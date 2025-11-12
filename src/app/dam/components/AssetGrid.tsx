"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useEffect, useMemo, useRef, type ReactElement } from "react"
import { PhotoView } from "react-photo-view"

interface Asset {
  id: string
  fileName: string
  filePath: string
  fileType: "image" | "video"
  uploadedAt: Date
  teamMemberId?: string
  tags?: Array<{
    id: string
    name: string
    displayName: string
    category: {
      id: string
      name: string
      displayName: string
      color?: string
    }
  }>
}

interface TeamMember {
  id: string
  name: string
  imageUrl: string
  cropCloseUpCircle?: {
    x: number
    y: number
    scale: number
  } | null
}

interface AssetGridProps {
  assets: Asset[]
  selectedAssetIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onDelete?: (assetIds: string[]) => void
  gridViewMode?: "square" | "aspect"
  groupByCategories?: string[]
  teamMembers?: TeamMember[]
  visibleCardTags?: string[]
}

interface GroupBucket {
  assets: Asset[]
  children: Record<string, GroupBucket>
}

export function AssetGrid({
  assets,
  selectedAssetIds = [],
  onSelectionChange,
  onDelete: _onDelete,
  gridViewMode = "square",
  groupByCategories = [],
  teamMembers = [],
  visibleCardTags = []
}: AssetGridProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(selectedAssetIds.length > 0)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartAssetId, setDragStartAssetId] = useState<string | null>(null)
  const [draggedOverAssets, setDraggedOverAssets] = useState<Set<string>>(new Set())
  const [lastClickedAssetId, setLastClickedAssetId] = useState<string | null>(null)
  const [mouseDownPosition, setMouseDownPosition] = useState<{ x: number; y: number } | null>(null)
  const [currentMousePosition, setCurrentMousePosition] = useState<{ x: number; y: number } | null>(null)
  const [potentialDragAssetId, setPotentialDragAssetId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedAssetSet = useMemo(() => new Set(selectedAssetIds), [selectedAssetIds])

  // Calculate selection box bounds
  const selectionBox = useMemo(() => {
    if (!isDragging || !mouseDownPosition || !currentMousePosition) return null

    return {
      left: Math.min(mouseDownPosition.x, currentMousePosition.x),
      top: Math.min(mouseDownPosition.y, currentMousePosition.y),
      width: Math.abs(currentMousePosition.x - mouseDownPosition.x),
      height: Math.abs(currentMousePosition.y - mouseDownPosition.y)
    }
  }, [isDragging, mouseDownPosition, currentMousePosition])

  // Group assets based on groupByCategories
  const groupedAssets = useMemo<Record<string, GroupBucket>>(() => {
    if (groupByCategories.length === 0) {
      return { ungrouped: { assets: assets.slice(), children: {} } }
    }

    const groups: Record<string, GroupBucket> = {}
    const ungrouped: Asset[] = []

    const ensureBucket = (level: Record<string, GroupBucket>, key: string) => {
      if (!level[key]) {
        level[key] = { assets: [], children: {} }
      }
      return level[key]
    }

    assets.forEach(asset => {
      const path: string[] = []
      let shouldPlace = true

      for (const categoryName of groupByCategories) {
        if (categoryName === 'team') {
          if (asset.teamMemberId) {
            path.push(`team|${asset.teamMemberId}`)
          } else if (path.length === 0) {
            shouldPlace = false
            break
          } else {
            break
          }
        } else {
          const tag = asset.tags?.find(t => t.category.name === categoryName)
          if (tag) {
            path.push(`${categoryName}|${tag.id}`)
          } else if (path.length === 0) {
            shouldPlace = false
            break
          } else {
            break
          }
        }
      }

      if (!shouldPlace || path.length === 0) {
        ungrouped.push(asset)
        return
      }

      let currentLevel = groups
      path.forEach((key, index) => {
        const bucket = ensureBucket(currentLevel, key)
        if (index === path.length - 1) {
          bucket.assets.push(asset)
        } else {
          currentLevel = bucket.children
        }
      })
    })

    if (ungrouped.length > 0) {
      groups.ungrouped = { assets: ungrouped, children: {} }
    }

    return groups
  }, [assets, groupByCategories])

  // Flatten all assets in display order for range selection
  const flattenedAssets = useMemo(() => {
    const flatten = (bucket: GroupBucket): Asset[] => {
      const result: Asset[] = [...bucket.assets]
      Object.values(bucket.children).forEach(child => {
        result.push(...flatten(child))
      })
      return result
    }

    if (groupByCategories.length === 0) {
      return assets
    }

    const result: Asset[] = []
    Object.values(groupedAssets).forEach(bucket => {
      result.push(...flatten(bucket))
    })
    return result
  }, [assets, groupedAssets, groupByCategories.length])

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    setIsSelectionMode(selectedAssetIds.length > 0)
  }, [selectedAssetIds.length])

  const toggleSelection = useCallback(
    (assetId: string) => {
      if (!onSelectionChange) return

      const nextSelection = new Set(selectedAssetIds)
      const wasSelected = nextSelection.has(assetId)
      if (wasSelected) {
        console.log('Deselecting asset:', assetId)
        nextSelection.delete(assetId)
      } else {
        console.log('Selecting asset:', assetId)
        nextSelection.add(assetId)
      }

      const nextArray = Array.from(nextSelection)
      console.log('New selection:', nextArray)
      setIsSelectionMode(nextArray.length > 0)
      onSelectionChange(nextArray)
      setLastClickedAssetId(assetId)
    },
    [onSelectionChange, selectedAssetIds]
  )

  const selectRange = useCallback(
    (assetId: string) => {
      if (!onSelectionChange || !lastClickedAssetId) {
        // No previous selection, just toggle this one
        toggleSelection(assetId)
        return
      }

      // Find indices of both assets in the flattened list
      const currentIndex = flattenedAssets.findIndex(a => a.id === assetId)
      const lastIndex = flattenedAssets.findIndex(a => a.id === lastClickedAssetId)

      if (currentIndex === -1 || lastIndex === -1) {
        toggleSelection(assetId)
        return
      }

      // Select all assets between the two indices (inclusive)
      const startIndex = Math.min(currentIndex, lastIndex)
      const endIndex = Math.max(currentIndex, lastIndex)
      const rangeAssetIds = flattenedAssets
        .slice(startIndex, endIndex + 1)
        .map(a => a.id)

      // Add range to existing selection
      const nextSelection = new Set([...selectedAssetIds, ...rangeAssetIds])
      const nextArray = Array.from(nextSelection)
      setIsSelectionMode(true)
      onSelectionChange(nextArray)
      setLastClickedAssetId(assetId)
    },
    [onSelectionChange, lastClickedAssetId, flattenedAssets, selectedAssetIds, toggleSelection]
  )

  const handleAssetClick = useCallback(
    (asset: Asset, event: React.MouseEvent) => {
      console.log('handleAssetClick called', { assetId: asset.id, isDragging, isSelectionMode })

      // If we're dragging, don't process clicks
      if (isDragging) {
        console.log('Click blocked: currently dragging')
        event.preventDefault()
        event.stopPropagation()
        return
      }

      // Shift + Click: Range selection
      if (!isTouchDevice && event.shiftKey) {
        console.log('Shift+Click: range selection')
        event.preventDefault()
        event.stopPropagation()
        setIsSelectionMode(true)
        selectRange(asset.id)
        return
      }

      // Desktop multi-select: Cmd/Ctrl + Click
      if (!isTouchDevice && (event.metaKey || event.ctrlKey)) {
        console.log('Cmd/Ctrl+Click: toggle selection')
        event.preventDefault()
        event.stopPropagation()
        setIsSelectionMode(true)
        toggleSelection(asset.id)
        return
      }

      // If in selection mode, toggle selection
      if (isSelectionMode) {
        console.log('In selection mode: toggling', asset.id)
        event.preventDefault()
        event.stopPropagation()
        toggleSelection(asset.id)
        return
      }

      console.log('Not in selection mode, PhotoView will handle')
      // Otherwise, PhotoView will handle opening the viewer
    },
    [isSelectionMode, isTouchDevice, toggleSelection, selectRange, isDragging]
  )

  const handleLongPress = useCallback(
    (assetId: string) => {
      // Only for touch devices
      if (isTouchDevice) {
        setIsSelectionMode(true)
        toggleSelection(assetId)
      }
    },
    [isTouchDevice, toggleSelection]
  )

  // Handle potential drag start (mousedown)
  const handleMouseDown = useCallback(
    (assetId: string, event: React.MouseEvent | React.TouchEvent) => {
      console.log('handleMouseDown called', { assetId, isSelectionMode })

      // Record position for potential drag (for both selection mode and normal mode)
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
      console.log('Recording potential drag position', { x: clientX, y: clientY })
      setMouseDownPosition({ x: clientX, y: clientY })
      setPotentialDragAssetId(assetId)
    },
    [isSelectionMode, selectedAssetIds, toggleSelection]
  )

  // Handle drag selection start
  const handleDragStart = useCallback(
    (assetId: string) => {
      console.log('handleDragStart called', assetId)
      setIsDragging(true)
      setIsSelectionMode(true)
      setDragStartAssetId(assetId)

      // If starting from an item (not empty space), select it
      if (assetId !== 'empty') {
        setDraggedOverAssets(new Set([assetId]))
        // Add the first asset to selection
        if (!selectedAssetIds.includes(assetId)) {
          toggleSelection(assetId)
        }
      } else {
        setDraggedOverAssets(new Set())
      }
    },
    [selectedAssetIds, toggleSelection]
  )

  // Handle drag over asset
  const handleDragOver = useCallback(
    (assetId: string) => {
      console.log('handleDragOver called', { assetId, isDragging })
      if (isDragging && !draggedOverAssets.has(assetId)) {
        console.log('Adding asset to dragged selection', assetId)
        setDraggedOverAssets(prev => {
          const next = new Set(prev)
          next.add(assetId)
          return next
        })

        // Toggle selection for this asset
        if (!selectedAssetIds.includes(assetId)) {
          toggleSelection(assetId)
        }
      }
    },
    [isDragging, draggedOverAssets, selectedAssetIds, toggleSelection]
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    console.log('handleDragEnd called')
    setIsDragging(false)
    setDragStartAssetId(null)
    setDraggedOverAssets(new Set())
    setMouseDownPosition(null)
    setCurrentMousePosition(null)
    setPotentialDragAssetId(null)
  }, [])

  // Add global listeners for drag start detection and drag end
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Update current mouse position if we have a potential drag
      if (mouseDownPosition) {
        setCurrentMousePosition({ x: e.clientX, y: e.clientY })
      }

      // Check if we should start dragging based on mouse movement
      if (!isDragging && potentialDragAssetId && mouseDownPosition) {
        const deltaX = Math.abs(e.clientX - mouseDownPosition.x)
        const deltaY = Math.abs(e.clientY - mouseDownPosition.y)
        const DRAG_THRESHOLD = 5 // pixels
        console.log('Mouse moved', { deltaX, deltaY, threshold: DRAG_THRESHOLD })

        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
          // Start drag selection
          console.log('Starting drag from global mousemove')
          handleDragStart(potentialDragAssetId)
          setPotentialDragAssetId(null)
        }
      }
    }

    const handleGlobalDragEnd = () => {
      if (isDragging || potentialDragAssetId) {
        handleDragEnd()
      }
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalDragEnd)
    window.addEventListener('touchend', handleGlobalDragEnd)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalDragEnd)
      window.removeEventListener('touchend', handleGlobalDragEnd)
    }
  }, [isDragging, potentialDragAssetId, mouseDownPosition, handleDragEnd, handleDragStart])

  const findSampleAsset = (bucket: GroupBucket): Asset | undefined => {
    if (bucket.assets.length > 0) {
      return bucket.assets[0]
    }
    for (const child of Object.values(bucket.children)) {
      const match = findSampleAsset(child)
      if (match) return match
    }
    return undefined
  }

  // Render grouped assets recursively
  const renderGroups = (groups: Record<string, GroupBucket>, level: number): ReactElement[] => {
    const elements: ReactElement[] = []

    Object.entries(groups).forEach(([key, value]) => {
      const groupKey = String(key)
      const [type, id] = groupKey.includes('|') ? groupKey.split('|') : ['', groupKey]
      const isUngrouped = groupKey === 'ungrouped'

      // Get display name and image for the group
      let groupTitle = isUngrouped ? 'Other' : groupKey
      let groupImage: { url: string; crop?: { x: number; y: number; scale: number } } | null = null
      const bucket = value

      if (type === 'team') {
        // Look up team member by ID
        const teamMember = teamMembers.find(tm => tm.id === id)
        if (teamMember) {
          groupTitle = teamMember.name
          // Only show image if it's not a placeholder
          const isPlaceholder = teamMember.imageUrl.includes('placeholder')
          if (!isPlaceholder) {
            groupImage = {
              url: teamMember.imageUrl,
              crop: teamMember.cropCloseUpCircle || undefined
            }
          }
        } else {
          groupTitle = 'Team Member'
        }
      } else if (!isUngrouped) {
        // Extract tag display name
        const sampleAsset = findSampleAsset(bucket)
        if (sampleAsset) {
          const tag = sampleAsset.tags?.find((t: any) => t.category.name === type && t.id === id)
          groupTitle = tag ? tag.displayName : groupTitle
        }
      }

      const groupArray = bucket.assets.length > 0 ? bucket.assets : null
      const hasChildren = Object.keys(bucket.children).length > 0

      elements.push(
        <div key={key} className="space-y-4">
          {/* Group header */}
          <div className={`${level === 0 ? 'border-b-2 border-sage/20 pb-2' : 'border-b border-sage/10 pb-1 ml-4'}`}>
            <div className="flex items-center gap-3">
              {/* Team member headshot */}
              {groupImage && (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-sage/20 flex-shrink-0">
                  <img
                    src={groupImage.url}
                    alt={groupTitle}
                    className="w-full h-full object-cover"
                    style={
                      groupImage.crop
                        ? {
                            objectPosition: `${groupImage.crop.x}% ${groupImage.crop.y}%`,
                            transform: `scale(${groupImage.crop.scale})`
                          }
                        : {
                            objectPosition: 'center 25%',
                            transform: 'scale(2)'
                          }
                    }
                  />
                </div>
              )}
              <h3 className={`${level === 0 ? 'h3 text-sage' : 'h4 text-sage/80'}`}>
                {groupTitle}
                {groupArray && (
                  <span className="ml-2 text-sm text-sage/60">({groupArray.length})</span>
                )}
              </h3>
            </div>
          </div>

          {/* Group content */}
          {groupArray ? (
            <div className={`dam-grid ${level > 0 ? 'ml-4' : ''} ${
              gridViewMode === "square"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
                : "columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 space-y-3 sm:space-y-4"
            }`}>
              {groupArray.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAssetSet.has(asset.id)}
                  isSelectionMode={isSelectionMode}
                  isTouchDevice={isTouchDevice}
                  gridViewMode={gridViewMode}
                  onClick={(e) => handleAssetClick(asset, e)}
                  onLongPress={() => handleLongPress(asset.id)}
                  onMouseDown={(e) => handleMouseDown(asset.id, e)}
                  onDragOver={() => handleDragOver(asset.id)}
                  isDragging={isDragging}
                  isDraggedOver={draggedOverAssets.has(asset.id)}
                  visibleCardTags={visibleCardTags}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          ) : null}
          {hasChildren && (
            <div className={level > 0 ? 'ml-4' : ''}>
              {renderGroups(bucket.children, level + 1)}
            </div>
          )}
        </div>
      )
    })

    return elements
  }

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${isDragging ? 'dragging-selection' : ''}`}
      onMouseDown={(e) => {
        // Allow starting drag from empty space
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('dam-grid')) {
          const clientX = e.clientX
          const clientY = e.clientY
          console.log('Starting drag from empty space', { x: clientX, y: clientY })
          setMouseDownPosition({ x: clientX, y: clientY })
          setPotentialDragAssetId('empty')

          // Clear selection if not holding Cmd/Ctrl
          if (!e.metaKey && !e.ctrlKey && onSelectionChange) {
            onSelectionChange([])
            setIsSelectionMode(false)
          }
        }
      }}
    >
      {/* Selection box overlay */}
      {selectionBox && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${selectionBox.left}px`,
            top: `${selectionBox.top}px`,
            width: `${selectionBox.width}px`,
            height: `${selectionBox.height}px`,
            border: '2px solid #D4A5A5',
            backgroundColor: 'rgba(212, 165, 165, 0.1)',
            borderRadius: '4px'
          }}
        />
      )}

      {/* Helper text for desktop */}
      {!isTouchDevice && !isSelectionMode && assets.length > 0 && (
        <div className="mb-4 text-center">
          <p className="caption text-sage">
            Click + Drag to select • {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + Click to toggle • Shift + Click for range
          </p>
        </div>
      )}

      {/* Grouped or regular grid */}
      {groupByCategories.length > 0 ? (
        <div className="space-y-8 mt-4">
          {renderGroups(groupedAssets, 0)}
        </div>
      ) : (
        <div className={`dam-grid mt-4 ${
          gridViewMode === "square"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
            : "columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 space-y-3 sm:space-y-4"
        }`}>
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isSelected={selectedAssetSet.has(asset.id)}
              isSelectionMode={isSelectionMode}
              isTouchDevice={isTouchDevice}
              gridViewMode={gridViewMode}
              onClick={(e) => handleAssetClick(asset, e)}
              onLongPress={() => handleLongPress(asset.id)}
              onMouseDown={(e) => handleMouseDown(asset.id, e)}
              onDragOver={() => handleDragOver(asset.id)}
              isDragging={isDragging}
              isDraggedOver={draggedOverAssets.has(asset.id)}
              visibleCardTags={visibleCardTags}
              teamMembers={teamMembers}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface AssetCardProps {
  asset: Asset
  isSelected: boolean
  isSelectionMode: boolean
  isTouchDevice: boolean
  gridViewMode: "square" | "aspect"
  onClick: (event: React.MouseEvent) => void
  onLongPress: () => void
  onMouseDown: (event: React.MouseEvent | React.TouchEvent) => void
  onDragOver: () => void
  isDragging: boolean
  isDraggedOver: boolean
  visibleCardTags?: string[]
  teamMembers?: TeamMember[]
}

function AssetCard({
  asset,
  isSelected,
  isSelectionMode,
  isTouchDevice,
  gridViewMode,
  onClick,
  onLongPress,
  onMouseDown,
  onDragOver,
  isDragging,
  isDraggedOver,
  visibleCardTags = [],
  teamMembers = []
}: AssetCardProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false)

  // Track modifier keys to prevent PhotoView from opening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        setIsModifierKeyPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        setIsModifierKeyPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchDevice) return

    // Prevent iOS context menu
    e.preventDefault()

    const timer = setTimeout(() => {
      onLongPress()
    }, 500)
    setPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
  }

  const imageContent = (
    <img
      src={asset.filePath}
      alt={asset.fileName}
      draggable={false}
      className={`w-full ${
        gridViewMode === "square" ? "h-full object-cover" : "h-auto"
      }`}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  )

  return (
    <div
      className={`relative arch-full overflow-hidden bg-warm-sand/40 group cursor-pointer touch-manipulation shadow-sm hover:shadow-lg transition-all ${
        gridViewMode === "square" ? "aspect-square" : "break-inside-avoid mb-3 sm:mb-4"
      } ${isSelected ? "ring-4 ring-dusty-rose/80" : ""} ${isDragging ? "pointer-events-none" : ""} ${
        isDraggedOver && !isSelected ? "ring-2 ring-dusty-rose/50 scale-95" : ""
      }`}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onClick={onClick}
      onMouseDown={(e) => {
        onMouseDown(e)
      }}
      onTouchStart={(e) => {
        if (isSelectionMode) {
          onMouseDown(e)
        } else {
          handleTouchStart(e)
        }
      }}
      onMouseEnter={() => onDragOver()}
      onTouchMove={(e) => {
        // Get the element at the touch point
        const touch = e.touches[0]
        const element = document.elementFromPoint(touch.clientX, touch.clientY)
        if (element && element.closest('.dam-grid > div')) {
          onDragOver()
        }
      }}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Image - wrapped in PhotoView when not in selection mode and no modifier key pressed */}
      {isSelectionMode || isModifierKeyPressed ? (
        <div className="w-full h-full">
          {imageContent}
        </div>
      ) : (
        <PhotoView src={asset.filePath}>
          <div className="w-full h-full">
            {imageContent}
          </div>
        </PhotoView>
      )}

      {/* Selection outline */}
      {isSelected && (
        <div className="absolute inset-0 rounded-[28px] ring-2 ring-dusty-rose pointer-events-none" />
      )}
      {isSelectionMode && isSelected && (
        <div className="absolute inset-0 bg-dusty-rose/15 pointer-events-none" />
      )}
      {/* Drag over indicator */}
      {isDraggedOver && !isSelected && (
        <div className="absolute inset-0 bg-dusty-rose/25 pointer-events-none animate-pulse" />
      )}

      {/* Tags and Team Member badges */}
      {!isSelectionMode && (() => {
        // Check if we should show team member
        const showTeamMember = (visibleCardTags.length === 0 || visibleCardTags.includes('team')) && asset.teamMemberId
        const teamMember = showTeamMember ? teamMembers.find(tm => tm.id === asset.teamMemberId) : null

        // Filter tags based on visibleCardTags setting
        const displayedTags = asset.tags && asset.tags.length > 0
          ? (visibleCardTags.length === 0
              ? asset.tags
              : asset.tags.filter(tag => visibleCardTags.includes(tag.category.id)))
          : []

        // Don't render anything if nothing to show
        if (!teamMember && displayedTags.length === 0) return null

        return (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {/* Team member badge */}
            {teamMember && (
              <span
                className="px-2 py-0.5 backdrop-blur-sm text-cream text-[10px] rounded-full font-medium shadow-sm overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #C4A587 0%, #C4A587CC 100%)'
                }}
              >
                {teamMember.name}
              </span>
            )}

            {/* Tag badges */}
            {displayedTags.slice(0, teamMember ? 1 : 2).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 backdrop-blur-sm text-cream text-[10px] rounded-full font-medium shadow-sm overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${tag.category.color || "#8A7C69"} 0%, ${tag.category.color || "#8A7C69"}CC 100%)`
                }}
              >
                {tag.displayName}
              </span>
            ))}

            {/* "+" badge for remaining tags */}
            {displayedTags.length > (teamMember ? 1 : 2) && (
              <span className="px-2 py-0.5 bg-dune/80 backdrop-blur-sm text-cream text-[10px] rounded-full font-medium">
                +{displayedTags.length - (teamMember ? 1 : 2)}
              </span>
            )}
          </div>
        )
      })()}

    </div>
  )
}

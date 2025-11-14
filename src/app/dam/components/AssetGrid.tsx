"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useEffect, useMemo, useRef, memo, type ReactElement } from "react"
import { PhotoView } from "react-photo-view"
import { ImageSkeleton } from "./ImageSkeleton"

// Global cache for loaded images - persists across all re-renders
const loadedImagesCache = new Set<string>()

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
  pendingTagRemoval?: {
    tagId: string
    assetIds: string[]
    context: string
  } | null
  dissipatingTags?: Set<string>
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
  visibleCardTags = [],
  pendingTagRemoval = null,
  dissipatingTags = new Set()
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
  const assetRefs = useRef<Map<string, HTMLDivElement>>(new Map())
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

  // Track if we're adding to selection (Cmd/Ctrl held)
  const [isAddingToSelection, setIsAddingToSelection] = useState(false)
  const [baseSelection, setBaseSelection] = useState<string[]>([])

  // Check which assets intersect with the selection box
  useEffect(() => {
    if (!selectionBox || !isDragging || !onSelectionChange) return

    const intersectingAssets = new Set<string>()

    // Check each asset for intersection
    assetRefs.current.forEach((element, assetId) => {
      const rect = element.getBoundingClientRect()

      // Check if the selection box intersects with this asset
      const intersects = !(
        rect.right < selectionBox.left ||
        rect.left > selectionBox.left + selectionBox.width ||
        rect.bottom < selectionBox.top ||
        rect.top > selectionBox.top + selectionBox.height
      )

      if (intersects) {
        intersectingAssets.add(assetId)
      }
    })

    // Combine with base selection if adding (Cmd/Ctrl held)
    let newSelection: string[]
    if (isAddingToSelection) {
      const combined = new Set([...baseSelection, ...Array.from(intersectingAssets)])
      newSelection = Array.from(combined)
    } else {
      newSelection = Array.from(intersectingAssets)
    }

    if (newSelection.length !== selectedAssetIds.length ||
        !newSelection.every(id => selectedAssetIds.includes(id))) {
      onSelectionChange(newSelection)
    }
  }, [selectionBox, isDragging, onSelectionChange, selectedAssetIds, isAddingToSelection, baseSelection])

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
        nextSelection.delete(assetId)
      } else {
        nextSelection.add(assetId)
      }

      const nextArray = Array.from(nextSelection)
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
      // If we're dragging, don't process clicks
      if (isDragging) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      // Shift + Click: Range selection
      if (!isTouchDevice && event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        setIsSelectionMode(true)
        selectRange(asset.id)
        return
      }

      // Desktop multi-select: Cmd/Ctrl + Click
      if (!isTouchDevice && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        event.stopPropagation()
        setIsSelectionMode(true)
        toggleSelection(asset.id)
        return
      }

      // If in selection mode, toggle selection
      if (isSelectionMode) {
        event.preventDefault()
        event.stopPropagation()
        toggleSelection(asset.id)
        return
      }

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
      // Record position for potential drag (for both selection mode and normal mode)
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
      setMouseDownPosition({ x: clientX, y: clientY })
      setPotentialDragAssetId(assetId)

      // Check if Cmd/Ctrl is held to add to selection
      const isModifierPressed = 'metaKey' in event && (event.metaKey || event.ctrlKey)
      setIsAddingToSelection(isModifierPressed)
      if (isModifierPressed) {
        setBaseSelection([...selectedAssetIds])
      } else {
        setBaseSelection([])
      }
    },
    [selectedAssetIds]
  )

  // Handle drag selection start
  const handleDragStart = useCallback(
    (assetId: string) => {
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
      if (isDragging && !draggedOverAssets.has(assetId)) {
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
    setIsDragging(false)
    setDragStartAssetId(null)
    setDraggedOverAssets(new Set())
    setMouseDownPosition(null)
    setCurrentMousePosition(null)
    setPotentialDragAssetId(null)
    setIsAddingToSelection(false)
    setBaseSelection([])
  }, [])

  // Add global listeners for drag start detection and drag end
  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      // Allow starting drag from anywhere on the page
      const target = e.target as HTMLElement
      const isInsideGrid = target.closest('[data-asset-grid]')

      // If we clicked inside the grid, let the grid handle it
      if (isInsideGrid) return

      // Don't clear selection if clicking on UI controls
      // Check if clicking on omni bar, chips, buttons, or any interactive elements
      const isUIControl = target.closest('[data-omni-bar]') || // OmniBar container
                          target.closest('.omni-bar') ||
                          target.closest('[role="button"]') ||
                          target.closest('button') ||
                          target.closest('.arch-full') || // Chips have this class
                          target.closest('.filter-selector') ||
                          target.closest('[data-command-palette]')

      if (isUIControl) {
        return
      }

      // Otherwise, start a drag from empty space
      const clientX = e.clientX
      const clientY = e.clientY
      setMouseDownPosition({ x: clientX, y: clientY })
      setPotentialDragAssetId('empty')

      // Check if Cmd/Ctrl is held to add to selection
      setIsAddingToSelection(e.metaKey || e.ctrlKey)
      if (e.metaKey || e.ctrlKey) {
        setBaseSelection([...selectedAssetIds])
      } else {
        setBaseSelection([])
        // Clear selection if not holding Cmd/Ctrl
        if (onSelectionChange) {
          onSelectionChange([])
          setIsSelectionMode(false)
        }
      }
    }

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
        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
          // Start drag selection
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

    window.addEventListener('mousedown', handleGlobalMouseDown)
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalDragEnd)
    window.addEventListener('touchend', handleGlobalDragEnd)

    return () => {
      window.removeEventListener('mousedown', handleGlobalMouseDown)
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalDragEnd)
      window.removeEventListener('touchend', handleGlobalDragEnd)
    }
  }, [isDragging, potentialDragAssetId, mouseDownPosition, handleDragEnd, handleDragStart, selectedAssetIds, onSelectionChange])

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
                            objectPosition: 'center 34%',
                            transform: 'scale(0.9)'
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
                  pendingTagRemoval={pendingTagRemoval}
                  dissipatingTags={dissipatingTags}
                  onRef={(el) => {
                    if (el) assetRefs.current.set(asset.id, el)
                    else assetRefs.current.delete(asset.id)
                  }}
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
      data-asset-grid="true"
      className={`w-full relative ${isDragging ? 'dragging-selection' : ''}`}
      onMouseDown={(e) => {
        // Allow starting drag from anywhere in the container
        // Check if we clicked on an asset card
        const assetCard = (e.target as HTMLElement).closest('[data-asset-id]')

        if (!assetCard) {
          // Clicked on empty space in grid
          const clientX = e.clientX
          const clientY = e.clientY
          setMouseDownPosition({ x: clientX, y: clientY })
          setPotentialDragAssetId('empty')

          // Check if Cmd/Ctrl is held to add to selection
          setIsAddingToSelection(e.metaKey || e.ctrlKey)
          if (e.metaKey || e.ctrlKey) {
            setBaseSelection([...selectedAssetIds])
          } else {
            setBaseSelection([])
            // Clear selection if not holding Cmd/Ctrl
            if (onSelectionChange) {
              onSelectionChange([])
              setIsSelectionMode(false)
            }
          }

          e.stopPropagation() // Prevent global handler from also firing
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
              pendingTagRemoval={pendingTagRemoval}
              dissipatingTags={dissipatingTags}
              onRef={(el) => {
                if (el) assetRefs.current.set(asset.id, el)
                else assetRefs.current.delete(asset.id)
              }}
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
  onRef?: (el: HTMLDivElement | null) => void
  pendingTagRemoval?: {
    tagId: string
    assetIds: string[]
    context: string
  } | null
  dissipatingTags?: Set<string>
}

const AssetCard = memo(function AssetCard({
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
  teamMembers = [],
  onRef,
  pendingTagRemoval = null,
  dissipatingTags = new Set()
}: AssetCardProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)

  // Check if image was previously loaded from global cache
  const wasImageLoaded = loadedImagesCache.has(asset.filePath)

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

  const [imageLoading, setImageLoading] = useState(!wasImageLoaded)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = useCallback(() => {
    loadedImagesCache.add(asset.filePath)
    setImageLoading(false)
  }, [asset.filePath])

  const handleImageError = useCallback(() => {
    setImageLoading(false)
    setImageError(true)
  }, [])

  const imageContent = (
    <div className="relative w-full h-full">
      {imageLoading && !wasImageLoaded && <ImageSkeleton gridViewMode={gridViewMode} />}
      <img
        src={asset.filePath}
        alt={asset.fileName}
        draggable={false}
        loading="lazy"
        className={`w-full ${
          gridViewMode === "square" ? "h-full object-cover" : "h-auto"
        } ${imageLoading && !wasImageLoaded ? "opacity-0" : "opacity-100"} ${!isDragging && !wasImageLoaded ? "transition-opacity duration-200" : ""}`}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onContextMenu={(e) => e.preventDefault()}
      />
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
          Failed to load
        </div>
      )}
    </div>
  )

  return (
    <div
      ref={onRef}
      data-asset-id={asset.id}
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
      {/* Image - wrapped in PhotoView when not in selection mode */}
      {isSelectionMode ? (
        <div className="w-full h-full">
          {imageContent}
        </div>
      ) : (
        <PhotoView src={asset.filePath}>
          <div className="w-full h-full" onClick={(e) => {
            // Prevent PhotoView from opening if modifier keys are pressed
            if (e.metaKey || e.ctrlKey || e.shiftKey) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}>
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
      {(() => {
        // Check if we should show team member
        const showTeamMember = (visibleCardTags.length === 0 || visibleCardTags.includes('team')) && asset.teamMemberId
        const teamMember = showTeamMember ? teamMembers.find(tm => tm.id === asset.teamMemberId) : null

        // Filter tags based on visibleCardTags setting
        let displayedTags: typeof asset.tags = []
        if (asset.tags && asset.tags.length > 0) {
          if (visibleCardTags.length === 0) {
            // Show all tags when array is empty
            displayedTags = asset.tags
          } else {
            // Filter tags - show only those whose category ID is in the visible list
            // IMPORTANT: Always show collection and rating tags regardless of settings
            displayedTags = asset.tags.filter(tag => {
              // Check if tag has category and category has id
              if (!tag.category || !tag.category.id) {
                return false
              }

              // Always show collections and ratings - they're not configurable
              const categoryName = tag.category.name?.toLowerCase() || ''
              if (categoryName === 'collections' || categoryName === 'rating') {
                return true
              }

              // For regular tags, check if their category is in the visible list
              return visibleCardTags.includes(tag.category.id)
            })
          }
        }

        // Don't render anything if nothing to show
        if (!teamMember && displayedTags.length === 0) return null

        return (
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="horizontal-scroll-tags pr-8">
              {/* Team member badge */}
              {teamMember && (() => {
                const teamTagId = `team-${asset.teamMemberId}`
                const isPending = pendingTagRemoval &&
                  pendingTagRemoval.tagId === teamTagId &&
                  pendingTagRemoval.assetIds.includes(asset.id)
                const isDissipating = dissipatingTags.has(teamTagId)

                return (
                  <span
                    className={`px-2 py-0.5 backdrop-blur-sm text-cream text-[10px] rounded-full font-medium shadow-sm overflow-hidden ${
                      isPending ? 'candy-cane-effect' : ''
                    } ${isDissipating ? 'dissipate-effect' : ''}`}
                    style={{
                      background: 'linear-gradient(135deg, #C4A587 0%, #C4A587CC 100%)'
                    }}
                  >
                    {teamMember.name}
                  </span>
                )
              })()}

              {/* Tag badges - show all, no truncation */}
              {displayedTags.map((tag) => {
                const isPending = pendingTagRemoval &&
                  pendingTagRemoval.tagId === tag.id &&
                  pendingTagRemoval.assetIds.includes(asset.id)
                const isDissipating = dissipatingTags.has(tag.id)

                return (
                  <span
                    key={tag.id}
                    className={`px-2 py-0.5 backdrop-blur-sm text-cream text-[10px] rounded-full font-medium shadow-sm overflow-hidden ${
                      isPending ? 'candy-cane-effect' : ''
                    } ${isDissipating ? 'dissipate-effect' : ''}`}
                    style={{
                      background: `linear-gradient(135deg, ${tag.category.color || "#8A7C69"} 0%, ${tag.category.color || "#8A7C69"}CC 100%)`
                    }}
                  >
                    {tag.displayName}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })()}

    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Return true to SKIP re-render, false to re-render

  // Always skip re-render if just selection mode changed (visual appearance doesn't change)
  // Only re-render if actual visual properties change
  const shouldSkipRender = (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.gridViewMode === nextProps.gridViewMode &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isDraggedOver === nextProps.isDraggedOver &&
    prevProps.visibleCardTags?.length === nextProps.visibleCardTags?.length &&
    prevProps.visibleCardTags?.every((tag, i) => tag === nextProps.visibleCardTags?.[i]) &&
    prevProps.pendingTagRemoval?.tagId === nextProps.pendingTagRemoval?.tagId &&
    prevProps.asset.tags?.length === nextProps.asset.tags?.length
  )

  return shouldSkipRender
})

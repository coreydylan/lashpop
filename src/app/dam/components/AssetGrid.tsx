"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useEffect, useMemo, type ReactElement } from "react"
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
}

export function AssetGrid({
  assets,
  selectedAssetIds = [],
  onSelectionChange,
  onDelete: _onDelete,
  gridViewMode = "square",
  groupByCategories = [],
  teamMembers = []
}: AssetGridProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(selectedAssetIds.length > 0)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartAssetId, setDragStartAssetId] = useState<string | null>(null)
  const [draggedOverAssets, setDraggedOverAssets] = useState<Set<string>>(new Set())
  const selectedAssetSet = useMemo(() => new Set(selectedAssetIds), [selectedAssetIds])

  // Group assets based on groupByCategories
  const groupedAssets = useMemo(() => {
    if (groupByCategories.length === 0) {
      return { ungrouped: assets }
    }

    const groups: Record<string, any> = {}
    const ungrouped: Asset[] = []

    assets.forEach(asset => {
      let placed = false
      const path: string[] = []

      // Check each level of grouping
      for (const categoryName of groupByCategories) {
        if (categoryName === 'team') {
          if (asset.teamMemberId) {
            path.push(`team_${asset.teamMemberId}`)
            placed = true
          } else if (path.length === 0) {
            // If first level and no team, skip this asset for grouping
            break
          }
        } else {
          const tag = asset.tags?.find(t => t.category.name === categoryName)
          if (tag) {
            path.push(`${categoryName}_${tag.name}`)
            placed = true
          } else if (path.length === 0) {
            // If first level and no tag for this category, skip
            break
          }
        }
      }

      if (placed && path.length > 0) {
        // Navigate/create nested structure
        let current = groups
        for (let i = 0; i < path.length; i++) {
          const key = path[i]
          if (!current[key]) {
            current[key] = i === path.length - 1 ? [] : {}
          }
          if (i === path.length - 1) {
            current[key].push(asset)
          } else {
            current = current[key]
          }
        }
      } else {
        ungrouped.push(asset)
      }
    })

    return ungrouped.length > 0 ? { ...groups, ungrouped } : groups
  }, [assets, groupByCategories])

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
      if (nextSelection.has(assetId)) {
        nextSelection.delete(assetId)
      } else {
        nextSelection.add(assetId)
      }

      const nextArray = Array.from(nextSelection)
      setIsSelectionMode(nextArray.length > 0)
      onSelectionChange(nextArray)
    },
    [onSelectionChange, selectedAssetIds]
  )

  const handleAssetClick = useCallback(
    (asset: Asset, event: React.MouseEvent) => {
      // If we're dragging, don't process clicks
      if (isDragging) {
        event.preventDefault()
        event.stopPropagation()
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
      }
      // Otherwise, PhotoView will handle opening the viewer
    },
    [isSelectionMode, isTouchDevice, toggleSelection, isDragging]
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

  // Handle drag selection start
  const handleDragStart = useCallback(
    (assetId: string, event: React.MouseEvent | React.TouchEvent) => {
      // Only start drag if in selection mode or holding Shift
      const isShiftPressed = 'shiftKey' in event && event.shiftKey

      if (isSelectionMode || isShiftPressed) {
        event.preventDefault()
        setIsDragging(true)
        setIsSelectionMode(true)
        setDragStartAssetId(assetId)
        setDraggedOverAssets(new Set([assetId]))

        // Add the first asset to selection
        if (!selectedAssetIds.includes(assetId)) {
          toggleSelection(assetId)
        }
      }
    },
    [isSelectionMode, selectedAssetIds, toggleSelection]
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
  }, [])

  // Add global listeners for drag end
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (isDragging) {
        handleDragEnd()
      }
    }

    window.addEventListener('mouseup', handleGlobalDragEnd)
    window.addEventListener('touchend', handleGlobalDragEnd)

    return () => {
      window.removeEventListener('mouseup', handleGlobalDragEnd)
      window.removeEventListener('touchend', handleGlobalDragEnd)
    }
  }, [isDragging, handleDragEnd])

  // Render grouped assets recursively
  const renderGroups = (groups: any, level: number): ReactElement[] => {
    const elements: ReactElement[] = []

    Object.entries(groups).forEach(([key, value]) => {
      const groupKey = String(key)
      const [type, id] = groupKey.includes('_') ? groupKey.split('_') : ['', groupKey]
      const isUngrouped = groupKey === 'ungrouped'

      // Get display name and image for the group
      let groupTitle = isUngrouped ? 'Other' : groupKey
      let groupImage: { url: string; crop?: { x: number; y: number; scale: number } } | null = null

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
        const sampleAsset = Array.isArray(value)
          ? value[0]
          : (Object.values(value as Record<string, Asset[]>)[0]?.[0])
        if (sampleAsset) {
          const tag = sampleAsset.tags?.find((t: any) => t.category.name === type && t.name === id)
          groupTitle = tag ? tag.displayName : groupTitle
        }
      }

      const groupArray = Array.isArray(value) ? (value as Asset[]) : null

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
                  onDragStart={(e) => handleDragStart(asset.id, e)}
                  onDragOver={() => handleDragOver(asset.id)}
                  isDragging={isDragging}
                />
              ))}
            </div>
          ) : (
            <div className={level > 0 ? 'ml-4' : ''}>
              {renderGroups(value, level + 1)}
            </div>
          )}
        </div>
      )
    })

    return elements
  }

  return (
    <div className={`w-full ${isDragging ? 'dragging-selection' : ''}`}>
      {/* Helper text for desktop */}
      {!isTouchDevice && !isSelectionMode && assets.length > 0 && (
        <div className="mb-4 text-center">
          <p className="caption text-sage">
            {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + Click to select • Shift + Drag to select multiple
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
              onDragStart={(e) => handleDragStart(asset.id, e)}
              onDragOver={() => handleDragOver(asset.id)}
              isDragging={isDragging}
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
  onDragStart: (event: React.MouseEvent | React.TouchEvent) => void
  onDragOver: () => void
  isDragging: boolean
}

function AssetCard({
  asset,
  isSelected,
  isSelectionMode,
  isTouchDevice,
  gridViewMode,
  onClick,
  onLongPress,
  onDragStart,
  onDragOver,
  isDragging
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
      className={`relative arch-full overflow-hidden bg-warm-sand/40 group cursor-pointer touch-manipulation shadow-sm hover:shadow-lg transition-shadow ${
        gridViewMode === "square" ? "aspect-square" : "break-inside-avoid mb-3 sm:mb-4"
      } ${isSelected ? "ring-4 ring-dusty-rose/80" : ""} ${isDragging ? "pointer-events-none" : ""}`}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onClick={onClick}
      onMouseDown={(e) => {
        if (e.shiftKey || isSelectionMode) {
          onDragStart(e)
        } else {
          handleTouchStart(e as any)
        }
      }}
      onTouchStart={(e) => {
        if (isSelectionMode) {
          onDragStart(e)
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

      {/* Tags badge */}
      {asset.tags && asset.tags.length > 0 && !isSelectionMode && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          {asset.tags.slice(0, 2).map((tag) => (
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
          {asset.tags.length > 2 && (
            <span className="px-2 py-0.5 bg-dune/80 backdrop-blur-sm text-cream text-[10px] rounded-full font-medium">
              +{asset.tags.length - 2}
            </span>
          )}
        </div>
      )}

    </div>
  )
}

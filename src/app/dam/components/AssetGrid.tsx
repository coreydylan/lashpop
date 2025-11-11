"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
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

interface AssetGridProps {
  assets: Asset[]
  selectedAssetIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onDelete?: (assetIds: string[]) => void
  gridViewMode?: "square" | "aspect"
  groupByCategories?: string[]
}

export function AssetGrid({
  assets,
  selectedAssetIds = [],
  onSelectionChange,
  onDelete: _onDelete,
  gridViewMode = "square",
  groupByCategories = []
}: AssetGridProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(selectedAssetIds.length > 0)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
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
    [isSelectionMode, isTouchDevice, toggleSelection]
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

  // Render grouped assets recursively
  const renderGroups = (groups: any, level: number): JSX.Element[] => {
    const elements: JSX.Element[] = []

    Object.entries(groups).forEach(([key, value]) => {
      const [type, id] = key.includes('_') ? key.split('_') : ['', key]
      const isUngrouped = key === 'ungrouped'

      // Get display name for the group
      let groupTitle = isUngrouped ? 'Other' : key
      if (type === 'team') {
        // TODO: Get team member name from ID
        groupTitle = 'Team Member'
      } else if (!isUngrouped) {
        // Extract tag display name
        const sampleAsset = Array.isArray(value) ? value[0] : Object.values(value)[0][0]
        if (sampleAsset) {
          const tag = sampleAsset.tags?.find((t: any) => t.category.name === type && t.name === id)
          groupTitle = tag ? `${tag.category.displayName}: ${tag.displayName}` : groupTitle
        }
      }

      elements.push(
        <div key={key} className="space-y-4">
          {/* Group header */}
          <div className={`${level === 0 ? 'border-b-2 border-sage/20 pb-2' : 'border-b border-sage/10 pb-1 ml-4'}`}>
            <h3 className={`${level === 0 ? 'h3 text-sage' : 'h4 text-sage/80'}`}>
              {groupTitle}
              {Array.isArray(value) && (
                <span className="ml-2 text-sm text-sage/60">({value.length})</span>
              )}
            </h3>
          </div>

          {/* Group content */}
          {Array.isArray(value) ? (
            <div className={`dam-grid ${level > 0 ? 'ml-4' : ''} ${
              gridViewMode === "square"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
                : "columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 space-y-3 sm:space-y-4"
            }`}>
              {value.map((asset: Asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAssetSet.has(asset.id)}
                  isSelectionMode={isSelectionMode}
                  isTouchDevice={isTouchDevice}
                  gridViewMode={gridViewMode}
                  onClick={(e) => handleAssetClick(asset, e)}
                  onLongPress={() => handleLongPress(asset.id)}
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
    <div className="w-full">
      {/* Helper text for desktop */}
      {!isTouchDevice && !isSelectionMode && assets.length > 0 && (
        <div className="mb-4 text-center">
          <p className="caption text-sage">
            {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + Click to select multiple
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
}

function AssetCard({
  asset,
  isSelected,
  isSelectionMode,
  isTouchDevice,
  gridViewMode,
  onClick,
  onLongPress
}: AssetCardProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchDevice) return

    // Prevent iOS context menu
    e.preventDefault()

    const timer = setTimeout(() => {
      onLongPress()
    }, 500)
    setPressTimer(timer)
  }

  const handleTouchEnd = (e?: React.TouchEvent<HTMLDivElement>) => {
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
      } ${isSelected ? "ring-4 ring-dusty-rose/80" : ""}`}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Image - wrapped in PhotoView when not in selection mode */}
      {isSelectionMode ? (
        imageContent
      ) : (
        <PhotoView src={asset.filePath}>
          <div
            onClick={(e) => {
              // Check for Cmd/Ctrl key to enter selection mode
              if (e.metaKey || e.ctrlKey) {
                e.preventDefault()
                e.stopPropagation()
                onClick(e)
                return
              }
              // Otherwise let PhotoView handle it
            }}
          >
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

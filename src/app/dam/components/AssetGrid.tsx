"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useEffect, useMemo, useRef, type ReactElement } from "react"
import React from "react"
import { PhotoView } from "react-photo-view"
import { useThrottle } from "@/hooks/useThrottle"
import { useHoverScroll } from "@/hooks/useHoverScroll"

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
  gridViewMode?: "square" | "aspect" | "masonry"
  groupByCategories?: string[]
  teamMembers?: TeamMember[]
  visibleCardTags?: string[]
  pendingTagRemoval?: {
    tagId: string
    assetIds: string[]
    context: string
  } | null
  dissipatingTags?: Set<string>
  mobileChipBar?: ReactElement
  chipBarInsertIndex?: number | null
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
  dissipatingTags = new Set(),
  mobileChipBar,
  chipBarInsertIndex
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

  // Smart infinite scroll - render assets in chunks
  const ITEMS_PER_PAGE = 75
  const PRELOAD_CHUNK = 25 // Additional items to preload in background
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const prevAssetsLengthRef = useRef(assets.length)
  const loadingMoreRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset visible count when assets array changes (filters applied)
  // But keep the expanded count if we're just loading more
  useEffect(() => {
    const prevLength = prevAssetsLengthRef.current
    const currentLength = assets.length

    // If assets significantly changed (not just grew), reset to first page
    // This happens when filters are applied
    if (currentLength < prevLength) {
      setVisibleCount(Math.min(currentLength, ITEMS_PER_PAGE))
    }
    // If we have fewer assets than what we're showing, adjust down
    else if (currentLength < visibleCount) {
      setVisibleCount(currentLength)
    }
    // Note: We don't reset to ITEMS_PER_PAGE when assets grow,
    // so user's "load more" state is preserved

    prevAssetsLengthRef.current = currentLength
  }, [assets.length, visibleCount, ITEMS_PER_PAGE])

  // Limit visible assets to improve performance
  const visibleAssets = useMemo(() => {
    return assets.slice(0, visibleCount)
  }, [assets, visibleCount])

  const hasMore = assets.length > visibleCount

  // Load more items (called by intersection observer)
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return
    loadingMoreRef.current = true

    // Load next chunk
    setVisibleCount(prev => {
      const next = Math.min(prev + ITEMS_PER_PAGE, assets.length)
      loadingMoreRef.current = false
      return next
    })
  }, [assets.length, hasMore, ITEMS_PER_PAGE])

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '400px' } // Start loading 400px before reaching bottom
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  // Background preloading - drizzle in images when idle
  useEffect(() => {
    if (!hasMore || visibleCount >= assets.length) return

    // Use requestIdleCallback to preload during browser idle time
    const preloadImages = () => {
      const nextBatch = assets.slice(visibleCount, visibleCount + PRELOAD_CHUNK)
      nextBatch.forEach(asset => {
        const img = new Image()
        img.src = asset.filePath
      })
    }

    // Wait a bit after initial render, then preload during idle time
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preloadImages, { timeout: 2000 })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(preloadImages, 1000)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [assets, visibleCount, hasMore, PRELOAD_CHUNK])

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
      return { ungrouped: { assets: visibleAssets.slice(), children: {} } }
    }

    const groups: Record<string, GroupBucket> = {}
    const ungrouped: Asset[] = []

    const ensureBucket = (level: Record<string, GroupBucket>, key: string) => {
      if (!level[key]) {
        level[key] = { assets: [], children: {} }
      }
      return level[key]
    }

    visibleAssets.forEach(asset => {
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
  }, [visibleAssets, groupByCategories])

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
  }, [visibleAssets, groupedAssets, groupByCategories.length])

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

  // Throttle mouse move updates to 60fps for better performance
  const throttledSetCurrentPosition = useThrottle((x: number, y: number) => {
    setCurrentMousePosition({ x, y })
  }, 16) // ~60fps

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
        // Clear selection if not holding Cmd/Ctrl - only if selection is not already empty
        if (onSelectionChange && selectedAssetIds.length > 0) {
          onSelectionChange([])
          setIsSelectionMode(false)
        }
      }
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Update current mouse position if we have a potential drag (throttled)
      if (mouseDownPosition) {
        throttledSetCurrentPosition(e.clientX, e.clientY)
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
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true })
    window.addEventListener('mouseup', handleGlobalDragEnd)
    window.addEventListener('touchend', handleGlobalDragEnd)

    return () => {
      window.removeEventListener('mousedown', handleGlobalMouseDown)
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalDragEnd)
      window.removeEventListener('touchend', handleGlobalDragEnd)
    }
  }, [isDragging, potentialDragAssetId, mouseDownPosition, handleDragEnd, handleDragStart, selectedAssetIds, onSelectionChange, throttledSetCurrentPosition])

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
              {type === 'team' && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-sage/20 flex-shrink-0 bg-warm-sand/40">
                  {!groupImage ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={groupImage.url}
                      alt={groupTitle}
                      className="absolute"
                      style={
                        groupImage.crop
                          ? {
                              width: `${groupImage.crop.scale * 100}%`,
                              height: `${groupImage.crop.scale * 100}%`,
                              left: `${50 - (groupImage.crop.x * groupImage.crop.scale)}%`,
                              top: `${50 - (groupImage.crop.y * groupImage.crop.scale)}%`,
                              objectFit: 'cover'
                            }
                          : {
                              width: '90%',
                              height: '90%',
                              left: '5%',
                              top: '-16%',
                              objectFit: 'cover'
                            }
                      }
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>'
                        }
                      }}
                    />
                  )}
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
                  groupByCategories={groupByCategories}
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
            // Clear selection if not holding Cmd/Ctrl - only if selection is not already empty
            if (onSelectionChange && selectedAssetIds.length > 0) {
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
          {visibleAssets.map((asset, index) => (
            <React.Fragment key={asset.id}>
              {/* Insert chip bar at specified index */}
              {chipBarInsertIndex !== null && index === chipBarInsertIndex && mobileChipBar && (
                <div
                  key="mobile-chip-bar"
                  className={
                    gridViewMode === "square"
                      ? "col-span-full"
                      : "w-full break-before-column break-after-column mb-4"
                  }
                  style={
                    gridViewMode === "square"
                      ? undefined
                      : {
                          columnSpan: 'all',
                          WebkitColumnSpan: 'all'
                        } as React.CSSProperties
                  }
                >
                  {mobileChipBar}
                </div>
              )}
              {/* Render asset card */}
              <AssetCard
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
                groupByCategories={groupByCategories}
                pendingTagRemoval={pendingTagRemoval}
                dissipatingTags={dissipatingTags}
                onRef={(el) => {
                  if (el) assetRefs.current.set(asset.id, el)
                  else assetRefs.current.delete(asset.id)
                }}
              />
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Infinite Scroll Sentinel - invisible trigger for loading more */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="h-20 flex items-center justify-center text-sage/40 text-sm"
        >
          Loading more...
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
  gridViewMode: "square" | "aspect" | "masonry"
  onClick: (event: React.MouseEvent) => void
  onLongPress: () => void
  onMouseDown: (event: React.MouseEvent | React.TouchEvent) => void
  onDragOver: () => void
  isDragging: boolean
  isDraggedOver: boolean
  visibleCardTags?: string[]
  teamMembers?: TeamMember[]
  groupByCategories?: string[]
  onRef?: (el: HTMLDivElement | null) => void
  pendingTagRemoval?: {
    tagId: string
    assetIds: string[]
    context: string
  } | null
  dissipatingTags?: Set<string>
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
  teamMembers = [],
  groupByCategories = [],
  onRef,
  pendingTagRemoval = null,
  dissipatingTags = new Set()
}: AssetCardProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [longPressTriggered, setLongPressTriggered] = useState(false)
  const tagScrollRef = useRef<HTMLDivElement>(null)
  const tagScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [showLeftTagScroll, setShowLeftTagScroll] = useState(false)
  const [showRightTagScroll, setShowRightTagScroll] = useState(false)

  // Check if tags overflow and show scroll indicators
  useEffect(() => {
    const checkTagScroll = () => {
      const container = tagScrollRef.current
      if (!container || isTouchDevice) {
        setShowLeftTagScroll(false)
        setShowRightTagScroll(false)
        return
      }

      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftTagScroll(scrollLeft > 5)
      setShowRightTagScroll(scrollLeft < scrollWidth - clientWidth - 5)
    }

    checkTagScroll()
    const container = tagScrollRef.current
    if (container) {
      container.addEventListener('scroll', checkTagScroll)
      window.addEventListener('resize', checkTagScroll)

      // Initial check after a small delay to ensure rendering is complete
      setTimeout(checkTagScroll, 100)

      return () => {
        container.removeEventListener('scroll', checkTagScroll)
        window.removeEventListener('resize', checkTagScroll)
      }
    }
  }, [isTouchDevice])

  const startTagScroll = (direction: 'left' | 'right') => {
    console.log('startTagScroll called:', direction, 'isTouchDevice:', isTouchDevice, 'hasInterval:', !!tagScrollIntervalRef.current)

    if (tagScrollIntervalRef.current || isTouchDevice) return

    const scroll = () => {
      const container = tagScrollRef.current
      if (!container) {
        console.log('No container ref')
        return
      }

      const scrollAmount = direction === 'left' ? -5 : 5
      console.log('Scrolling:', direction, 'current scrollLeft:', container.scrollLeft, 'scrollAmount:', scrollAmount)
      container.scrollLeft += scrollAmount
    }

    // Start scrolling immediately
    scroll()

    // Then continue with interval
    tagScrollIntervalRef.current = setInterval(scroll, 16)
  }

  const stopTagScroll = () => {
    if (tagScrollIntervalRef.current) {
      clearInterval(tagScrollIntervalRef.current)
      tagScrollIntervalRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tagScrollIntervalRef.current) {
        clearInterval(tagScrollIntervalRef.current)
      }
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchDevice) return

    // Prevent iOS context menu
    e.preventDefault()

    // Reset long press flag
    setLongPressTriggered(false)

    const timer = setTimeout(() => {
      setLongPressTriggered(true)
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

  const handleClick = (e: React.MouseEvent) => {
    // If a long press was just triggered, prevent the click from toggling selection again
    if (longPressTriggered) {
      e.preventDefault()
      e.stopPropagation()
      setLongPressTriggered(false)
      return
    }
    onClick(e)
  }

  const imageContent = (
    <img
      src={asset.filePath}
      alt={asset.fileName}
      draggable={false}
      decoding="async"
      onLoad={() => setImageLoaded(true)}
      className={`w-full ${
        gridViewMode === "square" ? "h-full object-cover" : "h-auto"
      } transition-all duration-500 ${
        imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
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
        userSelect: 'none',
        willChange: isDragging || isDraggedOver ? 'transform' : 'auto'
      }}
      onClick={handleClick}
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
            // Only prevent default - let event bubble up to parent handler
            if (e.metaKey || e.ctrlKey || e.shiftKey) {
              e.preventDefault()
              // Don't stopPropagation - let parent onClick handle the selection
            }
          }}>
            {imageContent}
          </div>
        </PhotoView>
      )}

      {/* Selection outline and overlay */}
      {isSelected && (
        <>
          <div className="absolute inset-0 rounded-[28px] ring-4 ring-dusty-rose pointer-events-none" />
          <div className="absolute inset-0 bg-dusty-rose/30 pointer-events-none rounded-[28px]" />
        </>
      )}
      {/* Drag over indicator */}
      {isDraggedOver && !isSelected && (
        <div className="absolute inset-0 bg-dusty-rose/25 pointer-events-none animate-pulse" />
      )}

      {/* Tags and Team Member badges */}
      {(() => {
        // Check if we should show team member
        // Hide team member if we're grouping by team
        const isGroupingByTeam = groupByCategories.includes('team')
        const showTeamMember = !isGroupingByTeam && (visibleCardTags.length === 0 || visibleCardTags.includes('team')) && asset.teamMemberId
        const teamMember = showTeamMember ? teamMembers.find(tm => tm.id === asset.teamMemberId) : null

        // Filter tags based on visibleCardTags setting
        let displayedTags: typeof asset.tags = []
        if (asset.tags && asset.tags.length > 0) {
          if (visibleCardTags.length === 0) {
            // Show all tags when array is empty, but exclude tags from grouping categories
            displayedTags = asset.tags.filter(tag => {
              // Hide tags that belong to categories we're grouping by
              return !groupByCategories.includes(tag.category.name)
            })
          } else {
            // Filter tags - show only those whose category ID is in the visible list
            // IMPORTANT: Always show collection and rating tags regardless of settings
            displayedTags = asset.tags.filter(tag => {
              // Check if tag has category and category has id
              if (!tag.category || !tag.category.id) {
                return false
              }

              // Hide tags that belong to categories we're grouping by
              if (groupByCategories.includes(tag.category.name)) {
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
            {/* Left scroll zone */}
            {showLeftTagScroll && (
              <div
                className="absolute left-0 top-0 bottom-0 w-12 z-20 cursor-w-resize"
                onMouseEnter={() => startTagScroll('left')}
                onMouseLeave={stopTagScroll}
              />
            )}

            {/* Right scroll zone */}
            {showRightTagScroll && (
              <div
                className="absolute right-0 top-0 bottom-0 w-12 z-20 cursor-e-resize"
                onMouseEnter={() => startTagScroll('right')}
                onMouseLeave={stopTagScroll}
              />
            )}

            <div
              ref={tagScrollRef}
              className="horizontal-scroll-tags pr-8"
              style={{
                scrollBehavior: 'auto' // Override smooth scrolling for programmatic control
              }}
            >
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
}

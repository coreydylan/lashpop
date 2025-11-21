"use client"

/* eslint-disable @next/next/no-img-element */

// Force dynamic rendering so middleware runs on every request
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react"

// Mobile debugging console - only in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('eruda').then(eruda => eruda.default.init())
}
import type { ReactNode } from "react"
import clsx from "clsx"
import { Upload as UploadIcon, Users, X, Sparkles, LogOut } from "lucide-react"
import Link from "next/link"
import { AssetGrid } from "../components/AssetGrid"
import { AssetGridSkeleton } from "../components/AssetGridSkeleton"
import { FilterSelector } from "../components/FilterSelector"
import { GroupBySelector } from "../components/GroupBySelector"
import { TagSelector } from "../components/TagSelector"
import { PhotoLightbox } from "../components/PhotoLightbox"
import { OmniBar } from "../components/OmniBar"
import { OmniChip } from "../components/OmniChip"
import { CollectionSelector } from "../components/CollectionSelector"
import { TutorialWalkthrough } from "../components/TutorialWalkthrough"
import { ThumbPanel } from "../components/ThumbPanel"
import { InlineChipBar, ChipBarToggleButton } from "../components/InlineChipBar"
import { ViewportSensor } from "../components/ViewportSensor"
import { useDamSettings } from "@/hooks/useDamSettings"
import { useDamActions } from "@/hooks/useDamActions"
import { useDamInitialData } from "@/hooks/useDamData"
import { useDamTutorial } from "@/contexts/DamTutorialContext"
import { useQueryClient } from "@tanstack/react-query"

// Lazy load heavy components that aren't immediately visible
const FileUploader = lazy(() => import("../components/FileUploader").then(mod => ({ default: mod.FileUploader })))
const OmniCommandPalette = lazy(() => import("../components/OmniCommandPalette").then(mod => ({ default: mod.OmniCommandPalette })))
const TagEditor = lazy(() => import("../components/TagEditor").then(mod => ({ default: mod.TagEditor })))
const CollectionManager = lazy(() => import("../components/CollectionManager").then(mod => ({ default: mod.CollectionManager })))

// Import type for CommandItem
import type { CommandItem } from "../components/OmniCommandPalette"

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
  cropCloseUpCircleUrl?: string | null
}

interface ActiveFilter {
  categoryId: string
  categoryName: string
  categoryDisplayName: string
  categoryColor?: string
  optionId: string
  optionName: string
  optionDisplayName: string
  imageUrl?: string
}

import { GroupedChipList } from "../components/GroupedChipList"

export default function DAMPage() {
  // DAM Settings & Actions hooks
  const {
    settings,
    isLoading: isLoadingSettings,
    updateGridViewMode,
    updateActiveFilters,
    updateGroupByCategories,
    updateVisibleCardTags,
    updateActiveCollection
  } = useDamSettings()

  const {
    logUpload,
    logTagAdd,
    logTagRemove,
    logDelete,
    logFilterChange,
    logViewChange,
    logGroupChange
  } = useDamActions()

  // Tutorial hook
  const {
    startTutorial,
    restartTutorial,
    completedDesktop,
    completedMobile
  } = useDamTutorial()

  // Fetch initial data using React Query
  const { data: initialData, isLoading: isLoadingData, error: dataError, refetch: refetchInitialData } = useDamInitialData()
  const queryClient = useQueryClient()

  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [tagCategories, setTagCategories] = useState<any[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [escConfirmationActive, setEscConfirmationActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Get from settings hook instead of useState
  const activeFilters = settings.activeFilters
  const setActiveFilters = useCallback((filters: ActiveFilter[]) => {
    updateActiveFilters(filters)
    logFilterChange({ filters })
  }, [updateActiveFilters, logFilterChange])
  const activeFiltersRef = useRef<ActiveFilter[]>([])

  const [uploadingAssetIds, setUploadingAssetIds] = useState<string[]>([])
  const hasInteractedWithGridRef = useRef(false)
  const assetsRef = useRef<Asset[]>([])

  // Inline chip bar state
  const [chipBarInsertIndex, setChipBarInsertIndex] = useState<number | null>(null)
  const [chipBarScrollToView, setChipBarScrollToView] = useState(false)
  const [visibleAssetIds, setVisibleAssetIds] = useState<string[]>([])

  // Handle assets detected by viewport sensor
  const handleAssetsDetected = useCallback((assetIds: string[]) => {
    setVisibleAssetIds(assetIds)
  }, [])

  // Get collection from settings
  const activeCollectionId = settings.activeCollectionId
  const setActiveCollectionId = (id: string | null | undefined) => updateActiveCollection(id ?? undefined)

  const filterableAssets = useMemo(
    () =>
      allAssets.map((asset) => ({
        id: asset.id,
        teamMemberId: asset.teamMemberId,
        tags: asset.tags?.map((tag) => ({
          id: tag.id,
          name: tag.name,
          displayName: tag.displayName,
          categoryId: tag.category.id
        }))
      })),
    [allAssets]
  )

  // Extract collections from tag categories
  const collections = useMemo(() => {
    const collectionCategory = tagCategories.find(cat => cat.isCollection)
    if (!collectionCategory) return []

    return (collectionCategory.tags || []).map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      displayName: tag.displayName,
      color: collectionCategory.color
    }))
  }, [tagCategories])

  // Get active collection info for mobile display
  const activeCollection = useMemo(() => {
    if (!activeCollectionId) return null
    return collections.find((c: any) => c.id === activeCollectionId)
  }, [activeCollectionId, collections])

  // Filter assets by active collection
  const collectionFilteredAssets = useMemo(() => {
    if (!activeCollectionId) return allAssets

    return allAssets.filter(asset =>
      asset.tags?.some(tag => tag.id === activeCollectionId)
    )
  }, [allAssets, activeCollectionId])

  // Omni-bar state (used for both filtering and bulk tagging)
  const [omniTeamMemberId, setOmniTeamMemberId] = useState<string | undefined>()
  const [omniTags, setOmniTags] = useState<any[]>([])

  // Grid view state from settings
  const gridViewMode = settings.gridViewMode
  const setGridViewMode = useCallback((mode: "square" | "aspect" | "masonry") => {
    updateGridViewMode(mode)
    logViewChange({ viewMode: mode })
  }, [updateGridViewMode, logViewChange])
  const [activeLightboxAsset, setActiveLightboxAsset] = useState<Asset | null>(null)
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(-1)
  const [isLightboxVisible, setIsLightboxVisible] = useState(false)
  const [lightboxOpenTime, setLightboxOpenTime] = useState<number>(0)
  const [singleTagDrafts, setSingleTagDrafts] = useState<any[]>([])
  const [pendingTagRemoval, setPendingTagRemoval] = useState<{
    tagId: string
    assetIds: string[]
    label: string
    count: number
    context: string
  } | null>(null)
  const [dissipatingTags, setDissipatingTags] = useState<Set<string>>(new Set())
  const [appearingTags, setAppearingTags] = useState<Set<string>>(new Set())

  // Upload panel state
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Fetch initial data
  const [isMobile, setIsMobile] = useState(false)

  // Group by settings from hook
  const groupByTags = settings.groupByCategories
  const setGroupByTags = useCallback((categories: string[]) => {
    updateGroupByCategories(categories)
    logGroupChange({ groupBy: categories })
  }, [updateGroupByCategories, logGroupChange])

  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState("")
  const [commandMode, setCommandMode] = useState<'normal' | 'edit' | 'card-settings'>('normal')
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false)
  const [isCollectionManagerOpen, setIsCollectionManagerOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState<'replace' | 'add'>('replace')

  // Card display settings from hook
  const visibleCardTags = settings.visibleCardTags
  const setVisibleCardTags = (tags: string[]) => updateVisibleCardTags(tags)

  // Helper to make colors more vibrant in lightbox mode
  const getTagColor = (color: string | undefined, isLightbox: boolean = false) => {
    const baseColor = color || "#A19781"
    if (!isLightbox) {
      return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}CC 100%)`
    }
    // In lightbox, use more saturated/vibrant version
    return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}EE 100%)`
  }

  // Handle grouping by tag category
  const handleGroupBy = useCallback((categoryName: string) => {
    if (groupByTags.includes(categoryName) || groupByTags.length >= 2) return
    setGroupByTags([...groupByTags, categoryName])
  }, [groupByTags, setGroupByTags])

  const handleRemoveGroupBy = useCallback((categoryName: string) => {
    setGroupByTags(groupByTags.filter((c: string) => c !== categoryName))
  }, [groupByTags, setGroupByTags])

  const openCommandPalette = useCallback((prefill = "") => {
    setCommandQuery(prefill)
    setIsCommandOpen(true)
  }, [])

  const openCardSettings = useCallback(() => {
    setCommandMode('card-settings')
    setCommandQuery("")
    setIsCommandOpen(true)
  }, [])

  const closeCommandPalette = useCallback(() => {
    setIsCommandOpen(false)
    setCommandMode('normal')
  }, [])

  const makeSelectedTag = useCallback((category: any, tag: any) => ({
    id: tag.id,
    name: tag.name,
    displayName: tag.displayName,
    category: {
      id: category.id,
      name: category.name,
      displayName: category.displayName,
      color: category.color
    }
  }), [])

  const getCategoryDisplayName = useCallback((categoryName: string) => {
    if (categoryName === "team") return "Team"
    const category = tagCategories.find(cat => cat.name === categoryName)
    return category?.displayName || categoryName
  }, [tagCategories])

  const handleTagFilterToggle = useCallback((tagId: string) => {
    if (selectedAssets.length > 0) return
    const category = tagCategories.find(cat =>
      cat.tags?.some((tag: any) => tag.id === tagId)
    )
    if (!category) return
    const tag = category.tags.find((t: any) => t.id === tagId)
    if (!tag) return

    const exists = activeFilters.some((f: ActiveFilter) => f.optionId === tagId)
    if (exists) {
      setActiveFilters(activeFilters.filter((f: ActiveFilter) => f.optionId !== tagId))
    } else {
      const newFilter: ActiveFilter = {
        categoryId: category.id,
        categoryName: category.name,
        categoryDisplayName: category.displayName,
        categoryColor: category.color,
        optionId: tag.id,
        optionName: tag.name,
        optionDisplayName: tag.displayName
      }
      setActiveFilters([...activeFilters, newFilter])
    }
  }, [selectedAssets.length, tagCategories, activeFilters, setActiveFilters])

  const handleTeamFilterToggle = useCallback((memberId: string) => {
    if (selectedAssets.length > 0) return
    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    const exists = activeFilters.some((f: ActiveFilter) => f.optionId === memberId)
    if (exists) {
      setActiveFilters(activeFilters.filter((f: ActiveFilter) => f.optionId !== memberId))
    } else {
      const newFilter: ActiveFilter = {
        categoryId: 'team',
        categoryName: 'team',
        categoryDisplayName: 'Team',
        categoryColor: '#BCC9C2',
        optionId: member.id,
        optionName: member.name,
        optionDisplayName: member.name,
        imageUrl: member.imageUrl
      }
      setActiveFilters([...activeFilters, newFilter])
    }
  }, [selectedAssets.length, teamMembers, activeFilters, setActiveFilters])

  const handleClearFilters = useCallback(() => {
    setActiveFilters([])
  }, [])

  const toggleUploadPanel = useCallback(() => {
    setIsUploadOpen(prev => !prev)
  }, [])

  const normalizeExclusiveTags = useCallback((tagsList: any[]) => {
    const latestByCategory = new Map<string, any>()
    tagsList.forEach((tag) => {
      if (!tag) return
      const key =
        tag.category?.id ||
        tag.category?.name ||
        tag.categoryId ||
        tag.id
      latestByCategory.set(key, tag)
    })
    return Array.from(latestByCategory.values())
  }, [])

  const applyFilters = useCallback((assetsToFilter: Asset[], filters: ActiveFilter[]) => {
    if (filters.length === 0) {
      return assetsToFilter
    }

    let filtered = assetsToFilter

    // Group filters by category
    const filtersByCategory = filters.reduce((acc, filter) => {
      if (!acc[filter.categoryName]) {
        acc[filter.categoryName] = []
      }
      acc[filter.categoryName].push(filter)
      return acc
    }, {} as Record<string, ActiveFilter[]>)

    // Apply filters (OR within category, AND across categories)
    Object.entries(filtersByCategory).forEach(([categoryName, categoryFilters]) => {
      if (categoryName === "team") {
        // Filter by team member
        const teamMemberIds = categoryFilters.map(f => f.optionId)
        filtered = filtered.filter(asset =>
          asset.teamMemberId && teamMemberIds.includes(asset.teamMemberId)
        )
      } else {
        // Filter by tags
        const tagIds = categoryFilters.map(f => f.optionId)
        filtered = filtered.filter(asset =>
          asset.tags?.some(tag => tagIds.includes(tag.id))
        )
      }
    })

    return filtered
  }, [])

  // Memoize filtered assets to prevent unnecessary re-renders
  const assets = useMemo(() => {
    return applyFilters(collectionFilteredAssets, activeFilters)
  }, [collectionFilteredAssets, activeFilters, applyFilters])

  // Keep ref updated for stable callback access
  useEffect(() => {
    assetsRef.current = assets
  }, [assets])

  // Handle chip bar activation (defined after assets is available)
  const handleChipBarActivate = useCallback(() => {
    console.log('Chip bar activate called', { chipBarInsertIndex, visibleAssetIds })

    // If no assets, always show at index 0 (top)
    if (assets.length === 0) {
      setChipBarInsertIndex(0)
      setChipBarScrollToView(true)
      setTimeout(() => setChipBarScrollToView(false), 1000)
      return
    }

    // Always recalculate position based on current viewport
    if (visibleAssetIds.length > 0) {
      // Find the index of the first visible asset
      const firstVisibleAssetId = visibleAssetIds[0]
      const assetIndex = assets.findIndex(a => a.id === firstVisibleAssetId)

      console.log('Using sensor data:', { firstVisibleAssetId, assetIndex, totalAssets: assets.length })

      if (assetIndex !== -1) {
        // Insert chip bar right before this asset
        setChipBarInsertIndex(assetIndex)
        setChipBarScrollToView(true)
        setTimeout(() => setChipBarScrollToView(false), 1000)
      }
    } else {
      // Fallback: estimate based on scroll position
      const viewportHeight = window.innerHeight
      const scrollY = window.scrollY
      const middleY = scrollY + (viewportHeight / 2)
      const estimatedRow = Math.floor(middleY / 300)
      const estimatedIndex = Math.max(0, Math.min(estimatedRow * 3, assets.length))

      console.log('Using scroll estimate:', { viewportHeight, scrollY, estimatedRow, estimatedIndex, totalAssets: assets.length })

      setChipBarInsertIndex(estimatedIndex)
      setChipBarScrollToView(true)
      setTimeout(() => setChipBarScrollToView(false), 1000)
    }
  }, [chipBarInsertIndex, visibleAssetIds, assets])

  useEffect(() => {
    // Only clear pending tag removal if selection actually changed to empty
    // Don't clear if we still have selections (which would happen during tag operations)
    if (selectedAssets.length === 0) {
      console.log('Clearing pendingTagRemoval because selection is empty')
      setPendingTagRemoval(null)
    }
    setSingleTagDrafts([])
  }, [selectedAssets, activeLightboxAsset])

  // Add escape key handler to cancel pending tag removal
  useEffect(() => {
    if (!pendingTagRemoval) {
      console.log('pendingTagRemoval is null')
      return
    }

    console.log('pendingTagRemoval set:', pendingTagRemoval)

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('Escape pressed, clearing pendingTagRemoval')
        setPendingTagRemoval(null)
      }
    }

    // Auto-cancel after 5 seconds
    const timeout = setTimeout(() => {
      console.log('Timeout reached, clearing pendingTagRemoval')
      setPendingTagRemoval(null)
    }, 5000)

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      clearTimeout(timeout)
    }
  }, [pendingTagRemoval])

  useEffect(() => {
    const handleCommandShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isTypingTarget = tagName === "input" || tagName === "textarea" || target?.isContentEditable

      if (isTypingTarget) return

      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        openCommandPalette("")
      }

      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        event.stopPropagation()
        openCommandPalette("")
      }
    }

    window.addEventListener("keydown", handleCommandShortcut)
    return () => window.removeEventListener("keydown", handleCommandShortcut)
  }, [openCommandPalette])

  // Keep ref updated for fetchAssets callback
  useEffect(() => {
    activeFiltersRef.current = activeFilters
  }, [activeFilters])

  const fetchAssets = useCallback(async () => {
    try {
      // Use React Query's refetch with cancelRefetch to bypass stale cache
      const { data } = await refetchInitialData({ cancelRefetch: true })
      const fetchedAssets = data?.assets || []
      setAllAssets(fetchedAssets)
      setIsLoading(false)
      // Filters will be applied automatically via useMemo
      return fetchedAssets
    } catch (error) {
      console.error("Failed to fetch assets:", error)
      setIsLoading(false)
      return []
    }
  }, [refetchInitialData])

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/dam/team-members")
      const data = await response.json()
      setTeamMembers(data.teamMembers || [])
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }, [])

  const fetchTagCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/dam/tags")
      const data = await response.json()
      console.log('Fetched tag categories:', data.categories)
      setTagCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch tag categories:", error)
    }
  }, [])

  // Populate state from React Query data
  useEffect(() => {
    if (initialData) {
      console.log('React Query initialData:', initialData)
      setAllAssets(initialData.assets || [])
      setTeamMembers(initialData.teamMembers || [])
      setTagCategories(initialData.categories || [])
      setIsLoading(false)
    }
  }, [initialData])

  // Log any errors from React Query
  useEffect(() => {
    if (dataError) {
      console.error('React Query error:', dataError)
    }
  }, [dataError])

  // Set loading state from React Query
  useEffect(() => {
    setIsLoading(isLoadingData)
  }, [isLoadingData])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleUploadComplete = (newAssets: Asset[], keepSelected: boolean) => {
    // Log upload action
    logUpload({
      assetIds: newAssets.map(a => a.id),
      fileCount: newAssets.length,
      totalSize: 0 // File size not available in Asset type
    })

    // Update the assets list directly with the new assets - PREPENDING so they show at top
    // We also filter out duplicates just in case
    setAllAssets(prev => {
      const newIds = new Set(newAssets.map(a => a.id))
      const filteredPrev = prev.filter(p => !newIds.has(p.id))
      return [...newAssets, ...filteredPrev]
    })

    // DELAY the server fetch to allow DB replication/consistency to catch up
    // This prevents the "stale read" from clobbering our optimistic update immediately
    setTimeout(() => {
      fetchAssets()
    }, 2000)
    
    // Close upload panel after successful upload
    setIsUploadOpen(false)

    if (!keepSelected) {
      // User clicked "Skip Initial Tagging" - clear selection
      setSelectedAssets([])
      setUploadingAssetIds([])
      setOmniTags([])
    }
  }

  const handleUploadingIdsChange = (assetIds: string[]) => {
    setUploadingAssetIds(assetIds)
    setSelectedAssets(assetIds)
    setOmniTags([])
  }

  const computeExistingTags = useCallback((assetIds: string[], sourceAssets: Asset[]) => {
    const tagCounts = new Map<string, number>()
    const selectedAssetsData = sourceAssets.filter((asset) => assetIds.includes(asset.id))

    selectedAssetsData.forEach((asset) => {
      asset.tags?.forEach((tag) => {
        tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1)
      })

      if (asset.teamMemberId) {
        const key = `team-${asset.teamMemberId}`
        tagCounts.set(key, (tagCounts.get(key) || 0) + 1)
      }
    })

    return tagCounts
  }, [])

  // Compute existing tags automatically whenever selectedAssets or assets change
  const existingTags = useMemo(() => {
    if (selectedAssets.length === 0) return new Map()
    return computeExistingTags(selectedAssets, assets)
  }, [selectedAssets, assets, computeExistingTags])

  const applyTagsToAssetIds = useCallback(async (targetAssetIds: string[], tagsToApply: any[]) => {
    const normalizedTags = normalizeExclusiveTags(tagsToApply)
    if (targetAssetIds.length === 0 || normalizedTags.length === 0) return

    const teamMemberTags = normalizedTags.filter((tag) => tag.category?.name === "team")
    const regularTags = normalizedTags.filter((tag) => tag.category?.name !== "team")

    if (teamMemberTags.length > 0) {
      const teamMemberId = teamMemberTags[0].id
      const response = await fetch("/api/dam/assets/assign-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetIds: targetAssetIds,
          teamMemberId
        })
      })

      if (!response.ok) {
        throw new Error("Failed to assign team member")
      }
    }

    if (regularTags.length > 0) {
      const response = await fetch("/api/dam/assets/bulk-tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetIds: targetAssetIds,
          tagIds: regularTags.map((t: any) => t.id),
          additive: true
        })
      })

      if (!response.ok) {
        throw new Error("Failed to save tags")
      }
    }
  }, [normalizeExclusiveTags])

  const requestTagRemoval = (tagId: string, assetIds: string[], label: string, count: number, context: string) => {
    console.log('requestTagRemoval called:', { tagId, assetIds, label, count, context })
    // If already pending this tag, cancel it
    if (pendingTagRemoval && pendingTagRemoval.tagId === tagId && pendingTagRemoval.context === context) {
      setPendingTagRemoval(null)
    } else {
      setPendingTagRemoval({ tagId, assetIds, label, count, context })
    }
  }

  const cancelTagRemoval = () => setPendingTagRemoval(null)

  const confirmTagRemoval = async () => {
    if (!pendingTagRemoval) return

    // Capture values before clearing state
    const { tagId, count, assetIds } = pendingTagRemoval

    // Add to dissipating set for dissolve animation
    setDissipatingTags(prev => {
      const next = new Set(prev)
      next.add(tagId)
      return next
    })

    // Clear pending state immediately - no more candycane
    setPendingTagRemoval(null)

    // Remove tag from database while animation plays
    try {
      await handleRemoveTag(tagId, count, assetIds, true)

      // Clean up dissipating tag after removal completes
      setDissipatingTags(prev => {
        const next = new Set(prev)
        next.delete(tagId)
        return next
      })
    } catch (error) {
      console.error("Failed to remove tag:", error)
      // Remove from dissipating even on error
      setDissipatingTags(prev => {
        const next = new Set(prev)
        next.delete(tagId)
        return next
      })
      // Re-fetch to ensure UI is in sync
      await fetchAssets()
    }
  }

  // Direct removal with dissipate effect (bypasses pendingTagRemoval state)
  const removeTagDirectly = async (tagId: string, assetIds: string[], count: number) => {
    // Add to dissipating set for dissolve animation
    setDissipatingTags(prev => {
      const next = new Set(prev)
      next.add(tagId)
      return next
    })

    // Remove tag from database while animation plays
    try {
      await handleRemoveTag(tagId, count, assetIds, true)

      // Clean up dissipating tag after removal completes
      setDissipatingTags(prev => {
        const next = new Set(prev)
        next.delete(tagId)
        return next
      })
    } catch (error) {
      console.error("Failed to remove tag:", error)
      // Remove from dissipating even on error
      setDissipatingTags(prev => {
        const next = new Set(prev)
        next.delete(tagId)
        return next
      })
      // Re-fetch to ensure UI is in sync
      await fetchAssets()
    }
  }

  const syncActiveLightboxAsset = useCallback((updatedAssets?: Asset[]) => {
    setActiveLightboxAsset((prev) => {
      if (!prev) return prev
      const source = updatedAssets || assets
      return source.find((asset) => asset.id === prev.id) || prev
    })
  }, [assets])

  const handleSingleTagsChange = useCallback(async (tags: any[]) => {
    if (!activeLightboxAsset) return
    const normalized = normalizeExclusiveTags(tags)
    if (normalized.length === 0) {
      setSingleTagDrafts([])
      return
    }

    try {
      setSingleTagDrafts(normalized)
      
      // Add appearing animation for single asset tags
      const newAppearingTags = new Set(appearingTags)
      normalized.forEach(tag => {
        newAppearingTags.add(`${activeLightboxAsset.id}-${tag.id}`)
      })
      setAppearingTags(newAppearingTags)

      // Clear appearing animation after delay
      setTimeout(() => {
        setAppearingTags(prev => {
          const next = new Set(prev)
          normalized.forEach(tag => {
            next.delete(`${activeLightboxAsset.id}-${tag.id}`)
          })
          return next
        })
      }, 1000)

      // OPTIMISTIC UPDATE for Single Asset
      setAllAssets(currentAssets => {
        return currentAssets.map(asset => {
          if (asset.id === activeLightboxAsset.id) {
            const updatedAsset = { ...asset }
            
            // Handle Team Member
            const teamTag = normalized.find((t: any) => t.category?.name === "team")
            if (teamTag) {
              updatedAsset.teamMemberId = teamTag.id
            }

            // Handle Regular Tags
            const newRegularTags = normalized.filter((t: any) => t.category?.name !== "team")
            if (newRegularTags.length > 0) {
               const existingTags = updatedAsset.tags || []
               const toAdd = newRegularTags.filter((nt: any) => !existingTags.some(et => et.id === nt.id))
               updatedAsset.tags = [...existingTags, ...toAdd]
            }
            return updatedAsset
          }
          return asset
        })
      })

      await applyTagsToAssetIds([activeLightboxAsset.id], normalized)
      setSingleTagDrafts([])
      const updated = await fetchAssets()
      syncActiveLightboxAsset(updated)
    } catch (error) {
      console.error("Failed to add tags:", error)
      setSingleTagDrafts([])
      await fetchAssets() // Revert on error
    }
  }, [activeLightboxAsset, applyTagsToAssetIds, fetchAssets, normalizeExclusiveTags, syncActiveLightboxAsset, appearingTags])


  const clearSelection = useCallback(() => {
    setSelectedAssets([])
    setOmniTags([])
    setEscConfirmationActive(false)
  }, [])

  // ESC key handler for clearing selection
  const handleEscPress = useCallback(() => {
    if (selectedAssets.length === 0) return

    if (escConfirmationActive) {
      // Second press - clear selection
      clearSelection()
    } else {
      // First press - show confirmation
      setEscConfirmationActive(true)

      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => {
        setEscConfirmationActive(false)
      }, 3000)
    }
  }, [selectedAssets.length, escConfirmationActive, clearSelection])

  // Reset ESC confirmation when selection changes
  useEffect(() => {
    if (selectedAssets.length === 0) {
      setEscConfirmationActive(false)
    }
  }, [selectedAssets.length])

  // Listen for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedAssets.length > 0) {
        // Don't trigger if user is typing in an input
        if (document.activeElement?.tagName === 'INPUT' ||
            document.activeElement?.tagName === 'TEXTAREA') {
          return
        }

        e.preventDefault()
        handleEscPress()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAssets.length, handleEscPress])

  const toggleGridView = useCallback(() => {
    setGridViewMode(gridViewMode === "square" ? "aspect" : "square")
  }, [gridViewMode, setGridViewMode])

  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    console.log('Selection change triggered:', selectedIds)
    setSelectedAssets(selectedIds)

    // Track that user has interacted with the grid (for tutorial)
    if (!hasInteractedWithGridRef.current) {
      hasInteractedWithGridRef.current = true
    }

    if (selectedIds.length === 0) {
      // Clear selection mode
      setOmniTeamMemberId(undefined)
      setOmniTags([])
    } else {
      setOmniTags([])
    }
    // Don't clear pendingTagRemoval here - let useEffect handle it based on selection state
  }, [computeExistingTags])

  const handleApplyTags = useCallback(async () => {
    if (omniTags.length === 0 || selectedAssets.length === 0) return

    // Add appearing animation for queued tags
    const newAppearingTags = new Set(appearingTags)
    omniTags.forEach(tag => {
      selectedAssets.forEach(assetId => {
        newAppearingTags.add(`${assetId}-${tag.id}`)
      })
    })
    setAppearingTags(newAppearingTags)

    setTimeout(() => {
      setAppearingTags(prev => {
        const next = new Set(prev)
        omniTags.forEach(tag => {
          selectedAssets.forEach(assetId => {
            next.delete(`${assetId}-${tag.id}`)
          })
        })
        return next
      })
    }, 1000)

    // OPTIMISTIC UPDATE for Queued Tags
    setAllAssets(currentAssets => {
      return currentAssets.map(asset => {
        if (selectedAssets.includes(asset.id)) {
          const updatedAsset = { ...asset }
          
          const teamTag = omniTags.find((t: any) => t.category?.name === "team")
          if (teamTag) {
            updatedAsset.teamMemberId = teamTag.id
          }

          const newRegularTags = omniTags.filter((t: any) => t.category?.name !== "team")
          if (newRegularTags.length > 0) {
             const existingTags = updatedAsset.tags || []
             const toAdd = newRegularTags.filter((nt: any) => !existingTags.some(et => et.id === nt.id))
             updatedAsset.tags = [...existingTags, ...toAdd]
          }
          return updatedAsset
        }
        return asset
      })
    })

    try {
      await applyTagsToAssetIds(selectedAssets, omniTags)
      await fetchAssets()
      clearSelection()
    } catch (error) {
      console.error("Failed to save tags:", error)
      await fetchAssets() // Revert
    }
  }, [applyTagsToAssetIds, clearSelection, fetchAssets, omniTags, selectedAssets, appearingTags])

  const handleMultiTagSelectorChange = useCallback(async (tags: any[]) => {
    const normalized = normalizeExclusiveTags(tags)

    // Update UI immediately with new tags
    setOmniTags(normalized)

    // If no assets selected, just update the tag list for future application
    if (selectedAssets.length === 0) {
      return
    }

    // Find newly added tags to apply to selected assets
    const newlyAdded = normalized.filter((tag: any) => !omniTags.some((existing) => existing.id === tag.id))

    if (newlyAdded.length === 0) return

    // Add appearing animation for new tags
    const newAppearingTags = new Set(appearingTags)
    newlyAdded.forEach(tag => {
      selectedAssets.forEach(assetId => {
        newAppearingTags.add(`${assetId}-${tag.id}`)
      })
    })
    setAppearingTags(newAppearingTags)

    // Clear appearing animation after delay
    setTimeout(() => {
      setAppearingTags(prev => {
        const next = new Set(prev)
        newlyAdded.forEach(tag => {
          selectedAssets.forEach(assetId => {
            next.delete(`${assetId}-${tag.id}`)
          })
        })
        return next
      })
    }, 1000)

    // OPTIMISTIC UPDATE: Immediately add tags to assets in state
    setAllAssets(currentAssets => {
      return currentAssets.map(asset => {
        if (selectedAssets.includes(asset.id)) {
          const updatedAsset = { ...asset }
          
          // Handle Team Member
          const teamTag = newlyAdded.find((t: any) => t.category?.name === "team")
          if (teamTag) {
            updatedAsset.teamMemberId = teamTag.id
          }

          // Handle Regular Tags
          const newRegularTags = newlyAdded.filter((t: any) => t.category?.name !== "team")
          if (newRegularTags.length > 0) {
             const existingTags = updatedAsset.tags || []
             // Filter out duplicates
             const toAdd = newRegularTags.filter((nt: any) => !existingTags.some(et => et.id === nt.id))
             
             // Map to correct structure if needed (Asset tags vs Tag object)
             // The tag object from selector should be compatible
             updatedAsset.tags = [...existingTags, ...toAdd]
          }
          return updatedAsset
        }
        return asset
      })
    })

    // Apply tags to assets in background, but keep UI showing the tags
    try {
      await applyTagsToAssetIds(selectedAssets, newlyAdded)
      // We still fetch to ensure consistency, but UI is already updated
      await fetchAssets()
      // Don't clear omniTags here - let user manage them
    } catch (error) {
      console.error("Failed to add tags instantly:", error)
      // On error, might want to revert, but for now just log
      // A re-fetch would correct it anyway
      await fetchAssets()
      setOmniTags(omniTags)
    }
  }, [applyTagsToAssetIds, computeExistingTags, fetchAssets, normalizeExclusiveTags, omniTags, selectedAssets, appearingTags])

  const handleRemoveTag = useCallback(async (tagId: string, count: number, targetAssetIds?: string[], skipPrompt = false) => {
    const isTeamMemberTag = tagId.startsWith('team-')
    const label = isTeamMemberTag ? "team member" : "tag"
    const assetIds = targetAssetIds ?? selectedAssets

    if (assetIds.length === 0) return

    if (!skipPrompt && !confirm(`Remove this ${label} from ${count} image${count !== 1 ? 's' : ''}?`)) return

    try {
      if (isTeamMemberTag) {
        // Remove team member from selected assets
        const response = await fetch("/api/dam/assets/remove-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assetIds
          })
        })

        if (!response.ok) {
          throw new Error("Failed to remove team member")
        }
      } else {
        // Remove regular tag from selected assets
        const response = await fetch("/api/dam/assets/remove-tag", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assetIds,
            tagId
          })
        })

        if (!response.ok) {
          throw new Error("Failed to remove tag")
        }
      }

      // Invalidate React Query cache to force immediate refetch
      queryClient.invalidateQueries({ queryKey: ['dam-initial-data'] })
      queryClient.invalidateQueries({ queryKey: ['dam-assets'] })

      const updated = await fetchAssets()
      console.log('Tag removed successfully, fetched updated assets:', updated?.length)

      if (targetAssetIds) {
        syncActiveLightboxAsset(updated)
      }
      // existingTags will automatically update via useMemo when assets change
    } catch (error) {
      console.error("Failed to remove tag:", error)
      // Re-fetch even on error to ensure UI is in sync
      await fetchAssets()
    }
  }, [fetchAssets, selectedAssets, syncActiveLightboxAsset, queryClient])

  const handleDelete = useCallback(async (assetIds: string[]) => {
    try {
      const response = await fetch("/api/dam/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetIds
        })
      })

      if (response.ok) {
        await fetchAssets()
        setSelectedAssets((prev) => prev.filter((id) => !assetIds.includes(id)))
      }
    } catch (error) {
      console.error("Failed to delete assets:", error)
    }
  }, [fetchAssets])

  const confirmDeleteAssets = useCallback(async (assetIds: string[], contextLabel: string) => {
    if (assetIds.length === 0) return
    const first = window.confirm(`Delete ${contextLabel}?`)
    if (!first) return
    const second = window.confirm("This action cannot be undone. Are you absolutely sure?")
    if (!second) return
    await handleDelete(assetIds)
  }, [handleDelete])

  // Helper functions for filter-based selection
  const selectAssetsByTag = useCallback((tagId: string, mode: 'replace' | 'add') => {
    const matchingAssets = assets.filter(asset =>
      asset.tags?.some(tag => tag.id === tagId)
    )
    const matchingIds = matchingAssets.map(a => a.id)

    if (mode === 'replace') {
      setSelectedAssets(matchingIds)
    } else {
      setSelectedAssets(prev => {
        const combined = new Set([...prev, ...matchingIds])
        return Array.from(combined)
      })
    }
  }, [assets])

  const selectAssetsByTeamMember = useCallback((memberId: string, mode: 'replace' | 'add') => {
    const matchingAssets = assets.filter(asset => asset.teamMemberId === memberId)
    const matchingIds = matchingAssets.map(a => a.id)

    if (mode === 'replace') {
      setSelectedAssets(matchingIds)
    } else {
      setSelectedAssets(prev => {
        const combined = new Set([...prev, ...matchingIds])
        return Array.from(combined)
      })
    }
  }, [assets])

  const commandItems = useMemo<CommandItem[]>(() => {
    // Only compute items when command palette is actually open for performance
    if (!isCommandOpen) return []

    const items: CommandItem[] = []
    const selectionCount = selectedAssets.length
    const assetCount = assets.length
    const hasFiltersOrGroups = activeFilters.length > 0 || groupByTags.length > 0

    // ========================================
    // CLEAR ALL (appears at top when filters/groups active)
    // ========================================
    if (hasFiltersOrGroups) {
      const clearText = []
      if (activeFilters.length > 0) clearText.push(`${activeFilters.length} filter${activeFilters.length === 1 ? '' : 's'}`)
      if (groupByTags.length > 0) clearText.push(`${groupByTags.length} group${groupByTags.length === 1 ? '' : 's'}`)

      items.push({
        id: "clear-all-filters-groups",
        group: "Quick Actions",
        label: "✕ Clear all filters & groups",
        description: `Remove ${clearText.join(' and ')}`,
        onSelect: () => {
          handleClearFilters()
          setGroupByTags([])
        }
      })
    }

    // ========================================
    // SELECTION CATEGORY
    // ========================================
    items.push({
      id: "selection-all",
      group: "Selection",
      label: "Select all in view",
      description: assetCount === 0
        ? "No assets available to select"
        : `Highlight all ${assetCount} asset${assetCount === 1 ? "" : "s"} currently filtered`,
      disabled: assetCount === 0 || selectionCount === assetCount,
      onSelect: () => setSelectedAssets(assets.map((asset) => asset.id))
    })

    if (selectionCount > 0) {
      // ========================================
      // TAGGING CATEGORY (Bulk Apply)
      // ========================================
      const sortedCategories = [...tagCategories].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      )

      sortedCategories.forEach((category) => {
        const sortedTags = [...(category.tags || [])].sort((a: any, b: any) =>
          a.displayName.localeCompare(b.displayName)
        )

        sortedTags.forEach((tag: any) => {
          items.push({
            id: `assign-${category.id}-${tag.id}`,
            group: "Tagging",
            label: `${category.displayName} › ${tag.displayName}`,
            description: `Apply to ${selectionCount} asset${selectionCount === 1 ? "" : "s"}`,
            badge: category.displayName,
            onSelect: () => {
              const formatted = makeSelectedTag(category, tag)
              void handleMultiTagSelectorChange([...omniTags, formatted])
            }
          })
        })
      })

      // ========================================
      // TEAM CATEGORY (Bulk Assign)
      // ========================================
      const sortedTeamMembers = [...teamMembers].sort((a, b) =>
        a.name.localeCompare(b.name)
      )

      sortedTeamMembers.forEach((member) => {
        items.push({
          id: `assign-team-${member.id}`,
          group: "Team",
          label: member.name,
          description: `Assign to ${selectionCount} asset${selectionCount === 1 ? "" : "s"}`,
          badge: "Team",
          avatarUrl: member.cropCloseUpCircleUrl || member.imageUrl,
          onSelect: () => {
            const teamCategory = {
              id: "team",
              name: "team",
              displayName: "Team",
              color: "#BCC9C2"
            }
            const formatted = makeSelectedTag(teamCategory, {
              id: member.id,
              name: member.name,
              displayName: member.name
            })
            void handleMultiTagSelectorChange([...omniTags, formatted])
          }
        })
      })

      items.push({
        id: "selection-apply",
        group: "Selection",
        label: "Apply queued tags now",
        description: omniTags.length > 0 ? `${omniTags.length} pending selections` : "Add tags to queue for instant apply",
        disabled: omniTags.length === 0,
        onSelect: () => {
          void handleApplyTags()
        }
      })

      items.push({
        id: "selection-clear",
        group: "Selection",
        label: "Clear selection",
        description: `Release ${selectionCount} asset${selectionCount === 1 ? "" : "s"}`,
        onSelect: clearSelection
      })

      items.push({
        id: "selection-delete",
        group: "Selection",
        label: selectionCount === 1 ? "Delete selected photo" : "Delete selected photos",
        description: "Double confirmation required",
        onSelect: () => confirmDeleteAssets(selectedAssets, `${selectionCount} selected photo${selectionCount === 1 ? "" : "s"}`)
      })
    } else if (activeLightboxAsset) {
      // ========================================
      // LIGHTBOX MODE - Single Asset Context
      // ========================================
      const activeAssetSelected = selectedAssets.includes(activeLightboxAsset.id)

      items.push({
        id: activeAssetSelected ? "single-unselect" : "single-select",
        group: "Selection",
        label: activeAssetSelected ? "Remove from selection" : "Add to selection",
        description: activeAssetSelected
          ? "Keep editing this photo without bulk state"
          : "Include this photo in your bulk selection",
        onSelect: () => {
          setSelectedAssets((prev) =>
            activeAssetSelected ? prev.filter((id) => id !== activeLightboxAsset.id) : [...prev, activeLightboxAsset.id]
          )
        }
      })

      // ========================================
      // TAGGING CATEGORY (Single Asset)
      // ========================================
      const sortedCategories = [...tagCategories].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      )

      sortedCategories.forEach((category) => {
        const sortedTags = [...(category.tags || [])].sort((a: any, b: any) =>
          a.displayName.localeCompare(b.displayName)
        )

        sortedTags.forEach((tag: any) => {
          items.push({
            id: `single-${category.id}-${tag.id}`,
            group: "Tagging",
            label: `${category.displayName} › ${tag.displayName}`,
            description: `Apply to "${activeLightboxAsset.fileName}"`,
            badge: category.displayName,
            onSelect: () => {
              const formatted = makeSelectedTag(category, tag)
              void handleSingleTagsChange([formatted])
            }
          })
        })
      })

      // ========================================
      // TEAM CATEGORY (Single Asset)
      // ========================================
      const sortedTeamMembers = [...teamMembers].sort((a, b) =>
        a.name.localeCompare(b.name)
      )

      sortedTeamMembers.forEach((member) => {
        items.push({
          id: `single-team-${member.id}`,
          group: "Team",
          label: member.name,
          description: `Assign to "${activeLightboxAsset.fileName}"`,
          avatarUrl: member.cropCloseUpCircleUrl || member.imageUrl,
          badge: "Team",
          onSelect: () => {
            const teamCategory = {
              id: "team",
              name: "team",
              displayName: "Team",
              color: "#BCC9C2"
            }
            const formatted = makeSelectedTag(teamCategory, {
              id: member.id,
              name: member.name,
              displayName: member.name
            })
            void handleSingleTagsChange([formatted])
          }
        })
      })

      // ========================================
      // CURRENT TAGS (Removal)
      // ========================================
      if (activeLightboxAsset.teamMemberId) {
        const member = teamMembers.find((m) => m.id === activeLightboxAsset.teamMemberId)
        if (member) {
          items.push({
            id: `current-team-${member.id}`,
            group: "Current Tags",
            label: `Team › ${member.name}`,
            description: "Remove from this photo",
            avatarUrl: member.cropCloseUpCircleUrl || member.imageUrl,
            onSelect: () => handleRemoveTag(`team-${member.id}`, 1, [activeLightboxAsset.id])
          })
        }
      }

      activeLightboxAsset.tags?.forEach((tag) => {
        items.push({
          id: `current-tag-${tag.id}`,
          group: "Current Tags",
          label: `${tag.category.displayName} › ${tag.displayName}`,
          description: "Remove from this photo",
          onSelect: () => handleRemoveTag(tag.id, 1, [activeLightboxAsset.id])
        })
      })

      // ========================================
      // SELECTION CATEGORY (Delete)
      // ========================================
      items.push({
        id: "single-delete",
        group: "Selection",
        label: "Delete this photo",
        description: "Double confirmation required",
        onSelect: () => confirmDeleteAssets([activeLightboxAsset.id], `"${activeLightboxAsset.fileName}"`)
      })
    } else {
      // ========================================
      // NO SELECTION MODE - Filtering Focus
      // ========================================
      const sortedCategories = [...tagCategories].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      )

      sortedCategories.forEach((category) => {
        const sortedTags = [...(category.tags || [])].sort((a: any, b: any) =>
          a.displayName.localeCompare(b.displayName)
        )

        sortedTags.forEach((tag: any) => {
          const isActive = activeFilters.some((filter) => filter.optionId === tag.id)
          items.push({
            id: `filter-tag-${tag.id}`,
            group: "Filtering",
            label: `${category.displayName} › ${tag.displayName}`,
            description: isActive ? "Click to remove filter" : "Click to add filter",
            isActive,
            badge: isActive ? "Active" : category.displayName,
            onSelect: () => handleTagFilterToggle(tag.id)
          })
        })
      })

      // ========================================
      // TEAM FILTERING
      // ========================================
      const sortedTeamMembers = [...teamMembers].sort((a, b) =>
        a.name.localeCompare(b.name)
      )

      sortedTeamMembers.forEach((member) => {
        const isActive = activeFilters.some((filter) =>
          filter.categoryName === "team" && filter.optionId === member.id
        )
        items.push({
          id: `filter-team-${member.id}`,
          group: "Filtering",
          label: `Team › ${member.name}`,
          description: isActive ? "Active filter" : "Filter by this team member",
          isActive,
          badge: isActive ? "Active" : "Team",
          avatarUrl: member.cropCloseUpCircleUrl || member.imageUrl,
          onSelect: () => handleTeamFilterToggle(member.id)
        })
      })

      items.push({
        id: "filters-clear",
        group: "Filtering",
        label: "Clear all filters",
        description: activeFilters.length > 0 ? `Remove ${activeFilters.length} active filter${activeFilters.length === 1 ? '' : 's'}` : "No filters applied",
        disabled: activeFilters.length === 0,
        onSelect: handleClearFilters
      })

      // ========================================
      // TAGGING CATEGORY (Disabled - Visibility Only)
      // ========================================
      // Reuse sortedCategories from above
      sortedCategories.forEach((category) => {
        const sortedTags = [...(category.tags || [])].sort((a: any, b: any) =>
          a.displayName.localeCompare(b.displayName)
        )

        sortedTags.forEach((tag: any) => {
          items.push({
            id: `assign-disabled-${category.id}-${tag.id}`,
            group: "Tagging",
            label: `${category.displayName} › ${tag.displayName}`,
            description: "Select assets first to apply tags",
            badge: category.displayName,
            disabled: true,
            onSelect: () => {} // No-op
          })
        })
      })

      // ========================================
      // TEAM CATEGORY (Disabled - Visibility Only)
      // ========================================
      // Reuse sortedTeamMembers from above
      sortedTeamMembers.forEach((member) => {
        items.push({
          id: `assign-team-disabled-${member.id}`,
          group: "Team",
          label: member.name,
          description: "Select assets first to assign team member",
          badge: "Team",
          avatarUrl: member.cropCloseUpCircleUrl || member.imageUrl,
          disabled: true,
          onSelect: () => {} // No-op
        })
      })
    }

    // ========================================
    // SELECT BY FILTER CATEGORY
    // ========================================
    // Add toggle for selection mode
    items.push({
      id: "selection-mode-toggle",
      group: "Select by Filter",
      label: selectionMode === 'replace' ? "Mode: Replace Selection" : "Mode: Add to Selection",
      description: selectionMode === 'replace'
        ? "Click to switch to additive mode"
        : "Click to switch to replace mode",
      isActive: selectionMode === 'add',
      badge: selectionMode === 'replace' ? "Replace" : "Add",
      onSelect: () => setSelectionMode(mode => mode === 'replace' ? 'add' : 'replace')
    })

    // Add commands for selecting by tags
    const sortedCategoriesForSelect = [...tagCategories].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )

    sortedCategoriesForSelect.forEach((category) => {
      const sortedTags = [...(category.tags || [])].sort((a: any, b: any) =>
        a.displayName.localeCompare(b.displayName)
      )

      sortedTags.forEach((tag: any) => {
        const matchingCount = assets.filter(asset =>
          asset.tags?.some(t => t.id === tag.id)
        ).length

        items.push({
          id: `select-tag-${tag.id}`,
          group: "Select by Filter",
          label: `${category.displayName} › ${tag.displayName}`,
          description: selectionMode === 'replace'
            ? `Select ${matchingCount} asset${matchingCount === 1 ? '' : 's'}`
            : `Add ${matchingCount} asset${matchingCount === 1 ? '' : 's'} to selection`,
          badge: category.displayName,
          disabled: matchingCount === 0,
          onSelect: () => {
            selectAssetsByTag(tag.id, selectionMode)
            setIsCommandOpen(false)
          }
        })
      })
    })

    // Add commands for selecting by team member
    const sortedTeamMembersForSelect = [...teamMembers].sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    sortedTeamMembersForSelect.forEach((member) => {
      const matchingCount = assets.filter(asset => asset.teamMemberId === member.id).length

      items.push({
        id: `select-team-${member.id}`,
        group: "Select by Filter",
        label: `Team › ${member.name}`,
        description: selectionMode === 'replace'
          ? `Select ${matchingCount} asset${matchingCount === 1 ? '' : 's'}`
          : `Add ${matchingCount} asset${matchingCount === 1 ? '' : 's'} to selection`,
        badge: "Team",
        avatarUrl: member.imageUrl,
        disabled: matchingCount === 0,
        onSelect: () => {
          selectAssetsByTeamMember(member.id, selectionMode)
          setIsCommandOpen(false)
        }
      })
    })

    // ========================================
    // ORGANIZATION CATEGORY
    // ========================================
    const groupingSet = new Set(groupByTags)
    if (groupByTags.length < 2) {
      if (!groupingSet.has("team") && teamMembers.length > 0) {
        items.push({
          id: "group-team",
          group: "Organization",
          label: "Group by Team",
          description: "Organize grid by team members",
          onSelect: () => handleGroupBy("team")
        })
      }

      tagCategories.forEach((category) => {
        if (!groupingSet.has(category.name)) {
          items.push({
            id: `group-${category.id}`,
            group: "Organization",
            label: `Group by ${category.displayName}`,
            description: `Organize grid by ${category.displayName.toLowerCase()}`,
            onSelect: () => handleGroupBy(category.name)
          })
        }
      })
    }

    groupByTags.forEach((categoryName) => {
      items.push({
        id: `remove-group-${categoryName}`,
        group: "Organization",
        label: `Remove ${getCategoryDisplayName(categoryName)} grouping`,
        description: "Clear this grouping layer",
        onSelect: () => handleRemoveGroupBy(categoryName)
      })
    })

    // Collections submenu
    if (collections.length > 0) {
      collections.forEach((collection: any) => {
        const isActive = activeCollectionId === collection.id
        items.push({
          id: `collection-${collection.id}`,
          group: "Organization",
          label: `Collection › ${collection.displayName}`,
          description: isActive ? "Currently viewing this collection" : "View this collection",
          isActive,
          badge: isActive ? "Active" : "Collection",
          onSelect: () => setActiveCollectionId(isActive ? undefined : collection.id)
        })
      })

      if (activeCollectionId) {
        items.push({
          id: "collection-clear",
          group: "Organization",
          label: "View all assets",
          description: "Clear collection filter",
          onSelect: () => setActiveCollectionId(undefined)
        })
      }
    }

    // ========================================
    // VIEW CATEGORY
    // ========================================
    items.push({
      id: "view-toggle",
      group: "View",
      label: gridViewMode === "square" ? "Switch to aspect ratio view" : "Switch to square grid view",
      description: "Toggle gallery layout mode",
      onSelect: toggleGridView
    })

    items.push({
      id: "view-card-settings",
      group: "View",
      label: "Customize card display",
      description: "Choose which tags appear on asset cards",
      onSelect: openCardSettings
    })

    items.push({
      id: "upload-toggle",
      group: "View",
      label: isUploadOpen ? "Hide upload panel" : "Show upload panel",
      description: "Toggle quick upload interface",
      onSelect: toggleUploadPanel
    })

    // ========================================
    // SETTINGS CATEGORY
    // ========================================
    items.push({
      id: "manage-tags",
      group: "Settings",
      label: "Manage tags & categories",
      description: "Edit, rename, or reorganize tag system",
      badge: "Admin",
      onSelect: () => {
        setIsCommandOpen(false)
        setIsTagEditorOpen(true)
      }
    })

    items.push({
      id: "manage-collections",
      group: "Settings",
      label: "Manage collections",
      description: "Create, rename, or reorganize collections",
      badge: "Admin",
      onSelect: () => {
        setIsCommandOpen(false)
        setIsCollectionManagerOpen(true)
      }
    })

    items.push({
      id: "settings-team",
      group: "Settings",
      label: "Team management",
      description: "Manage team members and photos",
      onSelect: () => {
        window.location.href = "/dam/team"
      }
    })

    items.push({
      id: "settings-logout",
      group: "Settings",
      label: "Logout",
      description: "Sign out of your account",
      onSelect: async () => {
        await fetch("/api/dam/auth/logout", { method: "POST" })
        window.location.href = "/dam/login"
      }
    })

    // ========================================
    // HELP CATEGORY
    // ========================================
    items.push({
      id: "help-tutorial",
      group: "Help",
      label: completedDesktop && completedMobile ? "Restart tutorial walkthrough" : "Start tutorial walkthrough",
      description: isMobile
        ? completedMobile ? "Review the mobile tutorial" : "Interactive guide for mobile users"
        : completedDesktop ? "Review the desktop tutorial" : "Interactive guide for first-time users",
      badge: (completedDesktop && completedMobile) ? "Completed" : undefined,
      onSelect: () => {
        setIsCommandOpen(false)
        setTimeout(() => {
          startTutorial(isMobile ? 'mobile' : 'desktop')
        }, 300)
      }
    })

    items.push({
      id: "help-restart-tutorial",
      group: "Help",
      label: "Reset tutorial progress",
      description: "Clear completion and start fresh",
      disabled: !completedDesktop && !completedMobile,
      onSelect: () => {
        if (confirm("Reset your tutorial progress? You can restart it anytime.")) {
          restartTutorial()
        }
      }
    })

    items.push({
      id: "help-shortcuts",
      group: "Help",
      label: "Keyboard shortcuts",
      description: "View all available keyboard commands",
      onSelect: () => {
        alert("⌨️ Keyboard Shortcuts\n\n/ or ⌘K (Ctrl+K) - Open Command Palette\nEsc - Close Command Palette\n\n⌘+Click - Multi-select items\nClick & Drag - Select range\nShift+Click - Select range\n\nArrow Keys - Navigate Command Palette\nEnter - Execute selected command")
      }
    })

    items.push({
      id: "help-tips",
      group: "Help",
      label: "Quick tips & examples",
      description: "Learn common workflows with examples",
      onSelect: () => {
        alert("💡 Quick Tip: Group by Team\n\n1. Open Command Palette (/)\n2. Type 'group'\n3. Select 'Group by Team'\n4. Your grid reorganizes by artist!\n\n---\n\n💡 Quick Tip: Bulk Tagging\n\n1. Select multiple photos (click & drag)\n2. Open Command Palette (/)\n3. Choose tags from Tagging category\n4. Tags apply to all selected items!\n\n---\n\nMore tips available in the tutorial!")
      }
    })

    return items
  }, [
    activeFilters,
    activeLightboxAsset,
    activeCollectionId,
    clearSelection,
    collections,
    completedDesktop,
    completedMobile,
    confirmDeleteAssets,
    isCommandOpen, // Added to dependencies for optimization
    getCategoryDisplayName,
    gridViewMode,
    groupByTags,
    handleApplyTags,
    handleClearFilters,
    handleGroupBy,
    handleMultiTagSelectorChange,
    handleRemoveGroupBy,
    handleSingleTagsChange,
    handleTagFilterToggle,
    handleTeamFilterToggle,
    isMobile,
    isUploadOpen,
    makeSelectedTag,
    omniTags,
    openCardSettings,
    restartTutorial,
    assets,
    selectedAssets,
    setActiveCollectionId,
    setIsCommandOpen,
    startTutorial,
    tagCategories,
    teamMembers,
    handleRemoveTag,
    toggleGridView,
    toggleUploadPanel,
    selectionMode,
    selectAssetsByTag,
    selectAssetsByTeamMember
  ])

  const renderGroupByChips = () => {
    if (groupByTags.length === 0) return null

    return (
      <div className="flex items-center gap-2">
        {groupByTags.map((categoryName, index) => (
          <OmniChip
            key={categoryName}
            variant="group-by"
            categoryDisplayName={`${index > 0 ? "→ " : ""}${getCategoryDisplayName(categoryName)}`}
            isSelected={selectedAssets.length > 0}
            isMobile={isMobile}
            onRemove={() => handleRemoveGroupBy(categoryName)}
          />
        ))}
      </div>
    )
  }

  const renderChips = (): ReactNode => {
    if (selectedAssets.length > 0 || activeFilters.length > 0) {
      return (
        <GroupedChipList
          selectedAssetIds={selectedAssets}
          assets={assets}
          teamMembers={teamMembers}
          activeFilters={activeFilters}
          omniTags={omniTags}
          tagCategories={tagCategories}
          isMobile={isMobile}
          groupByTags={groupByTags}
          onRemoveTag={(tagId, count, assetIds) => {
            // Direct removal with dissipate effect
            void removeTagDirectly(tagId, assetIds, count)
          }}
          onGroupBy={handleGroupBy}
          onUnselectAssets={(assetsToUnselect) => {
            const idsToRemove = assetsToUnselect.map((a: any) => typeof a === 'string' ? a : a.id)
            setSelectedAssets(prev => prev.filter(id => !idsToRemove.includes(id)))
          }}
          onRemoveFilter={(filter) => {
            setActiveFilters(activeFilters.filter(
              f => !(f.categoryId === filter.categoryId && f.optionId === filter.optionId)
            ))
          }}
          onRemoveOmniTag={(tagId) => setOmniTags(omniTags.filter(t => t.id !== tagId))}
          onMultiTagSelectorChange={handleMultiTagSelectorChange}
          pendingTagRemoval={pendingTagRemoval}
          dissipatingTags={dissipatingTags}
        />
      )
    } else if (activeLightboxAsset) {
      return renderLightboxTags()
    }
    return null
  }

  const renderLightboxTags = () => {
    if (selectedAssets.length > 0) {
      return renderChips()
    }

    if (!activeLightboxAsset) {
      return (
        <span className="text-sm text-cream/70">Open a photo to view and edit tags.</span>
      )
    }

    const teamMember = activeLightboxAsset.teamMemberId
      ? teamMembers.find((member) => member.id === activeLightboxAsset.teamMemberId)
      : undefined

    const hasTags = Boolean(teamMember) || (activeLightboxAsset.tags && activeLightboxAsset.tags.length > 0)

    if (!hasTags) {
      return (
        <span className="text-sm text-cream/70">
          No tags yet. Use the Action Palette or tag selector to add some magic.
        </span>
      )
    }

    return (
      <div className="flex items-center gap-2">
          {teamMember && (
            <OmniChip
              variant="tag-existing"
              categoryName="team"
              categoryDisplayName="Team"
              optionDisplayName={teamMember.name}
              color={getTagColor("#BCC9C2", true)}
              imageUrl={teamMember.cropCloseUpCircleUrl || teamMember.imageUrl}
              imageCrop={teamMember.cropCloseUpCircleUrl ? undefined : teamMember.cropCloseUpCircle}
              isStaticImage={!!teamMember.cropCloseUpCircleUrl}
              isPending={pendingTagRemoval?.tagId === `team-${teamMember.id}` && pendingTagRemoval?.context === `single-${activeLightboxAsset.id}`}
              isMobile={isMobile}
              onRemove={() => requestTagRemoval(`team-${teamMember.id}`, [activeLightboxAsset.id], "team member", 1, `single-${activeLightboxAsset.id}`)}
              onCategoryClick={() => handleGroupBy("team")}
              isDisabled={groupByTags.includes("team") || groupByTags.length >= 2}
            />
          )}

          {activeLightboxAsset.tags?.map((tag) => (
            <OmniChip
              key={tag.id}
              variant="tag-existing"
              categoryName={tag.category.name}
              categoryDisplayName={tag.category.displayName}
              optionDisplayName={tag.displayName}
              color={getTagColor(tag.category.color, true)}
              isPending={pendingTagRemoval?.tagId === tag.id && pendingTagRemoval?.context === `single-${activeLightboxAsset.id}`}
              isMobile={isMobile}
              onRemove={() => requestTagRemoval(tag.id, [activeLightboxAsset.id], "tag", 1, `single-${activeLightboxAsset.id}`)}
              onCategoryClick={() => handleGroupBy(tag.category.name)}
              isDisabled={groupByTags.includes(tag.category.name) || groupByTags.length >= 2}
            />
          ))}

        {!hasTags && (
          <span className="text-sm text-cream/70">No tags yet. Add one below.</span>
        )}
      </div>
    )
  }

  const renderLightboxTagSelector = () => {
    if (selectedAssets.length > 0 || !activeLightboxAsset) {
      return null
    }

    return (
      <div className="min-w-[240px]">
        <TagSelector
          selectedTags={singleTagDrafts}
          onTagsChange={handleSingleTagsChange}
        />
      </div>
    )
  }

  return (
    <PhotoLightbox
      selectedAssetIds={selectedAssets}
      onSelectionChange={handleSelectionChange}
      assets={assets}
      isMobile={isMobile}
      isModalOpen={isCommandOpen}
      onOpenCommandPalette={() => openCommandPalette("")}
      onVisibilityChange={(visible) => {
        if (visible) {
          setIsLightboxVisible(true)
          setLightboxOpenTime(Date.now())
        } else {
          // Prevent immediate closure on mobile - ensure at least 500ms has passed
          const timeSinceOpen = Date.now() - lightboxOpenTime
          if (isMobile && timeSinceOpen < 500) {
            console.log('Preventing immediate lightbox close on mobile')
            return
          }
          setIsLightboxVisible(false)
        }
      }}
      omniBarProps={{
        mode: "page",  // Use exact same mode as grid view
        groupByContent: renderGroupByChips(),
        chipsContent: renderChips(),
        selectedCount: selectedAssets.length,
        assetsCount: assets.length,
        totalAssetsCount: allAssets.length,
        canApplyTags: selectedAssets.length === 0 ? omniTags.length > 0 : false,
        onClearSelection: clearSelection,
        onApplyTags: handleApplyTags,
        gridViewMode,
        onToggleGridView: toggleGridView,
        onOpenCardSettings: openCardSettings,
        showGridToggle: true,  // Show grid toggle like in main view
        escConfirmationActive,
        onEscClick: handleEscPress,
        onOpenCommandPalette: () => openCommandPalette(""),
        activeCollectionName: activeCollection?.displayName,
        activeCollectionColor: activeCollection?.color,
        counterSlot:
          assets.length > 0 && activeLightboxIndex >= 0
            ? `${Math.min(activeLightboxIndex + 1, assets.length)} / ${assets.length}`
            : undefined
      }}
      onActiveAssetChange={(asset, index) => {
        setActiveLightboxAsset(asset)
        setActiveLightboxIndex(index)
      }}
    >
      <div className="min-h-screen bg-cream no-horizontal-scroll">
        {/* Header - not sticky */}
        <header className="bg-cream select-none">
          <div className="max-w-7xl mx-auto px-3 py-4 lg:px-6 lg:py-6">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <img
                  src="/lashpop-images/branding/logo.png"
                  alt="LashPop Studios"
                  className="h-8 lg:h-10 w-auto mb-1 lg:mb-2"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(72%) sepia(12%) saturate(635%) hue-rotate(316deg) brightness(95%) contrast(88%)'
                  }}
                />
                <h1 className="hidden sm:block text-[10px] lg:text-xs font-semibold text-dune uppercase tracking-wider">
                  Digital Asset Management
                </h1>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                <button
                  onClick={() => setIsUploadOpen(!isUploadOpen)}
                  className={`btn ${isUploadOpen ? 'btn-primary' : 'btn-secondary'} px-2.5 py-2 sm:px-3 sm:py-2`}
                >
                  <UploadIcon className="w-5 h-5 lg:w-5 lg:h-5" />
                  <span className="hidden md:inline">Upload</span>
                </button>
                <Link
                  href="/dam/team"
                  className="btn btn-secondary px-2.5 py-2 sm:px-3 sm:py-2"
                >
                  <Users className="w-5 h-5 lg:w-5 lg:h-5" />
                  <span className="hidden md:inline">Team</span>
                </Link>
                <button
                  onClick={async () => {
                    await fetch("/api/dam/auth/logout", { method: "POST" })
                    window.location.href = "/dam/login"
                  }}
                  className="btn btn-secondary px-2.5 py-2 sm:px-3 sm:py-2"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 lg:w-5 lg:h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Sticky Omni Control Bar */}
        <div className="sticky top-0 z-30 bg-cream backdrop-blur-sm select-none lg:bg-cream/95">
          <div className="max-w-7xl mx-auto px-3 pt-2 lg:px-6 lg:pt-4">
            {/* Desktop: Collection Selector Row with Command Palette */}
            <div className={clsx(
              "hidden lg:flex mb-4 items-center gap-4",
              collections.length > 0 ? "justify-between" : "justify-end"
            )}>
              {/* Collection Selector on the left */}
              {collections.length > 0 && (
                <div className="flex-1">
                  <CollectionSelector
                    collections={collections}
                    activeCollectionId={activeCollectionId}
                    onSelectCollection={setActiveCollectionId}
                    onCreateCollection={() => setIsCollectionManagerOpen(true)}
                  />
                </div>
              )}

              {/* Command Palette Button on the right */}
              <div data-tutorial="command-button" className="flex-shrink-0">
                <OmniChip
                  variant="command-launcher"
                  isSelected={selectedAssets.length > 0}
                  isMobile={isMobile}
                  onClick={() => openCommandPalette("")}
                />
              </div>
            </div>

            {/* Omni Bar */}
            <div className="lg:pb-0">
              <OmniBar
                mode="page"
                groupByButton={selectedAssets.length === 0 ? (
                  <GroupBySelector
                    categories={tagCategories}
                    hasTeamMembers={teamMembers.length > 0}
                    selectedCategories={groupByTags}
                    onCategoryToggle={handleGroupBy}
                    isLightbox={false}
                    maxSelections={2}
                  />
                ) : undefined}
                filterButton={selectedAssets.length === 0 ? (
                  <FilterSelector
                    categories={tagCategories}
                    teamMembers={teamMembers}
                    selectedTagIds={activeFilters.filter(f => f.categoryName !== 'team').map(f => f.optionId)}
                    selectedTeamMemberIds={activeFilters.filter(f => f.categoryName === 'team').map(f => f.optionId)}
                    assets={filterableAssets}
                    onTagToggle={handleTagFilterToggle}
                    onTeamMemberToggle={handleTeamFilterToggle}
                    isLightbox={false}
                  />
                ) : undefined}
                groupByContent={renderGroupByChips()}
                chipsContent={renderChips()}
                selectedCount={selectedAssets.length}
                assetsCount={assets.length}
                totalAssetsCount={allAssets.length}
                canApplyTags={selectedAssets.length === 0 ? omniTags.length > 0 : false}
                onClearSelection={clearSelection}
                onApplyTags={handleApplyTags}
                gridViewMode={gridViewMode}
                onToggleGridView={toggleGridView}
                onOpenCardSettings={openCardSettings}
                escConfirmationActive={escConfirmationActive}
                onEscClick={handleEscPress}
                collectionSelector={collections.length > 0 ? (
                  <CollectionSelector
                    collections={collections}
                    activeCollectionId={activeCollectionId}
                    onSelectCollection={setActiveCollectionId}
                    onCreateCollection={() => setIsCollectionManagerOpen(true)}
                  />
                ) : undefined}
                onOpenCommandPalette={() => openCommandPalette("")}
                activeCollectionName={activeCollection?.displayName}
                activeCollectionColor={activeCollection?.color}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 pt-4 pb-8">
          {/* Collapsible Upload Section */}
          {isUploadOpen && (
            <div className="mb-6 select-none">
              <Suspense fallback={<div className="py-8 text-center text-sage">Loading uploader...</div>}>
                <FileUploader
                  onUploadComplete={handleUploadComplete}
                  onUploadingIdsChange={handleUploadingIdsChange}
                />
              </Suspense>
            </div>
          )}

          {/* Gallery */}
          {isLoading ? (
            <AssetGridSkeleton gridViewMode={gridViewMode} />
          ) : assets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-warm-sand/50 arch-full flex items-center justify-center mx-auto mb-6">
                <UploadIcon className="w-10 h-10 text-sage" />
              </div>
              <h3 className="h3 text-dune mb-3">
                No assets yet
              </h3>
              <p className="body text-sage">
                Click the Upload button to add your first photos
              </p>
            </div>
          ) : (
            <AssetGrid
              assets={assets}
              selectedAssetIds={selectedAssets}
              onSelectionChange={handleSelectionChange}
              onDelete={handleDelete}
              gridViewMode={gridViewMode}
              groupByCategories={groupByTags}
              teamMembers={teamMembers}
              visibleCardTags={visibleCardTags}
              pendingTagRemoval={pendingTagRemoval}
              dissipatingTags={dissipatingTags}
              appearingTags={appearingTags}
              mobileChipBar={undefined} // Commented out InlineChipBar - filters now in OmniBar mobile layout
              chipBarInsertIndex={chipBarInsertIndex}
            />
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <OmniCommandPalette
          open={isCommandOpen}
          query={commandQuery}
          onQueryChange={setCommandQuery}
          onClose={closeCommandPalette}
          items={commandItems}
          isMobile={isMobile}
          mode={commandMode}
          onModeChange={setCommandMode}
          tagCategories={tagCategories}
          onTagCategoriesChange={setTagCategories}
          visibleCardTags={visibleCardTags}
          onVisibleCardTagsChange={setVisibleCardTags}
          contextSummary={{
            selectionCount: selectedAssets.length,
            filterCount: activeFilters.length,
            totalAssets: allAssets.length,
            activeAssetName: activeLightboxAsset?.fileName
          }}
        />
      </Suspense>

      {isTagEditorOpen && (
        <Suspense fallback={null}>
          <TagEditor
            categories={tagCategories.filter(cat => !cat.isCollection && !cat.isRating)}
            onSave={async (updatedCategories) => {
              try {
                // Save to database
                const response = await fetch("/api/dam/tags", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ categories: updatedCategories })
                })

                if (!response.ok) {
                  throw new Error("Failed to save tags")
                }

                // Refresh tag categories from database
                const refreshResponse = await fetch("/api/dam/tags")
                const refreshData = await refreshResponse.json()
                setTagCategories(refreshData.categories || [])

                setIsTagEditorOpen(false)
              } catch (error) {
                console.error("Error saving tags:", error)
                alert("Failed to save tags. Please try again.")
              }
            }}
            onClose={() => setIsTagEditorOpen(false)}
          />
        </Suspense>
      )}

      {isCollectionManagerOpen && (
        <Suspense fallback={null}>
          <CollectionManager
          collections={collections.map((c: { id: string; name: string; displayName: string; color?: string }) => ({
            id: c.id,
            name: c.name,
            displayName: c.displayName,
            description: null,
            sortOrder: 0,
            color: c.color || null
          }))}
          onSave={async (updatedCollections) => {
            try {
              let collectionCategory = tagCategories.find(cat => cat.isCollection)

              // If collection category doesn't exist, create it
              if (!collectionCategory) {
                collectionCategory = {
                  id: `cat-${Date.now()}`,
                  name: "collections",
                  displayName: "Collections",
                  description: "Curated collections of assets",
                  color: "#BD8878", // terracotta
                  sortOrder: 999,
                  isCollection: true,
                  isRating: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  tags: []
                }
              }

              // Update the collection category with new tags
              const updatedCategory = {
                ...collectionCategory,
                tags: updatedCollections.map(col => ({
                  id: col.id,
                  categoryId: collectionCategory.id,
                  name: col.name,
                  displayName: col.displayName,
                  description: col.description,
                  sortOrder: col.sortOrder
                }))
              }

              // IMPORTANT: Send ALL categories, not just the updated one
              // This prevents the API from deleting other categories
              const allCategories = collectionCategory.id.startsWith('cat-')
                ? [...tagCategories, updatedCategory]
                : tagCategories.map(cat => cat.isCollection ? updatedCategory : cat)

              // Save to database
              const response = await fetch("/api/dam/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categories: allCategories })
              })

              if (!response.ok) {
                throw new Error("Failed to save collections")
              }

              // Refresh tag categories from database
              const refreshResponse = await fetch("/api/dam/tags")
              const refreshData = await refreshResponse.json()
              setTagCategories(refreshData.categories || [])

              setIsCollectionManagerOpen(false)
            } catch (error) {
              console.error("Error saving collections:", error)
              alert("Failed to save collections. Please try again.")
            }
          }}
          onClose={() => setIsCollectionManagerOpen(false)}
        />
        </Suspense>
      )}


      {/* Tutorial System */}
      <TutorialWalkthrough />

      {/* Mobile Thumb Panel - only show on mobile */}
      {isMobile && (
        <>
          <ThumbPanel
            collections={collections}
            activeCollectionId={activeCollectionId}
            onSelectCollection={setActiveCollectionId}
            onCreateCollection={() => setIsCollectionManagerOpen(true)}
            groupCategories={tagCategories}
            hasTeamMembers={teamMembers.length > 0}
            selectedGroupCategories={groupByTags}
            onGroupCategoryToggle={handleGroupBy}
            maxGroupSelections={2}
            filterCategories={tagCategories}
            teamMembers={teamMembers}
            selectedTagIds={activeFilters.filter(f => f.categoryName !== 'team').map(f => f.optionId)}
            selectedTeamMemberIds={activeFilters.filter(f => f.categoryName === 'team').map(f => f.optionId)}
            onTagToggle={handleTagFilterToggle}
            onTeamMemberToggle={handleTeamFilterToggle}
            onClearFiltersAndGroups={() => {
              handleClearFilters()
              setGroupByTags([])
            }}
            onOpenCommandPalette={() => openCommandPalette("")}
            showGridToggle={true}
            gridViewMode={gridViewMode}
            onToggleGridView={toggleGridView}
            onOpenCardSettings={openCardSettings}
            selectedCount={selectedAssets.length}
            totalAssetsCount={assets.length}
            onClearSelection={clearSelection}
            onSelectAll={() => setSelectedAssets(assets.map(a => a.id))}
            onDeleteSelected={() => confirmDeleteAssets(selectedAssets, `${selectedAssets.length} selected photo${selectedAssets.length === 1 ? '' : 's'}`)}
            canApplyTags={selectedAssets.length === 0 ? omniTags.length > 0 : false}
            onApplyTags={handleApplyTags}
          />

          {/* Chip bar toggle button - Commented out, using ThumbPanel action button instead */}
          {/* <ChipBarToggleButton
            isActive={chipBarInsertIndex !== null}
            onActivate={handleChipBarActivate}
            hasContent={Boolean(renderGroupByChips() || renderChips())}
          /> */}

          {/* Viewport sensor - invisible line that detects which assets are visible */}
          <ViewportSensor
            position={45}  // 45% from top - matches button position
            onAssetsDetected={handleAssetsDetected}
            debug={false}  // Set to true to see the sensor line
          />
        </>
      )}
    </PhotoLightbox>
  )
}

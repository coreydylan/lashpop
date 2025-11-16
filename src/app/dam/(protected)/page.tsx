"use client"

/* eslint-disable @next/next/no-img-element */

// Force dynamic rendering so middleware runs on every request
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react"
import type { ReactNode } from "react"
import clsx from "clsx"
import { Upload as UploadIcon, Users, X, Sparkles, LogOut } from "lucide-react"
import Link from "next/link"
import { AssetGrid } from "../components/AssetGrid"
import { FilterSelector } from "../components/FilterSelector"
import { TagSelector } from "../components/TagSelector"
import { PhotoLightbox } from "../components/PhotoLightbox"
import { OmniBar } from "../components/OmniBar"
import { OmniChip } from "../components/OmniChip"
import { CollectionSelector } from "../components/CollectionSelector"
import { TutorialWalkthrough } from "../components/TutorialWalkthrough"
import { useDamSettings } from "@/hooks/useDamSettings"
import { useDamActions } from "@/hooks/useDamActions"
import { useDamInitialData } from "@/hooks/useDamData"
import { useDamTutorial } from "@/contexts/DamTutorialContext"

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

  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [tagCategories, setTagCategories] = useState<any[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get from settings hook instead of useState
  const activeFilters = settings.activeFilters
  const setActiveFilters = (filters: ActiveFilter[]) => {
    updateActiveFilters(filters)
    logFilterChange({ filters })
  }
  const activeFiltersRef = useRef<ActiveFilter[]>([])

  const [uploadingAssetIds, setUploadingAssetIds] = useState<string[]>([])
  const hasInteractedWithGridRef = useRef(false)
  const assetsRef = useRef<Asset[]>([])

  // Get collection from settings
  const activeCollectionId = settings.activeCollectionId
  const setActiveCollectionId = (id: string | undefined) => updateActiveCollection(id)

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
  const [existingTags, setExistingTags] = useState<Map<string, number>>(new Map())

  // Grid view state from settings
  const gridViewMode = settings.gridViewMode
  const setGridViewMode = (mode: "square" | "aspect") => {
    updateGridViewMode(mode)
    logViewChange({ viewMode: mode })
  }
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

  // Upload panel state
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Fetch initial data
  const [isMobile, setIsMobile] = useState(false)

  // Group by settings from hook
  const groupByTags = settings.groupByCategories
  const setGroupByTags = (categories: string[]) => {
    updateGroupByCategories(categories)
    logGroupChange({ groupBy: categories })
  }

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
      // Use React Query's refetch instead of manual fetch
      const { data } = await refetchInitialData()
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

    // Refresh the entire asset list to show new uploads
    fetchAssets()
    // Close upload panel after successful upload
    setIsUploadOpen(false)

    if (!keepSelected) {
      // User clicked "Skip Initial Tagging" - clear selection
      setSelectedAssets([])
      setUploadingAssetIds([])
      setOmniTags([])
      setExistingTags(new Map())
    }
  }

  const handleUploadingIdsChange = (assetIds: string[]) => {
    setUploadingAssetIds(assetIds)
    setSelectedAssets(assetIds)
    setOmniTags([])
    setExistingTags(new Map())
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

    // Add tag to dissipating set for animation
    setDissipatingTags(prev => {
      const next = new Set(prev)
      next.add(tagId)
      return next
    })
    setPendingTagRemoval(null)

    // Wait for animation to complete before actually removing
    setTimeout(async () => {
      await handleRemoveTag(tagId, count, assetIds, true)

      // Clean up dissipating tag after removal
      setDissipatingTags(prev => {
        const next = new Set(prev)
        next.delete(tagId)
        return next
      })
    }, 600) // Match dissipate animation duration
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
      await applyTagsToAssetIds([activeLightboxAsset.id], normalized)
      setSingleTagDrafts([])
      const updated = await fetchAssets()
      syncActiveLightboxAsset(updated)
    } catch (error) {
      console.error("Failed to add tags:", error)
      setSingleTagDrafts([])
    }
  }, [activeLightboxAsset, applyTagsToAssetIds, fetchAssets, normalizeExclusiveTags, syncActiveLightboxAsset])


  const clearSelection = useCallback(() => {
    setSelectedAssets([])
    setOmniTags([])
    setExistingTags(new Map())
  }, [])

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
      setExistingTags(new Map())
    } else {
      setExistingTags(computeExistingTags(selectedIds, assetsRef.current))
      setOmniTags([])
    }
    // Don't clear pendingTagRemoval here - let useEffect handle it based on selection state
  }, [computeExistingTags])

  const handleApplyTags = useCallback(async () => {
    if (omniTags.length === 0 || selectedAssets.length === 0) return

    try {
      await applyTagsToAssetIds(selectedAssets, omniTags)
      await fetchAssets()
      clearSelection()
    } catch (error) {
      console.error("Failed to save tags:", error)
    }
  }, [applyTagsToAssetIds, clearSelection, fetchAssets, omniTags, selectedAssets])

  const handleMultiTagSelectorChange = useCallback(async (tags: any[]) => {
    const normalized = normalizeExclusiveTags(tags)
    if (selectedAssets.length === 0) {
      setOmniTags(normalized)
      return
    }

    const newlyAdded = normalized.filter((tag: any) => !omniTags.some((existing) => existing.id === tag.id))
    setOmniTags(normalized)

    if (newlyAdded.length === 0) return

    try {
      await applyTagsToAssetIds(selectedAssets, newlyAdded)
      const updated = await fetchAssets()
      setExistingTags(computeExistingTags(selectedAssets, updated))
      setOmniTags([])
    } catch (error) {
      console.error("Failed to add tags instantly:", error)
    }
  }, [applyTagsToAssetIds, computeExistingTags, fetchAssets, normalizeExclusiveTags, omniTags, selectedAssets])

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

      const updated = await fetchAssets()

      if (targetAssetIds) {
        syncActiveLightboxAsset(updated)
      } else {
        const newExistingTags = new Map(existingTags)
        newExistingTags.delete(tagId)
        setExistingTags(newExistingTags)
      }
      setPendingTagRemoval(null)
    } catch (error) {
      console.error("Failed to remove tag:", error)
    }
  }, [existingTags, fetchAssets, selectedAssets, syncActiveLightboxAsset])

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
          avatarUrl: member.imageUrl,
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
          avatarUrl: member.imageUrl,
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
            avatarUrl: member.imageUrl,
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
          avatarUrl: member.imageUrl,
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
        <span className={`text-xs font-bold ${selectedAssets.length > 0 ? 'text-cream' : 'text-sage'} uppercase`}>
          Group By:
        </span>
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
    // Always show Group By chips first if any
    const groupByContent = renderGroupByChips()
    const commandLauncher = (
      <div key="command-launcher" data-tutorial="command-button">
        <OmniChip
          variant="command-launcher"
          isSelected={selectedAssets.length > 0}
          isMobile={isMobile}
          onClick={() => openCommandPalette("")}
        />
      </div>
    )

    if (selectedAssets.length > 0) {
      return (
        <>
          {commandLauncher}
          {groupByContent}
          {/* Selection Mode: Show existing tags with counts */}
          {Array.from(existingTags.entries()).map(([tagId, count]) => {
            const isTeamMemberTag = tagId.startsWith('team-')
            const isPending = pendingTagRemoval && pendingTagRemoval.tagId === tagId && pendingTagRemoval.context === "multi"

            if (isTeamMemberTag) {
              const teamMemberId = tagId.replace('team-', '')
              const teamMember = teamMembers.find(m => m.id === teamMemberId)
              if (!teamMember) return null

              return (
                <OmniChip
                  key={tagId}
                  variant="tag-existing"
                  categoryName="team"
                  categoryDisplayName="Team"
                  optionDisplayName={teamMember.name}
                  count={count}
                  color={getTagColor("#BCC9C2", false)}
                  imageUrl={teamMember.imageUrl}
                  imageCrop={teamMember.cropCloseUpCircle}
                  isPending={isPending}
                  isMobile={isMobile}
                  onRemove={() => {
                    if (isPending) {
                      confirmTagRemoval()
                    } else {
                      requestTagRemoval(tagId, selectedAssets, "team member", count, "multi")
                    }
                  }}
                  onCategoryClick={() => handleGroupBy("team")}
                  isDisabled={groupByTags.includes("team") || groupByTags.length >= 2}
                  onUnselectAssets={() => {
                    // Find all assets with this team member and unselect them
                    const assetsToUnselect = selectedAssets.filter(assetId => {
                      const asset = assets.find(a => a.id === assetId)
                      return asset?.teamMemberId === teamMemberId
                    })
                    setSelectedAssets(selectedAssets.filter(id => !assetsToUnselect.includes(id)))
                  }}
                />
              )
            }

            // Regular tag
            const tag = assets
              .flatMap(a => a.tags || [])
              .find(t => t.id === tagId)
            if (!tag) return null

            return (
              <OmniChip
                key={tagId}
                variant="tag-existing"
                categoryName={tag.category.name}
                categoryDisplayName={tag.category.displayName}
                optionDisplayName={tag.displayName}
                count={count}
                color={getTagColor(tag.category.color, false)}
                isPending={isPending}
                isMobile={isMobile}
                onRemove={() => {
                  if (isPending) {
                    confirmTagRemoval()
                  } else {
                    requestTagRemoval(tagId, selectedAssets, "tag", count, "multi")
                  }
                }}
                onCategoryClick={() => handleGroupBy(tag.category.name)}
                isDisabled={groupByTags.includes(tag.category.name) || groupByTags.length >= 2}
                onUnselectAssets={() => {
                  // Find all assets with this tag and unselect them
                  const assetsToUnselect = selectedAssets.filter(assetId => {
                    const asset = assets.find(a => a.id === assetId)
                    return asset?.tags?.some(t => t.id === tagId)
                  })
                  setSelectedAssets(selectedAssets.filter(id => !assetsToUnselect.includes(id)))
                }}
              />
            )
          })}

          {/* New tags to add */}
          {omniTags.map((tag) => {
            const isTeamTag = tag.category.name === "team"
            const teamMember = isTeamTag ? teamMembers.find(m => m.id === tag.id) : null

            return (
              <OmniChip
                key={`new-${tag.id}`}
                variant="tag-new"
                categoryDisplayName={tag.category.displayName}
                optionDisplayName={tag.displayName}
                color={getTagColor(tag.category.color, false)}
                imageUrl={isTeamTag ? teamMember?.imageUrl : undefined}
                imageCrop={teamMember?.cropCloseUpCircle}
                isMobile={isMobile}
                onRemove={() => setOmniTags(omniTags.filter(t => t.id !== tag.id))}
                onCategoryClick={() => handleGroupBy(tag.category.name)}
                isDisabled={groupByTags.includes(tag.category.name) || groupByTags.length >= 2}
              />
            )
          })}

          {/* Add Tag button */}
          <TagSelector
            selectedTags={omniTags}
            onTagsChange={handleMultiTagSelectorChange}
          />
        </>
      )
    } else if (activeLightboxAsset) {
      return (
        <>
          {commandLauncher}
          {groupByContent}
          {renderLightboxTags()}
        </>
      )
    } else {
      /* Filter Mode */
      // Convert activeFilters to selected IDs format
      const selectedTagIds = activeFilters
        .filter(f => f.categoryName !== 'team')
        .map(f => f.optionId)
      const selectedTeamMemberIds = activeFilters
        .filter(f => f.categoryName === 'team')
        .map(f => f.optionId)

      return (
        <>
          {commandLauncher}
          {groupByContent}
          {/* Render active filter chips */}
          {activeFilters.map((filter) => (
            <OmniChip
              key={`${filter.categoryId}-${filter.optionId}`}
              variant="filter"
              categoryDisplayName={filter.categoryDisplayName}
              optionDisplayName={filter.optionDisplayName}
              color={filter.categoryColor || "#A19781"}
              imageUrl={filter.imageUrl}
              isMobile={isMobile}
              onRemove={() => {
                setActiveFilters(activeFilters.filter(
                  f => !(f.categoryId === filter.categoryId && f.optionId === filter.optionId)
                ))
              }}
            />
          ))}
          <FilterSelector
            categories={tagCategories}
            teamMembers={teamMembers}
            selectedTagIds={selectedTagIds}
            selectedTeamMemberIds={selectedTeamMemberIds}
            assets={filterableAssets}
            onTagToggle={handleTagFilterToggle}
            onTeamMemberToggle={handleTeamFilterToggle}
            isLightbox={false}
          />
        </>
      )
    }
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
            <div
              className={`flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm border border-white/20 ${isMobile ? 'text-xs' : ''}`}
              style={{
                background: getTagColor("#BCC9C2", true)
              }}
            >
              <div className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
                {teamMember.imageUrl && (
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-cream/30 flex-shrink-0">
                    <img
                      src={teamMember.imageUrl}
                      alt={teamMember.name}
                      className="w-full h-full object-cover"
                      style={
                        teamMember.cropCloseUpCircle
                          ? {
                              objectPosition: `${teamMember.cropCloseUpCircle.x}% ${teamMember.cropCloseUpCircle.y}%`,
                              transform: `scale(${teamMember.cropCloseUpCircle.scale})`
                            }
                          : {
                              objectPosition: 'center 25%',
                              transform: 'scale(2)'
                            }
                      }
                    />
                  </div>
                )}
                <button
                  onClick={() => handleGroupBy("team")}
                  className={`text-xs font-semibold text-cream uppercase tracking-wide hover:text-white transition-colors ${
                    groupByTags.includes("team") ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  disabled={groupByTags.includes("team") || groupByTags.length >= 2}
                >
                  Team
                </button>
                <span className="text-cream/80 text-xs">›</span>
                <span className="text-sm text-cream font-medium">
                  {teamMember.name}
                </span>
              </div>
              {pendingTagRemoval && pendingTagRemoval.tagId === `team-${teamMember.id}` && pendingTagRemoval.context === `single-${activeLightboxAsset.id}` ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/10">
                  <button
                    onClick={confirmTagRemoval}
                    className="text-xs font-semibold text-cream bg-black/30 rounded-full px-2 py-0.5"
                  >
                    Remove
                  </button>
                  <button
                    onClick={cancelTagRemoval}
                    className="text-xs font-medium text-cream/80"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => requestTagRemoval(`team-${teamMember.id}`, [activeLightboxAsset.id], "team member", 1, `single-${activeLightboxAsset.id}`)}
                  className="px-2 py-1.5 hover:bg-black/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-cream" />
                </button>
              )}
            </div>
          )}

          {activeLightboxAsset.tags?.map((tag) => (
            <div
              key={tag.id}
              className={`flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm border border-white/20 ${isMobile ? 'text-xs' : ''}`}
              style={{
                background: getTagColor(tag.category.color, true)
              }}>
                <div className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
                  <button
                    onClick={() => handleGroupBy(tag.category.name)}
                    className={`text-xs font-semibold text-cream uppercase tracking-wide hover:text-white transition-colors ${
                      groupByTags.includes(tag.category.name) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    disabled={groupByTags.includes(tag.category.name) || groupByTags.length >= 2}
                  >
                    {tag.category.displayName}
                  </button>
                  <span className="text-cream/80 text-xs">›</span>
                  <span className="text-sm text-cream font-medium">
                    {tag.displayName}
                  </span>
                </div>
              {pendingTagRemoval && pendingTagRemoval.tagId === tag.id && pendingTagRemoval.context === `single-${activeLightboxAsset.id}` ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/10">
                  <button
                    onClick={confirmTagRemoval}
                    className="text-xs font-semibold text-cream bg-black/30 rounded-full px-2 py-0.5"
                  >
                    Remove
                  </button>
                  <button
                    onClick={cancelTagRemoval}
                    className="text-xs font-medium text-cream/80"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => requestTagRemoval(tag.id, [activeLightboxAsset.id], "tag", 1, `single-${activeLightboxAsset.id}`)}
                  className="px-2 py-1.5 hover:bg-black/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-cream" />
                </button>
              )}
            </div>
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
      <div className="min-h-screen bg-cream">
        {/* Header - not sticky */}
        <header className="bg-cream select-none">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <img
                  src="/lashpop-images/branding/logo.png"
                  alt="LashPop Studios"
                  className="h-10 w-auto mb-2"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(72%) sepia(12%) saturate(635%) hue-rotate(316deg) brightness(95%) contrast(88%)'
                  }}
                />
                <h1 className="text-xs font-semibold text-dune uppercase tracking-wider">
                  Digital Asset Management
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsUploadOpen(!isUploadOpen)}
                  className={`btn ${isUploadOpen ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <UploadIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
                <Link
                  href="/dam/team"
                  className="btn btn-secondary"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">Team</span>
                </Link>
                <button
                  onClick={async () => {
                    await fetch("/api/dam/auth/logout", { method: "POST" })
                    window.location.href = "/dam/login"
                  }}
                  className="btn btn-secondary"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Sticky Omni Control Bar */}
        <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm select-none">
          <div className="max-w-7xl mx-auto px-6 pt-4">
            {/* Collection Selector */}
            {collections.length > 0 && (
              <div className="mb-4">
                <CollectionSelector
                  collections={collections}
                  activeCollectionId={activeCollectionId}
                  onSelectCollection={setActiveCollectionId}
                  onCreateCollection={() => setIsCollectionManagerOpen(true)}
                />
              </div>
            )}

            {/* Omni Bar */}
            <div>
              <OmniBar
                mode="page"
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
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
            </div>
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

      {isMobile && !isCommandOpen && (
        <div className="fixed bottom-5 left-0 right-0 z-40 px-6 lg:hidden safe-bottom">
          <button
            onClick={() => openCommandPalette("")}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-dune text-cream py-3 shadow-2xl shadow-dune/40 border border-white/10"
            data-tutorial="command-button"
          >
            <Sparkles className="w-5 h-5 text-dusty-rose" />
            <span className="text-sm font-semibold uppercase tracking-wide">Command Palette</span>
          </button>
        </div>
      )}

      {/* Tutorial System */}
      <TutorialWalkthrough />
    </PhotoLightbox>
  )
}

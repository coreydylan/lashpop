"use client"

import { useState, useMemo } from "react"
import { OmniChip } from "./OmniChip"
import { TagSelector } from "./TagSelector"
import { ChevronLeft } from "lucide-react"

interface GroupedChipListProps {
  // Selection Data
  selectedAssetIds: string[]
  assets: any[]
  teamMembers: any[]
  
  // Filter Data
  activeFilters: any[]
  
  // Tagging Data
  omniTags: any[]
  
  // Tag Categories (needed for filtering/grouping lookup)
  tagCategories?: any[]
  
  // UI State
  isMobile: boolean
  groupByTags: string[]
  
  // Callbacks
  onRemoveTag: (tagId: string, count: number, assetIds: string[]) => void
  onGroupBy: (categoryName: string) => void
  onUnselectAssets: (assetIds: string[]) => void
  onRemoveFilter: (filter: any) => void
  onRemoveOmniTag: (tagId: string) => void
  onMultiTagSelectorChange: (tags: any[]) => void
  
  // Visual States
  pendingTagRemoval?: {
    tagId: string
    assetIds: string[]
    label: string
    count: number
    context: string
  } | null
  dissipatingTags?: Set<string>
}

export function GroupedChipList({
  selectedAssetIds,
  assets,
  teamMembers,
  activeFilters,
  omniTags,
  tagCategories = [],
  isMobile,
  groupByTags,
  onRemoveTag,
  onGroupBy,
  onUnselectAssets,
  onRemoveFilter,
  onRemoveOmniTag,
  onMultiTagSelectorChange,
  pendingTagRemoval,
  dissipatingTags = new Set()
}: GroupedChipListProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Helper to generate tag colors
  const getTagColor = (color: string | undefined, isLightbox: boolean = false) => {
    const baseColor = color || "#A19781"
    if (!isLightbox) {
      return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}CC 100%)`
    }
    return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}EE 100%)`
  }

  // Compute existing tags from selection
  const existingTags = useMemo(() => {
    if (selectedAssetIds.length === 0) return new Map()
    
    const tagCounts = new Map<string, number>()
    const selectedAssetsData = assets.filter((asset) => selectedAssetIds.includes(asset.id))

    selectedAssetsData.forEach((asset) => {
      asset.tags?.forEach((tag: any) => {
        tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1)
      })

      if (asset.teamMemberId) {
        const key = `team-${asset.teamMemberId}`
        tagCounts.set(key, (tagCounts.get(key) || 0) + 1)
      }
    })

    return tagCounts
  }, [selectedAssetIds, assets])

  // Group everything by category
  const groups = useMemo(() => {
    const grouped: Record<string, {
      id: string
      type: 'selection' | 'new' | 'filter'
      categoryName: string
      categoryDisplayName: string
      optionDisplayName: string
      count?: number
      color: string
      imageUrl?: string
      imageCrop?: any
      isStaticImage?: boolean
      data: any
    }[]> = {}

    // 1. Process Selection Tags
    if (selectedAssetIds.length > 0) {
      Array.from(existingTags.entries()).forEach(([tagId, count]) => {
        const isTeamMemberTag = tagId.startsWith('team-')
        
        if (isTeamMemberTag) {
          const teamMemberId = tagId.replace('team-', '')
          const teamMember = teamMembers.find(m => m.id === teamMemberId)
          if (teamMember) {
            if (!grouped['team']) grouped['team'] = []
            grouped['team'].push({
              id: tagId,
              type: 'selection',
              categoryName: 'team',
              categoryDisplayName: 'Team',
              optionDisplayName: teamMember.name,
              count,
              color: getTagColor("#BCC9C2", false),
              imageUrl: teamMember.cropCloseUpCircleUrl || teamMember.imageUrl,
              imageCrop: teamMember.cropCloseUpCircleUrl ? undefined : teamMember.cropCloseUpCircle,
              isStaticImage: !!teamMember.cropCloseUpCircleUrl,
              data: { teamMember }
            })
          }
        } else {
          // Regular tag lookup
          // Inefficient but safe: scan all assets to find tag metadata
          const tag = assets
            .flatMap(a => a.tags || [])
            .find(t => t.id === tagId)
            
          if (tag) {
            const catName = tag.category.name
            if (!grouped[catName]) grouped[catName] = []
            grouped[catName].push({
              id: tagId,
              type: 'selection',
              categoryName: catName,
              categoryDisplayName: tag.category.displayName,
              optionDisplayName: tag.displayName,
              count,
              color: getTagColor(tag.category.color, false),
              data: { tag }
            })
          }
        }
      })

      // 2. Process New Omni Tags (Pending application)
      omniTags.forEach((tag) => {
        const catName = tag.category.name
        const isTeamTag = catName === "team"
        const teamMember = isTeamTag ? teamMembers.find(m => m.id === tag.id) : null
        
        if (!grouped[catName]) grouped[catName] = []
        grouped[catName].push({
          id: `new-${tag.id}`,
          type: 'new',
          categoryName: catName,
          categoryDisplayName: tag.category.displayName,
          optionDisplayName: tag.displayName,
          color: getTagColor(tag.category.color, false),
          imageUrl: isTeamTag ? (teamMember?.cropCloseUpCircleUrl || teamMember?.imageUrl) : undefined,
          imageCrop: isTeamTag ? (teamMember?.cropCloseUpCircleUrl ? undefined : teamMember?.cropCloseUpCircle) : undefined,
          isStaticImage: isTeamTag ? !!teamMember?.cropCloseUpCircleUrl : false,
          data: { tag }
        })
      })
    } else {
      // 3. Process Filters (Only when no selection)
      activeFilters.forEach((filter) => {
        const catName = filter.categoryName
        if (!grouped[catName]) grouped[catName] = []
        
        const isTeam = catName === 'team'
        const teamMember = isTeam ? teamMembers.find(m => m.id === filter.optionId) : null

        grouped[catName].push({
          id: `filter-${filter.categoryId}-${filter.optionId}`,
          type: 'filter',
          categoryName: catName,
          categoryDisplayName: filter.categoryDisplayName,
          optionDisplayName: filter.optionDisplayName,
          color: filter.categoryColor || "#A19781",
          imageUrl: isTeam ? (teamMember?.cropCloseUpCircleUrl || teamMember?.imageUrl || filter.imageUrl) : filter.imageUrl,
          imageCrop: isTeam ? (teamMember?.cropCloseUpCircleUrl ? undefined : teamMember?.cropCloseUpCircle) : undefined,
          isStaticImage: isTeam ? !!teamMember?.cropCloseUpCircleUrl : false,
          data: { filter }
        })
      })
    }

    return grouped
  }, [selectedAssetIds, existingTags, assets, teamMembers, omniTags, activeFilters])

  // Render logic
  return (
    <>
      {Object.entries(groups).map(([categoryName, items]) => {
        if (items.length === 0) return null

        // Check if this group is expanded
        const isExpanded = expandedCategory === categoryName
        const shouldStack = items.length > 1
        const masterItem = items[0] // Use first item for category metadata

        // RENDER EXPANDED GROUP (OR SINGLE ITEM LIST)
        if (!shouldStack || isExpanded) {
          return (
            <div key={categoryName} className="flex items-center gap-2">
              {/* Collapse Button (Only if it was a stack) */}
              {shouldStack && (
                <button
                  onClick={() => setExpandedCategory(null)}
                  className="flex items-center justify-center w-6 h-6 rounded-full transition-colors"
                  style={{
                    backgroundColor: items[0].color ? `${items[0].color.split(' ')[1]}40` : 'rgba(0,0,0,0.1)', // Extract color from gradient string roughly or fallback
                    color: '#2B2824' // Dune color for icon
                  }}
                  title="Collapse group"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
              
              {/* The List of Chips */}
              {items.map((item) => {
                const isPending = pendingTagRemoval && pendingTagRemoval.tagId === item.id && pendingTagRemoval.context === "multi"
                const isDissipating = dissipatingTags.has(item.id)

                if (item.type === 'selection') {
                  return (
                    <OmniChip
                      key={item.id}
                      variant="tag-existing"
                      categoryName={item.categoryName}
                      categoryDisplayName={item.categoryDisplayName}
                      optionDisplayName={item.optionDisplayName}
                      count={item.count}
                      color={item.color}
                      imageUrl={item.imageUrl}
                      imageCrop={item.imageCrop}
                      isStaticImage={item.isStaticImage}
                      isPending={isPending}
                      isDissipating={isDissipating}
                      isMobile={isMobile}
                      onRemove={() => onRemoveTag(item.id, item.count!, selectedAssetIds)}
                      onCategoryClick={() => onGroupBy(item.categoryName)}
                      isDisabled={groupByTags.includes(item.categoryName) || groupByTags.length >= 2}
                      onUnselectAssets={() => {
                         // Reconstruct unselect logic
                         const targetId = item.categoryName === 'team' ? item.id.replace('team-', '') : item.id
                         const assetsToUnselect = selectedAssetIds.filter(assetId => {
                           const asset = assets.find(a => a.id === assetId)
                           if (item.categoryName === 'team') return asset?.teamMemberId === targetId
                           return asset?.tags?.some((t: any) => t.id === targetId)
                         })
                         onUnselectAssets(assetsToUnselect)
                      }}
                    />
                  )
                } else if (item.type === 'new') {
                   return (
                    <OmniChip
                      key={item.id}
                      variant="tag-new"
                      categoryDisplayName={item.categoryDisplayName}
                      optionDisplayName={item.optionDisplayName}
                      color={item.color}
                      imageUrl={item.imageUrl}
                      imageCrop={item.imageCrop}
                      isMobile={isMobile}
                      onRemove={() => onRemoveOmniTag(item.data.tag.id)}
                      onCategoryClick={() => onGroupBy(item.categoryName)}
                      isDisabled={groupByTags.includes(item.categoryName) || groupByTags.length >= 2}
                    />
                   )
                } else {
                  // Filter
                  return (
                    <OmniChip
                      key={item.id}
                      variant="filter"
                      categoryName={item.categoryName}
                      categoryDisplayName={item.categoryDisplayName}
                      optionDisplayName={item.optionDisplayName}
                      color={item.color}
                      imageUrl={item.imageUrl}
                      imageCrop={item.imageCrop}
                      isMobile={isMobile}
                      onRemove={() => onRemoveFilter(item.data.filter)}
                      onCategoryClick={() => onGroupBy(item.categoryName)}
                      isDisabled={groupByTags.includes(item.categoryName) || groupByTags.length >= 2}
                    />
                  )
                }
              })}
            </div>
          )
        }

        // RENDER STACK CHIP
        return (
          <OmniChip
            key={categoryName}
            variant="stack"
            categoryName={categoryName}
            categoryDisplayName={masterItem.categoryDisplayName}
            optionDisplayName={`${items.length} items`}
            count={items.length}
            color={masterItem.color} // Use color of first item (usually category color)
            isMobile={isMobile}
            onClick={() => setExpandedCategory(categoryName)}
          />
        )
      })}

      {/* Add Tag Selector (Hidden on mobile) */}
      {selectedAssetIds.length > 0 && (
        <div className="hidden lg:block">
          <TagSelector
            selectedTags={omniTags}
            onTagsChange={onMultiTagSelectorChange}
          />
        </div>
      )}
    </>
  )
}


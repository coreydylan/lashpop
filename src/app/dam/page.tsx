"use client"

import { useState, useEffect } from "react"
import { Upload as UploadIcon, Users, X, Grid3x3, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { FileUploader } from "./components/FileUploader"
import { AssetGrid } from "./components/AssetGrid"
import { FilterSelector } from "./components/FilterSelector"
import { TagSelector } from "./components/TagSelector"
import { PhotoLightbox } from "./components/PhotoLightbox"

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
  const [assets, setAssets] = useState<Asset[]>([])
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [uploadingAssetIds, setUploadingAssetIds] = useState<string[]>([])

  // Omni-bar state (used for both filtering and bulk tagging)
  const [omniTeamMemberId, setOmniTeamMemberId] = useState<string | undefined>()
  const [omniTags, setOmniTags] = useState<any[]>([])
  const [existingTags, setExistingTags] = useState<Map<string, number>>(new Map())

  // Grid view state
  const [gridViewMode, setGridViewMode] = useState<"square" | "aspect">("square")

  // Upload panel state
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchAssets()
    fetchTeamMembers()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/dam/assets")
      const data = await response.json()
      const fetchedAssets = data.assets || []
      setAllAssets(fetchedAssets)
      applyFilters(fetchedAssets, activeFilters)
    } catch (error) {
      console.error("Failed to fetch assets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = (assetsToFilter: Asset[], filters: ActiveFilter[]) => {
    if (filters.length === 0) {
      setAssets(assetsToFilter)
      return
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

    setAssets(filtered)
  }

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    // Only apply filters if not in selection mode
    if (selectedAssets.length === 0) {
      setActiveFilters(filters)
      applyFilters(allAssets, filters)
    }
  }

  const handleOmniTagsChange = (tags: any[]) => {
    setOmniTags(tags)
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/dam/team-members")
      const data = await response.json()
      setTeamMembers(data.teamMembers || [])
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }

  const handleUploadComplete = (newAssets: Asset[], keepSelected: boolean) => {
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

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedAssets(selectedIds)

    if (selectedIds.length === 0) {
      // Clear selection mode
      setOmniTeamMemberId(undefined)
      setOmniTags([])
      setExistingTags(new Map())
    } else {
      // Calculate existing tags on selected assets (including team members)
      const selectedAssetsData = assets.filter(a => selectedIds.includes(a.id))
      const tagCounts = new Map<string, number>()

      selectedAssetsData.forEach(asset => {
        // Count regular tags
        asset.tags?.forEach(tag => {
          tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1)
        })

        // Count team member as a "tag"
        if (asset.teamMemberId) {
          tagCounts.set(`team-${asset.teamMemberId}`, (tagCounts.get(`team-${asset.teamMemberId}`) || 0) + 1)
        }
      })

      setExistingTags(tagCounts)
      setOmniTags([])
    }
  }

  const handleApplyTags = async () => {
    if (omniTags.length === 0) return

    try {
      // Separate team member tags from regular tags
      const teamMemberTags = omniTags.filter(t => t.category.name === "team")
      const regularTags = omniTags.filter(t => t.category.name !== "team")

      // Apply team member assignments
      if (teamMemberTags.length > 0) {
        const teamMemberId = teamMemberTags[0].id
        const response = await fetch("/api/dam/assets/assign-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assetIds: selectedAssets,
            teamMemberId
          })
        })

        if (!response.ok) {
          throw new Error("Failed to assign team member")
        }
      }

      // Apply regular tags
      if (regularTags.length > 0) {
        const response = await fetch("/api/dam/assets/bulk-tag", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assetIds: selectedAssets,
            tagIds: regularTags.map(t => t.id),
            additive: true
          })
        })

        if (!response.ok) {
          throw new Error("Failed to save tags")
        }
      }

      // Refresh assets
      await fetchAssets()
      setSelectedAssets([])
      setOmniTags([])
      setExistingTags(new Map())
    } catch (error) {
      console.error("Failed to save tags:", error)
    }
  }

  const handleRemoveTag = async (tagId: string, count: number) => {
    const isTeamMemberTag = tagId.startsWith('team-')
    const label = isTeamMemberTag ? "team member" : "tag"

    if (!confirm(`Remove this ${label} from ${count} image${count !== 1 ? 's' : ''}?`)) return

    try {
      if (isTeamMemberTag) {
        // Remove team member from selected assets
        const response = await fetch("/api/dam/assets/remove-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assetIds: selectedAssets
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
            assetIds: selectedAssets,
            tagId
          })
        })

        if (!response.ok) {
          throw new Error("Failed to remove tag")
        }
      }

      // Refresh assets
      await fetchAssets()

      // Update existing tags count
      const newExistingTags = new Map(existingTags)
      newExistingTags.delete(tagId)
      setExistingTags(newExistingTags)
    } catch (error) {
      console.error("Failed to remove tag:", error)
    }
  }

  const handleDelete = async (assetIds: string[]) => {
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
        // Refresh assets
        await fetchAssets()
        setSelectedAssets([])
      }
    } catch (error) {
      console.error("Failed to delete assets:", error)
    }
  }

  const renderChips = () => {
    if (selectedAssets.length > 0) {
      return (
        <>
          {/* Selection Mode: Show existing tags with counts */}
          {Array.from(existingTags.entries()).map(([tagId, count]) => {
            const isTeamMemberTag = tagId.startsWith('team-')

            if (isTeamMemberTag) {
              const teamMemberId = tagId.replace('team-', '')
              const teamMember = teamMembers.find(m => m.id === teamMemberId)
              if (!teamMember) return null

              return (
                <div
                  key={tagId}
                  className="flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, #BCC9C2 0%, #BCC9C2CC 100%)`
                  }}
                >
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <button
                      onClick={() => handleRemoveTag(tagId, count)}
                      className="flex items-center gap-1 hover:bg-black/10 rounded px-1 transition-colors"
                    >
                      <X className="w-3 h-3 text-cream" />
                      <span className="text-xs font-bold text-cream">{count}</span>
                    </button>
                    {teamMember.imageUrl && (
                      <img
                        src={teamMember.imageUrl}
                        alt={teamMember.name}
                        className="w-5 h-5 rounded-full object-cover border border-cream/30"
                      />
                    )}
                    <span className="text-xs font-semibold text-cream uppercase tracking-wide">
                      Team
                    </span>
                    <span className="text-cream/80 text-xs">›</span>
                    <span className="text-sm text-cream font-medium">
                      {teamMember.name}
                    </span>
                  </div>
                </div>
              )
            }

            // Regular tag
            const tag = assets
              .flatMap(a => a.tags || [])
              .find(t => t.id === tagId)
            if (!tag) return null

            return (
              <div
                key={tagId}
                className="flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${tag.category.color || "#A19781"} 0%, ${tag.category.color || "#A19781"}CC 100%)`
                }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <button
                    onClick={() => handleRemoveTag(tagId, count)}
                    className="flex items-center gap-1 hover:bg-black/10 rounded px-1 transition-colors"
                  >
                    <X className="w-3 h-3 text-cream" />
                    <span className="text-xs font-bold text-cream">{count}</span>
                  </button>
                  <span className="text-xs font-semibold text-cream uppercase tracking-wide">
                    {tag.category.displayName}
                  </span>
                  <span className="text-cream/80 text-xs">›</span>
                  <span className="text-sm text-cream font-medium">
                    {tag.displayName}
                  </span>
                </div>
              </div>
            )
          })}

          {/* New tags to add */}
          {omniTags.map((tag) => {
            const isTeamTag = tag.category.name === "team"
            const teamMember = isTeamTag ? teamMembers.find(m => m.id === tag.id) : null

            return (
              <div
                key={`new-${tag.id}`}
                className="flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm border-2 border-cream/40"
                style={{
                  background: `linear-gradient(135deg, ${tag.category.color || "#A19781"} 0%, ${tag.category.color || "#A19781"}CC 100%)`
                }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5">
                  {isTeamTag && teamMember?.imageUrl && (
                    <img
                      src={teamMember.imageUrl}
                      alt={tag.displayName}
                      className="w-5 h-5 rounded-full object-cover border border-cream/30"
                    />
                  )}
                  <span className="text-xs font-semibold text-cream uppercase tracking-wide">
                    {tag.category.displayName}
                  </span>
                  <span className="text-cream/80 text-xs">›</span>
                  <span className="text-sm text-cream font-medium">
                    {tag.displayName}
                  </span>
                </div>
                <button
                  onClick={() => setOmniTags(omniTags.filter(t => t.id !== tag.id))}
                  className="px-2 py-1.5 hover:bg-black/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-cream" />
                </button>
              </div>
            )
          })}

          {/* Add Tag button */}
          <TagSelector
            selectedTags={omniTags}
            onTagsChange={handleOmniTagsChange}
          />
        </>
      )
    } else {
      /* Filter Mode */
      return (
        <FilterSelector
          activeFilters={activeFilters}
          onFiltersChange={handleFiltersChange}
        />
      )
    }
  }

  return (
    <PhotoLightbox
      selectedAssetIds={selectedAssets}
      onSelectionChange={handleSelectionChange}
      assets={assets}
    >
      <div className="min-h-screen bg-cream">
        {/* Header - not sticky */}
        <header className="bg-cream">
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
              </div>
            </div>
          </div>
        </header>

        {/* Sticky Omni Control Bar */}
        <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className={`arch-full overflow-hidden transition-colors ${
              selectedAssets.length > 0
                ? "bg-dusty-rose/30"
                : "bg-warm-sand/30"
            }`}>
              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center gap-4 px-6 py-5">
                {/* Chips area */}
                <div className="flex-1 min-w-0 overflow-x-auto">
                  <div className="flex items-center gap-3">
                    {renderChips()}
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex-shrink-0 pl-4 flex items-center gap-3">
                  {selectedAssets.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="body text-dune whitespace-nowrap font-semibold">
                          {selectedAssets.length} selected
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAssets([])
                            setOmniTags([])
                            setExistingTags(new Map())
                          }}
                          className="p-1 hover:bg-dune/10 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-dune" />
                        </button>
                      </div>
                      {omniTags.length > 0 && (
                        <button
                          onClick={handleApplyTags}
                          className="px-6 py-2 rounded-full bg-dusty-rose text-cream font-semibold hover:bg-dusty-rose/80 transition-colors shadow-lg"
                        >
                          Apply
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="body text-sage whitespace-nowrap">
                        {assets.length} asset{assets.length !== 1 ? "s" : ""}
                        {activeFilters.length > 0 && ` (${allAssets.length} total)`}
                      </span>
                      <button
                        onClick={() => setGridViewMode(gridViewMode === "square" ? "aspect" : "square")}
                        className="p-2 hover:bg-dune/10 rounded-full transition-colors"
                        title={gridViewMode === "square" ? "Switch to aspect ratio view" : "Switch to square grid view"}
                      >
                        {gridViewMode === "square" ? (
                          <LayoutGrid className="w-4 h-4 text-sage" />
                        ) : (
                          <Grid3x3 className="w-4 h-4 text-sage" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Layout - Stacked */}
              <div className="block lg:hidden">
                {/* Top row: Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-sage/10">
                  {selectedAssets.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="body text-dune font-semibold">
                          {selectedAssets.length} selected
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAssets([])
                            setOmniTags([])
                            setExistingTags(new Map())
                          }}
                          className="p-1 hover:bg-dune/10 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-dune" />
                        </button>
                      </div>
                      {omniTags.length > 0 && (
                        <button
                          onClick={handleApplyTags}
                          className="px-4 py-1.5 rounded-full bg-dusty-rose text-cream text-sm font-semibold"
                        >
                          Apply
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="body text-sage">
                        {assets.length} asset{assets.length !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => setGridViewMode(gridViewMode === "square" ? "aspect" : "square")}
                        className="p-2 hover:bg-dune/10 rounded-full transition-colors"
                      >
                        {gridViewMode === "square" ? (
                          <LayoutGrid className="w-4 h-4 text-sage" />
                        ) : (
                          <Grid3x3 className="w-4 h-4 text-sage" />
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Bottom row: Chips */}
                <div className="px-4 py-3 overflow-x-auto">
                  <div className="flex items-center gap-2">
                    {renderChips()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Collapsible Upload Section */}
          {isUploadOpen && (
            <div className="mb-6">
              <FileUploader
                onUploadComplete={handleUploadComplete}
                onUploadingIdsChange={handleUploadingIdsChange}
              />
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
            />
          )}
        </main>
      </div>
    </PhotoLightbox>
  )
}

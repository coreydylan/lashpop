"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  X,
  Search,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
  Tag,
  Layers,
  Star,
  Expand,
  Grid3X3,
  ImageOff
} from 'lucide-react'
import clsx from 'clsx'

// Types
interface Asset {
  id: string
  fileName: string
  filePath: string
  fileType: "image" | "video"
  uploadedAt: Date | string
  teamMemberId?: string | null
  tags?: Array<{
    id: string
    name: string
    displayName: string
    category: {
      id: string
      name: string
      displayName: string
      color?: string | null
    }
  }>
}

interface TagCategory {
  id: string
  name: string
  displayName: string
  color?: string | null
  isCollection?: boolean
  isRating?: boolean
  tags: Array<{
    id: string
    name: string
    displayName: string
  }>
}

interface TeamMember {
  id: string
  name: string
  imageUrl?: string | null
  cropCloseUpCircleUrl?: string | null
}

interface ServiceHeroImagePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: Asset, shouldTagForService: boolean) => void
  onClearImage?: () => void
  selectedAssetId?: string | null
  serviceId: string
  serviceName: string
}

export function ServiceHeroImagePicker({
  isOpen,
  onClose,
  onSelect,
  onClearImage,
  selectedAssetId,
  serviceId,
  serviceName
}: ServiceHeroImagePickerProps) {
  // Data state
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [serviceTaggedAssetIds, setServiceTaggedAssetIds] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View mode: 'service' shows only service-tagged images, 'all' shows everything
  const [viewMode, setViewMode] = useState<'service' | 'all'>('service')

  // Filter state (only used in 'all' mode)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Fetch DAM data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all assets and service-specific tagged assets in parallel
      const [damResponse, serviceAssetsResponse] = await Promise.all([
        fetch('/api/dam/initial-data'),
        fetch(`/api/dam/service-assets?serviceId=${serviceId}`)
      ])

      if (!damResponse.ok) throw new Error('Failed to fetch DAM data')

      const damData = await damResponse.json()
      setAllAssets(damData.assets || [])
      setCategories(damData.categories || [])
      setTeamMembers(damData.teamMembers || [])

      // Get the IDs of assets tagged for this service
      if (serviceAssetsResponse.ok) {
        const serviceData = await serviceAssetsResponse.json()
        setServiceTaggedAssetIds(new Set(serviceData.assetIds || []))
      }
    } catch (err) {
      console.error('Error fetching DAM data:', err)
      setError('Failed to load media library')
    } finally {
      setLoading(false)
    }
  }, [serviceId])

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedTagIds(new Set())
      setSelectedTeamMemberIds(new Set())
      setShowFilters(false)
      setViewMode('service')
    }
  }, [isOpen])

  // Images only
  const imageAssets = useMemo(() => {
    return allAssets.filter(asset => asset.fileType === 'image')
  }, [allAssets])

  // Service-tagged images (pre-filtered view)
  const serviceTaggedAssets = useMemo(() => {
    return imageAssets.filter(asset => serviceTaggedAssetIds.has(asset.id))
  }, [imageAssets, serviceTaggedAssetIds])

  // Filtered assets for "all" view
  const filteredAllAssets = useMemo(() => {
    let filtered = imageAssets

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(asset =>
        asset.fileName.toLowerCase().includes(query) ||
        asset.tags?.some(tag =>
          tag.displayName.toLowerCase().includes(query) ||
          tag.category.displayName.toLowerCase().includes(query)
        )
      )
    }

    // Apply tag filters
    if (selectedTagIds.size > 0) {
      filtered = filtered.filter(asset =>
        asset.tags?.some(tag => selectedTagIds.has(tag.id))
      )
    }

    // Apply team member filters
    if (selectedTeamMemberIds.size > 0) {
      filtered = filtered.filter(asset =>
        asset.teamMemberId && selectedTeamMemberIds.has(asset.teamMemberId)
      )
    }

    return filtered
  }, [imageAssets, searchQuery, selectedTagIds, selectedTeamMemberIds])

  // Filter categories (exclude collections and ratings for simplicity)
  const filterableCategories = useMemo(() => {
    return categories.filter(cat => !cat.isCollection && !cat.isRating)
  }, [categories])

  // Handle asset selection
  const handleAssetClick = (asset: Asset) => {
    // If selecting from "all" view and image is NOT already tagged for this service,
    // we need to auto-tag it
    const isTaggedForService = serviceTaggedAssetIds.has(asset.id)
    const shouldTagForService = viewMode === 'all' && !isTaggedForService

    onSelect(asset, shouldTagForService)
    onClose()
  }

  // Handle tag toggle
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else {
        next.add(tagId)
      }
      return next
    })
  }

  // Handle team member toggle
  const toggleTeamMember = (memberId: string) => {
    setSelectedTeamMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedTagIds(new Set())
    setSelectedTeamMemberIds(new Set())
    setSearchQuery('')
  }

  const hasActiveFilters = selectedTagIds.size > 0 || selectedTeamMemberIds.size > 0 || searchQuery

  // Which assets to show based on view mode
  const displayedAssets = viewMode === 'service' ? serviceTaggedAssets : filteredAllAssets

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dune/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-cream rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sage/10 bg-cream/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-dusty-rose/30 to-terracotta/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-terracotta" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-dune">Select Hero Image</h2>
                  <p className="text-xs text-dune/60">for {serviceName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* No Image option - only show if there's currently an image selected */}
                {selectedAssetId && onClearImage && (
                  <button
                    onClick={() => {
                      onClearImage()
                      onClose()
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sage/10 hover:bg-sage/20 text-dune/70 hover:text-dune transition-colors text-sm"
                  >
                    <ImageOff className="w-4 h-4" />
                    <span>No Image</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-sage/10 hover:bg-sage/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-dune/60" />
                </button>
              </div>
            </div>

            {/* View Toggle & Search Bar */}
            <div className="px-6 py-3 border-b border-sage/10 bg-warm-sand/20">
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 bg-cream rounded-xl p-1 border border-sage/20">
                  <button
                    onClick={() => setViewMode('service')}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      viewMode === 'service'
                        ? "bg-dusty-rose/20 text-dune shadow-sm"
                        : "text-dune/60 hover:text-dune"
                    )}
                  >
                    <Star className="w-4 h-4" />
                    <span>For This Service</span>
                    <span className={clsx(
                      "px-1.5 py-0.5 rounded-full text-[10px]",
                      viewMode === 'service' ? "bg-dusty-rose/30 text-dusty-rose" : "bg-sage/20 text-sage"
                    )}>
                      {serviceTaggedAssets.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      viewMode === 'all'
                        ? "bg-dusty-rose/20 text-dune shadow-sm"
                        : "text-dune/60 hover:text-dune"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span>All Images</span>
                    <span className={clsx(
                      "px-1.5 py-0.5 rounded-full text-[10px]",
                      viewMode === 'all' ? "bg-dusty-rose/30 text-dusty-rose" : "bg-sage/20 text-sage"
                    )}>
                      {imageAssets.length}
                    </span>
                  </button>
                </div>

                {/* Refresh */}
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="w-10 h-10 rounded-xl bg-cream border border-sage/20 flex items-center justify-center hover:border-sage/40 transition-colors"
                >
                  <RefreshCw className={clsx("w-4 h-4 text-dune/60", loading && "animate-spin")} />
                </button>
              </div>

              {/* Service View Info Banner */}
              {viewMode === 'service' && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dusty-rose/10 border border-dusty-rose/20 mb-3">
                  <Star className="w-5 h-5 text-dusty-rose flex-shrink-0" />
                  <p className="text-sm text-dune/70">
                    Showing images tagged for <strong className="text-dune">{serviceName}</strong>.
                    {serviceTaggedAssets.length === 0 && (
                      <span className="text-dune/60"> No images tagged yet — select from &ldquo;All Images&rdquo; to add one.</span>
                    )}
                  </p>
                </div>
              )}

              {/* All View - Search & Filters */}
              {viewMode === 'all' && (
                <>
                  <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-ocean-mist/10 border border-ocean-mist/20">
                    <Expand className="w-5 h-5 text-ocean-mist flex-shrink-0" />
                    <p className="text-sm text-dune/70">
                      Selecting from all images will <strong className="text-dune">automatically tag</strong> the image for {serviceName}.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dune/40" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or tag..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-sage/20 text-sm text-dune placeholder:text-dune/40 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose/40"
                      />
                    </div>

                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={clsx(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
                        showFilters || hasActiveFilters
                          ? "bg-dusty-rose/10 border-dusty-rose/30 text-dune"
                          : "bg-cream border-sage/20 text-dune/60 hover:border-sage/40"
                      )}
                    >
                      <Filter className="w-4 h-4" />
                      <span className="text-sm">Filters</span>
                      {hasActiveFilters && (
                        <span className="w-5 h-5 rounded-full bg-dusty-rose text-white text-xs flex items-center justify-center">
                          {selectedTagIds.size + selectedTeamMemberIds.size}
                        </span>
                      )}
                      <ChevronDown className={clsx(
                        "w-4 h-4 transition-transform",
                        showFilters && "rotate-180"
                      )} />
                    </button>
                  </div>

                  {/* Expanded Filters */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-4">
                          {/* Team Members */}
                          {teamMembers.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 text-xs text-dune/60 uppercase tracking-wider mb-2">
                                <Users className="w-3 h-3" />
                                <span>Team Members</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {teamMembers.map(member => (
                                  <button
                                    key={member.id}
                                    onClick={() => toggleTeamMember(member.id)}
                                    className={clsx(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all",
                                      selectedTeamMemberIds.has(member.id)
                                        ? "bg-ocean-mist/20 border border-ocean-mist/40 text-dune"
                                        : "bg-cream border border-sage/20 text-dune/70 hover:border-sage/40"
                                    )}
                                  >
                                    {member.cropCloseUpCircleUrl || member.imageUrl ? (
                                      <Image
                                        src={member.cropCloseUpCircleUrl || member.imageUrl || ''}
                                        alt={member.name}
                                        width={16}
                                        height={16}
                                        className="w-4 h-4 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full bg-sage/20" />
                                    )}
                                    {member.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tag Categories */}
                          {filterableCategories.map(category => (
                            <div key={category.id}>
                              <div className="flex items-center gap-2 text-xs text-dune/60 uppercase tracking-wider mb-2">
                                <Tag className="w-3 h-3" />
                                <span>{category.displayName}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {category.tags.map(tag => (
                                  <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={clsx(
                                      "px-3 py-1.5 rounded-full text-xs transition-all",
                                      selectedTagIds.has(tag.id)
                                        ? "text-white"
                                        : "bg-cream border border-sage/20 text-dune/70 hover:border-sage/40"
                                    )}
                                    style={selectedTagIds.has(tag.id) ? {
                                      background: `linear-gradient(135deg, ${category.color || '#A19781'} 0%, ${category.color || '#A19781'}CC 100%)`
                                    } : undefined}
                                  >
                                    {tag.displayName}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Clear Filters */}
                          {hasActiveFilters && (
                            <button
                              onClick={clearFilters}
                              className="text-xs text-dusty-rose hover:text-terracotta transition-colors"
                            >
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Asset Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-3 border-dusty-rose border-t-transparent rounded-full" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 text-dune/60">
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={fetchData}
                    className="mt-4 text-sm text-dusty-rose hover:text-terracotta"
                  >
                    Try again
                  </button>
                </div>
              ) : displayedAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 rounded-2xl bg-sage/10 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-sage/40" />
                  </div>
                  <p className="text-sm text-dune/60">
                    {viewMode === 'service'
                      ? 'No images tagged for this service yet'
                      : 'No images found'}
                  </p>
                  {viewMode === 'service' && (
                    <button
                      onClick={() => setViewMode('all')}
                      className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-dusty-rose/10 text-dusty-rose hover:bg-dusty-rose/20 transition-colors text-sm font-medium"
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Browse All Images
                    </button>
                  )}
                  {viewMode === 'all' && hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-sm text-dusty-rose hover:text-terracotta"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {displayedAssets.map((asset, index) => {
                    const isSelected = selectedAssetId === asset.id
                    const isTaggedForService = serviceTaggedAssetIds.has(asset.id)

                    return (
                      <motion.button
                        key={asset.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.02, 0.5) }}
                        onClick={() => handleAssetClick(asset)}
                        className={clsx(
                          "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
                          isSelected
                            ? "border-dusty-rose shadow-lg ring-2 ring-dusty-rose/30"
                            : "border-transparent hover:border-sage/30"
                        )}
                      >
                        <Image
                          src={asset.filePath}
                          alt={asset.fileName}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                        />

                        {/* Service tag indicator (in "all" view) */}
                        {viewMode === 'all' && isTaggedForService && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-dusty-rose/90 flex items-center justify-center shadow-lg">
                            <Star className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                        )}

                        {/* Selection overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-dusty-rose/30 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-dusty-rose flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Hover overlay with tags */}
                        <div className="absolute inset-0 bg-gradient-to-t from-dune/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-[10px] text-white/90 truncate">
                              {asset.fileName}
                            </p>
                            {asset.tags && asset.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {asset.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag.id}
                                    className="px-1.5 py-0.5 rounded text-[8px] text-white/90"
                                    style={{
                                      background: tag.category.color
                                        ? `${tag.category.color}80`
                                        : 'rgba(161, 151, 129, 0.5)'
                                    }}
                                  >
                                    {tag.displayName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Stats */}
            <div className="px-6 py-3 border-t border-sage/10 bg-cream/80 backdrop-blur-sm flex items-center justify-between text-xs text-dune/60">
              <div className="flex items-center gap-4">
                <span>
                  <Layers className="w-3 h-3 inline mr-1" />
                  {displayedAssets.length} {viewMode === 'service' ? 'service' : 'total'} images
                </span>
                {viewMode === 'all' && (
                  <span className="text-dusty-rose flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {serviceTaggedAssets.length} tagged for this service
                  </span>
                )}
              </div>
              <span>
                Press ESC to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Export types for external use
export type { Asset, ServiceHeroImagePickerProps }

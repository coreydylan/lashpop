"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  Users,
  Tag,
  Layers,
  Upload,
  Loader2,
  AlertCircle
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

interface MiniDamExplorerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: Asset) => void
  selectedAssetId?: string | null
  title?: string
  subtitle?: string
  filterTags?: string[] // Pre-filter by specific tag names (e.g., ["website:hero"])
  filterCategoryNames?: string[] // Pre-filter by category names
  allowMultiple?: boolean
  selectedAssetIds?: string[]
  onMultiSelect?: (assets: Asset[]) => void
}

export function MiniDamExplorer({
  isOpen,
  onClose,
  onSelect,
  selectedAssetId,
  title = "Select Image",
  subtitle = "Choose from your media library",
  filterTags,
  filterCategoryNames,
  allowMultiple = false,
  selectedAssetIds = [],
  onMultiSelect
}: MiniDamExplorerProps) {
  // Data state
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Multi-select state
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set(selectedAssetIds))

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadCount, setUploadCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepthRef = useRef(0)

  // Sync local selection with prop
  useEffect(() => {
    setLocalSelectedIds(new Set(selectedAssetIds))
  }, [selectedAssetIds])

  // Fetch DAM data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dam/initial-data')
      if (!response.ok) throw new Error('Failed to fetch DAM data')

      const data = await response.json()
      setAssets(data.assets || [])
      setCategories(data.categories || [])
      setTeamMembers(data.teamMembers || [])
    } catch (err) {
      console.error('Error fetching DAM data:', err)
      setError('Failed to load media library')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])

  // Reset filters when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedCategoryId(null)
      setSelectedTagIds(new Set())
      setSelectedTeamMemberIds(new Set())
      setShowFilters(false)
    }
  }, [isOpen])

  // Filter assets
  const filteredAssets = useMemo(() => {
    let filtered = assets

    // Only show images, not videos
    filtered = filtered.filter(asset => asset.fileType === 'image')

    // Apply pre-filter tags if specified
    if (filterTags && filterTags.length > 0) {
      filtered = filtered.filter(asset =>
        filterTags.some(filterTag => {
          const [catName, tagName] = filterTag.includes(':')
            ? filterTag.split(':')
            : [null, filterTag]

          return asset.tags?.some(tag => {
            if (catName && tagName) {
              return tag.category.name.toLowerCase() === catName.toLowerCase()
                && tag.name.toLowerCase() === tagName.toLowerCase()
            }
            return tag.name.toLowerCase() === filterTag.toLowerCase()
          })
        })
      )
    }

    // Apply pre-filter categories if specified
    if (filterCategoryNames && filterCategoryNames.length > 0) {
      filtered = filtered.filter(asset =>
        asset.tags?.some(tag =>
          filterCategoryNames.some(catName =>
            tag.category.name.toLowerCase() === catName.toLowerCase()
          )
        )
      )
    }

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
  }, [assets, searchQuery, selectedTagIds, selectedTeamMemberIds, filterTags, filterCategoryNames])

  // Filter categories (exclude collections and ratings for simplicity)
  const filterableCategories = useMemo(() => {
    return categories.filter(cat => !cat.isCollection && !cat.isRating)
  }, [categories])

  // Handle asset selection
  const handleAssetClick = (asset: Asset) => {
    if (allowMultiple) {
      setLocalSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(asset.id)) {
          next.delete(asset.id)
        } else {
          next.add(asset.id)
        }
        return next
      })
    } else {
      onSelect(asset)
      onClose()
    }
  }

  // Handle multi-select confirm
  const handleConfirmMultiSelect = () => {
    if (onMultiSelect) {
      const selectedAssets = assets.filter(a => localSelectedIds.has(a.id))
      onMultiSelect(selectedAssets)
    }
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

  // Upload handler
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (fileArray.length === 0) return

    setUploading(true)
    setUploadError(null)
    setUploadCount(fileArray.length)

    try {
      const formData = new FormData()
      fileArray.forEach(f => formData.append('files', f))

      const res = await fetch('/api/dam/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`)
      }

      const data = await res.json()
      if (data.assets && data.assets.length > 0) {
        // Prepend new assets so they appear first in the grid
        setAssets(prev => [
          ...data.assets.map((a: any) => ({
            id: a.id,
            fileName: a.fileName,
            filePath: a.filePath,
            fileType: a.fileType,
            uploadedAt: a.uploadedAt || new Date().toISOString(),
            teamMemberId: a.teamMemberId || null,
            tags: [],
          })),
          ...prev,
        ])
      }

      const failCount = data.results?.filter((r: any) => r.status === 'error').length || 0
      if (failCount > 0) {
        setUploadError(`${data.assets.length} uploaded, ${failCount} failed`)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadCount(0)
    }
  }, [])

  // Drag and drop handlers for the modal content area
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current += 1
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = 0
    setIsDragging(false)
    if (e.dataTransfer?.files?.length) {
      handleUpload(e.dataTransfer.files)
    }
  }, [handleUpload])

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
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleUpload(e.target.files)
                  e.target.value = '' // reset so same file can be re-selected
                }
              }}
              className="hidden"
            />

            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-[60] bg-dusty-rose/10 backdrop-blur-sm border-4 border-dashed border-dusty-rose/40 rounded-3xl flex items-center justify-center">
                <div className="text-center bg-cream/90 rounded-2xl px-8 py-6 shadow-xl border border-dusty-rose/20">
                  <Upload className="w-10 h-10 text-dusty-rose mx-auto mb-2" />
                  <p className="text-dune font-semibold">Drop images here</p>
                  <p className="text-xs text-dune/60 mt-1">They&apos;ll be uploaded to your media library</p>
                </div>
              </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sage/10 bg-cream/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-dusty-rose/30 to-terracotta/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-terracotta" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-dune">{title}</h2>
                  <p className="text-xs text-dune/60">{subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    uploading
                      ? "bg-sage/20 text-dune/40 cursor-wait"
                      : "bg-dusty-rose/10 text-dusty-rose hover:bg-dusty-rose/20 border border-dusty-rose/20"
                  )}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? `Uploading ${uploadCount}...` : 'Upload'}
                </button>
                {allowMultiple && localSelectedIds.size > 0 && (
                  <button
                    onClick={handleConfirmMultiSelect}
                    className="btn btn-primary"
                  >
                    <Check className="w-4 h-4" />
                    Select {localSelectedIds.size}
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

            {/* Search and Filters Bar */}
            <div className="px-6 py-3 border-b border-sage/10 bg-warm-sand/20">
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

                {/* Refresh */}
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="w-10 h-10 rounded-xl bg-cream border border-sage/20 flex items-center justify-center hover:border-sage/40 transition-colors"
                >
                  <RefreshCw className={clsx("w-4 h-4 text-dune/60", loading && "animate-spin")} />
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
            </div>

            {/* Upload status banner */}
            {uploadError && (
              <div className="mx-6 mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terracotta/10 border border-terracotta/20 text-sm text-terracotta">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{uploadError}</span>
                <button onClick={() => setUploadError(null)} className="text-terracotta/60 hover:text-terracotta">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

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
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 rounded-2xl bg-sage/10 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-sage/40" />
                  </div>
                  <p className="text-sm text-dune/60">No images found</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-dusty-rose hover:bg-dusty-rose/10 border border-dusty-rose/20 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload images
                  </button>
                  {hasActiveFilters && (
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
                  {filteredAssets.map((asset, index) => {
                    const isSelected = allowMultiple
                      ? localSelectedIds.has(asset.id)
                      : selectedAssetId === asset.id

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
                  {filteredAssets.length} of {assets.filter(a => a.fileType === 'image').length} images
                </span>
                {allowMultiple && localSelectedIds.size > 0 && (
                  <span className="text-dusty-rose">
                    {localSelectedIds.size} selected
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
export type { Asset, MiniDamExplorerProps }

"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Layers,
  Image as ImageIcon,
  Clock,
  DollarSign,
  RefreshCw,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Unlink,
  Settings2,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  ExternalLink
} from 'lucide-react'
import clsx from 'clsx'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'
import { ServiceHeroImagePicker } from '@/components/admin/ServiceHeroImagePicker'
import {
  getAllServicesAdmin,
  getServiceCategoriesWithSubcategories,
  updateServiceImage,
  updateServiceCategoryImage,
  updateServiceSubcategoryImage,
  tagAssetWithService
} from '@/actions/services'

// Types
interface Service {
  id: string
  name: string
  slug: string
  subtitle: string | null
  description: string
  durationMinutes: number
  priceStarting: number
  imageUrl: string | null
  color: string | null
  displayOrder: number
  categoryId: string | null
  categoryName: string | null
  categorySlug: string | null
  subcategoryId: string | null
  subcategoryName: string | null
  subcategorySlug: string | null
  vagaroWidgetUrl: string | null
  vagaroServiceCode: string | null
  keyImageAssetId: string | null
  useDemoPhotos: boolean
  isActive: boolean
  vagaroServiceId: string | null
  lastSyncedAt: Date | null
}

interface Subcategory {
  id: string
  categoryId: string
  name: string
  slug: string
  description: string | null
  displayOrder: number
  isActive: boolean
  keyImageAssetId: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  displayOrder: number
  isActive: boolean
  keyImageAssetId: string | null
  subcategories: Subcategory[]
}

type ViewMode = 'categories' | 'services' | 'all'

export default function ServicesAdminPage() {
  // Data state
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null) // ID of item being saved

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('categories')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false)
  const [showOnlyWithDemoMode, setShowOnlyWithDemoMode] = useState(false)

  // Image picker state (for categories and subcategories - uses MiniDamExplorer)
  const [imagePicker, setImagePicker] = useState<{
    isOpen: boolean
    type: 'category' | 'subcategory'
    itemId: string
    itemName: string
    currentAssetId: string | null
  } | null>(null)

  // Service hero image picker state (uses ServiceHeroImagePicker with two-tier filtering)
  const [serviceImagePicker, setServiceImagePicker] = useState<{
    isOpen: boolean
    serviceId: string
    serviceName: string
    currentAssetId: string | null
  } | null>(null)

  // Asset lookup for displaying images
  const [assetLookup, setAssetLookup] = useState<Map<string, { filePath: string; fileName: string }>>(new Map())
  const [assetsFetched, setAssetsFetched] = useState(false)

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [servicesData, categoriesData] = await Promise.all([
        getAllServicesAdmin(),
        getServiceCategoriesWithSubcategories()
      ])
      setServices(servicesData)
      setCategories(categoriesData)

      // Expand all categories by default
      setExpandedCategories(new Set(categoriesData.map((c: Category) => c.id)))
    } catch (error) {
      console.error('Error fetching services data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch asset details for existing key images (only once after initial data load)
  useEffect(() => {
    if (assetsFetched || loading || services.length === 0) return

    const assetIds = new Set<string>()

    services.forEach(s => {
      if (s.keyImageAssetId) assetIds.add(s.keyImageAssetId)
    })
    categories.forEach(c => {
      if (c.keyImageAssetId) assetIds.add(c.keyImageAssetId)
      c.subcategories.forEach(sub => {
        if (sub.keyImageAssetId) assetIds.add(sub.keyImageAssetId)
      })
    })

    if (assetIds.size === 0) {
      setAssetsFetched(true)
      return
    }

    // Fetch asset details
    fetch('/api/dam/initial-data')
      .then(res => res.json())
      .then(data => {
        const lookup = new Map<string, { filePath: string; fileName: string }>()
        data.assets?.forEach((asset: any) => {
          lookup.set(asset.id, { filePath: asset.filePath, fileName: asset.fileName })
        })
        setAssetLookup(lookup)
        setAssetsFetched(true)
      })
      .catch(err => {
        console.error('Error fetching asset details:', err)
        setAssetsFetched(true)
      })
  }, [services, categories, loading, assetsFetched])

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Toggle subcategory expansion
  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => {
      const next = new Set(prev)
      if (next.has(subcategoryId)) {
        next.delete(subcategoryId)
      } else {
        next.add(subcategoryId)
      }
      return next
    })
  }

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = services

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.categoryName?.toLowerCase().includes(query) ||
        s.subcategoryName?.toLowerCase().includes(query)
      )
    }

    if (showOnlyWithImages) {
      filtered = filtered.filter(s => s.keyImageAssetId)
    }

    if (showOnlyWithDemoMode) {
      filtered = filtered.filter(s => s.useDemoPhotos)
    }

    return filtered
  }, [services, searchQuery, showOnlyWithImages, showOnlyWithDemoMode])

  // Group services by category and subcategory
  const servicesByCategory = useMemo(() => {
    const grouped = new Map<string, {
      category: Category | null
      subcategories: Map<string, {
        subcategory: Subcategory | null
        services: Service[]
      }>
      uncategorizedServices: Service[]
    }>()

    // Initialize with all categories
    categories.forEach(cat => {
      const subcategoriesMap = new Map<string, { subcategory: Subcategory | null; services: Service[] }>()
      cat.subcategories.forEach(sub => {
        subcategoriesMap.set(sub.id, { subcategory: sub, services: [] })
      })
      grouped.set(cat.id, {
        category: cat,
        subcategories: subcategoriesMap,
        uncategorizedServices: []
      })
    })

    // Add services to their categories/subcategories
    filteredServices.forEach(service => {
      if (!service.categoryId) return

      let catGroup = grouped.get(service.categoryId)
      if (!catGroup) {
        catGroup = {
          category: null,
          subcategories: new Map(),
          uncategorizedServices: []
        }
        grouped.set(service.categoryId, catGroup)
      }

      if (service.subcategoryId) {
        let subGroup = catGroup.subcategories.get(service.subcategoryId)
        if (!subGroup) {
          subGroup = { subcategory: null, services: [] }
          catGroup.subcategories.set(service.subcategoryId, subGroup)
        }
        subGroup.services.push(service)
      } else {
        catGroup.uncategorizedServices.push(service)
      }
    })

    return grouped
  }, [categories, filteredServices])

  // Handle image selection for categories/subcategories (MiniDamExplorer)
  const handleImageSelect = async (asset: Asset) => {
    if (!imagePicker) return

    setSaving(imagePicker.itemId)
    try {
      if (imagePicker.type === 'category') {
        await updateServiceCategoryImage(imagePicker.itemId, asset.id)
        setCategories(prev => prev.map(c =>
          c.id === imagePicker.itemId
            ? { ...c, keyImageAssetId: asset.id }
            : c
        ))
      } else if (imagePicker.type === 'subcategory') {
        await updateServiceSubcategoryImage(imagePicker.itemId, asset.id)
        setCategories(prev => prev.map(c => ({
          ...c,
          subcategories: c.subcategories.map(sub =>
            sub.id === imagePicker.itemId
              ? { ...sub, keyImageAssetId: asset.id }
              : sub
          )
        })))
      }

      // Update asset lookup
      setAssetLookup(prev => {
        const next = new Map(prev)
        next.set(asset.id, { filePath: asset.filePath, fileName: asset.fileName })
        return next
      })
    } catch (error) {
      console.error('Error updating image:', error)
    } finally {
      setSaving(null)
      setImagePicker(null)
    }
  }

  // Handle service hero image selection (ServiceHeroImagePicker)
  const handleServiceHeroImageSelect = async (asset: Asset, shouldTagForService: boolean) => {
    if (!serviceImagePicker) return

    setSaving(serviceImagePicker.serviceId)
    try {
      // If selecting from "all images" and not already tagged, auto-tag for this service
      if (shouldTagForService) {
        await tagAssetWithService(asset.id, serviceImagePicker.serviceId)
      }

      // Update the service's key image
      await updateServiceImage(serviceImagePicker.serviceId, {
        keyImageAssetId: asset.id,
        imageUrl: asset.filePath
      })

      setServices(prev => prev.map(s =>
        s.id === serviceImagePicker.serviceId
          ? { ...s, keyImageAssetId: asset.id, imageUrl: asset.filePath }
          : s
      ))

      // Update asset lookup
      setAssetLookup(prev => {
        const next = new Map(prev)
        next.set(asset.id, { filePath: asset.filePath, fileName: asset.fileName })
        return next
      })
    } catch (error) {
      console.error('Error updating service hero image:', error)
    } finally {
      setSaving(null)
      setServiceImagePicker(null)
    }
  }

  // Handle removing image
  const handleRemoveImage = async (type: 'service' | 'category' | 'subcategory', itemId: string) => {
    setSaving(itemId)
    try {
      if (type === 'service') {
        await updateServiceImage(itemId, { keyImageAssetId: null, imageUrl: null })
        setServices(prev => prev.map(s =>
          s.id === itemId ? { ...s, keyImageAssetId: null, imageUrl: null } : s
        ))
      } else if (type === 'category') {
        await updateServiceCategoryImage(itemId, null)
        setCategories(prev => prev.map(c =>
          c.id === itemId ? { ...c, keyImageAssetId: null } : c
        ))
      } else if (type === 'subcategory') {
        await updateServiceSubcategoryImage(itemId, null)
        setCategories(prev => prev.map(c => ({
          ...c,
          subcategories: c.subcategories.map(sub =>
            sub.id === itemId ? { ...sub, keyImageAssetId: null } : sub
          )
        })))
      }
    } catch (error) {
      console.error('Error removing image:', error)
    } finally {
      setSaving(null)
    }
  }

  // Toggle demo photos mode
  const handleToggleDemoPhotos = async (serviceId: string, currentValue: boolean) => {
    setSaving(serviceId)
    try {
      await updateServiceImage(serviceId, { useDemoPhotos: !currentValue })
      setServices(prev => prev.map(s =>
        s.id === serviceId ? { ...s, useDemoPhotos: !currentValue } : s
      ))
    } catch (error) {
      console.error('Error toggling demo photos:', error)
    } finally {
      setSaving(null)
    }
  }

  // Render image thumbnail with picker button for categories/subcategories
  const renderImageCell = (
    type: 'category' | 'subcategory',
    itemId: string,
    itemName: string,
    assetId: string | null,
    size: 'sm' | 'md' = 'md'
  ) => {
    const asset = assetId ? assetLookup.get(assetId) : null
    const isSaving = saving === itemId
    const dimensions = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16'

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setImagePicker({
            isOpen: true,
            type,
            itemId,
            itemName,
            currentAssetId: assetId
          })}
          disabled={isSaving}
          className={clsx(
            dimensions,
            "rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 group relative",
            asset
              ? "border-dusty-rose/30 hover:border-dusty-rose"
              : "border-dashed border-sage/30 hover:border-sage/60 bg-sage/5"
          )}
        >
          {asset ? (
            <>
              <Image
                src={asset.filePath}
                alt={asset.fileName}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-dune/0 group-hover:bg-dune/30 transition-colors flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isSaving ? (
                <RefreshCw className="w-4 h-4 text-sage/40 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4 text-sage/40 group-hover:text-sage/60 transition-colors" />
              )}
            </div>
          )}
        </button>
        {asset && (
          <button
            onClick={() => handleRemoveImage(type, itemId)}
            disabled={isSaving}
            className="p-1 rounded-md hover:bg-terracotta/10 text-terracotta/60 hover:text-terracotta transition-colors"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  // Render service image cell with the enhanced two-tier picker
  const renderServiceImageCell = (
    serviceId: string,
    serviceName: string,
    assetId: string | null,
    size: 'sm' | 'md' = 'md'
  ) => {
    const asset = assetId ? assetLookup.get(assetId) : null
    const isSaving = saving === serviceId
    const dimensions = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16'

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setServiceImagePicker({
            isOpen: true,
            serviceId,
            serviceName,
            currentAssetId: assetId
          })}
          disabled={isSaving}
          className={clsx(
            dimensions,
            "rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 group relative",
            asset
              ? "border-dusty-rose/30 hover:border-dusty-rose"
              : "border-dashed border-sage/30 hover:border-sage/60 bg-sage/5"
          )}
        >
          {asset ? (
            <>
              <Image
                src={asset.filePath}
                alt={asset.fileName}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-dune/0 group-hover:bg-dune/30 transition-colors flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isSaving ? (
                <RefreshCw className="w-4 h-4 text-sage/40 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4 text-sage/40 group-hover:text-sage/60 transition-colors" />
              )}
            </div>
          )}
        </button>
        {asset && (
          <button
            onClick={() => handleRemoveImage('service', serviceId)}
            disabled={isSaving}
            className="p-1 rounded-md hover:bg-terracotta/10 text-terracotta/60 hover:text-terracotta transition-colors"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  // Render Vagaro sync status
  const renderVagaroStatus = (service: Service) => {
    const hasVagaro = service.vagaroServiceId || service.vagaroServiceCode
    const lastSynced = service.lastSyncedAt ? new Date(service.lastSyncedAt) : null
    const syncedRecently = lastSynced && (Date.now() - lastSynced.getTime()) < 24 * 60 * 60 * 1000

    return (
      <div className="flex items-center gap-1">
        {hasVagaro ? (
          <>
            <LinkIcon className={clsx(
              "w-3 h-3",
              syncedRecently ? "text-ocean-mist" : "text-golden"
            )} />
            <span className={clsx(
              "text-[10px]",
              syncedRecently ? "text-ocean-mist" : "text-golden"
            )}>
              {service.vagaroServiceCode || 'Linked'}
            </span>
          </>
        ) : (
          <>
            <Unlink className="w-3 h-3 text-sage/40" />
            <span className="text-[10px] text-sage/40">No sync</span>
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-mist/30 to-sage/20 flex items-center justify-center">
              <Layers className="w-6 h-6 text-ocean-mist" />
            </div>
            <div>
              <h1 className="h2 text-dune">Services Manager</h1>
              <p className="text-sm text-dune/60">
                {services.length} services across {categories.length} categories
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 glass rounded-2xl p-4 border border-sage/10"
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dune/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream border border-sage/20 text-sm text-dune placeholder:text-dune/40 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-cream rounded-xl p-1 border border-sage/20">
            {(['categories', 'services', 'all'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  viewMode === mode
                    ? "bg-dusty-rose/20 text-dune"
                    : "text-dune/60 hover:text-dune"
                )}
              >
                {mode === 'categories' ? 'By Category' : mode === 'services' ? 'List View' : 'All'}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOnlyWithImages(!showOnlyWithImages)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all",
                showOnlyWithImages
                  ? "bg-ocean-mist/20 text-dune border border-ocean-mist/30"
                  : "text-dune/60 hover:text-dune border border-sage/20"
              )}
            >
              <ImageIcon className="w-3 h-3" />
              Has Image
            </button>
            <button
              onClick={() => setShowOnlyWithDemoMode(!showOnlyWithDemoMode)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all",
                showOnlyWithDemoMode
                  ? "bg-golden/20 text-dune border border-golden/30"
                  : "text-dune/60 hover:text-dune border border-sage/20"
              )}
            >
              <Eye className="w-3 h-3" />
              Demo Mode
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="glass rounded-2xl p-4 border border-sage/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ocean-mist/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-ocean-mist" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{services.length}</p>
              <p className="text-xs text-dune/60">Total Services</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-sage/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dusty-rose/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-dusty-rose" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">
                {services.filter(s => s.keyImageAssetId).length}
              </p>
              <p className="text-xs text-dune/60">With Key Images</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-sage/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-golden/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-golden" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">
                {services.filter(s => s.useDemoPhotos).length}
              </p>
              <p className="text-xs text-dune/60">Demo Mode Active</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-sage/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-sage" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">
                {services.filter(s => s.vagaroServiceId || s.vagaroServiceCode).length}
              </p>
              <p className="text-xs text-dune/60">Vagaro Linked</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {viewMode === 'categories' ? (
          // Category View
          Array.from(servicesByCategory.entries()).map(([categoryId, { category, subcategories, uncategorizedServices }]) => {
            if (!category) return null
            const isExpanded = expandedCategories.has(categoryId)
            const serviceCount = Array.from(subcategories.values()).reduce((sum, sub) => sum + sub.services.length, 0) + uncategorizedServices.length

            return (
              <div key={categoryId} className="glass rounded-2xl border border-sage/10 overflow-hidden">
                {/* Category Header */}
                <div className="flex items-center gap-4 p-4 hover:bg-sage/5 transition-colors">
                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className="p-1 -m-1 hover:bg-sage/10 rounded transition-colors"
                    aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                  >
                    <ChevronRight className={clsx(
                      "w-5 h-5 text-dune/40 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </button>

                  {renderImageCell('category', category.id, category.name, category.keyImageAssetId)}

                  {/* Category info - clickable to expand */}
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className="flex-1 text-left"
                  >
                    <h3 className="font-medium text-dune">{category.name}</h3>
                    <p className="text-xs text-dune/60">
                      {serviceCount} services in {category.subcategories.length} subcategories
                    </p>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      "px-2 py-1 rounded-full text-[10px] font-medium",
                      category.isActive
                        ? "bg-ocean-mist/10 text-ocean-mist"
                        : "bg-sage/10 text-sage"
                    )}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Category Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-sage/10">
                        {/* Subcategories */}
                        {Array.from(subcategories.entries()).map(([subId, { subcategory, services: subServices }]) => {
                          if (!subcategory) return null
                          const isSubExpanded = expandedSubcategories.has(subId)

                          return (
                            <div key={subId} className="border-b border-sage/5 last:border-b-0">
                              {/* Subcategory Header */}
                              <div className="flex items-center gap-4 px-6 py-3 hover:bg-sage/5 transition-colors">
                                {/* Expand toggle */}
                                <button
                                  onClick={() => toggleSubcategory(subId)}
                                  className="p-1 -m-1 hover:bg-sage/10 rounded transition-colors"
                                  aria-label={isSubExpanded ? 'Collapse subcategory' : 'Expand subcategory'}
                                >
                                  <ChevronRight className={clsx(
                                    "w-4 h-4 text-dune/30 transition-transform",
                                    isSubExpanded && "rotate-90"
                                  )} />
                                </button>

                                {renderImageCell('subcategory', subcategory.id, subcategory.name, subcategory.keyImageAssetId, 'sm')}

                                {/* Subcategory info - clickable to expand */}
                                <button
                                  onClick={() => toggleSubcategory(subId)}
                                  className="flex-1 text-left"
                                >
                                  <h4 className="text-sm font-medium text-dune">{subcategory.name}</h4>
                                  <p className="text-[10px] text-dune/50">{subServices.length} services</p>
                                </button>
                              </div>

                              {/* Services */}
                              <AnimatePresence>
                                {isSubExpanded && subServices.length > 0 && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-cream/50"
                                  >
                                    <div className="px-8 py-2 space-y-1">
                                      {subServices.map(service => (
                                        <div
                                          key={service.id}
                                          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/50 transition-colors"
                                        >
                                          {renderServiceImageCell(service.id, service.name, service.keyImageAssetId, 'sm')}

                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-dune truncate">{service.name}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-dune/50">
                                              <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {service.durationMinutes} min
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                ${(service.priceStarting / 100).toFixed(0)}+
                                              </span>
                                              {renderVagaroStatus(service)}
                                            </div>
                                          </div>

                                          {/* Demo Toggle */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleToggleDemoPhotos(service.id, service.useDemoPhotos)
                                            }}
                                            disabled={saving === service.id}
                                            className={clsx(
                                              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-all",
                                              service.useDemoPhotos
                                                ? "bg-golden/20 text-golden border border-golden/30"
                                                : "bg-sage/10 text-sage/60 border border-sage/20 hover:border-sage/40"
                                            )}
                                            title={service.useDemoPhotos ? 'Demo mode ON' : 'Demo mode OFF'}
                                          >
                                            {service.useDemoPhotos ? (
                                              <ToggleRight className="w-3 h-3" />
                                            ) : (
                                              <ToggleLeft className="w-3 h-3" />
                                            )}
                                            Demo
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}

                        {/* Uncategorized Services */}
                        {uncategorizedServices.length > 0 && (
                          <div className="px-8 py-3 bg-cream/50">
                            <p className="text-xs text-dune/40 mb-2">Uncategorized</p>
                            <div className="space-y-1">
                              {uncategorizedServices.map(service => (
                                <div
                                  key={service.id}
                                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/50 transition-colors"
                                >
                                  {renderServiceImageCell(service.id, service.name, service.keyImageAssetId, 'sm')}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-dune truncate">{service.name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })
        ) : (
          // List View
          <div className="glass rounded-2xl border border-sage/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sage/10 bg-cream/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-dune/60 uppercase tracking-wider">Image</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dune/60 uppercase tracking-wider">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dune/60 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dune/60 uppercase tracking-wider hidden lg:table-cell">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dune/60 uppercase tracking-wider hidden lg:table-cell">Vagaro</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-dune/60 uppercase tracking-wider">Demo</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service, index) => (
                  <tr
                    key={service.id}
                    className={clsx(
                      "border-b border-sage/5 last:border-b-0 hover:bg-sage/5 transition-colors",
                      index % 2 === 0 && "bg-cream/30"
                    )}
                  >
                    <td className="px-4 py-3">
                      {renderServiceImageCell(service.id, service.name, service.keyImageAssetId)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-dune text-sm">{service.name}</p>
                      {service.subtitle && (
                        <p className="text-xs text-dune/60 truncate max-w-[200px]">{service.subtitle}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-dune">{service.categoryName || '-'}</p>
                      {service.subcategoryName && (
                        <p className="text-xs text-dune/50">{service.subcategoryName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs text-dune/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.durationMinutes}m
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${(service.priceStarting / 100).toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {renderVagaroStatus(service)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleDemoPhotos(service.id, service.useDemoPhotos)}
                        disabled={saving === service.id}
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          service.useDemoPhotos
                            ? "bg-golden/20 text-golden border border-golden/30"
                            : "bg-sage/10 text-sage/60 border border-sage/20 hover:border-sage/40"
                        )}
                      >
                        {service.useDemoPhotos ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            On
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Off
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredServices.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-dune/60">No services found matching your filters</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 p-6 bg-cream/60 backdrop-blur-sm rounded-3xl border border-sage/10"
      >
        <h3 className="font-serif text-lg text-dune mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-dune/70">
          <li className="flex items-start gap-2">
            <span className="text-dusty-rose">&#8226;</span>
            <span><strong>Key Images</strong> are used as thumbnails in service cards. Click on any image cell to select from your DAM.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-golden">&#8226;</span>
            <span><strong>Demo Mode</strong> shows curated demo photos instead of real service photos - great for new services or staging.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-mist">&#8226;</span>
            <span>Images cascade: Service image overrides Subcategory image, which overrides Category image.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sage">&#8226;</span>
            <span>Vagaro sync status shows whether the service is linked to your Vagaro account for booking.</span>
          </li>
        </ul>
      </motion.div>

      {/* Image Picker Modal (for categories/subcategories) */}
      <MiniDamExplorer
        isOpen={imagePicker?.isOpen ?? false}
        onClose={() => setImagePicker(null)}
        onSelect={handleImageSelect}
        selectedAssetId={imagePicker?.currentAssetId}
        title={`Select Image for ${imagePicker?.itemName || 'Item'}`}
        subtitle="Choose a key image from your media library"
      />

      {/* Service Hero Image Picker (two-tier: service-tagged first, then all) */}
      <ServiceHeroImagePicker
        isOpen={serviceImagePicker?.isOpen ?? false}
        onClose={() => setServiceImagePicker(null)}
        onSelect={handleServiceHeroImageSelect}
        onClearImage={async () => {
          if (serviceImagePicker?.serviceId) {
            await handleRemoveImage('service', serviceImagePicker.serviceId)
          }
        }}
        selectedAssetId={serviceImagePicker?.currentAssetId}
        serviceId={serviceImagePicker?.serviceId ?? ''}
        serviceName={serviceImagePicker?.serviceName ?? ''}
      />
    </div>
  )
}

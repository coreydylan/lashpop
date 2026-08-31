"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Sparkles,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Trash2,
  Eye,
  EyeOff,
  Crop,
  X,
  GripVertical,
  AlertCircle
} from 'lucide-react'
import clsx from 'clsx'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'
import {
  getAllQuizPhotos,
  addQuizPhoto,
  toggleQuizPhotoEnabled,
  deleteQuizPhoto,
  updateQuizPhotoCrop,
  getAllResultSettings,
  updateResultSettingsText,
  setResultImage,
  updateResultImageCrop,
  removeResultImage,
  type QuizPhotoWithAsset,
  type QuizResultSettingsWithAsset,
  type LashStyle
} from '@/actions/quiz-photos'
import { QuizPhotoCropEditor } from '@/components/admin/QuizPhotoCropEditor'
import { QUIZ_COMPARISON_CROP_ASPECT } from '@/components/find-your-look/quiz-crop'
import { isLegacySquareQuizCrop } from '@/components/find-your-look/quiz-image-preloader'

type AdminTab = 'photos' | 'results'

// Lash style configuration
const LASH_STYLES: { id: LashStyle; label: string; color: string; description: string }[] = [
  {
    id: 'classic',
    label: 'Classic',
    color: 'ocean-mist',
    description: 'One extension on each natural lash for a natural look'
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    color: 'sage',
    description: 'A mix of classic and volume lashes for added texture and fullness'
  },
  {
    id: 'wetAngel',
    label: 'Wet / Angel',
    color: 'dusty-rose',
    description: 'Narrow lash spikes with a glossy, defined finish'
  },
  {
    id: 'volume',
    label: 'Volume',
    color: 'terracotta',
    description: 'Multiple lightweight extensions on each natural lash for a fuller look'
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  'ocean-mist': { bg: 'bg-ocean-mist/10', text: 'text-ocean-mist', border: 'border-ocean-mist/30' },
  'sage': { bg: 'bg-sage/10', text: 'text-sage', border: 'border-sage/30' },
  'dusty-rose': { bg: 'bg-dusty-rose/10', text: 'text-dusty-rose', border: 'border-dusty-rose/30' },
  'terracotta': { bg: 'bg-terracotta/10', text: 'text-terracotta', border: 'border-terracotta/30' },
}

export default function QuizAdminPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('photos')

  // Data state
  const [photos, setPhotos] = useState<QuizPhotoWithAsset[]>([])
  const [resultSettings, setResultSettings] = useState<QuizResultSettingsWithAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // UI state
  const [expandedStyles, setExpandedStyles] = useState<Set<LashStyle>>(new Set(LASH_STYLES.map(s => s.id)))
  const [expandedResultStyles, setExpandedResultStyles] = useState<Set<LashStyle>>(new Set())

  // DAM picker state (for comparison photos)
  const [damPicker, setDamPicker] = useState<{
    isOpen: boolean
    lashStyle: LashStyle
  } | null>(null)

  // DAM picker state (for result images)
  const [resultDamPicker, setResultDamPicker] = useState<{
    isOpen: boolean
    lashStyle: LashStyle
  } | null>(null)

  // Crop editor state (for comparison photos)
  const [cropEditor, setCropEditor] = useState<{
    isOpen: boolean
    photo: QuizPhotoWithAsset
  } | null>(null)

  // Crop editor state (for result images)
  const [resultCropEditor, setResultCropEditor] = useState<{
    isOpen: boolean
    lashStyle: LashStyle
    imageUrl: string
    cropData: { x: number; y: number; scale: number } | null
  } | null>(null)

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [photosData, settingsData] = await Promise.all([
        getAllQuizPhotos(),
        getAllResultSettings()
      ])
      setPhotos(photosData)
      setResultSettings(settingsData)
    } catch (error) {
      console.error('Error fetching quiz data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Group photos by style
  const photosByStyle = useMemo(() => {
    const grouped: Record<LashStyle, QuizPhotoWithAsset[]> = {
      classic: [],
      hybrid: [],
      wetAngel: [],
      volume: [],
    }

    photos.forEach(photo => {
      grouped[photo.lashStyle].push(photo)
    })

    // Sort by sortOrder within each group
    Object.keys(grouped).forEach(style => {
      grouped[style as LashStyle].sort((a, b) => a.sortOrder - b.sortOrder)
    })

    return grouped
  }, [photos])

  // Toggle style expansion
  const toggleStyle = (style: LashStyle) => {
    setExpandedStyles(prev => {
      const next = new Set(prev)
      if (next.has(style)) {
        next.delete(style)
      } else {
        next.add(style)
      }
      return next
    })
  }

  // Handle adding photo from DAM
  const handleAddPhoto = async (asset: Asset) => {
    if (!damPicker) return

    setSaving('adding')
    try {
      const newPhoto = await addQuizPhoto({
        assetId: asset.id,
        lashStyle: damPicker.lashStyle
      })

      // Add to local state with asset data
      setPhotos(prev => [...prev, {
        ...newPhoto,
        filePath: asset.filePath,
        fileName: asset.fileName
      } as QuizPhotoWithAsset])

      setDamPicker(null)
    } catch (error) {
      console.error('Error adding quiz photo:', error)
    } finally {
      setSaving(null)
    }
  }

  // Handle toggle enabled
  const handleToggleEnabled = async (photoId: string) => {
    setSaving(photoId)
    try {
      const result = await toggleQuizPhotoEnabled(photoId)
      setPhotos(prev => prev.map(p =>
        p.id === photoId ? { ...p, isEnabled: result.isEnabled } : p
      ))
    } catch (error) {
      console.error('Error toggling photo enabled:', error)
    } finally {
      setSaving(null)
    }
  }

  // Handle delete
  const handleDelete = async (photoId: string) => {
    setSaving(photoId)
    try {
      await deleteQuizPhoto(photoId)
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting quiz photo:', error)
    } finally {
      setSaving(null)
    }
  }

  // Handle crop save
  const handleCropSave = async (cropData: { x: number; y: number; scale: number }) => {
    if (!cropEditor) return

    setSaving(cropEditor.photo.id)
    try {
      const result = await updateQuizPhotoCrop(cropEditor.photo.id, cropData)
      setPhotos(prev => prev.map(p =>
        p.id === cropEditor.photo.id
          ? { ...p, cropData, cropUrl: result.cropUrl }
          : p
      ))
      setCropEditor(null)
    } catch (error) {
      console.error('Error saving crop:', error)
    } finally {
      setSaving(null)
    }
  }

  // Toggle result style expansion
  const toggleResultStyle = (style: LashStyle) => {
    setExpandedResultStyles(prev => {
      const next = new Set(prev)
      if (next.has(style)) {
        next.delete(style)
      } else {
        next.add(style)
      }
      return next
    })
  }

  // Get settings for a style
  const getSettingsForStyle = (style: LashStyle) => {
    return resultSettings.find(s => s.lashStyle === style)
  }

  // Handle setting result image from DAM
  const handleSetResultImage = async (asset: Asset) => {
    if (!resultDamPicker) return

    setSaving(`result-${resultDamPicker.lashStyle}`)
    try {
      await setResultImage(resultDamPicker.lashStyle, asset.id)
      setResultSettings(prev => prev.map(s =>
        s.lashStyle === resultDamPicker.lashStyle
          ? {
              ...s,
              resultImageAssetId: asset.id,
              resultImageFilePath: asset.filePath,
              resultImageFileName: asset.fileName,
              resultImageCropData: null,
              resultImageCropUrl: null
            }
          : s
      ))
      setResultDamPicker(null)
    } catch (error) {
      console.error('Error setting result image:', error)
    } finally {
      setSaving(null)
    }
  }

  // Handle result image crop save
  const handleResultCropSave = async (cropData: { x: number; y: number; scale: number }) => {
    if (!resultCropEditor) return

    setSaving(`result-crop-${resultCropEditor.lashStyle}`)
    try {
      const result = await updateResultImageCrop(resultCropEditor.lashStyle, cropData)
      setResultSettings(prev => prev.map(s =>
        s.lashStyle === resultCropEditor.lashStyle
          ? { ...s, resultImageCropData: cropData, resultImageCropUrl: result.cropUrl }
          : s
      ))
      setResultCropEditor(null)
    } catch (error) {
      console.error('Error saving result crop:', error)
    } finally {
      setSaving(null)
    }
  }

  // Handle removing result image
  const handleRemoveResultImage = async (style: LashStyle) => {
    setSaving(`result-remove-${style}`)
    try {
      await removeResultImage(style)
      setResultSettings(prev => prev.map(s =>
        s.lashStyle === style
          ? {
              ...s,
              resultImageAssetId: null,
              resultImageFilePath: null,
              resultImageFileName: null,
              resultImageCropData: null,
              resultImageCropUrl: null
            }
          : s
      ))
    } catch (error) {
      console.error('Error removing result image:', error)
    } finally {
      setSaving(null)
    }
  }

  // Handle updating result text fields
  const handleUpdateResultText = async (
    style: LashStyle,
    field: 'displayName' | 'description' | 'recommendedService' | 'bookingLabel',
    value: string
  ) => {
    // Optimistic update
    setResultSettings(prev => prev.map(s =>
      s.lashStyle === style ? { ...s, [field]: value } : s
    ))

    try {
      await updateResultSettingsText(style, { [field]: value })
    } catch (error) {
      console.error('Error updating result text:', error)
      // Revert on error
      fetchData()
    }
  }

  // Handle updating bestFor array
  const handleUpdateBestFor = async (style: LashStyle, bestFor: string[]) => {
    setResultSettings(prev => prev.map(s =>
      s.lashStyle === style ? { ...s, bestFor } : s
    ))

    try {
      await updateResultSettingsText(style, { bestFor })
    } catch (error) {
      console.error('Error updating best for:', error)
      fetchData()
    }
  }

  // Get stats
  const stats = useMemo(() => {
    const total = photos.length
    const enabled = photos.filter(p => p.isEnabled).length
    const cropped = photos.filter(p => p.cropData || p.cropUrl).length
    const stylesWithPhotos = Object.values(photosByStyle).filter(arr => arr.filter(p => p.isEnabled).length >= 2).length

    return { total, enabled, cropped, stylesWithPhotos }
  }, [photos, photosByStyle])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="grid gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta/30 to-dusty-rose/20 sm:flex">
              <Sparkles className="w-6 h-6 text-terracotta" />
            </div>
            <div className="min-w-0">
              <h1 className="h2 text-dune">Find Your Look quiz</h1>
              <p className="text-sm text-dune/60">
                Choose comparison photos and edit the result shown for each lash style.
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary w-full sm:w-auto"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 grid grid-cols-2 gap-2"
      >
        <button
          onClick={() => setActiveTab('photos')}
          className={clsx(
            "min-w-0 px-2 py-2 rounded-lg font-medium transition-all sm:px-4",
            activeTab === 'photos'
              ? "bg-dusty-rose text-white"
              : "bg-sage/10 text-dune/70 hover:bg-sage/20"
          )}
        >
          <ImageIcon className="mr-1 inline-block size-4 sm:mr-2" />
          <span className="sm:hidden">Photos</span><span className="hidden sm:inline">Comparison photos</span>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={clsx(
            "min-w-0 px-2 py-2 rounded-lg font-medium transition-all sm:px-4",
            activeTab === 'results'
              ? "bg-dusty-rose text-white"
              : "bg-sage/10 text-dune/70 hover:bg-sage/20"
          )}
        >
          <Sparkles className="mr-1 inline-block size-4 sm:mr-2" />
          <span className="sm:hidden">Results</span><span className="hidden sm:inline">Result pages</span>
        </button>
      </motion.div>

      {/* PHOTOS TAB CONTENT */}
      {activeTab === 'photos' && (
        <>
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4"
      >
        <div className="glass min-w-0 rounded-lg border border-sage/15 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="hidden size-10 items-center justify-center rounded-lg bg-terracotta/10 sm:flex">
              <ImageIcon className="w-5 h-5 text-terracotta" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{stats.total}</p>
              <p className="text-xs text-dune/60">All photos</p>
            </div>
          </div>
        </div>
        <div className="glass min-w-0 rounded-lg border border-sage/15 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="hidden size-10 items-center justify-center rounded-lg bg-ocean-mist/10 sm:flex">
              <Eye className="w-5 h-5 text-ocean-mist" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{stats.enabled}</p>
              <p className="text-xs text-dune/60">Used in quiz</p>
            </div>
          </div>
        </div>
        <div className="glass min-w-0 rounded-lg border border-sage/15 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="hidden size-10 items-center justify-center rounded-lg bg-dusty-rose/10 sm:flex">
              <Crop className="w-5 h-5 text-dusty-rose" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{stats.cropped}</p>
              <p className="text-xs text-dune/60">Cropped</p>
            </div>
          </div>
        </div>
        <div className="glass min-w-0 rounded-lg border border-sage/15 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "hidden size-10 items-center justify-center rounded-lg sm:flex",
              stats.stylesWithPhotos >= 4 ? "bg-ocean-mist/10" : "bg-golden/10"
            )}>
              <Sparkles className={clsx(
                "w-5 h-5",
                stats.stylesWithPhotos >= 4 ? "text-ocean-mist" : "text-golden"
              )} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{stats.stylesWithPhotos}/4</p>
              <p className="text-xs text-dune/60">Styles ready</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quiz Ready Warning */}
      {stats.stylesWithPhotos < 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 flex items-start gap-3 rounded-lg border border-golden/30 bg-golden/10 p-4"
        >
          <AlertCircle className="w-5 h-5 text-golden flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-dune">Quiz needs more photos</p>
            <p className="text-xs text-dune/70 mt-1">
              Each lash style needs at least 2 photos turned on. Add photos to {4 - stats.stylesWithPhotos} more style{4 - stats.stylesWithPhotos !== 1 ? 's' : ''}.
            </p>
          </div>
        </motion.div>
      )}

      {/* Lash Style Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {LASH_STYLES.map((style, index) => {
          const stylePhotos = photosByStyle[style.id]
          const enabledCount = stylePhotos.filter(p => p.isEnabled).length
          const isExpanded = expandedStyles.has(style.id)
          const colors = colorMap[style.color]
          const isReady = enabledCount >= 2

          return (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={clsx(
                "glass overflow-hidden rounded-lg border sm:rounded-xl",
                colors.border
              )}
            >
              {/* Style Header */}
              <button
                onClick={() => toggleStyle(style.id)}
                className="flex w-full min-w-0 items-center gap-3 p-3 transition-colors hover:bg-sage/5 sm:gap-4 sm:p-4"
              >
                <div className={clsx(
                  "flex size-9 shrink-0 items-center justify-center rounded-md sm:size-10 sm:rounded-lg",
                  colors.bg
                )}>
                  {isExpanded ? (
                    <ChevronDown className={clsx("w-5 h-5", colors.text)} />
                  ) : (
                    <ChevronRight className={clsx("w-5 h-5", colors.text)} />
                  )}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="font-medium text-dune">{style.label}</h3>
                    <span className={clsx(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      isReady ? "bg-ocean-mist/10 text-ocean-mist" : "bg-golden/10 text-golden"
                    )}>
                      {enabledCount} used in quiz
                    </span>
                  </div>
                  <p className="text-xs text-dune/60 mt-0.5">{style.description}</p>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-sm text-dune/40">{stylePhotos.length} photos</span>
                </div>
              </button>

              {/* Style Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-sage/10 p-4">
                      {/* Photo Grid */}
                      {stylePhotos.length > 0 ? (
                        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                          {stylePhotos.map(photo => (
                            <div
                              key={photo.id}
                              className={clsx(
                                "group relative aspect-[3/4] overflow-hidden rounded-md border sm:rounded-lg",
                                photo.isEnabled
                                  ? "border-ocean-mist/30"
                                  : "border-sage/20 opacity-60"
                              )}
                            >
                              {/* Photo - key forces re-render when cropUrl changes */}
                              <Image
                                key={isLegacySquareQuizCrop(photo.cropUrl) ? photo.filePath : (photo.cropUrl || photo.id)}
                                src={isLegacySquareQuizCrop(photo.cropUrl) ? photo.filePath : (photo.cropUrl || photo.filePath)}
                                alt={photo.fileName}
                                fill
                                className="object-cover"
                                unoptimized={!!photo.cropUrl}
                              />

                              {/* Overlay Actions */}
                              <div className="absolute bottom-1 right-1 flex flex-col items-center justify-center gap-1 opacity-100 sm:inset-0 sm:flex-row sm:bg-dune/0 sm:opacity-0 sm:transition-[background-color,opacity] sm:group-hover:bg-dune/40 sm:group-hover:opacity-100 sm:group-focus-within:bg-dune/40 sm:group-focus-within:opacity-100">
                                {/* Crop Button */}
                                <button
                                  onClick={() => setCropEditor({ isOpen: true, photo })}
                                  className="flex size-11 items-center justify-center rounded-md bg-white/90 transition-colors hover:bg-white"
                                  title="Edit crop"
                                  aria-label={`Edit crop for ${photo.fileName}`}
                                >
                                  <Crop className="w-4 h-4 text-dune" />
                                </button>

                                {/* Toggle Enabled */}
                                <button
                                  onClick={() => handleToggleEnabled(photo.id)}
                                  disabled={saving === photo.id}
                                  className={clsx(
                                    "flex size-11 items-center justify-center rounded-md transition-colors",
                                    photo.isEnabled
                                      ? "bg-ocean-mist/90 hover:bg-ocean-mist text-white"
                                      : "bg-white/90 hover:bg-white text-dune"
                                  )}
                                  title={photo.isEnabled ? 'Disable' : 'Enable'}
                                  aria-label={`${photo.isEnabled ? 'Disable' : 'Enable'} ${photo.fileName}`}
                                >
                                  {saving === photo.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : photo.isEnabled ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => setDeleteConfirm(photo.id)}
                                  className="flex size-11 items-center justify-center rounded-md bg-terracotta/90 text-white transition-colors hover:bg-terracotta"
                                  title="Delete"
                                  aria-label={`Delete ${photo.fileName}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Status Badges */}
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                {!photo.isEnabled && (
                                  <span className="px-1.5 py-0.5 rounded bg-sage/80 text-white text-[10px]">
                                    Not used
                                  </span>
                                )}
                                {!photo.cropData && !photo.cropUrl && (
                                  <span className="px-1.5 py-0.5 rounded bg-golden/80 text-white text-[10px]">
                                    No crop
                                  </span>
                                )}
                                {isLegacySquareQuizCrop(photo.cropUrl) && (
                                  <span className="px-1.5 py-0.5 rounded bg-golden/80 text-white text-[10px]">
                                    Crop needs updating
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-dune/40">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No photos added yet</p>
                        </div>
                      )}

                      {/* Add Photo Button */}
                      <button
                        onClick={() => setDamPicker({ isOpen: true, lashStyle: style.id })}
                        disabled={saving === 'adding'}
                        className={clsx(
                          "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed py-3 transition-all",
                          "hover:border-dusty-rose/40 hover:bg-dusty-rose/5",
                          "text-dune/60 hover:text-dusty-rose",
                          colors.border
                        )}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add photo from Media</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 rounded-lg border border-sage/15 bg-cream/60 p-4 sm:p-6"
      >
        <h3 className="font-serif text-lg text-dune mb-3">Photo requirements</h3>
        <ul className="space-y-2 text-sm text-dune/70">
          <li className="flex items-start gap-2">
            <span className="text-dusty-rose">&#8226;</span>
            <span>Turn on at least 2 photos for each lash style.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-mist">&#8226;</span>
            <span>Crop each photo around the lashes. Quiz photos are shown in a portrait frame.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-terracotta">&#8226;</span>
            <span>The quiz shows photos in pairs until one lash style wins.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sage">&#8226;</span>
            <span>Use 3 to 4 photos per style for enough variety.</span>
          </li>
        </ul>
      </motion.div>
        </>
      )}

      {/* RESULTS TAB CONTENT */}
      {activeTab === 'results' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <p className="text-sm text-dune/60 mb-6">
            Edit the image, name, description, and bullet points customers see for each result.
          </p>

          {LASH_STYLES.map((style, index) => {
            const settings = getSettingsForStyle(style.id)
            const isExpanded = expandedResultStyles.has(style.id)
            const colors = colorMap[style.color]
            const hasImage = !!settings?.resultImageAssetId

            return (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className={clsx(
                  "glass overflow-hidden rounded-lg border sm:rounded-xl",
                  colors.border
                )}
              >
                {/* Style Header */}
                <button
                  onClick={() => toggleResultStyle(style.id)}
                  className="flex w-full min-w-0 items-center gap-3 p-3 transition-colors hover:bg-sage/5 sm:gap-4 sm:p-4"
                >
                  <div className={clsx(
                    "flex size-9 shrink-0 items-center justify-center rounded-md sm:size-10 sm:rounded-lg",
                    colors.bg
                  )}>
                    {isExpanded ? (
                      <ChevronDown className={clsx("w-5 h-5", colors.text)} />
                    ) : (
                      <ChevronRight className={clsx("w-5 h-5", colors.text)} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="font-medium text-dune">{settings?.displayName || style.label}</h3>
                      {hasImage ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-ocean-mist/10 text-ocean-mist">
                          Image set
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-golden/10 text-golden">
                          No image
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dune/60 mt-0.5">{style.description}</p>
                  </div>
                </button>

                {/* Style Content */}
                <AnimatePresence>
                  {isExpanded && settings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-sage/10 p-4 space-y-4">
                        {/* Result Image */}
                        <div>
                          <label className="text-xs font-medium text-dune/60 uppercase tracking-wider mb-2 block">
                            Result image
                          </label>
                          <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
                            {settings.resultImageFilePath ? (
                              <div className="group relative size-28 shrink-0 overflow-hidden rounded-md border border-sage/20 sm:size-32 sm:rounded-lg">
                                <Image
                                  key={settings.resultImageCropUrl || settings.resultImageAssetId}
                                  src={settings.resultImageCropUrl || settings.resultImageFilePath}
                                  alt={settings.displayName}
                                  fill
                                  className="object-cover"
                                  unoptimized={!!settings.resultImageCropUrl}
                                />
                                <div className="absolute bottom-1 right-1 flex items-center justify-center gap-1 opacity-100 sm:inset-0 sm:bg-dune/0 sm:opacity-0 sm:transition-[background-color,opacity] sm:group-hover:bg-dune/40 sm:group-hover:opacity-100 sm:group-focus-within:bg-dune/40 sm:group-focus-within:opacity-100">
                                  <button
                                    onClick={() => setResultCropEditor({
                                      isOpen: true,
                                      lashStyle: style.id,
                                      imageUrl: settings.resultImageFilePath!,
                                      cropData: settings.resultImageCropData
                                    })}
                                    className="flex size-11 items-center justify-center rounded-md bg-white/90 hover:bg-white"
                                    title="Edit crop"
                                    aria-label={`Edit crop for ${settings.displayName}`}
                                  >
                                    <Crop className="w-4 h-4 text-dune" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveResultImage(style.id)}
                                    className="flex size-11 items-center justify-center rounded-md bg-terracotta/90 text-white hover:bg-terracotta"
                                    title="Remove image"
                                    aria-label={`Remove result image for ${settings.displayName}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setResultDamPicker({ isOpen: true, lashStyle: style.id })}
                                className="flex size-28 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-sage/30 text-dune/40 transition-colors hover:border-dusty-rose/40 hover:text-dusty-rose sm:size-32"
                              >
                                <Plus className="w-6 h-6" />
                                <span className="text-xs">Add image</span>
                              </button>
                            )}
                            <div className="min-w-0 flex-1 text-xs text-dune/50">
                              <p>This image shows on the result page after the quiz.</p>
                              <p className="mt-1">Use a square crop focused on the lashes.</p>
                            </div>
                          </div>
                        </div>

                        {/* Display Name */}
                        <div>
                          <label className="text-xs font-medium text-dune/60 uppercase tracking-wider mb-2 block">
                            Name shown to customers
                          </label>
                          <input
                            type="text"
                            value={settings.displayName}
                            onChange={(e) => handleUpdateResultText(style.id, 'displayName', e.target.value)}
                            className="w-full rounded-lg border border-sage/20 px-3 py-2 text-sm outline-none focus:border-dusty-rose/50 focus:ring-2 focus:ring-dusty-rose/20"
                            placeholder="For example, Classic Lashes"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-xs font-medium text-dune/60 uppercase tracking-wider mb-2 block">
                            Description
                          </label>
                          <textarea
                            value={settings.description}
                            onChange={(e) => handleUpdateResultText(style.id, 'description', e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-lg border border-sage/20 px-3 py-2 text-sm outline-none focus:border-dusty-rose/50 focus:ring-2 focus:ring-dusty-rose/20"
                            placeholder="Describe this lash style…"
                          />
                        </div>

                        {/* Best For */}
                        <div>
                          <label className="text-xs font-medium text-dune/60 uppercase tracking-wider mb-2 block">
                            Best for
                          </label>
                          <div className="space-y-2">
                            {settings.bestFor.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-dusty-rose">•</span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const newBestFor = [...settings.bestFor]
                                    newBestFor[i] = e.target.value
                                    handleUpdateBestFor(style.id, newBestFor)
                                  }}
                                  className="min-w-0 flex-1 rounded-lg border border-sage/20 px-3 py-1.5 text-sm outline-none focus:border-dusty-rose/50"
                                />
                                <button
                                  onClick={() => {
                                    const newBestFor = settings.bestFor.filter((_, idx) => idx !== i)
                                    handleUpdateBestFor(style.id, newBestFor)
                                  }}
                                  className="flex size-11 shrink-0 items-center justify-center rounded-md bg-sage/10 text-dune/40 transition-colors hover:bg-terracotta/10 hover:text-terracotta"
                                  aria-label={`Remove bullet point ${i + 1} from ${settings.displayName}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => handleUpdateBestFor(style.id, [...settings.bestFor, ''])}
                              className="text-xs text-dusty-rose hover:text-dusty-rose/80 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add item
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* DAM Picker Modal (Comparison Photos) */}
      <MiniDamExplorer
        isOpen={damPicker?.isOpen ?? false}
        onClose={() => setDamPicker(null)}
        onSelect={handleAddPhoto}
        title={`Add photo for ${LASH_STYLES.find(s => s.id === damPicker?.lashStyle)?.label || 'quiz'}`}
        subtitle="Choose a lash photo from your media library"
      />

      {/* DAM Picker Modal (Result Images) */}
      <MiniDamExplorer
        isOpen={resultDamPicker?.isOpen ?? false}
        onClose={() => setResultDamPicker(null)}
        onSelect={handleSetResultImage}
        title={`Result image for ${LASH_STYLES.find(s => s.id === resultDamPicker?.lashStyle)?.label || 'result'}`}
        subtitle="Choose an image for the result page"
      />

      {/* Crop Editor Modal (Comparison Photos) */}
      {cropEditor?.isOpen && (
        <QuizPhotoCropEditor
          isOpen={cropEditor.isOpen}
          onClose={() => setCropEditor(null)}
          onSave={handleCropSave}
          imageUrl={cropEditor.photo.filePath}
          initialCrop={isLegacySquareQuizCrop(cropEditor.photo.cropUrl)
            ? {
                x: cropEditor.photo.cropData?.x ?? 50,
                y: cropEditor.photo.cropData?.y ?? 50,
                scale: 0.5,
              }
            : cropEditor.photo.cropData || undefined}
          photoName={cropEditor.photo.fileName}
          cropAspect={QUIZ_COMPARISON_CROP_ASPECT}
        />
      )}

      {/* Crop Editor Modal (Result Images) */}
      {resultCropEditor?.isOpen && (
        <QuizPhotoCropEditor
          isOpen={resultCropEditor.isOpen}
          onClose={() => setResultCropEditor(null)}
          onSave={handleResultCropSave}
          imageUrl={resultCropEditor.imageUrl}
          initialCrop={resultCropEditor.cropData || undefined}
          photoName={`${LASH_STYLES.find(s => s.id === resultCropEditor.lashStyle)?.label} Result`}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-dune/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-lg bg-white p-4 shadow-2xl sm:p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="hidden size-12 shrink-0 items-center justify-center rounded-lg bg-terracotta/10 sm:flex">
                  <Trash2 className="w-6 h-6 text-terracotta" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-dune">Delete this quiz photo?</h3>
                  <p className="text-sm text-dune/60 mt-1">
                    The photo will be removed from the quiz. It will stay in Media.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="min-h-11 rounded-md px-4 py-2 text-sm font-medium text-dune/60 transition-colors hover:bg-sage/10 hover:text-dune"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={saving === deleteConfirm}
                  className="btn bg-terracotta text-white hover:bg-terracotta/90"
                >
                  {saving === deleteConfirm ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

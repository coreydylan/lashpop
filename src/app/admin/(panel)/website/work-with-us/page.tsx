"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Users
} from 'lucide-react'
import clsx from 'clsx'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'
import {
  getAllCarouselPhotos,
  addCarouselPhoto,
  toggleCarouselPhotoEnabled,
  deleteCarouselPhoto,
  reorderCarouselPhotos,
  type CarouselPhotoWithAsset
} from '@/actions/work-with-us-carousel'
import { WorkWithUsContentEditor } from './WorkWithUsContentEditor'

export default function WorkWithUsCarouselAdminPage() {
  // Data state
  const [photos, setPhotos] = useState<CarouselPhotoWithAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // UI state
  const [damPickerOpen, setDamPickerOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllCarouselPhotos()
      setPhotos(data)
    } catch (error) {
      console.error('Error fetching carousel photos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle adding photo from DAM
  const handleAddPhoto = async (asset: Asset) => {
    setSaving('adding')
    try {
      const newPhoto = await addCarouselPhoto(asset.id)
      setPhotos(prev => [...prev, newPhoto])
      setDamPickerOpen(false)
    } catch (error) {
      console.error('Error adding photo:', error)
    } finally {
      setSaving(null)
    }
  }

  // Handle toggle enabled
  const handleToggleEnabled = async (photoId: string) => {
    setSaving(photoId)
    try {
      const result = await toggleCarouselPhotoEnabled(photoId)
      setPhotos(prev => prev.map(p =>
        p.id === photoId ? { ...p, isEnabled: result.isEnabled } : p
      ))
    } catch (error) {
      console.error('Error toggling photo:', error)
    } finally {
      setSaving(null)
    }
  }

  // Handle delete
  const handleDelete = async (photoId: string) => {
    setSaving(photoId)
    try {
      await deleteCarouselPhoto(photoId)
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting photo:', error)
    } finally {
      setSaving(null)
    }
  }

  // Get stats
  const stats = {
    total: photos.length,
    enabled: photos.filter(p => p.isEnabled).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="grid gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-dusty-rose/30 to-terracotta/20 sm:flex">
              <Users className="w-6 h-6 text-dusty-rose" />
            </div>
            <div className="min-w-0">
              <h1 className="h2 text-dune">Work With Us photos</h1>
              <p className="text-sm text-dune/60">
                Choose the photos shown between the work option cards.
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

      <WorkWithUsContentEditor />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid grid-cols-2 divide-x divide-sage/15 border-y border-sage/20 bg-white"
      >
        <div className="min-w-0 px-3 py-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden size-10 items-center justify-center rounded-lg bg-terracotta/10 sm:flex">
              <ImageIcon className="w-5 h-5 text-terracotta" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{stats.total}</p>
              <p className="text-xs text-dune/60">All photos</p>
            </div>
          </div>
        </div>
        <div className="min-w-0 px-3 py-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden size-10 items-center justify-center rounded-lg bg-ocean-mist/10 sm:flex">
              <Eye className="w-5 h-5 text-ocean-mist" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{stats.enabled}</p>
              <p className="text-xs text-dune/60">Shown</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Photo Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-lg border border-sage/15 p-4 sm:p-6"
      >
        <div className="mb-4 grid gap-3 sm:flex sm:items-center sm:justify-between">
          <h2 className="font-serif text-lg text-dune">Page photos</h2>
          <button
            onClick={() => setDamPickerOpen(true)}
            disabled={saving === 'adding'}
            className="btn btn-primary w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add photo
          </button>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={clsx(
                  "group relative aspect-square overflow-hidden rounded-md border sm:rounded-lg",
                  photo.isEnabled
                    ? "border-ocean-mist/30"
                    : "border-sage/20 opacity-60"
                )}
              >
                <Image
                  src={photo.filePath}
                  alt={photo.fileName}
                  fill
                  className="object-cover"
                />

                {/* Overlay Actions */}
                <div className="absolute bottom-1 right-1 flex items-center justify-center gap-1 opacity-100 sm:inset-0 sm:bg-dune/0 sm:opacity-0 sm:transition-[background-color,opacity] sm:group-hover:bg-dune/40 sm:group-hover:opacity-100 sm:group-focus-within:bg-dune/40 sm:group-focus-within:opacity-100">
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
                    title={photo.isEnabled ? 'Hide from page' : 'Show on page'}
                    aria-label={`${photo.isEnabled ? 'Hide' : 'Show'} ${photo.fileName} on the Work With Us page`}
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

                {/* Order Badge */}
                <div className="absolute top-2 left-2">
                  <span className="rounded bg-white/85 px-1.5 py-0.5 text-xs font-medium text-dune">
                    #{index + 1}
                  </span>
                </div>

                {/* Status Badge */}
                {!photo.isEnabled && (
                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 rounded bg-sage/80 text-white text-[10px]">
                      Hidden
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-dune/40">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-4">No photos added yet</p>
            <button
              onClick={() => setDamPickerOpen(true)}
              className="btn btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Add photo
            </button>
          </div>
        )}
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-lg border border-sage/15 bg-cream/60 p-4 sm:p-6"
      >
        <h3 className="font-serif text-lg text-dune mb-3">Tips</h3>
        <ul className="space-y-2 text-sm text-dune/70">
          <li className="flex items-start gap-2">
            <span className="text-dusty-rose">•</span>
            <span>Photos appear between the work option cards and their details.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-mist">•</span>
            <span>Hide a photo to remove it from the page without deleting it.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-terracotta">•</span>
            <span>Photos appear in this order. Use 4 to 6 photos for a balanced carousel.</span>
          </li>
        </ul>
      </motion.div>

      {/* DAM Picker Modal */}
      <MiniDamExplorer
        isOpen={damPickerOpen}
        onClose={() => setDamPickerOpen(false)}
        onSelect={handleAddPhoto}
        title="Add Work With Us photo"
        subtitle="Select a team or culture photo from your media library"
      />

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
                  <h3 className="font-serif text-lg text-dune">Remove photo from this page?</h3>
                  <p className="text-sm text-dune/60 mt-1">
                    The photo will stay in Media but will no longer appear on the Work With Us page.
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
                      Removing…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove photo
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

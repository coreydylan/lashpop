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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dusty-rose/30 to-terracotta/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-dusty-rose" />
            </div>
            <div>
              <h1 className="h2 text-dune">Work With Us Carousel</h1>
              <p className="text-sm text-dune/60">
                Manage photos displayed in the team carousel
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

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <div className="glass rounded-2xl p-4 border border-sage/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-terracotta" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{stats.total}</p>
              <p className="text-xs text-dune/60">Total Photos</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-sage/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ocean-mist/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-ocean-mist" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-dune">{stats.enabled}</p>
              <p className="text-xs text-dune/60">Enabled</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Photo Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl border border-sage/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-dune">Carousel Photos</h2>
          <button
            onClick={() => setDamPickerOpen(true)}
            disabled={saving === 'adding'}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Photo
          </button>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={clsx(
                  "relative aspect-square rounded-xl overflow-hidden border-2 group",
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
                <div className="absolute inset-0 bg-dune/0 group-hover:bg-dune/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {/* Toggle Enabled */}
                  <button
                    onClick={() => handleToggleEnabled(photo.id)}
                    disabled={saving === photo.id}
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      photo.isEnabled
                        ? "bg-ocean-mist/90 hover:bg-ocean-mist text-white"
                        : "bg-white/90 hover:bg-white text-dune"
                    )}
                    title={photo.isEnabled ? 'Disable' : 'Enable'}
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
                    className="w-8 h-8 rounded-full bg-terracotta/90 hover:bg-terracotta flex items-center justify-center text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/80 text-dune text-xs font-medium">
                    #{index + 1}
                  </span>
                </div>

                {/* Status Badge */}
                {!photo.isEnabled && (
                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 rounded bg-sage/80 text-white text-[10px]">
                      Disabled
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
              Add Your First Photo
            </button>
          </div>
        )}
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-6 bg-cream/60 backdrop-blur-sm rounded-3xl border border-sage/10"
      >
        <h3 className="font-serif text-lg text-dune mb-3">Tips</h3>
        <ul className="space-y-2 text-sm text-dune/70">
          <li className="flex items-start gap-2">
            <span className="text-dusty-rose">•</span>
            <span>Photos appear in the carousel between the career cards and expanded sections.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-mist">•</span>
            <span>Use the <strong>eye icon</strong> to enable/disable photos without deleting them.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-terracotta">•</span>
            <span>Photos are displayed in the order shown here. Add at least 4-6 photos for best results.</span>
          </li>
        </ul>
      </motion.div>

      {/* DAM Picker Modal */}
      <MiniDamExplorer
        isOpen={damPickerOpen}
        onClose={() => setDamPickerOpen(false)}
        onSelect={handleAddPhoto}
        title="Add Carousel Photo"
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
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-terracotta" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-dune">Delete Photo?</h3>
                  <p className="text-sm text-dune/60 mt-1">
                    This will remove this photo from the carousel. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-dune/60 hover:text-dune hover:bg-sage/10 transition-colors"
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
                      Deleting...
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

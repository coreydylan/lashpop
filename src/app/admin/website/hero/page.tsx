"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Image as ImageIcon,
  Move,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Folder,
  Smartphone,
  Monitor,
  Play,
  Layers,
  Plus,
  Trash2,
  Settings,
  Clock,
  MousePointer,
  ChevronDown,
  GripVertical
} from 'lucide-react'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'
import type {
  SlideshowPreset,
  SlideshowImage,
  SlideshowAssignments,
  TransitionType,
  TransitionConfig,
  TimingConfig,
  NavigationConfig,
  TRANSITION_META
} from '@/types/hero-slideshow'
import {
  DEFAULT_TRANSITION,
  DEFAULT_TIMING,
  DEFAULT_NAVIGATION,
  DEFAULT_ASSIGNMENTS
} from '@/types/hero-slideshow'

// ============================================
// Types
// ============================================

interface HeroImage {
  assetId: string
  url: string
  fileName: string
  position: { x: number; y: number }
  objectFit: 'cover' | 'contain'
}

type DeviceType = 'desktop' | 'mobile'
type EditorMode = 'single' | 'slideshow'
type SlideshowTab = 'presets' | 'editor' | 'assignments'

// ============================================
// Transition Metadata
// ============================================

const TRANSITION_OPTIONS: { type: TransitionType; name: string; description: string }[] = [
  { type: 'fade', name: 'Fade', description: 'Simple crossfade' },
  { type: 'slide', name: 'Slide', description: 'Horizontal slide' },
  { type: 'slideUp', name: 'Slide Up', description: 'Vertical slide up' },
  { type: 'slideDown', name: 'Slide Down', description: 'Vertical slide down' },
  { type: 'kenBurns', name: 'Ken Burns', description: 'Zoom & pan with fade' },
  { type: 'zoom', name: 'Zoom', description: 'Zoom in/out transition' },
  { type: 'blur', name: 'Blur', description: 'Blur transition' },
  { type: 'wipeLeft', name: 'Wipe Left', description: 'Wipe from right to left' },
  { type: 'wipeRight', name: 'Wipe Right', description: 'Wipe from left to right' },
  { type: 'wipeUp', name: 'Wipe Up', description: 'Wipe from bottom to top' },
  { type: 'wipeDown', name: 'Wipe Down', description: 'Wipe from top to bottom' },
  { type: 'circleReveal', name: 'Circle Reveal', description: 'Circular reveal from center' },
  { type: 'pixelate', name: 'Pixelate', description: 'Pixelated dissolve' },
]

// ============================================
// Main Component
// ============================================

export default function HeroSectionEditor() {
  // Mode state
  const [editorMode, setEditorMode] = useState<EditorMode>('single')
  const [slideshowTab, setSlideshowTab] = useState<SlideshowTab>('presets')

  // Single image state
  const [desktopImage, setDesktopImage] = useState<HeroImage | null>(null)
  const [mobileImage, setMobileImage] = useState<HeroImage | null>(null)
  const [availableImages, setAvailableImages] = useState<{ id: string; url: string; fileName: string }[]>([])
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktop')
  const [selectingFor, setSelectingFor] = useState<DeviceType>('desktop')

  // Slideshow state
  const [presets, setPresets] = useState<SlideshowPreset[]>([])
  const [assignments, setAssignments] = useState<SlideshowAssignments>(DEFAULT_ASSIGNMENTS)
  const [editingPreset, setEditingPreset] = useState<SlideshowPreset | null>(null)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerMode, setImagePickerMode] = useState<'single' | 'slideshow'>('single')

  // Get current image based on active device (single mode)
  const currentImage = activeDevice === 'desktop' ? desktopImage : mobileImage
  const setCurrentImage = activeDevice === 'desktop' ? setDesktopImage : setMobileImage

  // ============================================
  // Data Fetching
  // ============================================

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [archwayRes, presetsRes, assignmentsRes, assetsRes] = await Promise.all([
        fetch('/api/admin/website/hero-archway'),
        fetch('/api/admin/website/hero-slideshow-presets'),
        fetch('/api/admin/website/hero-slideshow-assignments'),
        fetch('/api/dam/assets?tag=website:hero')
      ])

      if (archwayRes.ok) {
        const data = await archwayRes.json()
        if (data.settings) {
          if (data.settings.desktop) setDesktopImage(data.settings.desktop)
          if (data.settings.mobile) setMobileImage(data.settings.mobile)
        }
      }

      if (presetsRes.ok) {
        const data = await presetsRes.json()
        setPresets(data.presets || [])
      }

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json()
        setAssignments(data.assignments || DEFAULT_ASSIGNMENTS)
      }

      if (assetsRes.ok) {
        const data = await assetsRes.json()
        setAvailableImages(data.assets || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ============================================
  // Save Handlers
  // ============================================

  const handleSaveSingleImage = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/website/hero-archway', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { desktop: desktopImage, mobile: mobileImage }
        })
      })
      if (!response.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreset = async (preset: SlideshowPreset) => {
    setSaving(true)
    setError(null)
    try {
      const isNew = !presets.find(p => p.id === preset.id)
      const response = await fetch('/api/admin/website/hero-slideshow-presets', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset })
      })
      if (!response.ok) throw new Error('Failed to save preset')

      const data = await response.json()
      if (isNew) {
        setPresets(prev => [...prev, data.preset])
      } else {
        setPresets(prev => prev.map(p => p.id === preset.id ? data.preset : p))
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setEditingPreset(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('Delete this preset?')) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/website/hero-slideshow-presets?id=${presetId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete')
      setPresets(prev => prev.filter(p => p.id !== presetId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAssignments = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/website/hero-slideshow-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      })
      if (!response.ok) throw new Error('Failed to save assignments')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignments')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // Image Selection Handlers
  // ============================================

  const handleImageSelect = (asset: Asset) => {
    if (imagePickerMode === 'single') {
      const newImage: HeroImage = {
        assetId: asset.id,
        url: asset.filePath,
        fileName: asset.fileName,
        position: { x: 50, y: 50 },
        objectFit: 'cover'
      }
      if (selectingFor === 'desktop') setDesktopImage(newImage)
      else setMobileImage(newImage)
    } else if (editingPreset && editingImageIndex !== null) {
      const newImage: SlideshowImage = {
        id: crypto.randomUUID(),
        assetId: asset.id,
        url: asset.filePath,
        fileName: asset.fileName,
        position: { x: 50, y: 50 },
        objectFit: 'cover'
      }
      const newImages = [...editingPreset.images]
      newImages[editingImageIndex] = newImage
      setEditingPreset({ ...editingPreset, images: newImages })
    } else if (editingPreset) {
      // Adding new image to slideshow
      const newImage: SlideshowImage = {
        id: crypto.randomUUID(),
        assetId: asset.id,
        url: asset.filePath,
        fileName: asset.fileName,
        position: { x: 50, y: 50 },
        objectFit: 'cover'
      }
      setEditingPreset({ ...editingPreset, images: [...editingPreset.images, newImage] })
    }
    setShowImagePicker(false)
  }

  const openImagePickerForSingle = (device: DeviceType) => {
    setSelectingFor(device)
    setImagePickerMode('single')
    setShowImagePicker(true)
  }

  const openImagePickerForSlideshow = (index?: number) => {
    setImagePickerMode('slideshow')
    setEditingImageIndex(index ?? null)
    setShowImagePicker(true)
  }

  const createNewPreset = () => {
    const newPreset: SlideshowPreset = {
      id: crypto.randomUUID(),
      name: `New Preset ${presets.length + 1}`,
      images: [],
      transition: { ...DEFAULT_TRANSITION },
      timing: { ...DEFAULT_TIMING },
      navigation: { ...DEFAULT_NAVIGATION },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setEditingPreset(newPreset)
    setSlideshowTab('editor')
  }

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dusty-rose/30 to-terracotta/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <h1 className="h2 text-dune">Hero Section</h1>
              <p className="text-sm text-dune/60">Configure the above-the-fold arch image or slideshow</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-terracotta/10 border border-terracotta/20 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-terracotta flex-shrink-0" />
          <p className="text-sm text-terracotta">{error}</p>
        </motion.div>
      )}

      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="glass rounded-2xl p-2 inline-flex gap-2">
          <button
            onClick={() => setEditorMode('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              editorMode === 'single'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Single Image
          </button>
          <button
            onClick={() => setEditorMode('slideshow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              editorMode === 'slideshow'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Slideshow
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {editorMode === 'single' ? (
          <SingleImageEditor
            key="single"
            desktopImage={desktopImage}
            mobileImage={mobileImage}
            availableImages={availableImages}
            activeDevice={activeDevice}
            setActiveDevice={setActiveDevice}
            setCurrentImage={setCurrentImage}
            currentImage={currentImage}
            openImagePicker={openImagePickerForSingle}
            onSave={handleSaveSingleImage}
            saving={saving}
            saved={saved}
          />
        ) : (
          <SlideshowEditor
            key="slideshow"
            presets={presets}
            assignments={assignments}
            setAssignments={setAssignments}
            editingPreset={editingPreset}
            setEditingPreset={setEditingPreset}
            slideshowTab={slideshowTab}
            setSlideshowTab={setSlideshowTab}
            onCreatePreset={createNewPreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            onSaveAssignments={handleSaveAssignments}
            openImagePicker={openImagePickerForSlideshow}
            saving={saving}
            saved={saved}
          />
        )}
      </AnimatePresence>

      {/* Mini DAM Explorer Modal */}
      <MiniDamExplorer
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleImageSelect}
        selectedAssetId={currentImage?.assetId}
        title="Select Hero Image"
        subtitle="Choose an image for the hero arch"
      />
    </div>
  )
}

// ============================================
// Single Image Editor Component
// ============================================

interface SingleImageEditorProps {
  desktopImage: HeroImage | null
  mobileImage: HeroImage | null
  availableImages: { id: string; url: string; fileName: string }[]
  activeDevice: DeviceType
  setActiveDevice: (d: DeviceType) => void
  setCurrentImage: (img: HeroImage) => void
  currentImage: HeroImage | null
  openImagePicker: (device: DeviceType) => void
  onSave: () => void
  saving: boolean
  saved: boolean
}

function SingleImageEditor({
  desktopImage,
  mobileImage,
  availableImages,
  activeDevice,
  setActiveDevice,
  setCurrentImage,
  currentImage,
  openImagePicker,
  onSave,
  saving,
  saved
}: SingleImageEditorProps) {
  const copyDesktopToMobile = () => {
    if (desktopImage) {
      setCurrentImage({ ...desktopImage })
    }
  }

  const updatePosition = (axis: 'x' | 'y', value: number) => {
    if (!currentImage) return
    setCurrentImage({
      ...currentImage,
      position: { ...currentImage.position, [axis]: value }
    })
  }

  const updateObjectFit = (fit: 'cover' | 'contain') => {
    if (!currentImage) return
    setCurrentImage({ ...currentImage, objectFit: fit })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Device Toggle & Save */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="glass rounded-2xl p-2 inline-flex gap-2">
            <button
              onClick={() => setActiveDevice('desktop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeDevice === 'desktop'
                  ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                  : 'text-dune/60 hover:text-dune hover:bg-cream/50'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </button>
            <button
              onClick={() => setActiveDevice('mobile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeDevice === 'mobile'
                  ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                  : 'text-dune/60 hover:text-dune hover:bg-cream/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
          </div>

          {activeDevice === 'mobile' && desktopImage && (
            <button
              onClick={copyDesktopToMobile}
              className="text-sm text-dusty-rose hover:text-terracotta transition-colors"
            >
              Copy from desktop
            </button>
          )}
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'}`}
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Preview Panel */}
        <div className="glass rounded-3xl p-6 border border-sage/20">
          <h3 className="font-serif text-lg text-dune mb-4">
            {activeDevice === 'desktop' ? 'Desktop' : 'Mobile'} Arch Preview
          </h3>

          <div className={`relative mx-auto ${activeDevice === 'desktop' ? 'aspect-[3/4] max-h-[500px]' : 'aspect-[9/16] max-h-[600px]'}`}>
            <div
              className="absolute inset-0 overflow-hidden bg-warm-sand/50"
              style={{
                borderRadius: activeDevice === 'desktop' ? '120px 120px 0 0' : '80px 80px 0 0',
                maxWidth: activeDevice === 'desktop' ? '320px' : '280px',
                margin: '0 auto'
              }}
            >
              {currentImage?.url ? (
                <Image
                  src={currentImage.url}
                  alt="Hero preview"
                  fill
                  className="transition-all duration-300"
                  style={{
                    objectFit: currentImage.objectFit,
                    objectPosition: `${currentImage.position.x}% ${currentImage.position.y}%`
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-dune/40">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No image selected</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-mist/20 to-transparent pointer-events-none" />
            </div>
          </div>

          {currentImage && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-dune/60">
                <Move className="w-4 h-4" />
                <span>Image Position</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider">
                    Horizontal: {currentImage.position.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentImage.position.x}
                    onChange={(e) => updatePosition('x', parseInt(e.target.value))}
                    className="w-full mt-1 accent-dusty-rose"
                  />
                </div>
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider">
                    Vertical: {currentImage.position.y}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentImage.position.y}
                    onChange={(e) => updatePosition('y', parseInt(e.target.value))}
                    className="w-full mt-1 accent-dusty-rose"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => updateObjectFit('cover')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm transition-all ${
                    currentImage.objectFit === 'cover'
                      ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                      : 'bg-cream/50 text-dune/60 border border-sage/20'
                  }`}
                >
                  Fill Arch
                </button>
                <button
                  onClick={() => updateObjectFit('contain')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm transition-all ${
                    currentImage.objectFit === 'contain'
                      ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                      : 'bg-cream/50 text-dune/60 border border-sage/20'
                  }`}
                >
                  Fit Inside
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image Selection Panel */}
        <div className="glass rounded-3xl p-6 border border-sage/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg text-dune">
              Select {activeDevice === 'desktop' ? 'Desktop' : 'Mobile'} Image
            </h3>
            <button
              onClick={() => openImagePicker(activeDevice)}
              className="btn btn-secondary text-sm"
            >
              <Folder className="w-4 h-4" />
              Browse DAM
            </button>
          </div>

          {availableImages.length === 0 ? (
            <div className="p-8 bg-golden/10 rounded-2xl border border-golden/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-golden flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-dune font-medium">No hero images tagged yet</p>
                  <p className="text-xs text-dune/60 mt-1">
                    Click <strong>Browse DAM</strong> to pick any image.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-dune/50 mb-3">Quick picks (tagged with Website: Hero)</p>
              <div className="grid grid-cols-2 gap-3">
                {availableImages.filter(img => img.url).map((image) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      const newImage: HeroImage = {
                        assetId: image.id,
                        url: image.url,
                        fileName: image.fileName,
                        position: currentImage?.position || { x: 50, y: 50 },
                        objectFit: currentImage?.objectFit || 'cover'
                      }
                      setCurrentImage(newImage)
                    }}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      currentImage?.assetId === image.id
                        ? 'border-dusty-rose shadow-lg scale-[1.02]'
                        : 'border-transparent hover:border-sage/30'
                    }`}
                  >
                    <Image src={image.url} alt={image.fileName} fill className="object-cover" />
                    {currentImage?.assetId === image.id && (
                      <div className="absolute inset-0 bg-dusty-rose/20 flex items-center justify-center">
                        <Check className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentImage && (
            <div className="mt-4 p-3 rounded-xl bg-sage/5 border border-sage/10">
              <p className="text-xs text-dune/60 mb-1">Currently selected for {activeDevice}</p>
              <p className="text-sm text-dune font-medium truncate">{currentImage.fileName}</p>
            </div>
          )}

          {/* Status */}
          <div className="mt-6 pt-4 border-t border-sage/10">
            <p className="text-xs text-dune/50 uppercase tracking-wider mb-3">Image Status</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-dune/40" />
                <span className="text-sm text-dune/70">Desktop:</span>
                <span className={`text-sm ${desktopImage ? 'text-ocean-mist font-medium' : 'text-terracotta/70'}`}>
                  {desktopImage ? desktopImage.fileName : 'Not set (using default)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-dune/40" />
                <span className="text-sm text-dune/70">Mobile:</span>
                <span className={`text-sm ${mobileImage ? 'text-ocean-mist font-medium' : 'text-terracotta/70'}`}>
                  {mobileImage ? mobileImage.fileName : 'Not set (using default)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// Slideshow Editor Component
// ============================================

interface SlideshowEditorProps {
  presets: SlideshowPreset[]
  assignments: SlideshowAssignments
  setAssignments: (a: SlideshowAssignments) => void
  editingPreset: SlideshowPreset | null
  setEditingPreset: (p: SlideshowPreset | null) => void
  slideshowTab: SlideshowTab
  setSlideshowTab: (t: SlideshowTab) => void
  onCreatePreset: () => void
  onSavePreset: (p: SlideshowPreset) => void
  onDeletePreset: (id: string) => void
  onSaveAssignments: () => void
  openImagePicker: (index?: number) => void
  saving: boolean
  saved: boolean
}

function SlideshowEditor({
  presets,
  assignments,
  setAssignments,
  editingPreset,
  setEditingPreset,
  slideshowTab,
  setSlideshowTab,
  onCreatePreset,
  onSavePreset,
  onDeletePreset,
  onSaveAssignments,
  openImagePicker,
  saving,
  saved
}: SlideshowEditorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="glass rounded-2xl p-2 inline-flex gap-2">
          <button
            onClick={() => setSlideshowTab('presets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              slideshowTab === 'presets'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Presets
          </button>
          <button
            onClick={() => setSlideshowTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              slideshowTab === 'editor'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Editor
          </button>
          <button
            onClick={() => setSlideshowTab('assignments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              slideshowTab === 'assignments'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Assignments
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {slideshowTab === 'presets' && (
          <PresetsList
            key="presets"
            presets={presets}
            onEdit={(p) => { setEditingPreset(p); setSlideshowTab('editor'); }}
            onDelete={onDeletePreset}
            onCreate={onCreatePreset}
          />
        )}

        {slideshowTab === 'editor' && (
          <PresetEditor
            key="editor"
            preset={editingPreset}
            setPreset={setEditingPreset}
            onSave={onSavePreset}
            onCancel={() => { setEditingPreset(null); setSlideshowTab('presets'); }}
            openImagePicker={openImagePicker}
            saving={saving}
            saved={saved}
          />
        )}

        {slideshowTab === 'assignments' && (
          <AssignmentsPanel
            key="assignments"
            presets={presets}
            assignments={assignments}
            setAssignments={setAssignments}
            onSave={onSaveAssignments}
            saving={saving}
            saved={saved}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// Presets List
// ============================================

interface PresetsListProps {
  presets: SlideshowPreset[]
  onEdit: (p: SlideshowPreset) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

function PresetsList({ presets, onEdit, onDelete, onCreate }: PresetsListProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass rounded-3xl p-6 border border-sage/20"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-lg text-dune">Slideshow Presets</h3>
        <button onClick={onCreate} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4" />
          New Preset
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="p-8 text-center text-dune/50">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No presets yet. Create your first slideshow preset!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-cream/50 border border-sage/10 hover:border-sage/30 transition-colors"
            >
              {/* Preview thumbnails */}
              <div className="flex -space-x-2">
                {preset.images.slice(0, 3).map((img, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-lg overflow-hidden border-2 border-cream bg-sage/10"
                  >
                    <Image src={img.url} alt="" width={48} height={48} className="w-full h-full object-cover" />
                  </div>
                ))}
                {preset.images.length > 3 && (
                  <div className="w-12 h-12 rounded-lg bg-dune/10 flex items-center justify-center text-xs text-dune/60">
                    +{preset.images.length - 3}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-dune truncate">{preset.name}</h4>
                <p className="text-xs text-dune/50">
                  {preset.images.length} images • {preset.transition.type} • {preset.timing.interval / 1000}s
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(preset)}
                  className="p-2 rounded-lg hover:bg-sage/10 transition-colors"
                >
                  <Settings className="w-4 h-4 text-dune/60" />
                </button>
                <button
                  onClick={() => onDelete(preset.id)}
                  className="p-2 rounded-lg hover:bg-terracotta/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-terracotta/60" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ============================================
// Preset Editor
// ============================================

interface PresetEditorProps {
  preset: SlideshowPreset | null
  setPreset: (p: SlideshowPreset | null) => void
  onSave: (p: SlideshowPreset) => void
  onCancel: () => void
  openImagePicker: (index?: number) => void
  saving: boolean
  saved: boolean
}

function PresetEditor({ preset, setPreset, onSave, onCancel, openImagePicker, saving, saved }: PresetEditorProps) {
  if (!preset) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="glass rounded-3xl p-8 border border-sage/20 text-center"
      >
        <p className="text-dune/50">Select a preset to edit or create a new one.</p>
      </motion.div>
    )
  }

  const updatePreset = (updates: Partial<SlideshowPreset>) => {
    setPreset({ ...preset, ...updates })
  }

  const removeImage = (index: number) => {
    const newImages = preset.images.filter((_, i) => i !== index)
    updatePreset({ images: newImages })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={preset.name}
          onChange={(e) => updatePreset({ name: e.target.value })}
          className="text-xl font-serif text-dune bg-transparent border-none focus:outline-none focus:ring-0"
          placeholder="Preset Name"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={() => onSave(preset)}
            disabled={saving}
            className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} text-sm`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Preset'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Images Panel */}
        <div className="glass rounded-3xl p-6 border border-sage/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg text-dune">Images</h3>
            <button onClick={() => openImagePicker()} className="btn btn-secondary text-sm">
              <Plus className="w-4 h-4" />
              Add Image
            </button>
          </div>

          {preset.images.length === 0 ? (
            <div className="p-8 text-center text-dune/50 border-2 border-dashed border-sage/20 rounded-2xl">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Add images to your slideshow</p>
            </div>
          ) : (
            <div className="space-y-2">
              {preset.images.map((img, index) => (
                <div
                  key={img.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-cream/50 border border-sage/10"
                >
                  <GripVertical className="w-4 h-4 text-dune/30 cursor-grab" />
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-sage/10">
                    <Image src={img.url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dune truncate">{img.fileName}</p>
                    <p className="text-xs text-dune/50">Position: {img.position.x}%, {img.position.y}%</p>
                  </div>
                  <button
                    onClick={() => openImagePicker(index)}
                    className="p-2 rounded-lg hover:bg-sage/10"
                  >
                    <Settings className="w-4 h-4 text-dune/60" />
                  </button>
                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 rounded-lg hover:bg-terracotta/10"
                  >
                    <Trash2 className="w-4 h-4 text-terracotta/60" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Panels */}
        <div className="space-y-6">
          {/* Transition Settings */}
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Transition
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider">Effect</label>
                <select
                  value={preset.transition.type}
                  onChange={(e) => updatePreset({
                    transition: { ...preset.transition, type: e.target.value as TransitionType }
                  })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-cream/50 border border-sage/20 text-dune"
                >
                  {TRANSITION_OPTIONS.map(opt => (
                    <option key={opt.type} value={opt.type}>{opt.name} - {opt.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider">
                  Duration: {preset.transition.duration}ms
                </label>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="100"
                  value={preset.transition.duration}
                  onChange={(e) => updatePreset({
                    transition: { ...preset.transition, duration: parseInt(e.target.value) }
                  })}
                  className="w-full mt-1 accent-dusty-rose"
                />
              </div>
            </div>
          </div>

          {/* Timing Settings */}
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timing
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preset.timing.autoAdvance}
                  onChange={(e) => updatePreset({
                    timing: { ...preset.timing, autoAdvance: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                />
                <span className="text-sm text-dune">Auto-advance slides</span>
              </label>

              {preset.timing.autoAdvance && (
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider">
                    Interval: {preset.timing.interval / 1000}s
                  </label>
                  <input
                    type="range"
                    min="2000"
                    max="15000"
                    step="500"
                    value={preset.timing.interval}
                    onChange={(e) => updatePreset({
                      timing: { ...preset.timing, interval: parseInt(e.target.value) }
                    })}
                    className="w-full mt-1 accent-dusty-rose"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preset.timing.pauseOnHover}
                  onChange={(e) => updatePreset({
                    timing: { ...preset.timing, pauseOnHover: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                />
                <span className="text-sm text-dune">Pause on hover</span>
              </label>
            </div>
          </div>

          {/* Navigation Settings */}
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
              <MousePointer className="w-5 h-5" />
              Navigation
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preset.navigation.scrollEnabled}
                  onChange={(e) => updatePreset({
                    navigation: { ...preset.navigation, scrollEnabled: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                />
                <span className="text-sm text-dune">Scroll wheel navigation</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preset.navigation.swipeEnabled}
                  onChange={(e) => updatePreset({
                    navigation: { ...preset.navigation, swipeEnabled: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                />
                <span className="text-sm text-dune">Swipe navigation (mobile)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preset.navigation.showIndicators}
                  onChange={(e) => updatePreset({
                    navigation: { ...preset.navigation, showIndicators: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                />
                <span className="text-sm text-dune">Show navigation dots</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preset.navigation.looping}
                  onChange={(e) => updatePreset({
                    navigation: { ...preset.navigation, looping: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                />
                <span className="text-sm text-dune">Loop slides</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// Assignments Panel
// ============================================

interface AssignmentsPanelProps {
  presets: SlideshowPreset[]
  assignments: SlideshowAssignments
  setAssignments: (a: SlideshowAssignments) => void
  onSave: () => void
  saving: boolean
  saved: boolean
}

function AssignmentsPanel({ presets, assignments, setAssignments, onSave, saving, saved }: AssignmentsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass rounded-3xl p-6 border border-sage/20"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-lg text-dune">Device Assignments</h3>
        <button
          onClick={onSave}
          disabled={saving}
          className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} text-sm`}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Assignments'}
        </button>
      </div>

      <p className="text-sm text-dune/60 mb-6">
        Assign slideshow presets to desktop and mobile. If no preset is assigned, the single image setting will be used as a fallback.
      </p>

      <div className="space-y-6">
        {/* Desktop Assignment */}
        <div className="p-4 rounded-2xl bg-cream/50 border border-sage/10">
          <div className="flex items-center gap-3 mb-3">
            <Monitor className="w-5 h-5 text-dune/60" />
            <span className="font-medium text-dune">Desktop</span>
          </div>
          <select
            value={assignments.desktop || ''}
            onChange={(e) => setAssignments({
              ...assignments,
              desktop: e.target.value || null
            })}
            className="w-full px-3 py-2 rounded-xl bg-white/50 border border-sage/20 text-dune"
          >
            <option value="">No slideshow (use single image)</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>
        </div>

        {/* Mobile Assignment */}
        <div className="p-4 rounded-2xl bg-cream/50 border border-sage/10">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="w-5 h-5 text-dune/60" />
            <span className="font-medium text-dune">Mobile</span>
          </div>

          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={assignments.mobileSameAsDesktop}
              onChange={(e) => setAssignments({
                ...assignments,
                mobileSameAsDesktop: e.target.checked
              })}
              className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
            />
            <span className="text-sm text-dune">Same as desktop</span>
          </label>

          {!assignments.mobileSameAsDesktop && (
            <select
              value={assignments.mobile || ''}
              onChange={(e) => setAssignments({
                ...assignments,
                mobile: e.target.value || null
              })}
              className="w-full px-3 py-2 rounded-xl bg-white/50 border border-sage/20 text-dune"
            >
              <option value="">No slideshow (use single image)</option>
              {presets.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Current State Info */}
      <div className="mt-6 pt-4 border-t border-sage/10">
        <p className="text-xs text-dune/50 uppercase tracking-wider mb-3">Current Configuration</p>
        <div className="space-y-2 text-sm text-dune/70">
          <p>
            <strong>Desktop:</strong> {assignments.desktop
              ? presets.find(p => p.id === assignments.desktop)?.name
              : 'Single image fallback'}
          </p>
          <p>
            <strong>Mobile:</strong> {assignments.mobileSameAsDesktop
              ? 'Same as desktop'
              : (assignments.mobile
                ? presets.find(p => p.id === assignments.mobile)?.name
                : 'Single image fallback')}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

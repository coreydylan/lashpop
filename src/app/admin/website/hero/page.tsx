"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Image as ImageIcon, Move, Save, RefreshCw, Check, AlertCircle, Folder, Smartphone, Monitor } from 'lucide-react'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'

interface HeroImage {
  assetId: string
  url: string
  fileName: string
  position: { x: number; y: number }
  objectFit: 'cover' | 'contain'
}

type DeviceType = 'desktop' | 'mobile'

export default function HeroSectionEditor() {
  const [desktopImage, setDesktopImage] = useState<HeroImage | null>(null)
  const [mobileImage, setMobileImage] = useState<HeroImage | null>(null)
  const [availableImages, setAvailableImages] = useState<{ id: string; url: string; fileName: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktop')
  const [selectingFor, setSelectingFor] = useState<DeviceType>('desktop')

  // Get current image based on active device
  const currentImage = activeDevice === 'desktop' ? desktopImage : mobileImage
  const setCurrentImage = activeDevice === 'desktop' ? setDesktopImage : setMobileImage

  // Fetch saved settings
  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/website/hero-archway')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          if (data.settings.desktop) setDesktopImage(data.settings.desktop)
          if (data.settings.mobile) setMobileImage(data.settings.mobile)
        }
      }
    } catch (err) {
      console.error('Error fetching hero settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch available hero images from DAM
  const fetchHeroImages = useCallback(async () => {
    try {
      const response = await fetch('/api/dam/assets?tag=website:hero')
      if (response.ok) {
        const data = await response.json()
        setAvailableImages(data.assets || [])
      }
    } catch (err) {
      console.error('Error fetching hero images:', err)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchHeroImages()
  }, [fetchSettings, fetchHeroImages])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/website/hero-archway', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            desktop: desktopImage,
            mobile: mobileImage
          }
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving hero settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleImageSelect = (asset: Asset) => {
    const newImage: HeroImage = {
      assetId: asset.id,
      url: asset.filePath,
      fileName: asset.fileName,
      position: { x: 50, y: 50 },
      objectFit: 'cover'
    }

    if (selectingFor === 'desktop') {
      setDesktopImage(newImage)
    } else {
      setMobileImage(newImage)
    }
    setShowImagePicker(false)
  }

  const handleQuickSelect = (image: { id: string; url: string; fileName: string }) => {
    const newImage: HeroImage = {
      assetId: image.id,
      url: image.url,
      fileName: image.fileName,
      position: currentImage?.position || { x: 50, y: 50 },
      objectFit: currentImage?.objectFit || 'cover'
    }
    setCurrentImage(newImage)
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

  const openImagePicker = (device: DeviceType) => {
    setSelectingFor(device)
    setShowImagePicker(true)
  }

  // Copy desktop settings to mobile
  const copyDesktopToMobile = () => {
    if (desktopImage) {
      setMobileImage({ ...desktopImage })
    }
  }

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
              <p className="text-sm text-dune/60">Configure the above-the-fold arch image for desktop & mobile</p>
            </div>
          </div>
          <button
            onClick={handleSave}
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

      {/* Device Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
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

        {/* Copy desktop to mobile button */}
        {activeDevice === 'mobile' && desktopImage && (
          <button
            onClick={copyDesktopToMobile}
            className="ml-4 text-sm text-dusty-rose hover:text-terracotta transition-colors"
          >
            Copy from desktop
          </button>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Preview Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="order-2 lg:order-1"
        >
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <h3 className="font-serif text-lg text-dune mb-4">
              {activeDevice === 'desktop' ? 'Desktop' : 'Mobile'} Arch Preview
            </h3>

            {/* Arch-shaped preview container */}
            <div className={`relative mx-auto ${activeDevice === 'desktop' ? 'aspect-[3/4] max-h-[500px]' : 'aspect-[9/16] max-h-[600px]'}`}>
              <div
                className="absolute inset-0 overflow-hidden bg-warm-sand/50"
                style={{
                  borderRadius: activeDevice === 'desktop'
                    ? '120px 120px 0 0'
                    : '80px 80px 0 0',
                  maxWidth: activeDevice === 'desktop' ? '320px' : '280px',
                  margin: '0 auto'
                }}
              >
                {currentImage && currentImage.url ? (
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

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-mist/20 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Position Controls */}
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
        </motion.div>

        {/* Image Selection Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="order-1 lg:order-2"
        >
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-dune">
                Select {activeDevice === 'desktop' ? 'Desktop' : 'Mobile'} Image
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openImagePicker(activeDevice)}
                  className="btn btn-secondary text-sm"
                >
                  <Folder className="w-4 h-4" />
                  Browse DAM
                </button>
                <button
                  onClick={fetchHeroImages}
                  className="text-sm text-dune/60 hover:text-dune flex items-center gap-1 px-2 py-1"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick picks from tagged images */}
            {availableImages.length === 0 ? (
              <div className="p-8 bg-golden/10 rounded-2xl border border-golden/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-golden flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-dune font-medium">No hero images tagged yet</p>
                    <p className="text-xs text-dune/60 mt-1">
                      Click <strong>Browse DAM</strong> to pick any image, or tag images with <code className="bg-dune/10 px-1 rounded">Website: Hero</code> in the DAM for quick access.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-dune/50 mb-3">Quick picks (tagged with Website: Hero)</p>
                <div className="grid grid-cols-2 gap-3">
                  {availableImages.filter(img => img.url && img.url.length > 0).map((image) => (
                    <button
                      key={image.id}
                      onClick={() => handleQuickSelect(image)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                        currentImage?.assetId === image.id
                          ? 'border-dusty-rose shadow-lg scale-[1.02]'
                          : 'border-transparent hover:border-sage/30'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.fileName || 'Hero image option'}
                        fill
                        className="object-cover"
                      />
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

            {/* Currently selected */}
            {currentImage && (
              <div className="mt-4 p-3 rounded-xl bg-sage/5 border border-sage/10">
                <p className="text-xs text-dune/60 mb-1">Currently selected for {activeDevice}</p>
                <p className="text-sm text-dune font-medium truncate">{currentImage.fileName}</p>
              </div>
            )}

            <p className="text-xs text-dune/40 mt-4">
              Use <strong>Browse DAM</strong> to select any image from your media library, or tag images with <strong>Website: Hero</strong> for quick access here.
            </p>

            {/* Status of both images */}
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
        </motion.div>
      </div>

      {/* Mini DAM Explorer Modal */}
      <MiniDamExplorer
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleImageSelect}
        selectedAssetId={currentImage?.assetId}
        title={`Select ${selectingFor === 'desktop' ? 'Desktop' : 'Mobile'} Hero Image`}
        subtitle="Choose an image for the landing page arch"
      />
    </div>
  )
}

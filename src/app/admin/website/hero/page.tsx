"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Image as ImageIcon, Move, Save, RefreshCw, Check, AlertCircle } from 'lucide-react'

interface HeroImage {
  id: string
  url: string
  fileName: string
  width?: number
  height?: number
}

export default function HeroSectionEditor() {
  const [heroImage, setHeroImage] = useState<HeroImage | null>(null)
  const [availableImages, setAvailableImages] = useState<HeroImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })
  const [objectFit, setObjectFit] = useState<'cover' | 'contain'>('cover')

  useEffect(() => {
    fetchHeroImages()
  }, [])

  const fetchHeroImages = async () => {
    setLoading(true)
    try {
      // Fetch images tagged with website/hero
      const response = await fetch('/api/dam/assets?tag=website:hero')
      if (response.ok) {
        const data = await response.json()
        setAvailableImages(data.assets || [])
        if (data.assets?.length > 0 && !heroImage) {
          setHeroImage(data.assets[0])
        }
      }
    } catch (error) {
      console.error('Error fetching hero images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save hero settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving hero settings:', error)
    } finally {
      setSaving(false)
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
              <p className="text-sm text-dune/60">Configure the above-the-fold arch image</p>
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

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Preview Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="order-2 lg:order-1"
        >
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <h3 className="font-serif text-lg text-dune mb-4">Arch Preview</h3>
            
            {/* Arch-shaped preview container */}
            <div className="relative aspect-[3/4] max-h-[500px] mx-auto">
              <div 
                className="absolute inset-0 rounded-[120px_120px_0_0] overflow-hidden bg-warm-sand/50"
                style={{ maxWidth: '320px', margin: '0 auto' }}
              >
                {heroImage && heroImage.url ? (
                  <Image
                    src={heroImage.url}
                    alt="Hero preview"
                    fill
                    className="transition-all duration-300"
                    style={{
                      objectFit,
                      objectPosition: `${imagePosition.x}% ${imagePosition.y}%`
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
            {heroImage && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-dune/60">
                  <Move className="w-4 h-4" />
                  <span>Image Position</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider">
                      Horizontal: {imagePosition.x}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={imagePosition.x}
                      onChange={(e) => setImagePosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                      className="w-full mt-1 accent-dusty-rose"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider">
                      Vertical: {imagePosition.y}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={imagePosition.y}
                      onChange={(e) => setImagePosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                      className="w-full mt-1 accent-dusty-rose"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setObjectFit('cover')}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm transition-all ${
                      objectFit === 'cover' 
                        ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30' 
                        : 'bg-cream/50 text-dune/60 border border-sage/20'
                    }`}
                  >
                    Fill Arch
                  </button>
                  <button
                    onClick={() => setObjectFit('contain')}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm transition-all ${
                      objectFit === 'contain' 
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
              <h3 className="font-serif text-lg text-dune">Select Image</h3>
              <button
                onClick={fetchHeroImages}
                className="text-sm text-dune/60 hover:text-dune flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {availableImages.length === 0 ? (
              <div className="p-8 bg-golden/10 rounded-2xl border border-golden/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-golden flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-dune font-medium">No hero images found</p>
                    <p className="text-xs text-dune/60 mt-1">
                      Tag images with <code className="bg-dune/10 px-1 rounded">Website: Hero</code> in the DAM to make them available here.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableImages.filter(img => img.url && img.url.length > 0).map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setHeroImage(image)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      heroImage?.id === image.id
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
                    {heroImage?.id === image.id && (
                      <div className="absolute inset-0 bg-dusty-rose/20 flex items-center justify-center">
                        <Check className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-dune/40 mt-4">
              Images with the <strong>Website: Hero</strong> tag in the DAM will appear here. 
              Only 1 image should have this tag at a time.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


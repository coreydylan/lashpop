"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import Image from 'next/image'
import {
  Image as ImageIcon,
  Move,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Folder,
  Monitor,
  Smartphone,
  Trash2,
  Plus,
  GripVertical,
  Play,
  Pause,
  Settings2,
  Eye,
  EyeOff,
  Sliders,
  ChevronDown,
  ChevronRight,
  Shuffle,
  Clock,
  Layers,
  Sparkles,
  RotateCcw,
  Info,
  Scale,
  ArrowRightLeft,
  Timer
} from 'lucide-react'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'
import {
  HeroArchwayConfig,
  HeroArchwayImage,
  DeviceVariant,
  InitialAnimation,
  ScrollAnimation,
  AnimationType,
  AnimationEasing,
  ObjectFitType,
  defaultHeroArchwayConfig,
  defaultInitialAnimation,
  defaultScrollAnimation,
  createNewHeroImage
} from '@/types/hero-archway'

type DeviceMode = 'desktop' | 'mobile'

// Animation type options with labels
const animationTypes: Array<{ value: AnimationType; label: string; description: string }> = [
  { value: 'pan-zoom', label: 'Pan & Zoom', description: 'Classic Ken Burns effect' },
  { value: 'zoom-only', label: 'Zoom Only', description: 'Scale in or out' },
  { value: 'pan-only', label: 'Pan Only', description: 'Horizontal/vertical drift' },
  { value: 'parallax', label: 'Parallax', description: 'Scroll-driven movement' },
  { value: 'fade-in', label: 'Fade In', description: 'Simple opacity transition' },
  { value: 'none', label: 'None', description: 'No animation' }
]

// Easing presets with labels
const easingPresets: Array<{ value: AnimationEasing; label: string }> = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In/Out' },
  { value: 'power1.out', label: 'Power 1' },
  { value: 'power2.out', label: 'Power 2 (Default)' },
  { value: 'power3.out', label: 'Power 3' },
  { value: 'power4.out', label: 'Power 4' },
  { value: 'back.out', label: 'Back (Overshoot)' },
  { value: 'elastic.out', label: 'Elastic' }
]

// Random mode options
const randomModes: Array<{ value: HeroArchwayConfig['randomMode']; label: string; description: string }> = [
  { value: 'per-page-load', label: 'Per Page Load', description: 'New random image each page view' },
  { value: 'per-session', label: 'Per Session', description: 'Same image for entire session' },
  { value: 'time-based', label: 'Time Based', description: 'Rotates on interval' },
  { value: 'disabled', label: 'Disabled', description: 'Always show first image' }
]

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children
}: {
  title: string
  icon: React.ElementType
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-sage/20 rounded-2xl overflow-hidden bg-cream/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-warm-sand/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-dusty-rose/20 to-terracotta/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-terracotta" />
          </div>
          <span className="font-medium text-dune">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-dune/50" />
        ) : (
          <ChevronRight className="w-5 h-5 text-dune/50" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-sage/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Slider Input Component
function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  helpText
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  unit?: string
  helpText?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-dune/60 uppercase tracking-wider">{label}</label>
        <span className="text-sm font-medium text-dune">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-dusty-rose"
      />
      {helpText && (
        <p className="text-[10px] text-dune/40">{helpText}</p>
      )}
    </div>
  )
}

// Image Card Component for the bank
function ImageBankCard({
  image,
  isSelected,
  onSelect,
  onToggleEnabled,
  onUpdateWeight,
  onUpdatePosition,
  onUpdateObjectFit,
  onRemove
}: {
  image: HeroArchwayImage
  isSelected: boolean
  onSelect: () => void
  onToggleEnabled: () => void
  onUpdateWeight: (weight: number) => void
  onUpdatePosition: (pos: { x: number; y: number }) => void
  onUpdateObjectFit: (fit: ObjectFitType) => void
  onRemove: () => void
}) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <Reorder.Item value={image} id={image.id}>
      <motion.div
        layout
        className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
          isSelected
            ? 'border-dusty-rose shadow-lg ring-2 ring-dusty-rose/20'
            : image.enabled
              ? 'border-sage/20 hover:border-sage/40'
              : 'border-dune/10 opacity-50'
        }`}
      >
        {/* Drag Handle */}
        <div className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing">
          <div className="w-6 h-6 rounded-lg bg-dune/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Image */}
        <button
          onClick={onSelect}
          className="relative aspect-square w-full"
        >
          <Image
            src={image.url}
            alt={image.fileName}
            fill
            className="object-cover"
            style={{
              objectPosition: `${image.position.x}% ${image.position.y}%`
            }}
          />

          {/* Disabled overlay */}
          {!image.enabled && (
            <div className="absolute inset-0 bg-cream/60 flex items-center justify-center">
              <EyeOff className="w-6 h-6 text-dune/40" />
            </div>
          )}

          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute inset-0 bg-dusty-rose/20 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-dusty-rose flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {/* Weight badge */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-dune/70 backdrop-blur-sm text-white text-xs font-medium">
            {image.weight}x
          </div>
        </button>

        {/* Controls */}
        <div className="p-2 bg-cream/80 border-t border-sage/10">
          <div className="flex items-center justify-between">
            <button
              onClick={onToggleEnabled}
              className={`p-1.5 rounded-lg transition-colors ${
                image.enabled
                  ? 'bg-ocean-mist/20 text-ocean-mist'
                  : 'bg-sage/10 text-dune/40'
              }`}
              title={image.enabled ? 'Disable' : 'Enable'}
            >
              {image.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition-colors ${
                showSettings
                  ? 'bg-dusty-rose/20 text-dusty-rose'
                  : 'bg-sage/10 text-dune/60 hover:text-dune'
              }`}
              title="Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg bg-sage/10 text-dune/60 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Expanded Settings */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3 border-t border-sage/10 mt-2">
                  {/* Weight */}
                  <SliderInput
                    label="Weight"
                    value={image.weight}
                    onChange={onUpdateWeight}
                    min={1}
                    max={10}
                    unit="x"
                    helpText="Higher weight = more likely to appear"
                  />

                  {/* Position X */}
                  <SliderInput
                    label="Position X"
                    value={image.position.x}
                    onChange={(x) => onUpdatePosition({ ...image.position, x })}
                    min={0}
                    max={100}
                    unit="%"
                  />

                  {/* Position Y */}
                  <SliderInput
                    label="Position Y"
                    value={image.position.y}
                    onChange={(y) => onUpdatePosition({ ...image.position, y })}
                    min={0}
                    max={100}
                    unit="%"
                  />

                  {/* Object Fit */}
                  <div className="space-y-1">
                    <label className="text-xs text-dune/60 uppercase tracking-wider">Fit Mode</label>
                    <div className="flex gap-1">
                      {(['cover', 'contain', 'fill'] as ObjectFitType[]).map((fit) => (
                        <button
                          key={fit}
                          onClick={() => onUpdateObjectFit(fit)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs transition-all ${
                            image.objectFit === fit
                              ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                              : 'bg-cream border border-sage/20 text-dune/60'
                          }`}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Reorder.Item>
  )
}

export default function HeroArchwayEditor() {
  // Config state
  const [config, setConfig] = useState<HeroArchwayConfig>(defaultHeroArchwayConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // UI state
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  // Get current device variant
  const currentVariant = config[deviceMode]
  const setCurrentVariant = (updater: (prev: DeviceVariant) => DeviceVariant) => {
    setConfig(prev => ({
      ...prev,
      [deviceMode]: updater(prev[deviceMode])
    }))
    setHasChanges(true)
  }

  // Fetch configuration
  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/website/hero-archway')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching hero archway config:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // Save configuration
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/website/hero-archway', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })

      if (response.ok) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error saving hero archway config:', error)
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return

    try {
      const response = await fetch('/api/admin/website/hero-archway', {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Error resetting config:', error)
    }
  }

  // Handle image selection from DAM
  const handleImageSelect = (asset: Asset) => {
    const newImage = createNewHeroImage(asset.id, asset.filePath, asset.fileName)
    setCurrentVariant(prev => ({
      ...prev,
      images: [...prev.images, newImage]
    }))
    setSelectedImageId(newImage.id)
    setShowImagePicker(false)
  }

  // Update image in bank
  const updateImage = (imageId: string, updates: Partial<HeroArchwayImage>) => {
    setCurrentVariant(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.id === imageId ? { ...img, ...updates } : img
      )
    }))
  }

  // Remove image from bank
  const removeImage = (imageId: string) => {
    setCurrentVariant(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }))
    if (selectedImageId === imageId) {
      setSelectedImageId(null)
    }
  }

  // Reorder images
  const handleReorder = (newOrder: HeroArchwayImage[]) => {
    setCurrentVariant(prev => ({
      ...prev,
      images: newOrder
    }))
  }

  // Update initial animation
  const updateInitialAnimation = (updates: Partial<InitialAnimation>) => {
    setCurrentVariant(prev => ({
      ...prev,
      initialAnimation: { ...prev.initialAnimation, ...updates }
    }))
  }

  // Update scroll animation
  const updateScrollAnimation = (updates: Partial<ScrollAnimation>) => {
    setCurrentVariant(prev => ({
      ...prev,
      scrollAnimation: { ...prev.scrollAnimation, ...updates }
    }))
  }

  // Get selected image for preview
  const selectedImage = currentVariant.images.find(img => img.id === selectedImageId)
  const previewImage = selectedImage || currentVariant.images[0]

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
        className="mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dusty-rose/30 to-terracotta/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <h1 className="h2 text-dune">Hero Archway</h1>
              <p className="text-sm text-dune/60">Configure the above-the-fold arch image and animations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="btn btn-secondary text-sm"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} ${
                !hasChanges ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : hasChanges ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Device Mode Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="glass rounded-2xl p-1 inline-flex border border-sage/20">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              deviceMode === 'desktop'
                ? 'bg-dusty-rose/20 text-dune shadow-sm'
                : 'text-dune/60 hover:text-dune'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Desktop
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              deviceMode === 'mobile'
                ? 'bg-dusty-rose/20 text-dune shadow-sm'
                : 'text-dune/60 hover:text-dune'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Mobile
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column - Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Image Bank Section */}
          <CollapsibleSection title="Image Bank" icon={Layers}>
            <div className="space-y-4">
              {/* Random Mode Settings */}
              <div className="p-3 rounded-xl bg-warm-sand/30 border border-sage/10">
                <div className="flex items-center gap-2 mb-3">
                  <Shuffle className="w-4 h-4 text-terracotta" />
                  <span className="text-sm font-medium text-dune">Random Selection Mode</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {randomModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => {
                        setConfig(prev => ({ ...prev, randomMode: mode.value }))
                        setHasChanges(true)
                      }}
                      className={`p-2 rounded-lg text-left transition-all ${
                        config.randomMode === mode.value
                          ? 'bg-dusty-rose/20 border border-dusty-rose/30'
                          : 'bg-cream border border-sage/20 hover:border-sage/40'
                      }`}
                    >
                      <div className="text-xs font-medium text-dune">{mode.label}</div>
                      <div className="text-[10px] text-dune/50">{mode.description}</div>
                    </button>
                  ))}
                </div>

                {config.randomMode === 'time-based' && (
                  <div className="mt-3">
                    <SliderInput
                      label="Rotation Interval"
                      value={config.rotationInterval || 60}
                      onChange={(val) => {
                        setConfig(prev => ({ ...prev, rotationInterval: val }))
                        setHasChanges(true)
                      }}
                      min={5}
                      max={240}
                      step={5}
                      unit=" min"
                    />
                  </div>
                )}
              </div>

              {/* Image Grid */}
              {currentVariant.images.length === 0 ? (
                <div className="p-8 bg-golden/10 rounded-2xl border border-golden/20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-golden/20 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-golden" />
                    </div>
                    <div>
                      <p className="text-sm text-dune font-medium">No images added yet</p>
                      <p className="text-xs text-dune/60 mt-1">
                        Add images to the {deviceMode} image bank to get started
                      </p>
                    </div>
                    <button
                      onClick={() => setShowImagePicker(true)}
                      className="btn btn-primary mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Images
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-dune/50">
                      {currentVariant.images.length} image{currentVariant.images.length !== 1 ? 's' : ''} in {deviceMode} bank
                    </p>
                    <button
                      onClick={() => setShowImagePicker(true)}
                      className="btn btn-secondary text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Add More
                    </button>
                  </div>

                  <Reorder.Group
                    axis="y"
                    values={currentVariant.images}
                    onReorder={handleReorder}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {currentVariant.images.map((image) => (
                      <ImageBankCard
                        key={image.id}
                        image={image}
                        isSelected={selectedImageId === image.id}
                        onSelect={() => setSelectedImageId(image.id)}
                        onToggleEnabled={() => updateImage(image.id, { enabled: !image.enabled })}
                        onUpdateWeight={(weight) => updateImage(image.id, { weight })}
                        onUpdatePosition={(position) => updateImage(image.id, { position })}
                        onUpdateObjectFit={(objectFit) => updateImage(image.id, { objectFit })}
                        onRemove={() => removeImage(image.id)}
                      />
                    ))}
                  </Reorder.Group>
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Initial Animation Section */}
          <CollapsibleSection title="Entry Animation" icon={Sparkles} defaultOpen={false}>
            <div className="space-y-4">
              {/* Animation Type */}
              <div className="space-y-2">
                <label className="text-xs text-dune/60 uppercase tracking-wider">Animation Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {animationTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateInitialAnimation({ type: type.value })}
                      className={`p-2 rounded-xl text-left transition-all ${
                        currentVariant.initialAnimation.type === type.value
                          ? 'bg-dusty-rose/20 border border-dusty-rose/30'
                          : 'bg-cream border border-sage/20 hover:border-sage/40'
                      }`}
                    >
                      <div className="text-xs font-medium text-dune">{type.label}</div>
                      <div className="text-[10px] text-dune/50">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {currentVariant.initialAnimation.type !== 'none' && (
                <>
                  {/* Duration */}
                  <SliderInput
                    label="Duration"
                    value={currentVariant.initialAnimation.duration}
                    onChange={(duration) => updateInitialAnimation({ duration })}
                    min={0}
                    max={10}
                    step={0.5}
                    unit="s"
                  />

                  {/* Easing */}
                  <div className="space-y-1">
                    <label className="text-xs text-dune/60 uppercase tracking-wider">Easing</label>
                    <select
                      value={currentVariant.initialAnimation.easing}
                      onChange={(e) => updateInitialAnimation({ easing: e.target.value as AnimationEasing })}
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-sage/20 text-sm text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
                    >
                      {easingPresets.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Scale Settings */}
                  {(currentVariant.initialAnimation.type === 'pan-zoom' ||
                    currentVariant.initialAnimation.type === 'zoom-only') && (
                    <div className="p-3 rounded-xl bg-warm-sand/30 border border-sage/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-terracotta" />
                        <span className="text-xs font-medium text-dune">Scale</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <SliderInput
                          label="Start Scale"
                          value={currentVariant.initialAnimation.startScale}
                          onChange={(startScale) => updateInitialAnimation({ startScale })}
                          min={0.8}
                          max={2}
                          step={0.1}
                          unit="x"
                        />
                        <SliderInput
                          label="End Scale"
                          value={currentVariant.initialAnimation.endScale}
                          onChange={(endScale) => updateInitialAnimation({ endScale })}
                          min={0.8}
                          max={2}
                          step={0.1}
                          unit="x"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pan Settings */}
                  {(currentVariant.initialAnimation.type === 'pan-zoom' ||
                    currentVariant.initialAnimation.type === 'pan-only') && (
                    <div className="p-3 rounded-xl bg-warm-sand/30 border border-sage/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-terracotta" />
                        <span className="text-xs font-medium text-dune">Pan Position</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <SliderInput
                          label="Start X"
                          value={currentVariant.initialAnimation.startX}
                          onChange={(startX) => updateInitialAnimation({ startX })}
                          min={-50}
                          max={50}
                          unit="%"
                        />
                        <SliderInput
                          label="End X"
                          value={currentVariant.initialAnimation.endX}
                          onChange={(endX) => updateInitialAnimation({ endX })}
                          min={-50}
                          max={50}
                          unit="%"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <SliderInput
                          label="Start Y"
                          value={currentVariant.initialAnimation.startY}
                          onChange={(startY) => updateInitialAnimation({ startY })}
                          min={-50}
                          max={50}
                          unit="%"
                        />
                        <SliderInput
                          label="End Y"
                          value={currentVariant.initialAnimation.endY}
                          onChange={(endY) => updateInitialAnimation({ endY })}
                          min={-50}
                          max={50}
                          unit="%"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Scroll Animation Section */}
          <CollapsibleSection title="Scroll Animation" icon={Timer} defaultOpen={false}>
            <div className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-warm-sand/30 border border-sage/10">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-terracotta" />
                  <span className="text-sm font-medium text-dune">Enable Scroll Animation</span>
                </div>
                <button
                  onClick={() => updateScrollAnimation({ enabled: !currentVariant.scrollAnimation.enabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    currentVariant.scrollAnimation.enabled
                      ? 'bg-dusty-rose'
                      : 'bg-sage/30'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      currentVariant.scrollAnimation.enabled
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {currentVariant.scrollAnimation.enabled && (
                <>
                  {/* Trigger Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-dune/60 uppercase tracking-wider">Trigger Start</label>
                      <input
                        type="text"
                        value={currentVariant.scrollAnimation.triggerStart}
                        onChange={(e) => updateScrollAnimation({ triggerStart: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-cream border border-sage/20 text-sm text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
                        placeholder="top center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-dune/60 uppercase tracking-wider">Trigger End</label>
                      <input
                        type="text"
                        value={currentVariant.scrollAnimation.triggerEnd}
                        onChange={(e) => updateScrollAnimation({ triggerEnd: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-cream border border-sage/20 text-sm text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
                        placeholder="bottom top"
                      />
                    </div>
                  </div>

                  {/* Scrub Intensity */}
                  <SliderInput
                    label="Scrub Smoothness"
                    value={currentVariant.scrollAnimation.scrubIntensity}
                    onChange={(scrubIntensity) => updateScrollAnimation({ scrubIntensity })}
                    min={0}
                    max={5}
                    step={0.5}
                    helpText="Higher = smoother, more delayed. 1 = direct"
                  />

                  {/* Pin Settings */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentVariant.scrollAnimation.pin}
                        onChange={(e) => updateScrollAnimation({ pin: e.target.checked })}
                        className="w-4 h-4 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose/30"
                      />
                      <span className="text-sm text-dune">Pin Container</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentVariant.scrollAnimation.pinSpacing}
                        onChange={(e) => updateScrollAnimation({ pinSpacing: e.target.checked })}
                        className="w-4 h-4 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose/30"
                      />
                      <span className="text-sm text-dune">Pin Spacing</span>
                    </label>
                  </div>

                  {/* End Position */}
                  <div className="grid grid-cols-2 gap-4">
                    <SliderInput
                      label="End X Position"
                      value={currentVariant.scrollAnimation.endX}
                      onChange={(endX) => updateScrollAnimation({ endX })}
                      min={-50}
                      max={50}
                      unit="%"
                    />
                    <SliderInput
                      label="End Scale"
                      value={currentVariant.scrollAnimation.endScale}
                      onChange={(endScale) => updateScrollAnimation({ endScale })}
                      min={0.8}
                      max={2}
                      step={0.1}
                      unit="x"
                    />
                  </div>

                  {/* Fade Overlay */}
                  <div className="p-3 rounded-xl bg-warm-sand/30 border border-sage/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-terracotta" />
                        <span className="text-xs font-medium text-dune">Fade Overlay</span>
                      </div>
                      <button
                        onClick={() => updateScrollAnimation({ fadeOverlay: !currentVariant.scrollAnimation.fadeOverlay })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          currentVariant.scrollAnimation.fadeOverlay
                            ? 'bg-dusty-rose'
                            : 'bg-sage/30'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            currentVariant.scrollAnimation.fadeOverlay
                              ? 'translate-x-5'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {currentVariant.scrollAnimation.fadeOverlay && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <SliderInput
                          label="Fade Start"
                          value={currentVariant.scrollAnimation.fadeStart}
                          onChange={(fadeStart) => updateScrollAnimation({ fadeStart })}
                          min={0}
                          max={1000}
                          step={50}
                          unit="px"
                        />
                        <SliderInput
                          label="Fade End"
                          value={currentVariant.scrollAnimation.fadeEnd}
                          onChange={(fadeEnd) => updateScrollAnimation({ fadeEnd })}
                          min={0}
                          max={1000}
                          step={50}
                          unit="px"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Arch Styling Section */}
          <CollapsibleSection title="Arch Styling" icon={Settings2} defaultOpen={false}>
            <div className="space-y-4">
              {/* Border Radius */}
              <div className="space-y-1">
                <label className="text-xs text-dune/60 uppercase tracking-wider">Border Radius</label>
                <input
                  type="text"
                  value={currentVariant.archBorderRadius}
                  onChange={(e) => setCurrentVariant(prev => ({ ...prev, archBorderRadius: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-sage/20 text-sm text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 font-mono"
                  placeholder="200px 200px 0 0"
                />
                <p className="text-[10px] text-dune/40">CSS border-radius value (top-left, top-right, bottom-right, bottom-left)</p>
              </div>

              {/* Arch Height */}
              <div className="space-y-1">
                <label className="text-xs text-dune/60 uppercase tracking-wider">Arch Height</label>
                <input
                  type="text"
                  value={currentVariant.archHeight}
                  onChange={(e) => setCurrentVariant(prev => ({ ...prev, archHeight: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-sage/20 text-sm text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 font-mono"
                  placeholder="85vh"
                />
                <p className="text-[10px] text-dune/40">CSS height value (e.g., 85vh, 100dvh, 600px)</p>
              </div>

              {/* Overlay Gradient */}
              <div className="space-y-1">
                <label className="text-xs text-dune/60 uppercase tracking-wider">Overlay Gradient (Optional)</label>
                <input
                  type="text"
                  value={currentVariant.overlayGradient || ''}
                  onChange={(e) => setCurrentVariant(prev => ({ ...prev, overlayGradient: e.target.value || undefined }))}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-sage/20 text-sm text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 font-mono"
                  placeholder="linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 100%)"
                />
                <p className="text-[10px] text-dune/40">CSS gradient for image overlay</p>
              </div>
            </div>
          </CollapsibleSection>
        </motion.div>

        {/* Right Column - Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <div className="sticky top-24 space-y-4">
            <div className="glass rounded-3xl p-6 border border-sage/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-dune">Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                    className={`p-2 rounded-xl transition-colors ${
                      isPreviewPlaying
                        ? 'bg-dusty-rose/20 text-dusty-rose'
                        : 'bg-sage/10 text-dune/60 hover:text-dune'
                    }`}
                    title={isPreviewPlaying ? 'Pause animation' : 'Play animation'}
                  >
                    {isPreviewPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Arch Preview Container */}
              <div
                className={`relative mx-auto overflow-hidden transition-all ${
                  deviceMode === 'mobile' ? 'max-w-[200px]' : 'max-w-[320px]'
                }`}
                style={{
                  aspectRatio: deviceMode === 'mobile' ? '9/16' : '3/4',
                  borderRadius: currentVariant.archBorderRadius,
                  backgroundColor: 'rgb(230, 218, 196)'
                }}
              >
                {previewImage ? (
                  <>
                    <motion.div
                      className="absolute inset-0"
                      initial={isPreviewPlaying ? {
                        scale: currentVariant.initialAnimation.startScale,
                        x: `${currentVariant.initialAnimation.startX}%`,
                        y: `${currentVariant.initialAnimation.startY}%`
                      } : false}
                      animate={isPreviewPlaying ? {
                        scale: currentVariant.initialAnimation.endScale,
                        x: `${currentVariant.initialAnimation.endX}%`,
                        y: `${currentVariant.initialAnimation.endY}%`
                      } : undefined}
                      transition={isPreviewPlaying ? {
                        duration: currentVariant.initialAnimation.duration,
                        ease: 'easeOut'
                      } : undefined}
                      key={isPreviewPlaying ? 'playing' : 'paused'}
                    >
                      <Image
                        src={previewImage.url}
                        alt={previewImage.fileName}
                        fill
                        className="object-cover"
                        style={{
                          objectFit: previewImage.objectFit,
                          objectPosition: `${previewImage.position.x}% ${previewImage.position.y}%`
                        }}
                      />
                    </motion.div>

                    {/* Overlay gradient */}
                    {currentVariant.overlayGradient && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: currentVariant.overlayGradient }}
                      />
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-dune/40">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No image selected</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Info */}
              {previewImage && (
                <div className="mt-4 p-3 rounded-xl bg-sage/5 border border-sage/10">
                  <p className="text-xs text-dune/60 mb-1">Previewing</p>
                  <p className="text-sm text-dune font-medium truncate">{previewImage.fileName}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-dune/50">
                    <span>Pos: {previewImage.position.x}%, {previewImage.position.y}%</span>
                    <span>•</span>
                    <span>Fit: {previewImage.objectFit}</span>
                    <span>•</span>
                    <span>Weight: {previewImage.weight}x</span>
                  </div>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="p-4 rounded-2xl bg-ocean-mist/10 border border-ocean-mist/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-ocean-mist flex-shrink-0 mt-0.5" />
                <div className="text-xs text-dune/70 space-y-1">
                  <p><strong>Image Bank:</strong> Add multiple images and set weights for random selection on each page load.</p>
                  <p><strong>Entry Animation:</strong> Plays once when the page loads.</p>
                  <p><strong>Scroll Animation:</strong> Responds to user scrolling.</p>
                  <p><strong>Device Variants:</strong> Configure different images and animations for desktop vs mobile.</p>
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
        title={`Add ${deviceMode === 'desktop' ? 'Desktop' : 'Mobile'} Hero Image`}
        subtitle="Select images for the archway background"
        filterTags={['website:hero']}
      />
    </div>
  )
}

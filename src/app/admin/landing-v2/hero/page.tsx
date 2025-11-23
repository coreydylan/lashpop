"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Image as ImageIcon, Move, ZoomIn, RotateCw, Link as LinkIcon } from "lucide-react"
import Image from "next/image"

interface HeroConfig {
  archAssetId: string | null
  archImageUrl: string | null
  imagePosition: {
    x: number
    y: number
    scale: number
    rotation: number
  }
  heading: string
  tagline: string
  description: string
  location: string
  trustIndicators: Array<{
    label: string
    value: string
    icon?: string
  }>
  primaryCta: {
    text: string
    url: string
    variant: string
  }
  secondaryCta: {
    text: string
    url: string
    variant: string
  }
}

export default function HeroSectionEditor() {
  const [config, setConfig] = useState<HeroConfig>({
    archAssetId: null,
    archImageUrl: "/lashpop-images/hero-arch-placeholder.jpg",
    imagePosition: {
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0
    },
    heading: "Welcome to Lashpop",
    tagline: "Newport Beach's Premier Lash Studio",
    description: "Expert lash extensions and beauty services",
    location: "Newport Beach, CA",
    trustIndicators: [
      { label: "Years Experience", value: "10+", icon: "trophy" },
      { label: "Happy Clients", value: "5000+", icon: "heart" },
      { label: "5-Star Reviews", value: "500+", icon: "star" }
    ],
    primaryCta: {
      text: "Book Now",
      url: "/booking",
      variant: "primary"
    },
    secondaryCta: {
      text: "Discover Your Look",
      url: "#services",
      variant: "secondary"
    }
  })

  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showDamPicker, setShowDamPicker] = useState(false)

  const handleImagePositionChange = (field: string, value: number) => {
    setConfig({
      ...config,
      imagePosition: {
        ...config.imagePosition,
        [field]: value
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Implement API call to save config
      const response = await fetch("/api/admin/landing-v2/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        alert("Hero section saved successfully!")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving hero config:", error)
      alert("Failed to save hero section")
    } finally {
      setSaving(false)
    }
  }

  const openDamPicker = () => {
    setShowDamPicker(true)
    // TODO: Integrate with DAM to select images with 'website/hero-arch' tag
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-dune">Hero Section Editor</h2>
          <p className="text-sm text-dune/60 mt-1">Configure the above-the-fold hero section</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Image & Positioning */}
        <div className="space-y-6">
          {/* Arch Image Selection */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4">Arch Image</h3>

            {/* Image Preview with Arch Overlay */}
            <div className="relative w-full aspect-[4/3] bg-dune/5 rounded-2xl overflow-hidden mb-4">
              {config.archImageUrl && (
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${config.imagePosition.x - 50}%, ${config.imagePosition.y - 50}%) scale(${config.imagePosition.scale}) rotate(${config.imagePosition.rotation}deg)`,
                    transformOrigin: "center"
                  }}
                >
                  <Image
                    src={config.archImageUrl}
                    alt="Hero arch image"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Arch SVG Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  <defs>
                    <mask id="arch-mask">
                      <rect width="400" height="300" fill="white" />
                      <path
                        d="M 50 300 L 50 150 Q 50 50, 200 50 Q 350 50, 350 150 L 350 300 Z"
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect width="400" height="300" fill="rgba(0,0,0,0.3)" mask="url(#arch-mask)" />
                  <path
                    d="M 50 300 L 50 150 Q 50 50, 200 50 Q 350 50, 350 150 L 350 300"
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              </div>

              {!config.archImageUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-dune/40">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No image selected</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={openDamPicker}
              className="w-full px-4 py-2 bg-dusty-rose/10 text-dusty-rose border border-dusty-rose/30 rounded-full hover:bg-dusty-rose/20 transition-all font-light text-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Choose from DAM</span>
              </div>
            </button>
          </div>

          {/* Image Positioning Controls */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4 flex items-center gap-2">
              <Move className="w-5 h-5" />
              Image Positioning
            </h3>

            <div className="space-y-4">
              {/* X Position */}
              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span>Horizontal Position</span>
                  <span className="font-mono text-xs text-dune/60">{config.imagePosition.x}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.imagePosition.x}
                  onChange={(e) => handleImagePositionChange("x", Number(e.target.value))}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>

              {/* Y Position */}
              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span>Vertical Position</span>
                  <span className="font-mono text-xs text-dune/60">{config.imagePosition.y}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.imagePosition.y}
                  onChange={(e) => handleImagePositionChange("y", Number(e.target.value))}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>

              {/* Scale */}
              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" />
                    Scale
                  </span>
                  <span className="font-mono text-xs text-dune/60">{config.imagePosition.scale}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={config.imagePosition.scale}
                  onChange={(e) => handleImagePositionChange("scale", Number(e.target.value))}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>

              {/* Rotation */}
              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Rotation
                  </span>
                  <span className="font-mono text-xs text-dune/60">{config.imagePosition.rotation}°</span>
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={config.imagePosition.rotation}
                  onChange={(e) => handleImagePositionChange("rotation", Number(e.target.value))}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>

              <button
                onClick={() => setConfig({
                  ...config,
                  imagePosition: { x: 50, y: 50, scale: 1, rotation: 0 }
                })}
                className="w-full px-4 py-2 bg-dune/10 text-dune/80 rounded-full hover:bg-dune/20 transition-all font-light text-sm"
              >
                Reset Position
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="space-y-6">
          {/* Text Content */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4">Hero Content</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dune/80 mb-2">Location</label>
                <input
                  type="text"
                  value={config.location}
                  onChange={(e) => setConfig({ ...config, location: e.target.value })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all"
                  placeholder="Newport Beach, CA"
                />
              </div>

              <div>
                <label className="block text-sm text-dune/80 mb-2">Main Heading</label>
                <input
                  type="text"
                  value={config.heading}
                  onChange={(e) => setConfig({ ...config, heading: e.target.value })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all"
                  placeholder="Welcome to Lashpop"
                />
              </div>

              <div>
                <label className="block text-sm text-dune/80 mb-2">Tagline</label>
                <input
                  type="text"
                  value={config.tagline}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all"
                  placeholder="Newport Beach's Premier Lash Studio"
                />
              </div>

              <div>
                <label className="block text-sm text-dune/80 mb-2">Description</label>
                <textarea
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all resize-none"
                  placeholder="Expert lash extensions and beauty services"
                />
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Call-to-Action Buttons
            </h3>

            <div className="space-y-4">
              {/* Primary CTA */}
              <div className="p-4 bg-cream/50 rounded-2xl border border-sage/10">
                <div className="text-sm font-medium text-dune/80 mb-3">Primary Button</div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={config.primaryCta.text}
                    onChange={(e) => setConfig({
                      ...config,
                      primaryCta: { ...config.primaryCta, text: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none"
                    placeholder="Button text"
                  />
                  <input
                    type="text"
                    value={config.primaryCta.url}
                    onChange={(e) => setConfig({
                      ...config,
                      primaryCta: { ...config.primaryCta, url: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none"
                    placeholder="URL or path"
                  />
                </div>
              </div>

              {/* Secondary CTA */}
              <div className="p-4 bg-cream/50 rounded-2xl border border-sage/10">
                <div className="text-sm font-medium text-dune/80 mb-3">Secondary Button</div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={config.secondaryCta.text}
                    onChange={(e) => setConfig({
                      ...config,
                      secondaryCta: { ...config.secondaryCta, text: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none"
                    placeholder="Button text"
                  />
                  <input
                    type="text"
                    value={config.secondaryCta.url}
                    onChange={(e) => setConfig({
                      ...config,
                      secondaryCta: { ...config.secondaryCta, url: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none"
                    placeholder="URL or path"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4">Trust Indicators</h3>
            <div className="space-y-3">
              {config.trustIndicators.map((indicator, index) => (
                <div key={index} className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={indicator.value}
                    onChange={(e) => {
                      const newIndicators = [...config.trustIndicators]
                      newIndicators[index].value = e.target.value
                      setConfig({ ...config, trustIndicators: newIndicators })
                    }}
                    className="px-3 py-2 bg-cream/50 border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none"
                    placeholder="Value"
                  />
                  <input
                    type="text"
                    value={indicator.label}
                    onChange={(e) => {
                      const newIndicators = [...config.trustIndicators]
                      newIndicators[index].label = e.target.value
                      setConfig({ ...config, trustIndicators: newIndicators })
                    }}
                    className="px-3 py-2 bg-cream/50 border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none"
                    placeholder="Label"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

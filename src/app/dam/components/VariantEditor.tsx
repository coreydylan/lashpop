"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { X, RotateCcw, Wand2, Square, ZoomIn, ZoomOut, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import type {
  VariantEditorProps,
  CropData,
  SafeZone
} from "@/types/social-variants-ui"

interface Point {
  x: number
  y: number
}

export function VariantEditor({
  variant,
  sourceImage,
  open,
  onClose,
  onSave
}: VariantEditorProps) {
  const [cropData, setCropData] = useState<CropData>(variant.cropData)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const [qualityScore, setQualityScore] = useState(variant.qualityScore)

  // Mock safe zones (in real implementation, these would come from AI detection)
  const [safeZones] = useState<SafeZone[]>([
    {
      elementType: "face",
      visibility: 100,
      status: "perfect",
      message: "Face fully visible"
    },
    {
      elementType: "logo",
      visibility: 85,
      status: "warning",
      message: "Logo 85% visible"
    }
  ])

  // Calculate crop quality based on safe zones
  const calculateQuality = useCallback((crop: CropData): number => {
    // Simple quality calculation
    // In real implementation, this would use AI to analyze the crop
    let score = 100

    // Penalize for cutting off safe zones
    safeZones.forEach(zone => {
      if (zone.visibility < 100) {
        score -= (100 - zone.visibility) * 0.5
      }
    })

    return Math.max(0, Math.min(100, Math.floor(score)))
  }, [safeZones])

  // Update quality when crop changes
  useEffect(() => {
    const newQuality = calculateQuality(cropData)
    setQualityScore(newQuality)
  }, [cropData, calculateQuality])

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const point = 'touches' in e ? {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    } : {
      x: e.clientX,
      y: e.clientY
    }

    setDragStart(point)
  }, [])

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const point = 'touches' in e ? {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    } : {
      x: e.clientX,
      y: e.clientY
    }

    const deltaX = point.x - dragStart.x
    const deltaY = point.y - dragStart.y

    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Convert pixel deltas to percentage
    const deltaXPercent = (deltaX / containerWidth) * 100
    const deltaYPercent = (deltaY / containerHeight) * 100

    setCropData(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaXPercent)),
      y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaYPercent))
    }))

    setDragStart(point)
  }, [isDragging, dragStart])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Set up global drag listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove)
      window.addEventListener('touchend', handleDragEnd)

      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
        window.removeEventListener('touchmove', handleDragMove)
        window.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(3, prev + 0.25))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.5, prev - 0.25))
  }, [])

  // Reset crop
  const handleReset = useCallback(() => {
    setCropData(variant.cropData)
    setZoom(1)
  }, [variant.cropData])

  // Auto-fix (center the crop)
  const handleAutoFix = useCallback(() => {
    setCropData({
      x: (100 - cropData.width) / 2,
      y: (100 - cropData.height) / 2,
      width: cropData.width,
      height: cropData.height,
      scale: 1
    })
  }, [cropData.width, cropData.height])

  // Switch to letterbox mode (would trigger regeneration in real implementation)
  const handleSwitchToLetterbox = useCallback(() => {
    // In real implementation, this would trigger regeneration with letterbox mode
    alert("This would regenerate the variant with letterbox mode")
  }, [])

  // Save changes
  const handleSave = useCallback(() => {
    onSave(cropData)
  }, [cropData, onSave])

  if (!open) return null

  const aspectRatio = variant.width / variant.height

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />

          {/* Editor Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-dune/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-cream/10">
                <div>
                  <h2 className="text-2xl font-bold text-cream">Edit Crop</h2>
                  <p className="text-sm text-cream/70 mt-1">
                    {variant.displayName} • {variant.width} × {variant.height}px
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-cream/10 hover:bg-cream/20 transition-colors flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-cream" />
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-col lg:flex-row h-[calc(95vh-180px)]">
                {/* Preview Area */}
                <div className="flex-1 p-8 flex items-center justify-center bg-black/30">
                  <div
                    ref={containerRef}
                    className="relative max-w-4xl max-h-full w-full"
                    style={{
                      aspectRatio: `${variant.width} / ${variant.height}`
                    }}
                  >
                    {/* Source Image */}
                    <div className="relative w-full h-full overflow-hidden rounded-xl">
                      <img
                        src={sourceImage}
                        alt="Source"
                        className="w-full h-full object-contain"
                        style={{
                          transform: `scale(${zoom})`,
                          transformOrigin: 'center'
                        }}
                        draggable={false}
                      />

                      {/* Crop Box Overlay */}
                      <div
                        className="absolute border-4 border-dusty-rose cursor-move"
                        style={{
                          left: `${cropData.x}%`,
                          top: `${cropData.y}%`,
                          width: `${cropData.width}%`,
                          height: `${cropData.height}%`,
                          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                        }}
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                      >
                        {/* Crop Box Grid */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div
                              key={i}
                              className="border border-cream/30"
                            />
                          ))}
                        </div>

                        {/* Corner Handles */}
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-dusty-rose rounded-full border-2 border-cream" />
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-dusty-rose rounded-full border-2 border-cream" />
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-dusty-rose rounded-full border-2 border-cream" />
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-dusty-rose rounded-full border-2 border-cream" />
                      </div>

                      {/* Safe Zone Overlays */}
                      {/* Face detection box (example) */}
                      <div
                        className="absolute border-2 border-green-500/60 bg-green-500/10 pointer-events-none"
                        style={{
                          left: '30%',
                          top: '20%',
                          width: '25%',
                          height: '35%'
                        }}
                      >
                        <div className="absolute -top-6 left-0 text-xs text-green-500 font-semibold bg-black/60 px-2 py-1 rounded">
                          Face
                        </div>
                      </div>

                      {/* Logo detection box (example) */}
                      <div
                        className="absolute border-2 border-yellow-500/60 bg-yellow-500/10 pointer-events-none"
                        style={{
                          right: '15%',
                          bottom: '15%',
                          width: '15%',
                          height: '15%'
                        }}
                      >
                        <div className="absolute -top-6 left-0 text-xs text-yellow-500 font-semibold bg-black/60 px-2 py-1 rounded whitespace-nowrap">
                          Logo (85%)
                        </div>
                      </div>
                    </div>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button
                        onClick={handleZoomOut}
                        className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-colors flex items-center justify-center"
                        aria-label="Zoom out"
                      >
                        <ZoomOut className="w-5 h-5 text-cream" />
                      </button>
                      <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-cream text-sm font-semibold flex items-center">
                        {Math.round(zoom * 100)}%
                      </div>
                      <button
                        onClick={handleZoomIn}
                        className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-colors flex items-center justify-center"
                        aria-label="Zoom in"
                      >
                        <ZoomIn className="w-5 h-5 text-cream" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-96 bg-cream/5 backdrop-blur-sm p-6 space-y-6 overflow-y-auto">
                  {/* Quality Score */}
                  <div className="bg-cream/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-cream">Crop Quality</h3>
                      <div className={clsx(
                        "text-2xl font-bold",
                        qualityScore >= 90 ? "text-green-400" :
                        qualityScore >= 70 ? "text-yellow-400" :
                        "text-red-400"
                      )}>
                        {qualityScore}/100
                      </div>
                    </div>
                    <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          "h-full transition-all",
                          qualityScore >= 90 ? "bg-green-500" :
                          qualityScore >= 70 ? "bg-yellow-500" :
                          "bg-red-500"
                        )}
                        style={{ width: `${qualityScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Safe Zones Checklist */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cream">Safe Zones</h3>
                    {safeZones.map((zone, idx) => {
                      const Icon = zone.status === "perfect" ? CheckCircle :
                                   zone.status === "warning" ? AlertTriangle :
                                   XCircle

                      const iconColor = zone.status === "perfect" ? "text-green-500" :
                                       zone.status === "warning" ? "text-yellow-500" :
                                       "text-red-500"

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-cream/10 rounded-xl"
                        >
                          <Icon className={clsx("w-5 h-5 flex-shrink-0 mt-0.5", iconColor)} />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-cream capitalize">
                              {zone.elementType} ({zone.visibility}% visible)
                            </div>
                            {zone.message && (
                              <div className="text-xs text-cream/70 mt-1">
                                {zone.message}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cream">Suggestions</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-sm text-cream/90">
                        Shift left 50px to include full logo
                      </div>
                      <div className="p-3 bg-cream/10 rounded-xl text-sm text-cream/70">
                        Alternative: Use letterbox mode to preserve full image
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-cream/10">
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-3 rounded-xl bg-cream/10 hover:bg-cream/20 transition-colors text-cream font-semibold flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                    <button
                      onClick={handleAutoFix}
                      className="w-full px-4 py-3 rounded-xl bg-dusty-rose/80 hover:bg-dusty-rose transition-colors text-cream font-semibold flex items-center justify-center gap-2"
                    >
                      <Wand2 className="w-4 h-4" />
                      Auto-Fix
                    </button>
                    <button
                      onClick={handleSwitchToLetterbox}
                      className="w-full px-4 py-3 rounded-xl bg-cream/10 hover:bg-cream/20 transition-colors text-cream font-semibold flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Switch to Letterbox
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-8 py-6 border-t border-cream/10 bg-black/20">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-cream/70 hover:bg-cream/10 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-8 py-2.5 rounded-full bg-dusty-rose hover:bg-dusty-rose/90 text-cream font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

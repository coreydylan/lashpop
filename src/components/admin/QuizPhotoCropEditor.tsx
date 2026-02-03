"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, useId } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn, ZoomOut, Save, RotateCcw } from "lucide-react"

interface CropData {
  x: number // 0-100 percentage (center point)
  y: number // 0-100 percentage (center point)
  scale: number // zoom multiplier (higher = tighter crop / smaller box)
}

interface QuizPhotoCropEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cropData: CropData) => void
  imageUrl: string
  initialCrop?: CropData
  photoName?: string
}

const SCALE_LIMITS = {
  min: 0.5,
  max: 2.5
}

// Base width of the square crop box as percentage of container width
const BASE_WIDTH_PERCENT = 70

const DEFAULT_CROP: CropData = {
  x: 50,
  y: 50,
  scale: 1.0
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

// Calculate crop box dimensions based on scale and image aspect ratio
const getCropBox = (crop: CropData, imageAspect: number) => {
  // The crop box is a square, so aspect ratio is 1:1
  // widthPercent is the percentage of the image width the square covers
  const widthPercent = clamp(BASE_WIDTH_PERCENT / crop.scale, 15, 95)
  // For a square, heightPercent = widthPercent * imageAspect (to maintain square in image coordinates)
  const heightPercent = widthPercent * imageAspect

  return {
    widthPercent,
    heightPercent
  }
}

// Clamp crop position to keep crop box within image bounds
const clampCropToBounds = (crop: CropData, imageAspect: number): CropData => {
  const normalizedScale = clamp(crop.scale, SCALE_LIMITS.min, SCALE_LIMITS.max)
  const { widthPercent, heightPercent } = getCropBox({ ...crop, scale: normalizedScale }, imageAspect)

  const halfWidth = widthPercent / 2
  const halfHeight = heightPercent / 2

  return {
    x: clamp(crop.x, halfWidth, 100 - halfWidth),
    y: clamp(crop.y, halfHeight, 100 - halfHeight),
    scale: normalizedScale
  }
}

export function QuizPhotoCropEditor({
  isOpen,
  onClose,
  onSave,
  imageUrl,
  initialCrop,
  photoName
}: QuizPhotoCropEditorProps) {
  const [crop, setCrop] = useState<CropData>(initialCrop || DEFAULT_CROP)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageAspect, setImageAspect] = useState(1)
  const [isImageReady, setIsImageReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const maskId = useId().replace(/:/g, "")

  const safeAspect = useMemo(() => (imageAspect > 0 ? imageAspect : 1), [imageAspect])

  // Reset crop when modal opens with new image
  useEffect(() => {
    if (isOpen) {
      setCrop(initialCrop || DEFAULT_CROP)
      setIsImageReady(false)
    }
  }, [isOpen, initialCrop, imageUrl])

  // Clamp crop when aspect ratio changes
  useEffect(() => {
    setCrop(prev => clampCropToBounds(prev, safeAspect))
  }, [safeAspect])

  // Track container size
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        setContainerSize(prev => {
          if (prev.width === width && prev.height === height) return prev
          return { width, height }
        })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [isOpen])

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageAspect(naturalWidth / naturalHeight)
      setIsImageReady(true)
    }
  }

  const getRelativePercentages = (clientX: number, clientY: number) => {
    if (!containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    return {
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100)
    }
  }

  const updateCrop = (updater: (prev: CropData) => CropData) => {
    setCrop(prev => clampCropToBounds(updater(prev), safeAspect))
  }

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return
    const coords = getRelativePercentages(e.clientX, e.clientY)
    if (!coords) return
    updateCrop(prev => ({ ...prev, x: coords.x, y: coords.y }))
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const coords = getRelativePercentages(e.clientX, e.clientY)
    if (!coords) return
    updateCrop(prev => ({ ...prev, x: coords.x, y: coords.y }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomChange = (scale: number) => {
    updateCrop(prev => ({ ...prev, scale: clamp(scale, SCALE_LIMITS.min, SCALE_LIMITS.max) }))
  }

  const handleReset = () => {
    setCrop(clampCropToBounds(initialCrop || DEFAULT_CROP, safeAspect))
  }

  const handleSave = () => {
    onSave(crop)
  }

  // Calculate the crop box overlay for display
  const cropBox = useMemo(() => getCropBox(crop, safeAspect), [crop, safeAspect])

  const cropOverlay = useMemo(() => {
    if (!containerSize.width || !containerSize.height) return null

    // Calculate box size - force square by using smaller dimension
    const widthPx = (cropBox.widthPercent / 100) * containerSize.width
    const heightPx = (cropBox.heightPercent / 100) * containerSize.height
    const boxSize = Math.min(widthPx, heightPx)

    const centerX = (crop.x / 100) * containerSize.width
    const centerY = (crop.y / 100) * containerSize.height

    return {
      size: boxSize,
      centerX,
      centerY,
      left: centerX - boxSize / 2,
      top: centerY - boxSize / 2
    }
  }, [containerSize, cropBox, crop])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dune/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-sage/10 shrink-0">
              <div>
                <h2 className="font-serif text-lg text-dune">Crop Photo</h2>
                {photoName && (
                  <p className="text-xs text-dune/60 truncate max-w-[300px]">{photoName}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-sage/10 hover:bg-sage/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-dune/60" />
              </button>
            </div>

            {/* Crop Preview */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="bg-dune/5 rounded-2xl p-3 mb-3">
                <p className="text-xs text-dune/60 text-center mb-3">
                  Click or drag to position the crop. The square shows the cropped area.
                </p>

                <div
                  ref={containerRef}
                  className="relative w-full max-w-[400px] max-h-[350px] mx-auto bg-dune/10 rounded-xl overflow-hidden cursor-crosshair"
                  style={{ aspectRatio: `${safeAspect}` }}
                  onClick={handleContainerClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Image - full size, preserves aspect ratio */}
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Crop preview"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    draggable={false}
                    onLoad={handleImageLoad}
                  />

                  {/* Crop overlay */}
                  {cropOverlay && isImageReady && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <mask id={`${maskId}-crop`}>
                          <rect width="100%" height="100%" fill="white" />
                          <rect
                            x={cropOverlay.left}
                            y={cropOverlay.top}
                            width={cropOverlay.size}
                            height={cropOverlay.size}
                            rx={12}
                            ry={12}
                            fill="black"
                          />
                        </mask>
                      </defs>
                      {/* Dark overlay outside crop area */}
                      <rect
                        width="100%"
                        height="100%"
                        fill="rgba(62, 50, 41, 0.5)"
                        mask={`url(#${maskId}-crop)`}
                      />
                      {/* Crop border */}
                      <rect
                        x={cropOverlay.left}
                        y={cropOverlay.top}
                        width={cropOverlay.size}
                        height={cropOverlay.size}
                        rx={12}
                        ry={12}
                        fill="none"
                        stroke="rgba(205, 168, 158, 0.9)"
                        strokeWidth={3}
                      />
                    </svg>
                  )}

                  {/* Focus point indicator at crop center */}
                  {isImageReady && cropOverlay && (
                    <div
                      className="absolute w-6 h-6 pointer-events-none"
                      style={{
                        left: cropOverlay.centerX,
                        top: cropOverlay.centerY,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/80" style={{ transform: 'translateY(-50%)' }} />
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/80" style={{ transform: 'translateX(-50%)' }} />
                      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-dusty-rose rounded-full" style={{ transform: 'translate(-50%, -50%)' }} />
                    </div>
                  )}

                  {!isImageReady && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-3 border-dusty-rose border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="bg-warm-sand/20 rounded-xl p-3">
                <label className="text-xs font-medium text-dune/60 uppercase tracking-wider mb-2 block text-center">
                  Crop Size
                </label>
                <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
                  <button
                    onClick={() => handleZoomChange(crop.scale - 0.1)}
                    disabled={crop.scale <= SCALE_LIMITS.min}
                    className="btn bg-white hover:bg-sage/10 text-dune px-3 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <div className="flex-1">
                    <input
                      type="range"
                      min={SCALE_LIMITS.min}
                      max={SCALE_LIMITS.max}
                      step={0.05}
                      value={crop.scale}
                      onChange={(e) => handleZoomChange(Number(e.target.value))}
                      className="w-full accent-dusty-rose h-2 cursor-pointer"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-sage/70">Wide</span>
                      <span className="text-xs font-semibold text-dune">×{crop.scale.toFixed(1)}</span>
                      <span className="text-[10px] text-sage/70">Tight</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleZoomChange(crop.scale + 0.1)}
                    disabled={crop.scale >= SCALE_LIMITS.max}
                    className="btn bg-white hover:bg-sage/10 text-dune px-3 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t border-sage/10 bg-cream/30 shrink-0">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-dune/60 hover:text-dune hover:bg-sage/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-dune/60 hover:text-dune hover:bg-sage/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isImageReady}
                  className="btn btn-primary"
                >
                  <Save className="w-4 h-4" />
                  Save Crop
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

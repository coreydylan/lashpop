"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, useId } from "react"
import { Sparkles, ZoomIn, ZoomOut } from "lucide-react"

interface CropData {
  x: number // 0-100 percentage of width (center point)
  y: number // 0-100 percentage of height (center point)
  scale: number // zoom multiplier (higher = tighter crop)
}

interface PhotoCropEditorProps {
  imageUrl: string
  onSave: (crops: {
    fullVertical: CropData
    fullHorizontal: CropData
    mediumCircle: CropData
    closeUpCircle: CropData
    square: CropData
  }) => void
}

type CropType = "fullVertical" | "fullHorizontal" | "mediumCircle" | "closeUpCircle" | "square"

const CROP_CONFIGS = {
  fullVertical: { label: "Full Vertical", aspect: 3 / 4, shape: "rect" as const },
  fullHorizontal: { label: "Full Horizontal", aspect: 16 / 9, shape: "rect" as const },
  square: { label: "Square", aspect: 1 / 1, shape: "rect" as const },
  mediumCircle: { label: "Medium Circle", aspect: 1 / 1, shape: "circle" as const },
  closeUpCircle: { label: "Close-Up Circle", aspect: 1 / 1, shape: "circle" as const }
}

const SCALE_LIMITS = {
  min: 0.7,
  max: 2.4
}

const BASE_WIDTH_PERCENT: Record<CropType, number> = {
  fullVertical: 48,
  fullHorizontal: 96,
  square: 72,
  mediumCircle: 60,
  closeUpCircle: 44
}

const MIN_WIDTH_PERCENT: Record<CropType, number> = {
  fullVertical: 30,
  fullHorizontal: 62,
  square: 38,
  mediumCircle: 24,
  closeUpCircle: 16
}

// Face offset from top of crop frame (0 = top, 0.5 = center, 1 = bottom)
const FACE_OFFSET_FROM_TOP: Record<CropType, number> = {
  closeUpCircle: 0.5,    // Face at center of circle
  mediumCircle: 0.33,    // Face in top 1/3 of circle
  square: 0.33,          // Face in top 1/3 of square
  fullHorizontal: 0.33,  // Face in top 1/3 of frame
  fullVertical: 0.33     // Face in top 1/3 of frame
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const generateSuggestedCrops = (faceCenterX: number, faceCenterY: number, imageAspect: number): Record<CropType, CropData> => {
  const safeFaceX = clamp(faceCenterX, 8, 92)
  const safeFaceY = clamp(faceCenterY, 8, 92)

  const crops: Record<CropType, CropData> = {} as Record<CropType, CropData>

  // Generate crops for each type
  ;(Object.keys(CROP_CONFIGS) as CropType[]).forEach((type) => {
    const scale = type === 'fullVertical' || type === 'fullHorizontal' ? 0.7 :
                  type === 'mediumCircle' ? 0.8 :
                  type === 'square' ? 1.0 :
                  0.9 // closeUpCircle

    // Calculate crop frame height to determine offset
    const { heightPercent } = getCropBox(type, { x: 50, y: 50, scale }, imageAspect)

    // Apply face offset: crop.y = faceCenterY + cropHeight * (0.5 - offset)
    const offset = FACE_OFFSET_FROM_TOP[type]
    const cropY = safeFaceY + heightPercent * (0.5 - offset)

    crops[type] = {
      x: safeFaceX,
      y: cropY,
      scale
    }
  })

  return crops
}

const DEFAULT_CROPS: Record<CropType, CropData> = {
  fullVertical: { x: 50, y: 66.67, scale: 0.7 },
  fullHorizontal: { x: 54, y: 42, scale: 0.7 },
  square: { x: 50, y: 50, scale: 1.0 },
  mediumCircle: { x: 50, y: 36, scale: 0.8 },
  closeUpCircle: { x: 50, y: 34, scale: 0.9 }
}

const cloneDefaultCrops = (): Record<CropType, CropData> =>
  (Object.keys(DEFAULT_CROPS) as CropType[]).reduce((acc, type) => {
    acc[type] = { ...DEFAULT_CROPS[type] }
    return acc
  }, {} as Record<CropType, CropData>)

const getCropBox = (type: CropType, crop: CropData, imageAspect: number) => {
  const config = CROP_CONFIGS[type]
  const baseWidth = BASE_WIDTH_PERCENT[type]
  const widthLimitFromHeight = Math.min(100, Math.max(10, (config.aspect / imageAspect) * 100))
  const effectiveMax = Math.max(widthLimitFromHeight, 12)
  const effectiveMin = Math.min(MIN_WIDTH_PERCENT[type], effectiveMax)

  const widthPercent = clamp(baseWidth / crop.scale, effectiveMin, effectiveMax)
  const heightPercent = widthPercent * (imageAspect / config.aspect)

  return {
    widthPercent,
    heightPercent
  }
}

const clampCropToBounds = (type: CropType, crop: CropData, imageAspect: number): CropData => {
  const normalizedScale = clamp(crop.scale, SCALE_LIMITS.min, SCALE_LIMITS.max)
  const { widthPercent, heightPercent } = getCropBox(type, { ...crop, scale: normalizedScale }, imageAspect)

  const halfWidth = widthPercent / 2
  const halfHeight = heightPercent / 2

  return {
    x: clamp(crop.x, halfWidth, 100 - halfWidth),
    y: clamp(crop.y, halfHeight, 100 - halfHeight),
    scale: normalizedScale
  }
}

export function PhotoCropEditor({ imageUrl, onSave }: PhotoCropEditorProps) {
  const [selectedCrop, setSelectedCrop] = useState<CropType>("closeUpCircle")
  const [faceCenterX, setFaceCenterX] = useState(50)
  const [faceCenterY, setFaceCenterY] = useState(32)
  const [hasSuggestedCrops, setHasSuggestedCrops] = useState(false)
  const [crops, setCrops] = useState<Record<CropType, CropData>>(() => cloneDefaultCrops())

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageAspect, setImageAspect] = useState(1)
  const [isImageReady, setIsImageReady] = useState(false)
  const [isDraggingMarker, setIsDraggingMarker] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const safeAspect = useMemo(() => (imageAspect > 0 ? imageAspect : 1), [imageAspect])
  const maskId = useId().replace(/:/g, "")

  const updateCrop = (type: CropType, updater: (prev: CropData) => CropData) => {
    setCrops((prev) => {
      const next = { ...prev, [type]: clampCropToBounds(type, updater(prev[type]), safeAspect) }
      return next
    })
  }

  useEffect(() => {
    setCrops((prev) => {
      const next = { ...prev }
      ;(Object.keys(next) as CropType[]).forEach((type) => {
        next[type] = clampCropToBounds(type, next[type], safeAspect)
      })
      return next
    })
  }, [safeAspect])

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

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

  const handleMarkerDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingMarker(true)
  }

  const handleMarkerDrag = (e: React.MouseEvent) => {
    if (!isDraggingMarker) return
    const coords = getRelativePercentages(e.clientX, e.clientY)
    if (!coords) return
    setFaceCenterX(coords.x)
    setFaceCenterY(coords.y)
    setHasSuggestedCrops(false)
  }

  const handleMarkerDragEnd = () => {
    setIsDraggingMarker(false)
  }

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingMarker) return
    const coords = getRelativePercentages(e.clientX, e.clientY)
    if (!coords) return

    if (!hasSuggestedCrops) {
      setFaceCenterX(coords.x)
      setFaceCenterY(coords.y)
      setHasSuggestedCrops(false)
      return
    }

    updateCrop(selectedCrop, (prev) => ({ ...prev, x: coords.x, y: coords.y }))
  }

  const handleLoadSuggestedCrops = () => {
    const suggested = generateSuggestedCrops(faceCenterX, faceCenterY, safeAspect)
    setCrops((prev) => {
      const next = { ...prev }
      ;(Object.keys(suggested) as CropType[]).forEach((type) => {
        next[type] = clampCropToBounds(type, suggested[type], safeAspect)
      })
      return next
    })
    setHasSuggestedCrops(true)
  }

  const updateCropZoom = (type: CropType, scale: number) => {
    const clampedScale = clamp(scale, SCALE_LIMITS.min, SCALE_LIMITS.max)
    updateCrop(type, (prev) => ({ ...prev, scale: clampedScale }))
  }

  const handleZoomIn = () => {
    updateCropZoom(selectedCrop, crops[selectedCrop].scale + 0.1)
  }

  const handleZoomOut = () => {
    updateCropZoom(selectedCrop, crops[selectedCrop].scale - 0.1)
  }

  const config = CROP_CONFIGS[selectedCrop]
  const crop = crops[selectedCrop]
  const cropBox = useMemo(() => getCropBox(selectedCrop, crop, safeAspect), [selectedCrop, crop, safeAspect])
  const cropOverlay = useMemo(() => {
    if (!hasSuggestedCrops || !containerSize.width || !containerSize.height) return null
    const widthPx = (cropBox.widthPercent / 100) * containerSize.width
    const heightPx = (cropBox.heightPercent / 100) * containerSize.height
    const centerX = (crop.x / 100) * containerSize.width
    const centerY = (crop.y / 100) * containerSize.height
    return {
      widthPx,
      heightPx,
      centerX,
      centerY,
      left: centerX - widthPx / 2,
      top: centerY - heightPx / 2
    }
  }, [containerSize, cropBox, crop, hasSuggestedCrops])

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-sage/10 arch-full p-4 text-center space-y-1.5">
        {!hasSuggestedCrops ? (
          <p className="text-sm text-dune font-medium">
            <span className="font-semibold">Step 1:</span> Drop the <span className="text-dusty-rose">+</span> marker on the center of the face to give the tool a reference point.
          </p>
        ) : (
          <>
            <p className="text-sm text-dune font-medium">
              <span className="font-semibold">Step 2:</span> Preview, click to reposition, and tweak zoom for each format.
            </p>
            <p className="text-xs text-sage font-medium">Tip: click anywhere on the photo to move the selected crop, then use the slider for tighter or wider framing.</p>
          </>
        )}
      </div>

      {/* Preview with Face Marker */}
      <div className="bg-warm-sand/20 arch-full p-5">
        <div
          ref={containerRef}
          className={`relative w-full max-w-[620px] mx-auto bg-dune/5 border border-warm-sand/40 overflow-hidden arch-full transition-shadow ${
            hasSuggestedCrops ? "cursor-pointer shadow-lg" : "cursor-crosshair shadow-sm"
          }`}
          style={{ aspectRatio: `${safeAspect}` }}
          onClick={handlePreviewClick}
          onMouseMove={!hasSuggestedCrops ? handleMarkerDrag : undefined}
          onMouseUp={!hasSuggestedCrops ? handleMarkerDragEnd : undefined}
          onMouseLeave={!hasSuggestedCrops ? handleMarkerDragEnd : undefined}
        >
          {/* Image - shows full image in native aspect ratio */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Crop preview"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
            onLoad={handleImageLoad}
          />

          {/* Overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {!hasSuggestedCrops ? (
              /* Step 1: Face Center Marker */
              <div
                className="absolute w-12 h-12 pointer-events-auto cursor-move"
                style={{
                  left: `${faceCenterX}%`,
                  top: `${faceCenterY}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseDown={handleMarkerDragStart}
                onClick={(event) => event.stopPropagation()}
              >
                {/* Large visible + marker */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-dusty-rose shadow-lg" style={{ transform: 'translateY(-50%)' }} />
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-dusty-rose shadow-lg" style={{ transform: 'translateX(-50%)' }} />
                </div>
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-dusty-rose rounded-full shadow-lg" style={{ transform: 'translate(-50%, -50%)' }} />
              </div>
            ) : (
              /* Step 2: Crop Preview overlay */
              <>
                {cropOverlay && (
                  <>
                    <svg
                      className="w-full h-full"
                      width={containerSize.width}
                      height={containerSize.height}
                      viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <mask id={`${maskId}-overlay`}>
                          <rect width="100%" height="100%" fill="white" />
                          {config.shape === "circle" ? (
                            <circle
                              cx={cropOverlay.centerX}
                              cy={cropOverlay.centerY}
                              r={Math.min(cropOverlay.widthPx, cropOverlay.heightPx) / 2}
                              fill="black"
                            />
                          ) : (
                            <rect
                              x={cropOverlay.left}
                              y={cropOverlay.top}
                              width={cropOverlay.widthPx}
                              height={cropOverlay.heightPx}
                              rx={14}
                              ry={14}
                              fill="black"
                            />
                          )}
                        </mask>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill="rgba(62, 50, 41, 0.55)"
                        mask={`url(#${maskId}-overlay)`}
                      />
                      {config.shape === "circle" ? (
                        <circle
                          cx={cropOverlay.centerX}
                          cy={cropOverlay.centerY}
                          r={Math.min(cropOverlay.widthPx, cropOverlay.heightPx) / 2}
                          fill="none"
                          stroke="rgba(205, 168, 158, 0.95)"
                          strokeWidth={3}
                        />
                      ) : (
                        <rect
                          x={cropOverlay.left}
                          y={cropOverlay.top}
                          width={cropOverlay.widthPx}
                          height={cropOverlay.heightPx}
                          rx={12}
                          ry={12}
                          fill="none"
                          stroke="rgba(205, 168, 158, 0.95)"
                          strokeWidth={3}
                        />
                      )}
                    </svg>
                    {/* Face center reference dot */}
                    <div
                      className="absolute w-2 h-2 bg-dusty-rose/60 rounded-full"
                      style={{
                        left: `${faceCenterX}%`,
                        top: `${faceCenterY}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  </>
                )}
              </>
            )}
          </div>

          {!isImageReady && (
            <div className="absolute inset-0 bg-cream/70 flex items-center justify-center text-sage font-medium text-sm tracking-wide">
              Loading photo…
            </div>
          )}
        </div>

      </div>

      {!hasSuggestedCrops ? (
        /* Step 1: Load Suggested Crops Button */
        <button
          onClick={handleLoadSuggestedCrops}
          disabled={!isImageReady}
          className="btn bg-sage text-cream w-full py-4 flex items-center justify-center gap-2 shadow-lg hover:bg-sage/90 disabled:opacity-60 disabled:cursor-not-allowed"
          title={!isImageReady ? "Photo is still loading" : undefined}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">{isImageReady ? "Generate Smart Crops" : "Preparing photo..."}</span>
        </button>
      ) : (
        /* Step 2: Crop Selection & Adjustment */
        <>
          {/* Crop Type Selector */}
          <div>
            <label className="text-sm font-medium text-dune mb-2 block">Preview Crop Format:</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CROP_CONFIGS) as CropType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedCrop(type)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedCrop === type
                      ? "bg-dusty-rose text-cream shadow-md"
                      : "bg-warm-sand/50 text-dune hover:bg-warm-sand"
                  }`}
                >
                  {CROP_CONFIGS[type].label}
                </button>
              ))}
            </div>
          </div>

          {/* Fine-tune Zoom Controls */}
          <div className="bg-warm-sand/20 arch-full p-4">
            <label className="text-sm font-medium text-dune mb-3 block text-center">
              Fine-tune {config.label} zoom:
            </label>
            <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
              <button
                onClick={handleZoomOut}
                disabled={crop.scale <= SCALE_LIMITS.min}
                className="btn bg-white hover:bg-warm-sand/30 text-dune px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={SCALE_LIMITS.min}
                  max={SCALE_LIMITS.max}
                  step={0.05}
                  value={crop.scale}
                  onChange={(e) => updateCropZoom(selectedCrop, Number(e.target.value))}
                  className="w-full accent-dusty-rose h-2 cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-sage/70">Wider</span>
                  <span className="text-sm font-semibold text-dune">Zoom ×{crop.scale.toFixed(1)}</span>
                  <span className="text-xs text-sage/70">Tighter</span>
                </div>
              </div>

              <button
                onClick={handleZoomIn}
                disabled={crop.scale >= SCALE_LIMITS.max}
                className="btn bg-white hover:bg-warm-sand/30 text-dune px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reset and Save Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setHasSuggestedCrops(false)
                setFaceCenterX(50)
                setFaceCenterY(32)
                setSelectedCrop("closeUpCircle")
                setCrops(cloneDefaultCrops())
              }}
              className="btn bg-warm-sand/50 text-dune px-6 py-3 hover:bg-warm-sand"
            >
              Reset
            </button>
            <button
              onClick={() => onSave(crops)}
              className="btn btn-primary flex-1 py-3"
            >
              Save All Crop Settings
            </button>
          </div>
        </>
      )}
    </div>
  )
}

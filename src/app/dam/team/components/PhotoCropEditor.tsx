"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from "react"
import { Sparkles, ZoomIn, ZoomOut } from "lucide-react"

interface CropData {
  x: number // 0-100 percentage
  y: number // 0-100 percentage
  scale: number // zoom level
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

// Suggested crop calculations based on face center position
const generateSuggestedCrops = (faceCenterX: number, faceCenterY: number): Record<CropType, CropData> => {
  return {
    // Full Vertical: Face at 33% from top (rule of thirds)
    fullVertical: {
      x: 50, // Centered horizontally
      y: 33, // Face in upper third
      scale: 1.0 // Show full body
    },
    // Full Horizontal: Face slightly right of center
    fullHorizontal: {
      x: 55, // Slightly right for dynamic composition
      y: 40, // Upper-middle
      scale: 1.0 // Wide shot
    },
    // Square: Centered composition
    square: {
      x: 50,
      y: 50,
      scale: 1.1 // Slightly tighter than full
    },
    // Medium Circle: Face in upper-middle for headshot
    mediumCircle: {
      x: 50,
      y: 35, // Face positioned nicely
      scale: 1.4 // Medium zoom
    },
    // Close-Up Circle: Tight on face based on user's marker
    closeUpCircle: {
      x: faceCenterX,
      y: faceCenterY,
      scale: 2.2 // Close crop on face
    }
  }
}

export function PhotoCropEditor({ imageUrl, onSave }: PhotoCropEditorProps) {
  const [selectedCrop, setSelectedCrop] = useState<CropType>("closeUpCircle")
  const [faceCenterX, setFaceCenterX] = useState(50)
  const [faceCenterY, setFaceCenterY] = useState(30)
  const [hasSuggestedCrops, setHasSuggestedCrops] = useState(false)
  const [crops, setCrops] = useState<Record<CropType, CropData>>({
    fullVertical: { x: 50, y: 33, scale: 1 },
    fullHorizontal: { x: 55, y: 40, scale: 1 },
    mediumCircle: { x: 50, y: 35, scale: 1.4 },
    closeUpCircle: { x: 50, y: 30, scale: 2.2 },
    square: { x: 50, y: 50, scale: 1.1 }
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageAspect, setImageAspect] = useState(1)
  const [isDraggingMarker, setIsDraggingMarker] = useState(false)

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageAspect(naturalWidth / naturalHeight)
    }
  }

  const handleMarkerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isDraggingMarker) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setFaceCenterX(Math.max(0, Math.min(100, x)))
    setFaceCenterY(Math.max(0, Math.min(100, y)))
    setHasSuggestedCrops(false) // Reset when marker moves
  }

  const handleMarkerDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingMarker(true)
  }

  const handleMarkerDrag = (e: React.MouseEvent) => {
    if (!isDraggingMarker || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setFaceCenterX(Math.max(0, Math.min(100, x)))
    setFaceCenterY(Math.max(0, Math.min(100, y)))
    setHasSuggestedCrops(false)
  }

  const handleMarkerDragEnd = () => {
    setIsDraggingMarker(false)
  }

  const handleLoadSuggestedCrops = () => {
    const suggested = generateSuggestedCrops(faceCenterX, faceCenterY)
    setCrops(suggested)
    setHasSuggestedCrops(true)
  }

  const updateCropZoom = (type: CropType, scale: number) => {
    const clampedScale = Math.max(0.5, Math.min(3, scale))
    setCrops((prev) => ({
      ...prev,
      [type]: { ...prev[type], scale: clampedScale }
    }))
  }

  const handleZoomIn = () => {
    updateCropZoom(selectedCrop, crops[selectedCrop].scale + 0.1)
  }

  const handleZoomOut = () => {
    updateCropZoom(selectedCrop, crops[selectedCrop].scale - 0.1)
  }

  const config = CROP_CONFIGS[selectedCrop]
  const crop = crops[selectedCrop]

  // Calculate crop box dimensions based on scale
  // For proper square crops, we need to use the smaller dimension of the image container
  const baseSize = 40 // Base percentage size

  // Calculate dimensions maintaining aspect ratio
  let cropWidth: number
  let cropHeight: number

  if (config.aspect > 1) {
    // Wider than tall (e.g., 16:9)
    cropWidth = baseSize * crop.scale
    cropHeight = (baseSize * crop.scale) / config.aspect
  } else if (config.aspect < 1) {
    // Taller than wide (e.g., 3:4)
    cropWidth = baseSize * crop.scale * config.aspect
    cropHeight = baseSize * crop.scale
  } else {
    // Square (1:1) - needs special handling to be truly square in the display
    const squareSize = baseSize * crop.scale
    cropWidth = squareSize
    cropHeight = squareSize
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-sage/10 arch-full p-4 text-center">
        <p className="text-sm text-dune font-medium">
          {!hasSuggestedCrops ? (
            <>
              <span className="font-bold">Step 1:</span> Click or drag the <span className="text-dusty-rose">+</span> marker to the center of the face
            </>
          ) : (
            <>
              <span className="font-bold">Step 2:</span> Preview and adjust crops • Select a crop below to fine-tune
            </>
          )}
        </p>
      </div>

      {/* Preview with Face Marker */}
      <div className="bg-warm-sand/20 arch-full p-8">
        <div
          ref={containerRef}
          className={`relative w-full max-w-2xl mx-auto bg-dune/5 overflow-hidden arch-full ${
            !hasSuggestedCrops ? 'cursor-crosshair' : ''
          }`}
          style={{ aspectRatio: imageAspect }}
          onClick={!hasSuggestedCrops ? handleMarkerClick : undefined}
          onMouseMove={handleMarkerDrag}
          onMouseUp={handleMarkerDragEnd}
          onMouseLeave={handleMarkerDragEnd}
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
              /* Step 2: Crop Preview */
              <>
                <svg className="w-full h-full">
                  <defs>
                    <mask id="cropMask">
                      <rect width="100%" height="100%" fill="white" />
                      {config.shape === "circle" ? (
                        <circle
                          cx={`${crop.x}%`}
                          cy={`${crop.y}%`}
                          r={`${cropHeight / 2}%`}
                          fill="black"
                        />
                      ) : (
                        <rect
                          x={`${crop.x - cropWidth / 2}%`}
                          y={`${crop.y - cropHeight / 2}%`}
                          width={`${cropWidth}%`}
                          height={`${cropHeight}%`}
                          fill="black"
                        />
                      )}
                    </mask>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(138, 124, 105, 0.7)"
                    mask="url(#cropMask)"
                  />
                </svg>

                {/* Crop border */}
                {config.shape === "circle" ? (
                  <svg className="w-full h-full">
                    <circle
                      cx={`${crop.x}%`}
                      cy={`${crop.y}%`}
                      r={`${cropHeight / 2}%`}
                      fill="none"
                      stroke="rgb(205, 168, 158)"
                      strokeWidth="3"
                      strokeDasharray="10,5"
                    />
                  </svg>
                ) : (
                  <div
                    className="absolute border-3 border-dashed border-dusty-rose"
                    style={{
                      left: `${crop.x - cropWidth / 2}%`,
                      top: `${crop.y - cropHeight / 2}%`,
                      width: `${cropWidth}%`,
                      height: `${cropHeight}%`
                    }}
                  />
                )}

                {/* Face center reference dot */}
                <div
                  className="absolute w-2 h-2 bg-dusty-rose/50 rounded-full"
                  style={{
                    left: `${faceCenterX}%`,
                    top: `${faceCenterY}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </>
            )}
          </div>
        </div>

      </div>

      {!hasSuggestedCrops ? (
        /* Step 1: Load Suggested Crops Button */
        <button
          onClick={handleLoadSuggestedCrops}
          className="btn bg-sage text-cream w-full py-4 flex items-center justify-center gap-2 shadow-lg hover:bg-sage/90"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Load Suggested Crops</span>
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
                disabled={crop.scale <= 0.5}
                className="btn bg-white hover:bg-warm-sand/30 text-dune px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={crop.scale}
                  onChange={(e) => updateCropZoom(selectedCrop, Number(e.target.value))}
                  className="w-full accent-dusty-rose h-2 cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-sage/70">Wider</span>
                  <span className="text-sm font-medium text-dune">{(crop.scale * 100).toFixed(0)}%</span>
                  <span className="text-xs text-sage/70">Tighter</span>
                </div>
              </div>

              <button
                onClick={handleZoomIn}
                disabled={crop.scale >= 3}
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
                setFaceCenterY(30)
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

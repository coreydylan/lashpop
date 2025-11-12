"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from "react"
import { ZoomIn, ZoomOut } from "lucide-react"

interface CropData {
  x: number // 0-100 percentage from center (always 50 - centered)
  y: number // 0-100 percentage from center (always 50 - centered)
  scale: number // 0.5-3 zoom level
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

export function PhotoCropEditor({ imageUrl, onSave }: PhotoCropEditorProps) {
  const [selectedCrop, setSelectedCrop] = useState<CropType>("closeUpCircle")
  const [crops, setCrops] = useState<Record<CropType, CropData>>({
    fullVertical: { x: 50, y: 50, scale: 1 },
    fullHorizontal: { x: 50, y: 50, scale: 1 },
    mediumCircle: { x: 50, y: 50, scale: 1.2 },
    closeUpCircle: { x: 50, y: 50, scale: 2 },
    square: { x: 50, y: 50, scale: 1 }
  })

  const imageRef = useRef<HTMLImageElement>(null)
  const [imageAspect, setImageAspect] = useState(1)

  const updateZoom = (type: CropType, scale: number) => {
    // Clamp scale to reasonable values
    const clampedScale = Math.max(0.5, Math.min(3, scale))

    setCrops((prev) => ({
      ...prev,
      [type]: { x: 50, y: 50, scale: clampedScale } // Always centered
    }))
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageAspect(naturalWidth / naturalHeight)
    }
  }

  const handleZoomIn = () => {
    updateZoom(selectedCrop, crops[selectedCrop].scale + 0.1)
  }

  const handleZoomOut = () => {
    updateZoom(selectedCrop, crops[selectedCrop].scale - 0.1)
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
      {/* Crop Type Selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CROP_CONFIGS) as CropType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedCrop(type)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedCrop === type
                ? "bg-dusty-rose text-cream"
                : "bg-warm-sand/50 text-dune hover:bg-warm-sand"
            }`}
          >
            {CROP_CONFIGS[type].label}
          </button>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="bg-warm-sand/20 arch-full p-4">
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
              onChange={(e) => updateZoom(selectedCrop, Number(e.target.value))}
              className="w-full accent-dusty-rose h-2 cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-sage/70">Zoom Out</span>
              <span className="text-sm font-medium text-dune">{(crop.scale * 100).toFixed(0)}%</span>
              <span className="text-xs text-sage/70">Zoom In</span>
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

      {/* Preview */}
      <div className="bg-warm-sand/20 arch-full p-8">
        <div
          className="relative w-full max-w-2xl mx-auto bg-dune/5 overflow-hidden arch-full"
          style={{ aspectRatio: imageAspect }}
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

          {/* Darkened overlay with crop cutout */}
          <div className="absolute inset-0 pointer-events-none">
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

            {/* Center crosshair */}
            <div
              className="absolute w-8 h-8 pointer-events-none"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-dusty-rose" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-dusty-rose" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-4">
          <p className="caption text-sage">
            Crop is centered • Use zoom controls above to adjust size
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={() => onSave(crops)}
        className="btn btn-primary w-full py-4"
      >
        Save All Crop Settings
      </button>
    </div>
  )
}

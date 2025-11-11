"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

interface CropData {
  x: number // 0-100 percentage from center
  y: number // 0-100 percentage from center
  scale: number // 0.5-2 crop box scale
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
  square: { label: "Square", aspect: 1, shape: "rect" as const },
  mediumCircle: { label: "Medium Circle", aspect: 1, shape: "circle" as const },
  closeUpCircle: { label: "Close-Up Circle", aspect: 1, shape: "circle" as const }
}

export function PhotoCropEditor({ imageUrl, onSave }: PhotoCropEditorProps) {
  const [selectedCrop, setSelectedCrop] = useState<CropType>("fullVertical")
  const [crops, setCrops] = useState<Record<CropType, CropData>>({
    fullVertical: { x: 50, y: 50, scale: 1 },
    fullHorizontal: { x: 50, y: 50, scale: 1 },
    mediumCircle: { x: 50, y: 50, scale: 1 },
    closeUpCircle: { x: 50, y: 50, scale: 1.5 },
    square: { x: 50, y: 50, scale: 1 }
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const updateCrop = (type: CropType, updates: Partial<CropData>) => {
    setCrops((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    // Convert pixel delta to percentage
    const deltaXPercent = (deltaX / rect.width) * 100
    const deltaYPercent = (deltaY / rect.height) * 100

    updateCrop(selectedCrop, {
      x: Math.max(0, Math.min(100, crops[selectedCrop].x + deltaXPercent)),
      y: Math.max(0, Math.min(100, crops[selectedCrop].y + deltaYPercent))
    })

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp)
      return () => window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const config = CROP_CONFIGS[selectedCrop]
  const crop = crops[selectedCrop]

  // Calculate crop box dimensions based on scale
  // Scale of 1 = box fills container, scale of 0.5 = box is half size
  const cropWidth = 50 * crop.scale * config.aspect // percentage
  const cropHeight = 50 * crop.scale // percentage

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

      {/* Preview */}
      <div className="bg-warm-sand/20 arch-full p-8">
        <div
          ref={containerRef}
          className={`relative w-full aspect-square max-w-2xl mx-auto bg-dune/5 overflow-hidden arch-full ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          {/* Image - fixed in place */}
          <img
            src={imageUrl}
            alt="Crop preview"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
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
            Drag to position • Use slider to adjust crop size
          </p>
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-4 max-w-md mx-auto">
          {/* Crop Size Slider */}
          <div>
            <label className="caption text-dune block mb-2">
              Crop Size: {(crop.scale * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={crop.scale}
              onChange={(e) =>
                updateCrop(selectedCrop, { scale: Number(e.target.value) })
              }
              className="w-full accent-dusty-rose"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-sage">Smaller (fits more)</span>
              <span className="text-xs text-sage">Larger (zoomed in)</span>
            </div>
          </div>

          {/* Position fine-tune */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="caption text-dune block mb-2">
                Horizontal: {crop.x.toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={crop.x}
                onChange={(e) =>
                  updateCrop(selectedCrop, { x: Number(e.target.value) })
                }
                className="w-full accent-dusty-rose"
              />
            </div>
            <div>
              <label className="caption text-dune block mb-2">
                Vertical: {crop.y.toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={crop.y}
                onChange={(e) =>
                  updateCrop(selectedCrop, { y: Number(e.target.value) })
                }
                className="w-full accent-dusty-rose"
              />
            </div>
          </div>
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

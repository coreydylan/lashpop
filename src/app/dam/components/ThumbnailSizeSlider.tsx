/**
 * Thumbnail Size Slider Component
 *
 * A beautiful, smooth slider for adjusting thumbnail size in the grid view.
 * Features smooth transitions, visual feedback, and responsive design.
 */

'use client'

import { useCallback, useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'

type ThumbnailSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ThumbnailSizeSliderProps {
  value: ThumbnailSize
  onChange: (size: ThumbnailSize) => void
  className?: string
}

const SIZE_VALUES: ThumbnailSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const SIZE_LABELS = {
  xs: 'XS',
  sm: 'S',
  md: 'M',
  lg: 'L',
  xl: 'XL'
}

export default function ThumbnailSizeSlider({ value, onChange, className = '' }: ThumbnailSizeSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const currentIndex = SIZE_VALUES.indexOf(localValue)

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(event.target.value)
    const newSize = SIZE_VALUES[newIndex]
    setLocalValue(newSize)
    onChange(newSize)
  }, [onChange])

  const handleDecrease = useCallback(() => {
    if (currentIndex > 0) {
      const newSize = SIZE_VALUES[currentIndex - 1]
      setLocalValue(newSize)
      onChange(newSize)
    }
  }, [currentIndex, onChange])

  const handleIncrease = useCallback(() => {
    if (currentIndex < SIZE_VALUES.length - 1) {
      const newSize = SIZE_VALUES[currentIndex + 1]
      setLocalValue(newSize)
      onChange(newSize)
    }
  }, [currentIndex, onChange])

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp)
      return () => window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseUp])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Decrease button */}
      <button
        onClick={handleDecrease}
        disabled={currentIndex === 0}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-warm-sand/40 hover:bg-warm-sand/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md active:scale-95"
        aria-label="Decrease thumbnail size"
      >
        <Minus className="w-4 h-4 text-charcoal/70" />
      </button>

      {/* Slider container */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-warm-sand/30 backdrop-blur-sm">
        {/* Size label */}
        <div className="text-xs font-medium text-charcoal/60 min-w-[20px] text-center">
          {SIZE_LABELS[localValue]}
        </div>

        {/* Custom styled slider */}
        <div className="relative w-32">
          <input
            type="range"
            min="0"
            max={SIZE_VALUES.length - 1}
            step="1"
            value={currentIndex}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            className="thumbnail-size-slider w-full h-2 bg-warm-sand/50 rounded-full appearance-none cursor-pointer transition-all duration-200"
            aria-label="Thumbnail size"
          />

          {/* Progress indicator */}
          <div
            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-dusty-rose/60 to-dusty-rose rounded-full pointer-events-none transition-all duration-300 ease-out"
            style={{
              width: `${(currentIndex / (SIZE_VALUES.length - 1)) * 100}%`,
              opacity: isDragging ? 1 : 0.8
            }}
          />

          {/* Tick marks */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[2px] pointer-events-none">
            {SIZE_VALUES.map((size, index) => (
              <div
                key={size}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  index <= currentIndex
                    ? 'bg-white shadow-sm'
                    : 'bg-warm-sand/80'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Visual size indicator - animated squares */}
        <div className="flex items-end gap-0.5 h-5">
          {SIZE_VALUES.map((size, index) => (
            <div
              key={size}
              className={`rounded-sm transition-all duration-300 ease-out ${
                index <= currentIndex
                  ? 'bg-dusty-rose'
                  : 'bg-warm-sand/50'
              }`}
              style={{
                width: '3px',
                height: `${((index + 1) / SIZE_VALUES.length) * 100}%`,
                opacity: index <= currentIndex ? 1 : 0.4,
                transform: isDragging && index === currentIndex ? 'scale(1.2)' : 'scale(1)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Increase button */}
      <button
        onClick={handleIncrease}
        disabled={currentIndex === SIZE_VALUES.length - 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-warm-sand/40 hover:bg-warm-sand/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md active:scale-95"
        aria-label="Increase thumbnail size"
      >
        <Plus className="w-4 h-4 text-charcoal/70" />
      </button>

      <style jsx>{`
        .thumbnail-size-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #D98880;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .thumbnail-size-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(217, 136, 128, 0.3);
        }

        .thumbnail-size-slider::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }

        .thumbnail-size-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #D98880;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .thumbnail-size-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(217, 136, 128, 0.3);
        }

        .thumbnail-size-slider::-moz-range-thumb:active {
          transform: scale(1.05);
        }

        .thumbnail-size-slider:focus {
          outline: none;
        }

        .thumbnail-size-slider:focus-visible::-webkit-slider-thumb {
          ring: 2px;
          ring-color: rgba(217, 136, 128, 0.5);
        }
      `}</style>
    </div>
  )
}

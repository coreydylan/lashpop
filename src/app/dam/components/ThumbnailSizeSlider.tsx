/**
 * Thumbnail Size Selector Component
 *
 * A minimal, elegant dropdown for adjusting thumbnail size in the grid view.
 * Features a magnifying glass icon with a hover dropdown showing size options.
 */

'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

type ThumbnailSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ThumbnailSizeSliderProps {
  value: ThumbnailSize
  onChange: (size: ThumbnailSize) => void
  className?: string
}

const SIZE_OPTIONS: { value: ThumbnailSize; label: string }[] = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' }
]

export default function ThumbnailSizeSlider({ value, onChange, className = '' }: ThumbnailSizeSliderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Magnifying glass button */}
      <button
        className="p-2 rounded-full transition-colors flex items-center justify-center hover:bg-dune/10"
        aria-label="Adjust thumbnail size"
      >
        <Search className="w-4 h-4 text-sage" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 right-0 bg-cream rounded-xl shadow-xl border border-sage/20 overflow-hidden z-50"
          style={{
            minWidth: '100px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                value === option.value
                  ? 'bg-dusty-rose text-cream'
                  : 'text-dune hover:bg-warm-sand/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

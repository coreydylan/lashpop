"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useMemo } from "react"
import { Grid3x3, Columns3, Columns2, Maximize2, Minimize2 } from "lucide-react"

interface Asset {
  id: string
  fileName: string
  filePath: string
  fileType: "image" | "video"
  uploadedAt: Date
  teamMemberId?: string
  tags?: Array<{
    id: string
    name: string
    displayName: string
    category: {
      id: string
      name: string
      displayName: string
      color?: string
    }
  }>
}

interface CollageViewProps {
  assets: Asset[]
  onClose?: () => void
}

type PhotoSize = 'small' | 'medium' | 'large' | 'full'

interface PhotoSizeState {
  [assetId: string]: PhotoSize
}

/**
 * Interactive masonry-style collage layout where users can
 * adjust photo sizes and column count to create custom layouts
 */
export function CollageView({ assets, onClose }: CollageViewProps) {
  const [columnCount, setColumnCount] = useState<2 | 3 | 4 | 5>(3)
  const [photoSizes, setPhotoSizes] = useState<PhotoSizeState>({})

  // Cycle through photo sizes
  const cyclePhotoSize = (assetId: string) => {
    setPhotoSizes(prev => {
      const current = prev[assetId] || 'medium'
      const sizes: PhotoSize[] = ['small', 'medium', 'large', 'full']
      const currentIndex = sizes.indexOf(current)
      const nextSize = sizes[(currentIndex + 1) % sizes.length]
      return { ...prev, [assetId]: nextSize }
    })
  }

  // Get size class for a photo
  const getSizeClass = (assetId: string): string => {
    const size = photoSizes[assetId] || 'medium'

    switch (size) {
      case 'small':
        return 'collage-photo-small'
      case 'medium':
        return 'collage-photo-medium'
      case 'large':
        return 'collage-photo-large'
      case 'full':
        return 'collage-photo-full'
      default:
        return 'collage-photo-medium'
    }
  }

  const getSizeLabel = (assetId: string): string => {
    const size = photoSizes[assetId] || 'medium'
    switch (size) {
      case 'small': return 'S'
      case 'medium': return 'M'
      case 'large': return 'L'
      case 'full': return 'XL'
      default: return 'M'
    }
  }

  return (
    <div className="collage-view-container">
      {/* Controls Bar */}
      <div className="collage-controls">
        <div className="collage-controls-left">
          <button onClick={onClose} className="collage-control-btn">
            <Minimize2 className="w-4 h-4" />
            <span>Exit Collage</span>
          </button>
          <div className="collage-divider" />
          <div className="collage-info">
            {assets.length} photo{assets.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="collage-controls-right">
          <span className="collage-label">Columns:</span>
          <button
            onClick={() => setColumnCount(2)}
            className={`collage-control-btn ${columnCount === 2 ? 'active' : ''}`}
            title="2 columns"
          >
            <Columns2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setColumnCount(3)}
            className={`collage-control-btn ${columnCount === 3 ? 'active' : ''}`}
            title="3 columns"
          >
            <Columns3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setColumnCount(4)}
            className={`collage-control-btn ${columnCount === 4 ? 'active' : ''}`}
            title="4 columns"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setColumnCount(5)}
            className={`collage-control-btn ${columnCount === 5 ? 'active' : ''}`}
            title="5 columns"
          >
            <span className="text-xs font-bold">5</span>
          </button>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="collage-scroll-container">
        <div
          className="collage-masonry"
          style={{
            columnCount: columnCount,
            columnGap: '16px',
          }}
        >
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`collage-photo ${getSizeClass(asset.id)}`}
              onClick={() => cyclePhotoSize(asset.id)}
            >
              <img
                src={asset.filePath}
                alt={asset.fileName}
                draggable={false}
              />

              {/* Size indicator badge */}
              <div className="collage-size-badge">
                {getSizeLabel(asset.id)}
              </div>

              {/* Hover overlay */}
              <div className="collage-hover-overlay">
                <Maximize2 className="w-5 h-5" />
                <span className="text-xs mt-1">Click to resize</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help text */}
      <div className="collage-help">
        Click any photo to cycle through sizes • Adjust columns to change layout
      </div>

      <style jsx>{`
        .collage-view-container {
          position: fixed;
          inset: 0;
          z-index: 10001;
          background: rgba(12, 10, 8, 0.98);
          backdrop-filter: blur(45px) saturate(180%);
          -webkit-backdrop-filter: blur(45px) saturate(180%);
          display: flex;
          flex-direction: column;
        }

        .collage-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(242, 237, 229, 0.1);
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
        }

        .collage-controls-left,
        .collage-controls-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .collage-control-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          border: 1px solid rgba(242, 237, 229, 0.15);
          background: rgba(242, 237, 229, 0.05);
          color: #F2EDE5;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .collage-control-btn:hover {
          background: rgba(242, 237, 229, 0.12);
          border-color: rgba(217, 136, 128, 0.4);
        }

        .collage-control-btn.active {
          background: rgba(217, 136, 128, 0.2);
          border-color: #D98880;
          color: #D98880;
        }

        .collage-divider {
          width: 1px;
          height: 24px;
          background: rgba(242, 237, 229, 0.15);
        }

        .collage-info {
          color: #F2EDE5;
          font-size: 0.875rem;
          opacity: 0.7;
        }

        .collage-label {
          color: #F2EDE5;
          font-size: 0.875rem;
          opacity: 0.7;
        }

        .collage-scroll-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 2rem;
        }

        .collage-scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .collage-scroll-container::-webkit-scrollbar-track {
          background: rgba(242, 237, 229, 0.05);
        }

        .collage-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(217, 136, 128, 0.3);
          border-radius: 4px;
        }

        .collage-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 136, 128, 0.5);
        }

        .collage-masonry {
          max-width: 1600px;
          margin: 0 auto;
        }

        .collage-photo {
          position: relative;
          break-inside: avoid;
          margin-bottom: 16px;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          background: #0f0d0b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .collage-photo:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
        }

        .collage-photo img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .collage-photo:hover img {
          transform: scale(1.02);
        }

        /* Size classes */
        .collage-photo-small {
          width: 60%;
        }

        .collage-photo-medium {
          width: 100%;
        }

        .collage-photo-large {
          width: 100%;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .collage-photo-large img {
          min-height: 300px;
          object-fit: cover;
        }

        .collage-photo-full {
          width: 100%;
          column-span: all;
          margin-bottom: 24px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
        }

        .collage-photo-full img {
          max-height: 600px;
          object-fit: contain;
          background: #0f0d0b;
        }

        .collage-size-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(217, 136, 128, 0.9);
          color: #F2EDE5;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          backdrop-filter: blur(8px);
        }

        .collage-photo:hover .collage-size-badge {
          opacity: 1;
        }

        .collage-hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(43, 40, 36, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          color: #F2EDE5;
          font-weight: 600;
        }

        .collage-photo:hover .collage-hover-overlay {
          opacity: 1;
        }

        .collage-help {
          padding: 1rem 2rem;
          text-align: center;
          color: #F2EDE5;
          font-size: 0.875rem;
          opacity: 0.6;
          border-top: 1px solid rgba(242, 237, 229, 0.1);
          background: rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .collage-controls {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .collage-controls-left,
          .collage-controls-right {
            width: 100%;
            justify-content: center;
          }

          .collage-scroll-container {
            padding: 1rem;
          }

          .collage-masonry {
            column-count: 2 !important;
          }

          .collage-photo-full img {
            max-height: 400px;
          }
        }
      `}</style>
    </div>
  )
}

"use client"

/* eslint-disable @next/next/no-img-element */

import { useMemo } from "react"

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

/**
 * Auto-grid collage layout that intelligently arranges images
 * based on the number of assets selected
 */
export function CollageView({ assets, onClose }: CollageViewProps) {
  const gridConfig = useMemo(() => {
    const count = assets.length

    // Define grid patterns based on count
    if (count === 1) {
      return { columns: 1, rows: 1, gap: 0 }
    } else if (count === 2) {
      return { columns: 2, rows: 1, gap: 8 }
    } else if (count === 3) {
      return { columns: 3, rows: 1, gap: 8 }
    } else if (count === 4) {
      return { columns: 2, rows: 2, gap: 8 }
    } else if (count <= 6) {
      return { columns: 3, rows: 2, gap: 6 }
    } else if (count <= 9) {
      return { columns: 3, rows: 3, gap: 6 }
    } else if (count <= 12) {
      return { columns: 4, rows: 3, gap: 6 }
    } else if (count <= 16) {
      return { columns: 4, rows: 4, gap: 4 }
    } else if (count <= 20) {
      return { columns: 5, rows: 4, gap: 4 }
    } else if (count <= 25) {
      return { columns: 5, rows: 5, gap: 4 }
    } else {
      // For larger collections, use a 6-column grid
      const rows = Math.ceil(count / 6)
      return { columns: 6, rows, gap: 3 }
    }
  }, [assets.length])

  return (
    <div className="collage-view-container">
      <div
        className="collage-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
          gap: `${gridConfig.gap}px`,
          width: '100%',
          height: '100%',
          padding: '20px',
        }}
      >
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="collage-item"
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '8px',
              aspectRatio: '1',
              backgroundColor: '#0f0d0b',
            }}
          >
            <img
              src={asset.filePath}
              alt={asset.fileName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              draggable={false}
            />
          </div>
        ))}
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
          align-items: center;
          justify-content: center;
          padding: 80px 40px 120px;
        }

        .collage-grid {
          max-width: min(90vw, 1400px);
          max-height: min(80vh, 900px);
        }

        .collage-item {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .collage-item:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          z-index: 10;
        }

        @media (max-width: 768px) {
          .collage-view-container {
            padding: 60px 20px 100px;
          }

          .collage-grid {
            max-width: 95vw;
            max-height: 75vh;
          }
        }
      `}</style>
    </div>
  )
}

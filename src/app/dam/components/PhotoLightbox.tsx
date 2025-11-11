"use client"

import { PhotoProvider } from "react-photo-view"
import "react-photo-view/dist/react-photo-view.css"
import { CheckCircle, Circle } from "lucide-react"

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

interface PhotoLightboxProps {
  children: React.ReactNode
  selectedAssetIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  assets?: Asset[]
}

export function PhotoLightbox({
  children,
  selectedAssetIds = [],
  onSelectionChange,
  assets = []
}: PhotoLightboxProps) {
  const handleToggleSelection = (assetId: string) => {
    if (!onSelectionChange) return

    const nextSelection = selectedAssetIds.includes(assetId)
      ? selectedAssetIds.filter((id) => id !== assetId)
      : [...selectedAssetIds, assetId]

    onSelectionChange(nextSelection)
  }

  return (
    <PhotoProvider
      speed={() => 300}
      easing={(type) =>
        type === 2 ? "cubic-bezier(0.36, 0, 0.66, -0.56)" : "cubic-bezier(0.34, 1.56, 0.64, 1)"
      }
      maskOpacity={0.98}
      photoClosable
      pullClosable
      bannerVisible={false}
      overlayRender={({ index, onIndexChange, visible }) => {
        if (!visible) return null
        const asset = assets[index]
        if (!asset) return null

        const isSelected = selectedAssetIds.includes(asset.id)

        return (
          <div className="photo-lightbox-overlay">
            <div className="photo-lightbox-omnibar">
              <div className="photo-lightbox-omnibar__content">
                <div className="photo-lightbox-counter">
                  {index + 1} / {assets.length}
                </div>

                {asset.tags && asset.tags.length > 0 ? (
                  <div className="photo-lightbox-tags">
                    {asset.tags.map((tag) => {
                      const baseColor = tag.category.color || "#A19781"
                      return (
                        <span
                          key={tag.id}
                          className="photo-lightbox-tag"
                          style={{
                            background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}CC 100%)`
                          }}
                        >
                          {tag.displayName}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <div className="photo-lightbox-tags photo-lightbox-tags--empty">
                    No tags applied
                  </div>
                )}

                <div className="photo-lightbox-actions">
                  {selectedAssetIds.length > 0 && (
                    <div className="photo-lightbox-selected-count">
                      {selectedAssetIds.length} selected
                    </div>
                  )}

                  {onSelectionChange && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleSelection(asset.id)
                      }}
                      className={`photo-lightbox-select-btn ${isSelected ? "selected" : "idle"}`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle className="icon" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <Circle className="icon" />
                          <span>Select</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {assets.length > 1 && (
              <div className="photo-lightbox-thumbnails">
                <div className="photo-lightbox-thumbnails__scroller">
                  {assets.map((thumbAsset, thumbIndex) => {
                    const isActive = thumbIndex === index
                    const thumbSelected = selectedAssetIds.includes(thumbAsset.id)

                    return (
                      <button
                        key={thumbAsset.id}
                        className={`photo-lightbox-thumb ${isActive ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onIndexChange(thumbIndex)
                        }}
                      >
                        <img src={thumbAsset.filePath} alt={thumbAsset.fileName} />
                        {thumbSelected && (
                          <div className="photo-lightbox-thumb__badge">
                            <CheckCircle />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      }}
    >
      <style jsx global>{`
        .PhotoView-Portal {
          --color-dune: #2B2824;
          --color-cream: #F2EDE5;
          --color-sage: #8C7C69;
          --color-dusty-rose: #D98880;
        }

        .PhotoView__Mask {
          background: rgba(12, 10, 8, 0.96) !important;
          backdrop-filter: blur(45px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(45px) saturate(180%) !important;
        }

        .PhotoView-Slider__Backdrop {
          background: radial-gradient(ellipse at center, rgba(12, 10, 8, 0.85), rgba(12, 10, 8, 0.95)) !important;
        }

        .PhotoView-Slider__toolbarWrap,
        .PhotoView-Slider__BannerWrap {
          display: none !important;
        }

        .PhotoView__PhotoWrap {
          padding: 140px 0 220px !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .PhotoView__PhotoBox {
          max-height: calc(100vh - 360px) !important;
          max-width: min(90vw, 1400px) !important;
        }

        .PhotoView__Photo {
          border-radius: 24px !important;
          box-shadow: 0 35px 90px rgba(0, 0, 0, 0.55) !important;
          background: #0f0d0b !important;
        }

        @media (max-width: 768px) {
          .PhotoView__PhotoWrap {
            padding: 100px 0 180px !important;
          }

          .PhotoView__PhotoBox {
            max-height: calc(100vh - 260px) !important;
          }
        }

        .photo-lightbox-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 10000;
        }

        .photo-lightbox-omnibar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(
            to bottom,
            rgba(20, 18, 16, 0.98) 0%,
            rgba(20, 18, 16, 0.85) 65%,
            transparent 100%
          );
          backdrop-filter: blur(36px) saturate(180%);
          -webkit-backdrop-filter: blur(36px) saturate(180%);
          padding: 28px 20px 32px;
          pointer-events: auto;
        }

        .photo-lightbox-omnibar__content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .photo-lightbox-counter {
          padding: 8px 16px;
          background: rgba(242, 237, 229, 0.15);
          border-radius: 999px;
          color: #F2EDE5;
          font-size: 14px;
          font-weight: 600;
        }

        .photo-lightbox-tags {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .photo-lightbox-tags--empty {
          font-size: 13px;
          color: rgba(242, 237, 229, 0.6);
          font-weight: 500;
        }

        .photo-lightbox-tag {
          padding: 6px 12px;
          border-radius: 24px;
          font-size: 12px;
          font-weight: 600;
          color: #F2EDE5;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }

        .photo-lightbox-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .photo-lightbox-selected-count {
          padding: 6px 12px;
          background: rgba(217, 136, 128, 0.9);
          border-radius: 999px;
          color: #F2EDE5;
          font-size: 13px;
          font-weight: 600;
        }

        .photo-lightbox-select-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #F2EDE5;
          background: rgba(242, 237, 229, 0.12);
          transition: background 0.2s ease;
        }

        .photo-lightbox-select-btn .icon {
          width: 18px;
          height: 18px;
        }

        .photo-lightbox-select-btn.selected {
          background: rgba(217, 136, 128, 0.9);
        }

        .photo-lightbox-thumbnails {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(
            to top,
            rgba(20, 18, 16, 0.98) 0%,
            rgba(20, 18, 16, 0.85) 65%,
            transparent 100%
          );
          backdrop-filter: blur(36px) saturate(180%);
          -webkit-backdrop-filter: blur(36px) saturate(180%);
          padding: 24px;
          pointer-events: auto;
        }

        .photo-lightbox-thumbnails__scroller {
          display: flex;
          gap: 10px;
          justify-content: center;
          overflow-x: auto;
          padding-bottom: 8px;
          max-width: 100%;
        }

        .photo-lightbox-thumb {
          position: relative;
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(242, 237, 229, 0.2);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
          background: none;
          opacity: 0.7;
        }

        .photo-lightbox-thumb.active {
          width: 76px;
          height: 76px;
          border: 2px solid #D98880;
          opacity: 1;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.45);
        }

        .photo-lightbox-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-lightbox-thumb__badge {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(217, 136, 128, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .photo-lightbox-thumb__badge svg {
          width: 20px;
          height: 20px;
          color: #F2EDE5;
          filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
        }

        .photo-lightbox-thumbnails__scroller::-webkit-scrollbar {
          height: 6px;
        }

        .photo-lightbox-thumbnails__scroller::-webkit-scrollbar-track {
          background: rgba(242, 237, 229, 0.08);
          border-radius: 3px;
        }

        .photo-lightbox-thumbnails__scroller::-webkit-scrollbar-thumb {
          background: rgba(242, 237, 229, 0.35);
          border-radius: 3px;
        }

        .photo-lightbox-thumbnails__scroller::-webkit-scrollbar-thumb:hover {
          background: rgba(242, 237, 229, 0.55);
        }
      `}</style>
      {children}
    </PhotoProvider>
  )
}

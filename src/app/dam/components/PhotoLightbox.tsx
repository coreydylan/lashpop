"use client"

import type { ReactNode } from "react"
import { useCallback, useRef } from "react"
import { PhotoProvider } from "react-photo-view"
import "react-photo-view/dist/react-photo-view.css"
import { CheckCircle, Circle, ChevronLeft, ChevronRight } from "lucide-react"
import { OmniBar, type OmniBarProps } from "./OmniBar"

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
  children: ReactNode
  selectedAssetIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  assets?: Asset[]
  omniBarProps?: OmniBarProps
  onActiveAssetChange?: (asset: Asset | null, index: number) => void
}

export function PhotoLightbox({
  children,
  selectedAssetIds = [],
  onSelectionChange,
  assets = [],
  omniBarProps,
  onActiveAssetChange
}: PhotoLightboxProps) {
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null)
  const currentIndexRef = useRef(0)

  const notifyActiveAsset = useCallback(
    (index: number | null) => {
      if (!onActiveAssetChange) return
      if (index === null || index < 0 || !assets[index]) {
        onActiveAssetChange(null, -1)
      } else {
        onActiveAssetChange(assets[index], index)
      }
    },
    [assets, onActiveAssetChange]
  )

  const scrollToIndex = useCallback((idx: number) => {
    const container = thumbnailStripRef.current
    if (!container) return
    const child = container.children[idx] as HTMLElement | undefined
    if (!child) return

    const containerWidth = container.clientWidth
    const childRect = child.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const offset = (childRect.left + childRect.width / 2) - (containerRect.left + containerWidth / 2)

    container.scrollBy({ left: offset, behavior: "smooth" })
  }, [])

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
      onIndexChange={(index) => {
        currentIndexRef.current = index
        notifyActiveAsset(index)
        scrollToIndex(index)
      }}
      onVisibleChange={(visible) => {
        if (!visible) {
          notifyActiveAsset(null)
        } else {
          notifyActiveAsset(currentIndexRef.current)
          scrollToIndex(currentIndexRef.current)
        }
      }}
      overlayRender={({ index, onIndexChange, visible }) => {
        if (!visible) return null
        const asset = assets[index]
        if (!asset) return null

        const isSelected = selectedAssetIds.includes(asset.id)

        return (
          <div className="photo-lightbox-overlay">
            {omniBarProps && (
              <div className="photo-lightbox-omnibar">
                <OmniBar
                  {...omniBarProps}
                  counterSlot={`${index + 1} / ${assets.length}`}
                />
              </div>
            )}

            {onSelectionChange && (
              <div className="photo-lightbox-select-control">
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
              </div>
            )}

            {assets.length > 1 && (
              <div className="photo-lightbox-thumbnails">
                <button
                  className="photo-lightbox-nav photo-lightbox-nav--left"
                  onClick={(e) => {
                    e.stopPropagation()
                    const nextIndex = (index - 1 + assets.length) % assets.length
                    onIndexChange(nextIndex)
                    scrollToIndex(nextIndex)
                  }}
                >
                  <ChevronLeft />
                </button>
                <div className="photo-lightbox-thumbnails__scroller" ref={thumbnailStripRef}>
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
                          scrollToIndex(thumbIndex)
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
                <button
                  className="photo-lightbox-nav photo-lightbox-nav--right"
                  onClick={(e) => {
                    e.stopPropagation()
                    const nextIndex = (index + 1) % assets.length
                    onIndexChange(nextIndex)
                    scrollToIndex(nextIndex)
                  }}
                >
                  <ChevronRight />
                </button>
                {onSelectionChange && (
                  <button
                    className={`photo-lightbox-select-btn photo-lightbox-select-btn--bottom ${isSelected ? "selected" : "idle"}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleSelection(asset.id)
                    }}
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
          padding: 240px 0 320px !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .PhotoView__PhotoBox {
          max-height: min(58vh, 620px) !important;
          max-width: min(52vw, 900px) !important;
        }

        .PhotoView__Photo {
          border-radius: 24px !important;
          box-shadow: 0 35px 90px rgba(0, 0, 0, 0.55) !important;
          background: #0f0d0b !important;
        }

        @media (max-width: 768px) {
          .PhotoView__PhotoWrap {
            padding: 140px 0 240px !important;
          }

          .PhotoView__PhotoBox {
            max-height: min(55vh, 420px) !important;
            max-width: 86vw !important;
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
          padding: 32px 24px 36px;
          pointer-events: auto;
        }

        .photo-lightbox-omnibar > div {
          max-width: 1200px;
          margin: 0 auto;
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
          padding: 20px 48px 40px;
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 16px;
          justify-content: center;
        }

        .photo-lightbox-thumbnails__scroller {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          max-width: 70vw;
          scrollbar-width: none;
        }

        .photo-lightbox-thumbnails__scroller::-webkit-scrollbar {
          display: none;
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

        .photo-lightbox-nav {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.25);
          color: #F2EDE5;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .photo-lightbox-nav:hover {
          background: rgba(0, 0, 0, 0.45);
        }

        .photo-lightbox-select-btn--bottom {
          position: absolute;
          bottom: 12px;
          right: 32px;
          transform: translateY(50%);
        }

        @media (max-width: 768px) {
          .photo-lightbox-thumbnails {
            padding: 16px 32px 32px;
          }

          .photo-lightbox-thumbnails__scroller {
            max-width: 65vw;
          }

          .photo-lightbox-select-btn--bottom {
            right: 16px;
          }
        }

        .photo-lightbox-thumbnails__scroller::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </PhotoProvider>
  )
}

"use client"

import type { ReactNode, PointerEvent as ReactPointerEvent } from "react"
import { useCallback, useRef } from "react"
import { PhotoProvider } from "react-photo-view"
import "react-photo-view/dist/react-photo-view.css"
import { CheckCircle, Circle } from "lucide-react"
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
  const thumbPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const isScrollingRef = useRef(false)

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

  const clearThumbPressTimer = () => {
    if (thumbPressTimerRef.current) {
      clearTimeout(thumbPressTimerRef.current)
      thumbPressTimerRef.current = null
    }
  }

  const handleThumbPointerDown = (assetId: string, e: ReactPointerEvent<HTMLButtonElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.pointerType === "mouse") {
      e.preventDefault()
      handleToggleSelection(assetId)
      return
    }

    if (e.pointerType === "touch") {
      // Prevent iOS context menu
      e.preventDefault()

      touchStartXRef.current = e.clientX
      isScrollingRef.current = false
      clearThumbPressTimer()

      thumbPressTimerRef.current = window.setTimeout(() => {
        if (!isScrollingRef.current) {
          handleToggleSelection(assetId)
        }
      }, 500)
    }
  }

  const handleThumbPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch" && touchStartXRef.current !== null) {
      const deltaX = Math.abs(e.clientX - touchStartXRef.current)
      if (deltaX > 10) { // If moved more than 10px, consider it scrolling
        isScrollingRef.current = true
        clearThumbPressTimer()
      }
    }
  }

  const handleThumbPointerEnd = () => {
    clearThumbPressTimer()
    touchStartXRef.current = null
    isScrollingRef.current = false
  }

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

            {assets.length > 1 && (
              <div className="photo-lightbox-thumbnails">
                <div className="photo-lightbox-thumbnails__scroller" ref={thumbnailStripRef}>
                  {assets.map((thumbAsset, thumbIndex) => {
                    const isActive = thumbIndex === index
                    const thumbSelected = selectedAssetIds.includes(thumbAsset.id)

                    return (
                      <button
                        key={thumbAsset.id}
                        className={`photo-lightbox-thumb ${isActive ? "active" : ""} ${thumbSelected ? "selected" : ""}`}
                        style={{
                          WebkitTouchCallout: 'none',
                          WebkitUserSelect: 'none',
                          userSelect: 'none'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onIndexChange(thumbIndex)
                          scrollToIndex(thumbIndex)
                        }}
                        onPointerDown={(e) => handleThumbPointerDown(thumbAsset.id, e)}
                        onPointerMove={handleThumbPointerMove}
                        onPointerUp={handleThumbPointerEnd}
                        onPointerLeave={handleThumbPointerEnd}
                        onPointerCancel={handleThumbPointerEnd}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        <img
                          src={thumbAsset.filePath}
                          alt={thumbAsset.fileName}
                          draggable={false}
                          style={{
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none'
                          }}
                          onContextMenu={(e) => e.preventDefault()}
                        />
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
          background: transparent;
          padding: 20px 16px 24px;
          pointer-events: auto;
          z-index: 10;
        }

        .photo-lightbox-omnibar > div {
          max-width: 1200px;
          margin: 0 auto;
        }

        .photo-lightbox-thumbnails {
          position: absolute;
          bottom: 24px;
          left: 0;
          right: 0;
          padding: 0 24px;
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .photo-lightbox-thumbnails__scroller {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          max-width: 90vw;
          scrollbar-width: none;
          padding: 4px 0;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          touch-action: pan-x;
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

        .photo-lightbox-thumb.selected:not(.active) {
          border: 2px solid rgba(217, 136, 128, 0.6);
          opacity: 0.9;
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

        @media (max-width: 768px) {
          .photo-lightbox-thumbnails {
            bottom: 16px;
            padding: 0 16px;
          }

          .photo-lightbox-thumbnails__scroller {
            max-width: 100%;
            justify-content: flex-start;
          }

          .photo-lightbox-thumb {
            width: 56px;
            height: 56px;
          }

          .photo-lightbox-thumb.active {
            width: 64px;
            height: 64px;
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

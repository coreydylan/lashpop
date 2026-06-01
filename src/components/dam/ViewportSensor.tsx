"use client"

import { useEffect, useRef, useState } from "react"

interface ViewportSensorProps {
  position: "top" | "middle" | "bottom" | number // number = percentage from top
  onAssetsDetected?: (assetIds: string[]) => void
  debug?: boolean
}

export function ViewportSensor({
  position = "middle",
  onAssetsDetected,
  debug = false
}: ViewportSensorProps) {
  const sensorRef = useRef<HTMLDivElement>(null)
  const [detectedAssets, setDetectedAssets] = useState<string[]>([])

  useEffect(() => {
    if (!sensorRef.current) return

    const sensorLine = sensorRef.current
    const checkIntersections = () => {
      const sensorRect = sensorLine.getBoundingClientRect()
      const sensorY = sensorRect.top + sensorRect.height / 2

      // Find all asset cards in the grid
      const assetCards = document.querySelectorAll('[data-asset-id]')
      const intersectingAssets: string[] = []

      assetCards.forEach((card) => {
        const rect = card.getBoundingClientRect()
        // Check if sensor line intersects with this asset vertically
        if (sensorY >= rect.top && sensorY <= rect.bottom) {
          const assetId = card.getAttribute('data-asset-id')
          if (assetId) {
            intersectingAssets.push(assetId)
          }
        }
      })

      setDetectedAssets(intersectingAssets)
      if (onAssetsDetected) {
        onAssetsDetected(intersectingAssets)
      }
    }

    // Check on scroll and resize
    const handleScroll = () => {
      requestAnimationFrame(checkIntersections)
    }

    // Initial check
    checkIntersections()

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    // Also check periodically in case grid layout changes
    const interval = setInterval(checkIntersections, 1000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      clearInterval(interval)
    }
  }, [onAssetsDetected])

  // Calculate position
  const getPositionStyle = () => {
    if (typeof position === 'number') {
      return { top: `${position}%` }
    }
    switch (position) {
      case 'top':
        return { top: '20%' }
      case 'bottom':
        return { top: '80%' }
      case 'middle':
      default:
        return { top: '50%' }
    }
  }

  return (
    <>
      <div
        ref={sensorRef}
        className={debug ? "fixed left-0 right-0 z-50 pointer-events-none" : "fixed left-0 right-0 z-50 pointer-events-none opacity-0"}
        style={{
          ...getPositionStyle(),
          height: '2px',
          background: debug ? 'rgba(255, 0, 0, 0.5)' : 'transparent'
        }}
      />
      {debug && detectedAssets.length > 0 && (
        <div
          className="fixed right-4 z-50 bg-black/80 text-white text-xs p-2 rounded"
          style={{ ...getPositionStyle(), transform: 'translateY(10px)' }}
        >
          Detecting {detectedAssets.length} assets: {detectedAssets.slice(0, 3).join(', ')}
          {detectedAssets.length > 3 && '...'}
        </div>
      )}
    </>
  )
}

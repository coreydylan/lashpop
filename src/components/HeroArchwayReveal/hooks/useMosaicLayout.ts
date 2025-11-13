/**
 * Hook to calculate and manage mosaic layout
 */

import { useState, useEffect, useMemo } from 'react'
import type { GridImage, MosaicLayoutConfig } from '../types'
import { calculateGridLayout, getColumnCount } from '../utils'

export function useMosaicLayout(
  images: GridImage[],
  config: MosaicLayoutConfig,
  containerWidth: number
) {
  const [columnCount, setColumnCount] = useState(() =>
    getColumnCount(typeof window !== 'undefined' ? window.innerWidth : 1024, config)
  )

  // Update column count on resize
  useEffect(() => {
    function handleResize() {
      const newColumnCount = getColumnCount(window.innerWidth, config)
      setColumnCount(newColumnCount)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [config])

  // Calculate layout
  const layout = useMemo(() => {
    if (images.length === 0) return { layout: [], totalHeight: 0 }
    return calculateGridLayout(images, columnCount, containerWidth)
  }, [images, columnCount, containerWidth])

  return {
    layout: layout.layout,
    totalHeight: layout.totalHeight,
    columnCount,
  }
}

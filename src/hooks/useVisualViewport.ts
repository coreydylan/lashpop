import { useState, useEffect } from 'react'

export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState<number>(0)
  // Track offset from top to handle scrolling/safe areas
  const [offsetTop, setOffsetTop] = useState<number>(0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateViewport = () => {
      const vv = window.visualViewport
      const height = vv ? vv.height : window.innerHeight
      const offset = vv ? vv.offsetTop : 0
      
      setViewportHeight(height)
      setOffsetTop(offset)
      
      // Heuristic: If viewport is significantly smaller than screen height (e.g., < 75%), 
      // the keyboard is likely open.
      // Note: On iOS, window.innerHeight might change too, so we compare against screen.height 
      // or a cached initial innerHeight.
      const isOpen = height < (window.screen.availHeight || window.innerHeight) * 0.75
      setIsKeyboardOpen(isOpen)
    }

    // Initial measurement
    updateViewport()

    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', updateViewport)
      vv.addEventListener('scroll', updateViewport)
    } else {
      window.addEventListener('resize', updateViewport)
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateViewport)
        vv.removeEventListener('scroll', updateViewport)
      } else {
        window.removeEventListener('resize', updateViewport)
      }
    }
  }, [])

  return { viewportHeight, offsetTop, isKeyboardOpen }
}


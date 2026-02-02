'use client'

import { useState, useEffect, useCallback } from 'react'

// LashPop Brand Colors
const BRAND_COLORS = [
  { name: 'Ivory', hex: '#faf6f2' },
  { name: 'Cream', hex: '#f0e0db' },
  { name: 'Peach', hex: '#eed9c8' },
  { name: 'Blush', hex: '#e9d1c8' },
  { name: 'Rose Mist', hex: '#e2c2b6' },
  { name: 'Dusty Rose', hex: '#dbb2a4' },
  { name: 'Soft Terracotta', hex: '#d3a392' },
  { name: 'Warm Terracotta', hex: '#cc947f' },
  { name: 'Terracotta Light', hex: '#c46b4e' },
  { name: 'Terracotta', hex: '#b5563d' },
  { name: 'Rust', hex: '#ac4d3c' },
  { name: 'Charcoal', hex: '#3d3632' },
  { name: 'Cyan', hex: '#18f0ed' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#000000' },
]

const FONT_WEIGHTS = [
  { label: 'Light', value: '300' },
  { label: 'Reg', value: '400' },
  { label: 'Med', value: '500' },
  { label: 'Semi', value: '600' },
  { label: 'Bold', value: '700' },
]

type StyleMode = 'color' | 'bg' | 'border'

export function DesignMode() {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [styleMode, setStyleMode] = useState<StyleMode>('color')
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentStyles, setCurrentStyles] = useState({
    color: '',
    backgroundColor: '',
    borderColor: '',
    fontWeight: '',
    fontStyle: '',
  })

  // Read current styles when element is selected
  useEffect(() => {
    if (selectedElement) {
      const computed = window.getComputedStyle(selectedElement)
      setCurrentStyles({
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        fontWeight: computed.fontWeight,
        fontStyle: computed.fontStyle,
      })
    }
  }, [selectedElement])

  // Handle element click (works for both mouse and touch)
  const handleClick = useCallback((e: MouseEvent | TouchEvent) => {
    if (isMinimized) return

    const target = e.target as HTMLElement
    if (target.closest('.design-mode-panel')) return

    e.preventDefault()
    e.stopPropagation()
    setSelectedElement(target)
    setHoveredElement(null)
  }, [isMinimized])

  // Handle hover (mouse only)
  const handleMouseOver = useCallback((e: MouseEvent) => {
    if (isMinimized) return
    const target = e.target as HTMLElement
    if (target.closest('.design-mode-panel')) return
    if (!selectedElement) {
      setHoveredElement(target)
    }
  }, [isMinimized, selectedElement])

  const handleMouseOut = useCallback(() => {
    setHoveredElement(null)
  }, [])

  // Handle keyboard
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedElement(null)
      setHoveredElement(null)
    }
  }, [])

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('touchend', handleClick, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('touchend', handleClick, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleMouseOver, handleMouseOut, handleClick, handleKeyDown])

  // Deselect
  const deselect = () => {
    setSelectedElement(null)
    setHoveredElement(null)
  }

  // Apply color
  const applyColor = (hex: string) => {
    if (!selectedElement) return

    switch (styleMode) {
      case 'color':
        selectedElement.style.color = hex
        break
      case 'bg':
        selectedElement.style.backgroundColor = hex
        break
      case 'border':
        selectedElement.style.borderColor = hex
        if (!selectedElement.style.borderWidth) {
          selectedElement.style.borderWidth = '2px'
          selectedElement.style.borderStyle = 'solid'
        }
        break
    }

    // Update current styles
    const computed = window.getComputedStyle(selectedElement)
    setCurrentStyles({
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
    })
  }

  // Apply font weight
  const applyFontWeight = (weight: string) => {
    if (!selectedElement) return
    selectedElement.style.fontWeight = weight
    setCurrentStyles(prev => ({ ...prev, fontWeight: weight }))
  }

  // Toggle italic
  const toggleItalic = () => {
    if (!selectedElement) return
    const isItalic = currentStyles.fontStyle === 'italic'
    selectedElement.style.fontStyle = isItalic ? 'normal' : 'italic'
    setCurrentStyles(prev => ({ ...prev, fontStyle: isItalic ? 'normal' : 'italic' }))
  }

  // Reset styles
  const resetStyles = () => {
    if (!selectedElement) return
    selectedElement.style.color = ''
    selectedElement.style.backgroundColor = ''
    selectedElement.style.borderColor = ''
    selectedElement.style.borderWidth = ''
    selectedElement.style.borderStyle = ''
    selectedElement.style.fontWeight = ''
    selectedElement.style.fontStyle = ''

    const computed = window.getComputedStyle(selectedElement)
    setCurrentStyles({
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
    })
  }

  // Copy styles to clipboard
  const copyStyles = () => {
    if (!selectedElement) return

    const styles: string[] = []
    if (selectedElement.style.color) styles.push(`color: ${selectedElement.style.color};`)
    if (selectedElement.style.backgroundColor) styles.push(`background-color: ${selectedElement.style.backgroundColor};`)
    if (selectedElement.style.borderColor) styles.push(`border-color: ${selectedElement.style.borderColor};`)
    if (selectedElement.style.fontWeight) styles.push(`font-weight: ${selectedElement.style.fontWeight};`)
    if (selectedElement.style.fontStyle) styles.push(`font-style: ${selectedElement.style.fontStyle};`)

    if (styles.length > 0) {
      navigator.clipboard.writeText(styles.join('\n'))
    }
  }

  // Get element info
  const getElementInfo = (el: HTMLElement) => {
    let info = el.tagName.toLowerCase()
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(' ').slice(0, 2).join('.')
      if (classes) info += `.${classes}`
    }
    return info.slice(0, 30)
  }

  // Minimized state - just show a small button
  if (isMinimized) {
    return (
      <button
        className="design-mode-panel"
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 99999,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          border: '2px solid #ac4d3c',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}
      >
        🎨
      </button>
    )
  }

  return (
    <>
      {/* Hover highlight */}
      {hoveredElement && !selectedElement && (
        <div
          style={{
            position: 'fixed',
            left: hoveredElement.getBoundingClientRect().left - 2,
            top: hoveredElement.getBoundingClientRect().top - 2,
            width: hoveredElement.getBoundingClientRect().width + 4,
            height: hoveredElement.getBoundingClientRect().height + 4,
            border: '2px dashed #18f0ed',
            pointerEvents: 'none',
            zIndex: 99998,
            borderRadius: '4px',
          }}
        />
      )}

      {/* Selected highlight */}
      {selectedElement && (
        <div
          style={{
            position: 'fixed',
            left: selectedElement.getBoundingClientRect().left - 2,
            top: selectedElement.getBoundingClientRect().top - 2,
            width: selectedElement.getBoundingClientRect().width + 4,
            height: selectedElement.getBoundingClientRect().height + 4,
            border: '3px solid #ac4d3c',
            pointerEvents: 'none',
            zIndex: 99998,
            borderRadius: '4px',
          }}
        />
      )}

      {/* Control Panel - Fixed at bottom on mobile */}
      <div
        className="design-mode-panel"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: '10px',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          width: 'calc(100vw - 20px)',
          maxWidth: '360px',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 600, color: '#e2c2b6', fontSize: '14px' }}>🎨 Design Mode</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedElement && (
              <button
                onClick={deselect}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#333',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Deselect
              </button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: '#333',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Hide
            </button>
          </div>
        </div>

        {/* Selected Element Info */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #333', background: '#222' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: selectedElement ? '#18f0ed' : '#666' }}>
            {selectedElement ? getElementInfo(selectedElement) : 'Tap any element to select'}
          </div>
        </div>

        {/* Style Mode Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
          {(['color', 'bg', 'border'] as StyleMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setStyleMode(mode)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: styleMode === mode ? '#ac4d3c' : 'transparent',
                color: styleMode === mode ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: styleMode === mode ? 600 : 400,
              }}
            >
              {mode === 'bg' ? 'Background' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Color Swatches */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {BRAND_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => applyColor(color.hex)}
                title={color.name}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  border: color.hex === '#ffffff' ? '1px solid #444' : 'none',
                  backgroundColor: color.hex,
                  cursor: selectedElement ? 'pointer' : 'not-allowed',
                  opacity: selectedElement ? 1 : 0.4,
                }}
              />
            ))}
          </div>
        </div>

        {/* Font Controls */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {FONT_WEIGHTS.map((fw) => (
              <button
                key={fw.value}
                onClick={() => applyFontWeight(fw.value)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '6px',
                  border: currentStyles.fontWeight === fw.value ? '2px solid #ac4d3c' : '1px solid #444',
                  background: currentStyles.fontWeight === fw.value ? '#ac4d3c' : '#2a2a2a',
                  color: '#fff',
                  cursor: selectedElement ? 'pointer' : 'not-allowed',
                  opacity: selectedElement ? 1 : 0.4,
                  fontSize: '11px',
                  fontWeight: parseInt(fw.value),
                }}
              >
                {fw.label}
              </button>
            ))}
            <button
              onClick={toggleItalic}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: currentStyles.fontStyle === 'italic' ? '2px solid #ac4d3c' : '1px solid #444',
                background: currentStyles.fontStyle === 'italic' ? '#ac4d3c' : '#2a2a2a',
                color: '#fff',
                cursor: selectedElement ? 'pointer' : 'not-allowed',
                opacity: selectedElement ? 1 : 0.4,
                fontSize: '12px',
                fontStyle: 'italic',
              }}
            >
              I
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '10px 12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={resetStyles}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #444',
              background: '#2a2a2a',
              color: '#fff',
              cursor: selectedElement ? 'pointer' : 'not-allowed',
              opacity: selectedElement ? 1 : 0.4,
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Reset
          </button>
          <button
            onClick={copyStyles}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: '#ac4d3c',
              color: '#fff',
              cursor: selectedElement ? 'pointer' : 'not-allowed',
              opacity: selectedElement ? 1 : 0.4,
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Copy CSS
          </button>
        </div>
      </div>
    </>
  )
}

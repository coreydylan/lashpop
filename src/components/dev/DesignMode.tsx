'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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

const FONT_WEIGHTS = ['300', '400', '500', '600', '700', '800']
const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '40', '48', '56', '64']
const TEXT_ALIGNS = ['left', 'center', 'right']
const LINE_HEIGHTS = ['1', '1.2', '1.4', '1.5', '1.6', '1.8', '2']
const LETTER_SPACINGS = ['-1', '0', '0.5', '1', '2', '3']
const PADDINGS = ['0', '4', '8', '12', '16', '24', '32', '48']
const BORDER_RADII = ['0', '4', '8', '12', '16', '24', '999']

type ColorMode = 'color' | 'bg' | 'border'
type ToolbarSection = 'colors' | 'weight' | 'size' | 'align' | 'spacing' | 'padding' | 'radius'

export function DesignMode() {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('color')
  const [activeSection, setActiveSection] = useState<ToolbarSection>('colors')
  const [isHidden, setIsHidden] = useState(false)
  const [selectMode, setSelectMode] = useState(true) // Toggle for element selection
  const [currentStyles, setCurrentStyles] = useState({
    color: '',
    backgroundColor: '',
    borderColor: '',
    fontWeight: '',
    fontStyle: '',
    textAlign: '',
    textTransform: '',
    fontSize: '',
    letterSpacing: '',
    lineHeight: '',
    padding: '',
    borderRadius: '',
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartPos = useRef({ x: 0, y: 0 })
  const isSwiping = useRef(false)

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
        textAlign: computed.textAlign,
        textTransform: computed.textTransform,
        fontSize: computed.fontSize,
        letterSpacing: computed.letterSpacing,
        lineHeight: computed.lineHeight,
        padding: computed.padding,
        borderRadius: computed.borderRadius,
      })
    }
  }, [selectedElement])

  // Track touch start for swipe detection
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!selectMode) return
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    isSwiping.current = false
  }, [selectMode])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!selectMode) return
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x)
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y)
    if (dx > 10 || dy > 10) {
      isSwiping.current = true
    }
  }, [selectMode])

  // Handle element click (desktop)
  const handleClick = useCallback((e: MouseEvent) => {
    if (isHidden || !selectMode) return
    const target = e.target as HTMLElement
    if (target.closest('.design-mode-panel')) return
    // Don't interfere with interactive elements when selectMode is on
    if (target.closest('button, a, input, select, textarea')) {
      // Still select the element but don't prevent default
      setSelectedElement(target)
      return
    }
    e.preventDefault()
    setSelectedElement(target)
    setHoveredElement(null)
  }, [isHidden, selectMode])

  // Handle touch end - only select if not swiping (mobile)
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isHidden || !selectMode) return
    if (isSwiping.current) return // Don't select if user was swiping

    const target = e.target as HTMLElement
    if (target.closest('.design-mode-panel')) return

    setSelectedElement(target)
    setHoveredElement(null)
  }, [isHidden, selectMode])

  // Handle hover
  const handleMouseOver = useCallback((e: MouseEvent) => {
    if (isHidden || !selectMode) return
    const target = e.target as HTMLElement
    if (target.closest('.design-mode-panel')) return
    if (!selectedElement) {
      setHoveredElement(target)
    }
  }, [selectedElement, isHidden, selectMode])

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
    document.addEventListener('click', handleClick)
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleMouseOver, handleMouseOut, handleClick, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown])

  // Apply styles
  const applyColor = (hex: string) => {
    if (!selectedElement) return
    switch (colorMode) {
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
    updateCurrentStyles()
  }

  const applyStyle = (property: string, value: string) => {
    if (!selectedElement) return
    ;(selectedElement.style as any)[property] = value
    updateCurrentStyles()
  }

  const updateCurrentStyles = () => {
    if (!selectedElement) return
    const computed = window.getComputedStyle(selectedElement)
    setCurrentStyles({
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
      textAlign: computed.textAlign,
      textTransform: computed.textTransform,
      fontSize: computed.fontSize,
      letterSpacing: computed.letterSpacing,
      lineHeight: computed.lineHeight,
      padding: computed.padding,
      borderRadius: computed.borderRadius,
    })
  }

  const resetStyles = () => {
    if (!selectedElement) return
    selectedElement.removeAttribute('style')
    updateCurrentStyles()
  }

  const copyStyles = () => {
    if (!selectedElement) return
    const style = selectedElement.getAttribute('style')
    if (style) {
      navigator.clipboard.writeText(style)
    }
  }

  const getElementInfo = (el: HTMLElement) => {
    let info = el.tagName.toLowerCase()
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(' ').filter(c => c && !c.includes('[')).slice(0, 1).join('.')
      if (classes) info += `.${classes}`
    }
    return info.slice(0, 20)
  }

  const sections: { key: ToolbarSection; label: string }[] = [
    { key: 'colors', label: '🎨' },
    { key: 'weight', label: 'W' },
    { key: 'size', label: 'Sz' },
    { key: 'align', label: '≡' },
    { key: 'spacing', label: 'Sp' },
    { key: 'padding', label: 'Pd' },
    { key: 'radius', label: '◐' },
  ]

  const disabled = !selectedElement

  // Completely hidden - just show a tiny button
  if (isHidden) {
    return (
      <button
        className="design-mode-panel"
        onClick={() => setIsHidden(false)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 99999,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          border: '2px solid #ac4d3c',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
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

      {/* Toolbar */}
      <div
        className="design-mode-panel"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          backgroundColor: '#1a1a1a',
          borderTopLeftRadius: isExpanded ? '20px' : '0',
          borderTopRightRadius: isExpanded ? '20px' : '0',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.4)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#fff',
          transition: 'border-radius 0.2s',
        }}
      >
        {/* Drag handle to hide */}
        <div
          onClick={() => setIsHidden(true)}
          style={{
            padding: '8px',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#555',
            borderRadius: '2px',
          }} />
        </div>

        {/* Compact Toolbar - Always Visible */}
        <div style={{ padding: '0 0 8px' }}>
          {/* Top row: Scrollable section tabs + controls */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', marginBottom: '8px' }}>
            {/* Select Mode Toggle */}
            <button
              onClick={() => setSelectMode(!selectMode)}
              style={{
                minWidth: '36px',
                height: '32px',
                borderRadius: '6px',
                border: selectMode ? '2px solid #18f0ed' : '1px solid #444',
                background: selectMode ? '#18f0ed' : '#333',
                color: selectMode ? '#000' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '6px',
                fontWeight: 700,
                flexShrink: 0,
              }}
              title={selectMode ? 'Selection ON - tap to disable' : 'Selection OFF - tap to enable'}
            >
              {selectMode ? '◎' : '○'}
            </button>

            {/* Scrollable section selector + color mode */}
            <div
              className="design-mode-scroll-container"
              style={{
                display: 'flex',
                gap: '4px',
                flex: 1,
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                touchAction: 'pan-x',
                paddingRight: '8px',
              }}
            >
              {sections.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    minWidth: '36px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeSection === s.key ? '#ac4d3c' : '#333',
                    color: activeSection === s.key ? '#fff' : '#888',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {s.label}
                </button>
              ))}

              {/* Divider */}
              <div style={{ width: '1px', background: '#444', margin: '4px 2px', flexShrink: 0 }} />

              {/* Color mode toggle (always visible, highlighted when on colors) */}
              {(['color', 'bg', 'border'] as ColorMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setColorMode(mode); setActiveSection('colors'); }}
                  style={{
                    minWidth: '36px',
                    height: '32px',
                    borderRadius: '6px',
                    border: activeSection === 'colors' && colorMode === mode ? '2px solid #ac4d3c' : '1px solid #444',
                    background: activeSection === 'colors' && colorMode === mode ? '#ac4d3c' : '#2a2a2a',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {mode === 'color' ? 'Txt' : mode === 'bg' ? 'BG' : 'Bdr'}
                </button>
              ))}
            </div>

            {/* Fixed controls on right */}
            <div style={{ display: 'flex', gap: '4px', marginLeft: '6px', flexShrink: 0 }}>
              {/* Element info */}
              <span style={{
                fontFamily: 'monospace',
                fontSize: '9px',
                color: selectedElement ? '#18f0ed' : selectMode ? '#555' : '#ac4d3c',
                alignSelf: 'center',
                maxWidth: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {selectedElement ? getElementInfo(selectedElement) : selectMode ? 'tap' : 'off'}
              </span>

              {/* Deselect */}
              {selectedElement && (
                <button
                  onClick={() => { setSelectedElement(null); setHoveredElement(null); }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#333',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '10px',
                  }}
                >
                  ✕
                </button>
              )}

              {/* Expand/Collapse */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#333',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                {isExpanded ? '▼' : '▲'}
              </button>
            </div>
          </div>

          {/* Scrollable options row */}
          <div
            ref={scrollRef}
            className="design-mode-scroll-container"
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              padding: '0 8px 8px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              touchAction: 'pan-x',
              minHeight: '44px',
            }}
          >
            {/* Colors */}
            {activeSection === 'colors' && BRAND_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => applyColor(color.hex)}
                title={color.name}
                style={{
                  minWidth: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: color.hex === '#ffffff' ? '1px solid #444' : 'none',
                  backgroundColor: color.hex,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  flexShrink: 0,
                }}
              />
            ))}

            {/* Font Weight */}
            {activeSection === 'weight' && FONT_WEIGHTS.map((w) => (
              <button
                key={w}
                onClick={() => applyStyle('fontWeight', w)}
                style={{
                  minWidth: '44px',
                  height: '36px',
                  borderRadius: '8px',
                  border: currentStyles.fontWeight === w ? '2px solid #ac4d3c' : '1px solid #444',
                  background: currentStyles.fontWeight === w ? '#ac4d3c' : '#2a2a2a',
                  color: '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  fontSize: '12px',
                  fontWeight: parseInt(w),
                  flexShrink: 0,
                }}
              >
                {w}
              </button>
            ))}

            {/* Font Size */}
            {activeSection === 'size' && FONT_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => applyStyle('fontSize', `${s}px`)}
                style={{
                  minWidth: '44px',
                  height: '36px',
                  borderRadius: '8px',
                  border: currentStyles.fontSize === `${s}px` ? '2px solid #ac4d3c' : '1px solid #444',
                  background: currentStyles.fontSize === `${s}px` ? '#ac4d3c' : '#2a2a2a',
                  color: '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  fontSize: '12px',
                  flexShrink: 0,
                }}
              >
                {s}
              </button>
            ))}

            {/* Text Align */}
            {activeSection === 'align' && (
              <>
                {TEXT_ALIGNS.map((a) => (
                  <button
                    key={a}
                    onClick={() => applyStyle('textAlign', a)}
                    style={{
                      minWidth: '50px',
                      height: '36px',
                      borderRadius: '8px',
                      border: currentStyles.textAlign?.startsWith(a) ? '2px solid #ac4d3c' : '1px solid #444',
                      background: currentStyles.textAlign?.startsWith(a) ? '#ac4d3c' : '#2a2a2a',
                      color: '#fff',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                      fontSize: '11px',
                      flexShrink: 0,
                      textTransform: 'capitalize',
                    }}
                  >
                    {a}
                  </button>
                ))}
                <div style={{ width: '1px', background: '#444', margin: '0 4px', flexShrink: 0 }} />
                <button
                  onClick={() => applyStyle('fontStyle', currentStyles.fontStyle === 'italic' ? 'normal' : 'italic')}
                  style={{
                    minWidth: '44px',
                    height: '36px',
                    borderRadius: '8px',
                    border: currentStyles.fontStyle === 'italic' ? '2px solid #ac4d3c' : '1px solid #444',
                    background: currentStyles.fontStyle === 'italic' ? '#ac4d3c' : '#2a2a2a',
                    color: '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    fontSize: '12px',
                    fontStyle: 'italic',
                    flexShrink: 0,
                  }}
                >
                  I
                </button>
                <button
                  onClick={() => applyStyle('textTransform', currentStyles.textTransform === 'uppercase' ? 'none' : 'uppercase')}
                  style={{
                    minWidth: '44px',
                    height: '36px',
                    borderRadius: '8px',
                    border: currentStyles.textTransform === 'uppercase' ? '2px solid #ac4d3c' : '1px solid #444',
                    background: currentStyles.textTransform === 'uppercase' ? '#ac4d3c' : '#2a2a2a',
                    color: '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  AA
                </button>
              </>
            )}

            {/* Letter Spacing & Line Height */}
            {activeSection === 'spacing' && (
              <>
                <span style={{ color: '#666', fontSize: '10px', alignSelf: 'center', marginRight: '4px', flexShrink: 0 }}>LS:</span>
                {LETTER_SPACINGS.map((ls) => (
                  <button
                    key={`ls-${ls}`}
                    onClick={() => applyStyle('letterSpacing', `${ls}px`)}
                    style={{
                      minWidth: '40px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #444',
                      background: '#2a2a2a',
                      color: '#fff',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                      fontSize: '11px',
                      flexShrink: 0,
                    }}
                  >
                    {ls}
                  </button>
                ))}
                <div style={{ width: '1px', background: '#444', margin: '0 4px', flexShrink: 0 }} />
                <span style={{ color: '#666', fontSize: '10px', alignSelf: 'center', marginRight: '4px', flexShrink: 0 }}>LH:</span>
                {LINE_HEIGHTS.map((lh) => (
                  <button
                    key={`lh-${lh}`}
                    onClick={() => applyStyle('lineHeight', lh)}
                    style={{
                      minWidth: '40px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #444',
                      background: '#2a2a2a',
                      color: '#fff',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                      fontSize: '11px',
                      flexShrink: 0,
                    }}
                  >
                    {lh}
                  </button>
                ))}
              </>
            )}

            {/* Padding */}
            {activeSection === 'padding' && PADDINGS.map((p) => (
              <button
                key={p}
                onClick={() => applyStyle('padding', p === '0' ? '0' : `${p}px`)}
                style={{
                  minWidth: '44px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#2a2a2a',
                  color: '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  fontSize: '12px',
                  flexShrink: 0,
                }}
              >
                {p}
              </button>
            ))}

            {/* Border Radius */}
            {activeSection === 'radius' && BORDER_RADII.map((r) => (
              <button
                key={r}
                onClick={() => applyStyle('borderRadius', r === '0' ? '0' : r === '999' ? '9999px' : `${r}px`)}
                style={{
                  minWidth: '44px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#2a2a2a',
                  color: '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  fontSize: '11px',
                  flexShrink: 0,
                }}
              >
                {r === '999' ? 'Full' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Section - Additional Controls */}
        {isExpanded && (
          <div style={{ borderTop: '1px solid #333', padding: '12px' }}>
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={resetStyles}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#2a2a2a',
                  color: '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  fontSize: '13px',
                }}
              >
                Reset All
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
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  fontSize: '13px',
                }}
              >
                Copy CSS
              </button>
            </div>

            {/* Current Styles Preview */}
            {selectedElement && (
              <div style={{
                background: '#222',
                borderRadius: '8px',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#888',
                maxHeight: '120px',
                overflow: 'auto',
              }}>
                <div style={{ color: '#18f0ed', marginBottom: '4px' }}>Applied styles:</div>
                {selectedElement.getAttribute('style')?.split(';').filter(Boolean).map((s, i) => (
                  <div key={i} style={{ color: '#aaa' }}>{s.trim()};</div>
                )) || <div style={{ color: '#555' }}>No inline styles</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hide scrollbar + scroll fade hint */}
      <style>{`
        .design-mode-panel *::-webkit-scrollbar {
          display: none;
        }
        .design-mode-scroll-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .design-mode-scroll-container::after {
          content: '';
          min-width: 8px;
          flex-shrink: 0;
        }
      `}</style>
    </>
  )
}

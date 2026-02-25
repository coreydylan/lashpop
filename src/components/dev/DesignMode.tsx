'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { sendDesignChanges } from '@/actions/design-mode'

// ============================================
// Brand Color Library
// ============================================
const BRAND_COLORS: { name: string; hex: string }[] = [
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
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#000000' },
]

// ============================================
// Typography & Layout Options (human-readable)
// ============================================
const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
]

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '40', '48', '56', '64']

const TEXT_ALIGNS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

const LINE_HEIGHTS = [
  { value: '1', label: 'Tight' },
  { value: '1.2', label: '1.2' },
  { value: '1.4', label: '1.4' },
  { value: '1.5', label: 'Normal' },
  { value: '1.6', label: '1.6' },
  { value: '1.8', label: 'Relaxed' },
  { value: '2', label: 'Loose' },
]

const LETTER_SPACINGS = [
  { value: '-1', label: 'Tight' },
  { value: '0', label: 'Normal' },
  { value: '1', label: 'Wide' },
  { value: '2', label: 'Wider' },
  { value: '3', label: 'Widest' },
]

const PADDINGS = [
  { value: '0', label: 'None' },
  { value: '8', label: 'Small' },
  { value: '16', label: 'Medium' },
  { value: '24', label: 'Large' },
  { value: '32', label: 'XL' },
  { value: '48', label: '2XL' },
]

const BORDER_RADII = [
  { value: '0', label: 'Sharp' },
  { value: '4', label: 'Slight' },
  { value: '8', label: 'Rounded' },
  { value: '16', label: 'More' },
  { value: '24', label: 'Pill' },
  { value: '999', label: 'Full' },
]

// ============================================
// Types
// ============================================
type ColorTarget = 'text' | 'background' | 'border'
type Tab = 'colors' | 'font' | 'layout'
type View = 'toolbar' | 'send'

interface StyleChange {
  elementLabel: string
  property: string
  displayValue: string
}

interface CustomColor {
  name: string
  hex: string
}

// ============================================
// Selection helpers: whitelist + bubble-up
// ============================================
const SELECTABLE_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'span', 'blockquote', 'li', 'label',
  'button',
  'section', 'nav', 'footer', 'header', 'main', 'article', 'aside',
  'img', 'picture', 'figure', 'figcaption',
])

const SELECTABLE_ATTRIBUTES = ['data-section-id', 'data-design-label']

function isSelectable(el: HTMLElement): boolean {
  if (el.closest('.design-mode-panel')) return false
  if (el === document.body || el === document.documentElement) return false
  const tag = el.tagName.toLowerCase()
  if (SELECTABLE_TAGS.has(tag)) return true
  for (const attr of SELECTABLE_ATTRIBUTES) {
    if (el.hasAttribute(attr)) return true
  }
  return false
}

function findSelectableAncestor(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el
  while (current && current !== document.body) {
    if (isSelectable(current)) return current
    current = current.parentElement
  }
  return null
}

const SECTION_NAMES: Record<string, string> = {
  hero: 'Hero Section',
  founder: 'Founder Letter',
  services: 'Services Section',
  team: 'Team Section',
  reviews: 'Reviews Section',
  instagram: 'Instagram Section',
  faq: 'FAQ Section',
  map: 'Map Section',
  footer: 'Footer',
}

function getElementLabel(el: HTMLElement): string {
  const designLabel = el.getAttribute('data-design-label')
  if (designLabel) return designLabel

  const sectionId = el.getAttribute('data-section-id')
  if (sectionId) return SECTION_NAMES[sectionId] || `${sectionId} Section`

  const tag = el.tagName.toLowerCase()
  const raw = el.textContent?.trim() || ''
  const textHint = raw ? ` "${raw.slice(0, 25)}${raw.length > 25 ? '...' : ''}"` : ''

  switch (tag) {
    case 'h1': return `Main Heading${textHint}`
    case 'h2': return `Heading${textHint}`
    case 'h3': return `Subheading${textHint}`
    case 'h4': case 'h5': case 'h6': return `Small Heading${textHint}`
    case 'p': return `Paragraph${textHint}`
    case 'a': return `Link${textHint}`
    case 'span': case 'label': return `Text${textHint}`
    case 'blockquote': return `Quote${textHint}`
    case 'li': return `List Item${textHint}`
    case 'button': return `Button${textHint}`
    case 'section': return 'Section'
    case 'nav': return 'Navigation'
    case 'footer': return 'Footer'
    case 'header': return 'Header'
    case 'main': return 'Main Content'
    case 'article': return 'Article'
    case 'aside': return 'Sidebar'
    case 'img': case 'picture': {
      const alt = el.getAttribute('alt')
      return alt ? `Image "${alt.slice(0, 25)}"` : 'Image'
    }
    case 'figure': return 'Figure'
    case 'figcaption': return `Caption${textHint}`
    default: return `Element${textHint}`
  }
}

// ============================================
// localStorage helpers
// ============================================
const CUSTOM_COLORS_KEY = 'lashpop-design-custom-colors'

function loadCustomColors(): CustomColor[] {
  try {
    const raw = localStorage.getItem(CUSTOM_COLORS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCustomColors(colors: CustomColor[]) {
  localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors))
}

// ============================================
// Main Component
// ============================================
export function DesignMode() {
  // Core state
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [isHidden, setIsHidden] = useState(true) // start minimized
  const [selectMode, setSelectMode] = useState(true)

  // Menu state
  const [activeTab, setActiveTab] = useState<Tab>('colors')
  const [colorTarget, setColorTarget] = useState<ColorTarget>('text')

  // View state (toolbar vs send form)
  const [view, setView] = useState<View>('toolbar')
  const [sendNotes, setSendNotes] = useState('')
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // Custom colors
  const [customColors, setCustomColors] = useState<CustomColor[]>([])
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Change tracking: keyed by "elementLabel|||property"
  const [changes, setChanges] = useState<Map<string, StyleChange>>(new Map())

  // Current element computed styles
  const [currentStyles, setCurrentStyles] = useState({
    fontWeight: '', fontSize: '', textAlign: '', fontStyle: '',
    textTransform: '', letterSpacing: '', lineHeight: '',
    padding: '', borderRadius: '',
  })

  // Touch tracking
  const touchStartPos = useRef({ x: 0, y: 0 })
  const isSwiping = useRef(false)

  // Load custom colors on mount
  useEffect(() => {
    setCustomColors(loadCustomColors())
  }, [])

  // Read computed styles when element changes
  useEffect(() => {
    if (!selectedElement) return
    const c = window.getComputedStyle(selectedElement)
    setCurrentStyles({
      fontWeight: c.fontWeight,
      fontSize: c.fontSize,
      textAlign: c.textAlign,
      fontStyle: c.fontStyle,
      textTransform: c.textTransform,
      letterSpacing: c.letterSpacing,
      lineHeight: c.lineHeight,
      padding: c.padding,
      borderRadius: c.borderRadius,
    })
  }, [selectedElement])

  // ============================================
  // Event handlers
  // ============================================
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!selectMode) return
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    isSwiping.current = false
  }, [selectMode])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!selectMode) return
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x)
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y)
    if (dx > 10 || dy > 10) isSwiping.current = true
  }, [selectMode])

  const selectTarget = useCallback((target: HTMLElement) => {
    if (target.closest('.design-mode-panel')) return
    const selectable = findSelectableAncestor(target)
    if (selectable) {
      setSelectedElement(selectable)
      setHoveredElement(null)
    }
  }, [])

  const handleClick = useCallback((e: MouseEvent) => {
    if (isHidden || !selectMode) return
    const target = e.target as HTMLElement
    if (target.closest('.design-mode-panel')) return
    e.preventDefault()
    e.stopPropagation()
    selectTarget(target)
  }, [isHidden, selectMode, selectTarget])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isHidden || !selectMode || isSwiping.current) return
    const target = e.target as HTMLElement
    if (target.closest('.design-mode-panel')) return
    // Prevent link navigation and button actions
    if (target.closest('a, button')) {
      e.preventDefault()
    }
    selectTarget(target)
  }, [isHidden, selectMode, selectTarget])

  const handleMouseOver = useCallback((e: MouseEvent) => {
    if (isHidden || !selectMode || selectedElement) return
    const target = e.target as HTMLElement
    if (target.closest('.design-mode-panel')) return
    const selectable = findSelectableAncestor(target)
    if (selectable) setHoveredElement(selectable)
  }, [selectedElement, isHidden, selectMode])

  const handleMouseOut = useCallback(() => setHoveredElement(null), [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { setSelectedElement(null); setHoveredElement(null) }
  }, [])

  useEffect(() => {
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('click', handleClick, true) // capture phase to intercept before links
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleMouseOver, handleMouseOut, handleClick, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown])

  // ============================================
  // Style application + change tracking
  // ============================================
  const refreshStyles = useCallback(() => {
    if (!selectedElement) return
    const c = window.getComputedStyle(selectedElement)
    setCurrentStyles({
      fontWeight: c.fontWeight,
      fontSize: c.fontSize,
      textAlign: c.textAlign,
      fontStyle: c.fontStyle,
      textTransform: c.textTransform,
      letterSpacing: c.letterSpacing,
      lineHeight: c.lineHeight,
      padding: c.padding,
      borderRadius: c.borderRadius,
    })
  }, [selectedElement])

  const trackChange = useCallback((property: string, displayValue: string) => {
    if (!selectedElement) return
    const label = getElementLabel(selectedElement)
    const key = `${label}|||${property}`
    setChanges(prev => {
      const next = new Map(prev)
      next.set(key, { elementLabel: label, property, displayValue })
      return next
    })
  }, [selectedElement])

  const applyColor = useCallback((hex: string) => {
    if (!selectedElement) return
    const allColors = [...BRAND_COLORS, ...customColors]
    const colorObj = allColors.find(c => c.hex.toLowerCase() === hex.toLowerCase())
    const displayValue = colorObj ? `${colorObj.name} (${hex})` : hex
    const propertyLabels: Record<ColorTarget, string> = {
      text: 'Text Color',
      background: 'Background',
      border: 'Border Color',
    }
    switch (colorTarget) {
      case 'text':
        selectedElement.style.color = hex
        break
      case 'background':
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
    trackChange(propertyLabels[colorTarget], displayValue)
    refreshStyles()
  }, [selectedElement, colorTarget, customColors, trackChange, refreshStyles])

  const applyStyle = useCallback((cssProp: string, value: string, propertyLabel: string, displayValue: string) => {
    if (!selectedElement) return
    ;(selectedElement.style as any)[cssProp] = value
    trackChange(propertyLabel, displayValue)
    refreshStyles()
  }, [selectedElement, trackChange, refreshStyles])

  const resetStyles = useCallback(() => {
    if (!selectedElement) return
    selectedElement.removeAttribute('style')
    refreshStyles()
  }, [selectedElement, refreshStyles])

  // ============================================
  // Custom colors
  // ============================================
  const addCustomColor = useCallback((hex: string) => {
    const num = customColors.length + 1
    const newColor: CustomColor = { name: `Custom ${num}`, hex }
    const updated = [...customColors, newColor]
    setCustomColors(updated)
    saveCustomColors(updated)
  }, [customColors])

  const removeCustomColor = useCallback((idx: number) => {
    const updated = customColors.filter((_, i) => i !== idx)
    setCustomColors(updated)
    saveCustomColors(updated)
  }, [customColors])

  // ============================================
  // Send to developer
  // ============================================
  const handleSend = useCallback(async () => {
    setSendStatus('sending')
    const changeList = Array.from(changes.values()).map(c => ({
      elementLabel: c.elementLabel,
      property: c.property,
      value: c.displayValue,
    }))
    const result = await sendDesignChanges(
      changeList,
      customColors,
      window.location.href,
      sendNotes
    )
    if (result.success) {
      setSendStatus('sent')
      setTimeout(() => {
        setSendStatus('idle')
        setView('toolbar')
        setSendNotes('')
      }, 2500)
    } else {
      setSendStatus('error')
      setTimeout(() => setSendStatus('idle'), 3000)
    }
  }, [changes, customColors, sendNotes])

  const disabled = !selectedElement
  const changeCount = changes.size

  // ============================================
  // Render: Hidden / minimized state
  // ============================================
  if (isHidden) {
    return (
      <button
        className="design-mode-panel"
        onClick={() => setIsHidden(false)}
        style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 99999,
          width: 48, height: 48, borderRadius: '50%',
          backgroundColor: '#1a1a1a', border: '2px solid #ac4d3c',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: '#fff',
        }}
        title="Open Design Mode"
      >
        <span role="img" aria-label="Design Mode">&#x1F3A8;</span>
      </button>
    )
  }

  // ============================================
  // Render: Main toolbar
  // ============================================
  const elementLabel = selectedElement ? getElementLabel(selectedElement) : null

  return (
    <>
      {/* Hover highlight */}
      {hoveredElement && !selectedElement && (() => {
        const r = hoveredElement.getBoundingClientRect()
        return (
          <div style={{
            position: 'fixed', left: r.left - 2, top: r.top - 2,
            width: r.width + 4, height: r.height + 4,
            border: '2px dashed #18f0ed', pointerEvents: 'none',
            zIndex: 99998, borderRadius: 4,
          }}>
            <div style={{
              position: 'absolute', top: -22, left: 0,
              background: '#18f0ed', color: '#000', fontSize: 10,
              padding: '2px 6px', borderRadius: 3, fontWeight: 600,
              whiteSpace: 'nowrap', fontFamily: 'system-ui, sans-serif',
            }}>
              {getElementLabel(hoveredElement)}
            </div>
          </div>
        )
      })()}

      {/* Selected highlight */}
      {selectedElement && (() => {
        const r = selectedElement.getBoundingClientRect()
        return (
          <div style={{
            position: 'fixed', left: r.left - 2, top: r.top - 2,
            width: r.width + 4, height: r.height + 4,
            border: '3px solid #ac4d3c', pointerEvents: 'none',
            zIndex: 99998, borderRadius: 4,
          }}>
            <div style={{
              position: 'absolute', top: -22, left: 0,
              background: '#ac4d3c', color: '#fff', fontSize: 10,
              padding: '2px 6px', borderRadius: 3, fontWeight: 600,
              whiteSpace: 'nowrap', fontFamily: 'system-ui, sans-serif',
            }}>
              {elementLabel}
            </div>
          </div>
        )
      })()}

      {/* Toolbar */}
      <div
        className="design-mode-panel"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 99999,
          backgroundColor: '#1a1a1a', borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
          fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#fff',
        }}
      >
        {/* Handle bar (hide) */}
        <div
          onClick={() => setIsHidden(true)}
          style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
        >
          <div style={{
            width: 36, height: 4, backgroundColor: '#555', borderRadius: 2,
          }} />
          <span style={{
            position: 'absolute', right: 12, fontSize: 10, color: '#555', marginTop: -1,
          }}>hide</span>
        </div>

        {/* Selection bar */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '4px 12px 8px',
          gap: 8, borderBottom: '1px solid #333',
        }}>
          {/* Select mode toggle */}
          <button
            onClick={() => setSelectMode(!selectMode)}
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: selectMode ? '2px solid #18f0ed' : '1px solid #444',
              background: selectMode ? '#18f0ed' : '#333',
              color: selectMode ? '#000' : '#888',
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            {selectMode ? 'Select ON' : 'Select OFF'}
          </button>

          {/* Element label or onboarding hint */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {elementLabel ? (
              <div style={{
                fontSize: 12, color: '#ddd', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {elementLabel}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#777', fontStyle: 'italic' }}>
                Tap any element on the page to start editing
              </div>
            )}
          </div>

          {/* Deselect */}
          {selectedElement && (
            <button
              onClick={() => { setSelectedElement(null); setHoveredElement(null) }}
              style={{
                padding: '4px 8px', borderRadius: 6, border: 'none',
                background: '#333', color: '#aaa', cursor: 'pointer',
                fontSize: 11, flexShrink: 0,
              }}
            >
              Deselect
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
          {([
            { key: 'colors' as Tab, label: 'Colors' },
            { key: 'font' as Tab, label: 'Font' },
            { key: 'layout' as Tab, label: 'Layout' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setView('toolbar') }}
              style={{
                flex: 1, padding: '8px 0', border: 'none',
                borderBottom: activeTab === tab.key && view === 'toolbar' ? '2px solid #ac4d3c' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer',
                color: activeTab === tab.key && view === 'toolbar' ? '#fff' : '#666',
                fontSize: 13, fontWeight: activeTab === tab.key && view === 'toolbar' ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        {view === 'toolbar' ? (
          <div style={{ padding: '10px 0', maxHeight: '40vh', overflowY: 'auto' }}>

            {/* ======================== COLORS TAB ======================== */}
            {activeTab === 'colors' && (
              <div>
                {/* Color target toggle */}
                <div style={{ display: 'flex', gap: 4, padding: '0 12px 10px', borderBottom: '1px solid #2a2a2a', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: '#777', alignSelf: 'center', marginRight: 4 }}>Apply to:</span>
                  {([
                    { key: 'text' as ColorTarget, label: 'Text Color' },
                    { key: 'background' as ColorTarget, label: 'Background' },
                    { key: 'border' as ColorTarget, label: 'Border' },
                  ]).map(ct => (
                    <button
                      key={ct.key}
                      onClick={() => setColorTarget(ct.key)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                        border: colorTarget === ct.key ? '2px solid #ac4d3c' : '1px solid #444',
                        background: colorTarget === ct.key ? '#ac4d3c' : '#2a2a2a',
                        color: '#fff', cursor: 'pointer',
                      }}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>

                {/* Brand colors */}
                <div style={{ padding: '0 12px 6px' }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Brand Palette</div>
                  <div
                    className="design-mode-scroll-container"
                    style={{
                      display: 'flex', gap: 8, overflowX: 'auto',
                      paddingBottom: 4,
                      WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                    }}
                  >
                    {BRAND_COLORS.map(color => (
                      <button
                        key={color.hex}
                        onClick={() => applyColor(color.hex)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                          background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.4 : 1, flexShrink: 0, padding: 0,
                        }}
                      >
                        <div style={{
                          width: 44, height: 36, borderRadius: 8,
                          backgroundColor: color.hex,
                          border: color.hex === '#ffffff' ? '1px solid #444' : '1px solid transparent',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                        <span style={{ fontSize: 9, color: '#999', whiteSpace: 'nowrap', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom colors */}
                <div style={{ padding: '8px 12px 0', borderTop: '1px solid #2a2a2a' }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                    Custom Colors
                  </div>
                  <div
                    className="design-mode-scroll-container"
                    style={{
                      display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
                      WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                    }}
                  >
                    {customColors.map((color, idx) => (
                      <div key={`${color.hex}-${idx}`} style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          onClick={() => applyColor(color.hex)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            background: 'transparent', border: 'none',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.4 : 1, padding: 0,
                          }}
                        >
                          <div style={{
                            width: 44, height: 36, borderRadius: 8,
                            backgroundColor: color.hex, border: '1px solid #444',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                          <span style={{ fontSize: 9, color: '#999', whiteSpace: 'nowrap' }}>
                            {color.name}
                          </span>
                        </button>
                        {/* Remove button */}
                        <button
                          onClick={() => removeCustomColor(idx)}
                          style={{
                            position: 'absolute', top: -4, right: -4,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#555', border: 'none', color: '#fff',
                            fontSize: 10, lineHeight: '16px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          x
                        </button>
                      </div>
                    ))}

                    {/* Add color button */}
                    <button
                      onClick={() => colorInputRef.current?.click()}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        flexShrink: 0, padding: 0,
                      }}
                    >
                      <div style={{
                        width: 44, height: 36, borderRadius: 8,
                        border: '2px dashed #555', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: '#666',
                      }}>
                        +
                      </div>
                      <span style={{ fontSize: 9, color: '#666' }}>Add</span>
                    </button>
                    <input
                      ref={colorInputRef}
                      type="color"
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                      onChange={(e) => addCustomColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ======================== FONT TAB ======================== */}
            {activeTab === 'font' && (
              <div style={{ padding: '0 12px' }}>
                {/* Font Weight */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Weight</div>
                  <div className="design-mode-scroll-container" style={{
                    display: 'flex', gap: 6, overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                  }}>
                    {FONT_WEIGHTS.map(w => {
                      const active = currentStyles.fontWeight === w.value
                      return (
                        <button
                          key={w.value}
                          onClick={() => applyStyle('fontWeight', w.value, 'Font Weight', w.label)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                            border: active ? '2px solid #ac4d3c' : '1px solid #444',
                            background: active ? '#ac4d3c' : '#2a2a2a',
                            color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.4 : 1, fontSize: 11,
                            fontWeight: parseInt(w.value), whiteSpace: 'nowrap',
                          }}
                        >
                          {w.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Size</div>
                  <div className="design-mode-scroll-container" style={{
                    display: 'flex', gap: 6, overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                  }}>
                    {FONT_SIZES.map(s => {
                      const active = currentStyles.fontSize === `${s}px`
                      return (
                        <button
                          key={s}
                          onClick={() => applyStyle('fontSize', `${s}px`, 'Font Size', `${s}px`)}
                          style={{
                            minWidth: 40, padding: '6px 8px', borderRadius: 8, flexShrink: 0,
                            border: active ? '2px solid #ac4d3c' : '1px solid #444',
                            background: active ? '#ac4d3c' : '#2a2a2a',
                            color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.4 : 1, fontSize: 11,
                          }}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Text Align + Style */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Alignment & Style</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TEXT_ALIGNS.map(a => {
                      const active = currentStyles.textAlign?.startsWith(a.value)
                      return (
                        <button
                          key={a.value}
                          onClick={() => applyStyle('textAlign', a.value, 'Text Align', a.label)}
                          style={{
                            padding: '6px 14px', borderRadius: 8,
                            border: active ? '2px solid #ac4d3c' : '1px solid #444',
                            background: active ? '#ac4d3c' : '#2a2a2a',
                            color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.4 : 1, fontSize: 11,
                          }}
                        >
                          {a.label}
                        </button>
                      )
                    })}

                    <div style={{ width: 1, background: '#444', margin: '0 2px' }} />

                    <button
                      onClick={() => {
                        const next = currentStyles.fontStyle === 'italic' ? 'normal' : 'italic'
                        applyStyle('fontStyle', next, 'Font Style', next === 'italic' ? 'Italic' : 'Normal')
                      }}
                      style={{
                        padding: '6px 14px', borderRadius: 8,
                        border: currentStyles.fontStyle === 'italic' ? '2px solid #ac4d3c' : '1px solid #444',
                        background: currentStyles.fontStyle === 'italic' ? '#ac4d3c' : '#2a2a2a',
                        color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.4 : 1, fontSize: 11, fontStyle: 'italic',
                      }}
                    >
                      Italic
                    </button>

                    <button
                      onClick={() => {
                        const next = currentStyles.textTransform === 'uppercase' ? 'none' : 'uppercase'
                        applyStyle('textTransform', next, 'Text Transform', next === 'uppercase' ? 'UPPERCASE' : 'Normal')
                      }}
                      style={{
                        padding: '6px 14px', borderRadius: 8,
                        border: currentStyles.textTransform === 'uppercase' ? '2px solid #ac4d3c' : '1px solid #444',
                        background: currentStyles.textTransform === 'uppercase' ? '#ac4d3c' : '#2a2a2a',
                        color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.4 : 1, fontSize: 11,
                      }}
                    >
                      UPPERCASE
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== LAYOUT TAB ======================== */}
            {activeTab === 'layout' && (
              <div style={{ padding: '0 12px' }}>
                {/* Letter Spacing */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Letter Spacing</div>
                  <div className="design-mode-scroll-container" style={{
                    display: 'flex', gap: 6, overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                  }}>
                    {LETTER_SPACINGS.map(ls => (
                      <button
                        key={ls.value}
                        onClick={() => applyStyle('letterSpacing', `${ls.value}px`, 'Letter Spacing', ls.label)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                          border: '1px solid #444', background: '#2a2a2a',
                          color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.4 : 1, fontSize: 11, whiteSpace: 'nowrap',
                        }}
                      >
                        {ls.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Height */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Line Height</div>
                  <div className="design-mode-scroll-container" style={{
                    display: 'flex', gap: 6, overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                  }}>
                    {LINE_HEIGHTS.map(lh => (
                      <button
                        key={lh.value}
                        onClick={() => applyStyle('lineHeight', lh.value, 'Line Height', lh.label)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                          border: '1px solid #444', background: '#2a2a2a',
                          color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.4 : 1, fontSize: 11, whiteSpace: 'nowrap',
                        }}
                      >
                        {lh.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Padding */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Padding</div>
                  <div className="design-mode-scroll-container" style={{
                    display: 'flex', gap: 6, overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                  }}>
                    {PADDINGS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => applyStyle('padding', p.value === '0' ? '0' : `${p.value}px`, 'Padding', p.label)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                          border: '1px solid #444', background: '#2a2a2a',
                          color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.4 : 1, fontSize: 11, whiteSpace: 'nowrap',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Corners</div>
                  <div className="design-mode-scroll-container" style={{
                    display: 'flex', gap: 6, overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                  }}>
                    {BORDER_RADII.map(r => (
                      <button
                        key={r.value}
                        onClick={() => applyStyle('borderRadius', r.value === '999' ? '9999px' : r.value === '0' ? '0' : `${r.value}px`, 'Corners', r.label)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                          border: '1px solid #444', background: '#2a2a2a',
                          color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.4 : 1, fontSize: 11, whiteSpace: 'nowrap',
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ======================== SEND VIEW ======================== */
          <div style={{ padding: 12, maxHeight: '50vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#ddd' }}>
              Send Changes to Developer
            </div>

            {/* Change summary */}
            <div style={{
              background: '#222', borderRadius: 8, padding: 10, marginBottom: 12,
              maxHeight: 140, overflowY: 'auto', fontSize: 12,
            }}>
              {Array.from(changes.values()).map((c, i) => (
                <div key={i} style={{ marginBottom: 4, color: '#bbb' }}>
                  <span style={{ color: '#18f0ed' }}>{c.elementLabel}</span>
                  {' — '}
                  <span style={{ color: '#999' }}>{c.property}:</span>
                  {' '}
                  <span style={{ color: '#ddd' }}>{c.displayValue}</span>
                </div>
              ))}
              {customColors.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #333', color: '#999' }}>
                  + {customColors.length} custom color{customColors.length !== 1 ? 's' : ''} added
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
                Add a note (optional)
              </label>
              <textarea
                value={sendNotes}
                onChange={e => setSendNotes(e.target.value)}
                placeholder="e.g. I liked the heading better in this darker color..."
                style={{
                  width: '100%', minHeight: 60, padding: 10, borderRadius: 8,
                  border: '1px solid #444', background: '#2a2a2a', color: '#ddd',
                  fontSize: 12, resize: 'vertical', fontFamily: 'system-ui, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setView('toolbar')}
                style={{
                  flex: 1, padding: 10, borderRadius: 8,
                  border: '1px solid #444', background: '#2a2a2a',
                  color: '#aaa', cursor: 'pointer', fontSize: 13,
                }}
              >
                Back
              </button>
              <button
                onClick={handleSend}
                disabled={sendStatus === 'sending'}
                style={{
                  flex: 2, padding: 10, borderRadius: 8, border: 'none',
                  background: sendStatus === 'sent' ? '#2d7a3a' : sendStatus === 'error' ? '#9a2c2c' : '#ac4d3c',
                  color: '#fff', cursor: sendStatus === 'sending' ? 'wait' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                  opacity: sendStatus === 'sending' ? 0.7 : 1,
                }}
              >
                {sendStatus === 'idle' && 'Send to Developer'}
                {sendStatus === 'sending' && 'Sending...'}
                {sendStatus === 'sent' && 'Sent!'}
                {sendStatus === 'error' && 'Failed — Try Again'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {view === 'toolbar' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderTop: '1px solid #333',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {selectedElement && (
                <button
                  onClick={resetStyles}
                  style={{
                    padding: '5px 10px', borderRadius: 6, border: '1px solid #444',
                    background: '#2a2a2a', color: '#aaa', cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Reset Element
                </button>
              )}
              <span style={{ fontSize: 10, color: '#666' }}>
                {changeCount > 0
                  ? `${changeCount} change${changeCount !== 1 ? 's' : ''}`
                  : 'No changes yet'
                }
              </span>
              <span style={{ fontSize: 9, color: '#444' }}>Changes are temporary previews</span>
            </div>

            <button
              onClick={() => setView('send')}
              disabled={changeCount === 0}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: changeCount > 0 ? '#ac4d3c' : '#333',
                color: changeCount > 0 ? '#fff' : '#555',
                cursor: changeCount > 0 ? 'pointer' : 'not-allowed',
                fontSize: 12, fontWeight: 600, flexShrink: 0,
              }}
            >
              Send to Developer
            </button>
          </div>
        )}
      </div>

      {/* Scrollbar hiding + smooth scroll */}
      <style>{`
        .design-mode-panel *::-webkit-scrollbar { display: none; }
        .design-mode-scroll-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          scrollbar-width: none;
        }
        .design-mode-scroll-container::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'

/**
 * Temporary diagnostic overlay. Renders NOTHING unless the URL contains
 * `?scrolldebug` (or `?scrolldebug=1`), so it is safe to ship — normal users
 * never see it. When armed, it patches scrollIntoView and listens for scroll /
 * focus / tap / viewport-resize events, then prints a rolling log on screen
 * with a COPY LOG button.
 *
 * Purpose: the work-with-us tab-switch "scroll to the bottom then back to top"
 * only reproduces on real iOS Safari (never in Chromium or WebKit emulation),
 * so we need to see what actually moves the scroll on the device itself.
 *
 * Usage on the phone:
 *   https://lashpop.vercel.app/work-with-us?scrolldebug=1
 *   reproduce the bounce, tap COPY LOG, paste it back.
 *
 * DELETE this file (and its import in page.tsx) once the bug is fixed.
 */
export function ScrollDebugOverlay() {
  const [armed, setArmed] = useState(false)
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!/scrolldebug/.test(window.location.search)) return
    setArmed(true)

    const buf: string[] = []
    const t0 = performance.now()
    const push = (s: string) => {
      const t = ((performance.now() - t0) / 1000).toFixed(2)
      buf.unshift(`${t}  ${s}`)
      if (buf.length > 60) buf.pop()
      setLines(buf.slice())
    }

    const origSIV = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (o?: ScrollIntoViewOptions | boolean) {
      const r = this.getBoundingClientRect()
      const cls = (this.className || '').toString().split(/\s+/).slice(0, 2).join('.')
      push(
        `SIV ${this.tagName}.${cls} absTop=${Math.round(r.top + window.scrollY)} curY=${Math.round(window.scrollY)} docH=${document.documentElement.scrollHeight} vh=${window.innerHeight} opts=${JSON.stringify(o || {})}`
      )
      return origSIV.call(this, o)
    }

    let last = -1
    const onScroll = () => {
      const y = Math.round(window.scrollY)
      if (Math.abs(y - last) < 40) return
      last = y
      push(`scroll y=${y} docH=${document.documentElement.scrollHeight} vh=${window.innerHeight}`)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (!el || !el.getBoundingClientRect) return
      const r = el.getBoundingClientRect()
      push(`FOCUSIN ${el.tagName}#${(el as HTMLInputElement).name || ''} absTop=${Math.round(r.top + window.scrollY)}`)
    }
    document.addEventListener('focusin', onFocus, true)

    const onTap = (e: Event) => {
      const btn = (e.target as HTMLElement)?.closest?.('button')
      if (btn) push(`TAP "${(btn.getAttribute('aria-label') || btn.textContent || '').trim().slice(0, 28)}" y=${Math.round(window.scrollY)}`)
    }
    document.addEventListener('click', onTap, true)

    const vv = window.visualViewport
    const onVV = () => push(`visualViewport h=${Math.round(vv!.height)} offTop=${Math.round(vv!.offsetTop)} pageTop=${Math.round(vv!.pageTop)}`)
    vv?.addEventListener('resize', onVV)
    vv?.addEventListener('scroll', onVV)

    push(`--- armed --- docH=${document.documentElement.scrollHeight} vh=${window.innerHeight} vvH=${vv ? Math.round(vv.height) : 'n/a'}`)

    return () => {
      Element.prototype.scrollIntoView = origSIV
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('focusin', onFocus, true)
      document.removeEventListener('click', onTap, true)
      vv?.removeEventListener('resize', onVV)
      vv?.removeEventListener('scroll', onVV)
    }
  }, [])

  if (!armed) return null

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, maxHeight: '42vh', overflow: 'auto',
        zIndex: 99999, background: 'rgba(0,0,0,0.86)', color: '#3f6', padding: '6px 8px',
        font: '10px/1.35 ui-monospace,Menlo,monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}
    >
      <button
        onClick={() => { navigator.clipboard?.writeText(lines.slice().reverse().join('\n')); }}
        style={{ color: '#fff', background: '#444', border: '1px solid #888', borderRadius: 4, padding: '3px 10px', marginBottom: 6, fontSize: 11 }}
      >
        COPY LOG
      </button>
      {lines.map((l, i) => (
        <div key={i} style={{ opacity: i === 0 ? 1 : 0.8 }}>{l}</div>
      ))}
    </div>
  )
}

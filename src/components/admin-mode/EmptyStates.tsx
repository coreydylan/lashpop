'use client'

/**
 * EmptyStates — the small empty / default / add helpers for inline admin.
 *
 * Implements §1 "Empty / Default / Add" and §3.G of the design system: the four
 * presentational pieces a section reaches for when it has no real content yet, or
 * is still showing brand starter copy.
 *
 *   - DefaultChip       a tiny top-LEFT "Default" pill (structure corner) marking
 *                       a surface that's still on starter copy. (COPY.defaultChip)
 *   - AddFirstRow       full-width charcoal "+ Add your first {noun}" button for
 *                       an empty list. (COPY.addFirst)
 *   - AddSectionStrip   a dashed ghost strip "+ Add {thing} (not set yet)" for a
 *                       section that doesn't exist on the page yet.
 *   - ResetToDefaultButton  a ghost "⤺ Reset to default" action. (COPY.resetToDefault)
 *
 * These are PURE UI: no dirty registry, no data logic, no network. The call site
 * owns persistence via the onAdd / onReset callbacks. Each respects admin mode —
 * when admin mode is OFF they render NOTHING (these affordances only exist for an
 * editing admin, never the public visitor), matching EditableText's pass-through
 * contract (which renders content; these render no content of their own).
 *
 * All colors/icons/strings come from adminTokens (ADMIN / AdminIcons / COPY).
 */

import React, { useState } from 'react'
import clsx from 'clsx'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { ADMIN, AdminIcons, COPY } from './adminTokens'

/* -------------------------------------------------------------------------- */
/* DefaultChip                                                                */
/* -------------------------------------------------------------------------- */

export interface DefaultChipProps {
  /** Extra classes for positioning inside the host surface (defaults to top-LEFT). */
  className?: string
}

/**
 * A tiny "Default" pill that marks a surface still using brand starter copy.
 * Lives in the STRUCTURE corner (top-LEFT) per the corner contract, alongside
 * grip / eye. The host positions it; this just paints the pill. Non-interactive
 * (the editable surface beneath it is what you tap to "make it yours").
 */
export function DefaultChip({ className }: DefaultChipProps) {
  const { enabled } = useAdminMode()
  if (!enabled) return null

  return (
    <span
      className={clsx(
        'pointer-events-none absolute left-0.5 top-0.5 z-10 inline-flex select-none items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm',
        className
      )}
      style={{ background: `${ADMIN.accent}29`, color: ADMIN.accentStrong }}
      title="This is our starter copy — tap to make it yours."
      data-admin-default-chip
    >
      {COPY.defaultChip}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* AddFirstRow                                                                */
/* -------------------------------------------------------------------------- */

export interface AddFirstRowProps {
  /** Plain-English noun, e.g. "credential", "photo". -> "+ Add your first credential". */
  noun: string
  /** Call site owns the add. May be async (button shows a spinner while pending). */
  onAdd: () => void | Promise<void>
}

/**
 * Full-width charcoal call-to-action for an EMPTY list — the "nothing here yet"
 * state. 48px tall (>= the 44px tap floor). Charcoal = primary action (ADMIN.ink).
 */
export function AddFirstRow({ noun, onAdd }: AddFirstRowProps) {
  const { enabled } = useAdminMode()
  const [busy, setBusy] = useState(false)
  if (!enabled) return null

  const Add = AdminIcons.add
  const Spinner = AdminIcons.spinner

  const handle = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onAdd()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className="flex h-12 min-h-[44px] w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: ADMIN.ink }}
      data-admin-add-first
    >
      {busy ? (
        <Spinner className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Add className="h-4 w-4" aria-hidden />
      )}
      {COPY.addFirst(noun)}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* AddSectionStrip                                                            */
/* -------------------------------------------------------------------------- */

export interface AddSectionStripProps {
  /** What the section is, e.g. "an announcement bar". -> "+ Add an announcement bar". */
  thing: string
  /** Call site owns adding the section. May be async. */
  onAdd: () => void | Promise<void>
}

/**
 * A dashed ghost strip for a section that DOESN'T EXIST on the page yet (§3.G:
 * "+ Add an announcement bar (not set yet)"). Uses the universal idle dashed cue
 * (ADMIN.accent), escalating to the strong color on hover/focus. 48px tall.
 */
export function AddSectionStrip({ thing, onAdd }: AddSectionStripProps) {
  const { enabled } = useAdminMode()
  const [busy, setBusy] = useState(false)
  if (!enabled) return null

  const Add = AdminIcons.add
  const Spinner = AdminIcons.spinner

  const handle = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onAdd()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className="group/add-section flex h-12 min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-transparent text-sm font-medium transition-colors disabled:opacity-60"
      style={{
        border: `1px dashed ${ADMIN.accent}`,
        color: ADMIN.accentStrong,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = ADMIN.accentStrong
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = ADMIN.accent
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = ADMIN.accentStrong
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = ADMIN.accent
      }}
      data-admin-add-section
    >
      {busy ? (
        <Spinner className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Add className="h-4 w-4" aria-hidden />
      )}
      <span>
        Add {thing}{' '}
        <span className="font-normal opacity-70">(not set yet)</span>
      </span>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* ResetToDefaultButton                                                       */
/* -------------------------------------------------------------------------- */

export interface ResetToDefaultButtonProps {
  /** Call site owns the reset (e.g. PATCH value -> NULL). Resolves on success. */
  onReset: () => Promise<void>
  /** Extra classes for placement within an editor footer. */
  className?: string
}

/**
 * A low-emphasis ghost "⤺ Reset to default" action — brings the original brand
 * copy back. Uses the ONE revert glyph (AdminIcons.revert); the label
 * disambiguates it as a reset. Shows a spinner while the reset is in flight.
 */
export function ResetToDefaultButton({ onReset, className }: ResetToDefaultButtonProps) {
  const { enabled } = useAdminMode()
  const [busy, setBusy] = useState(false)
  if (!enabled) return null

  const Revert = AdminIcons.revert
  const Spinner = AdminIcons.spinner

  const handle = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onReset()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className={clsx(
        'inline-flex min-h-[44px] items-center gap-1.5 rounded px-2 text-[11px] font-medium text-stone-500 transition-colors hover:text-stone-800 disabled:opacity-60',
        className
      )}
      data-admin-reset-default
    >
      {busy ? (
        <Spinner className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Revert className="h-3.5 w-3.5" aria-hidden />
      )}
      {COPY.resetToDefault}
    </button>
  )
}

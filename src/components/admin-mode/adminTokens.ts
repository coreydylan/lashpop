/**
 * Inline-admin design tokens, icon vocabulary, and microcopy — the single source
 * every Editable* primitive imports so the whole system reads as ONE tool.
 * See tmp/inline-admin-design-system.md.
 */
import type { CSSProperties } from 'react'
import {
  Pencil,
  Image as ImageIcon,
  Settings,
  GripVertical,
  Eye,
  EyeOff,
  Star,
  Plus,
  RotateCcw,
  Trash2,
  FolderOpen,
  LogOut,
  Check,
  X,
  Loader2,
} from 'lucide-react'

// ---- Color, one meaning each ----
export const ADMIN = {
  /** idle "you can edit this" — dashed, every surface. */
  accent: '#C9A9A6',
  /** escalation: hover / focus / actively editing. NEVER at idle. */
  accentStrong: '#b14e33',
  /** primary buttons + the chrome bar */
  ink: '#1C1917',
} as const

/** The idle "editable" outline — identical on text, image, list, card, section. */
export const editableIdleStyle: CSSProperties = {
  outline: `1px dashed ${ADMIN.accent}`,
  outlineOffset: 2,
  background: `${ADMIN.accent}14`,
  borderRadius: 2,
}

// ---- Icon vocabulary (one meaning each) ----
export const AdminIcons = {
  editText: Pencil,
  swapImage: ImageIcon,
  settings: Settings,
  grip: GripVertical,
  show: Eye,
  hide: EyeOff,
  feature: Star,
  add: Plus,
  /** the ONE revert glyph — the LABEL disambiguates revert / reset / undo. */
  revert: RotateCcw,
  remove: Trash2,
  assets: FolderOpen,
  exit: LogOut,
  saved: Check,
  cancel: X,
  spinner: Loader2,
} as const

// ---- Microcopy (plain English, reassurance baked in) ----
export const COPY = {
  goLiveHint: "Won't go live until you tap Save all.",
  useVagaro: (noun: string) => `Use Vagaro ${noun}`,
  vagaroNote: (noun: string) =>
    `This ${noun} comes from Vagaro. Saving your edit will show your version on the site instead.`,
  hideFromSite: 'Hide from site',
  showOnSite: 'Show on site',
  hiddenRibbon: 'Hidden from your site',
  resetToDefault: 'Reset to default',
  defaultChip: 'Default',
  addFirst: (noun: string) => `Add your first ${noun}`,
  saveError: 'Couldn’t save — check your connection and try again.',
  /** The single destructive-confirm string. Nothing here is irreversible. */
  removeConfirm: (noun: string) => `Remove ${noun} from the page? You can add it back anytime.`,
} as const

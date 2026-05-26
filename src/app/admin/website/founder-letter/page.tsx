import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Old static-stub admin (per tmp/admin-audit.md was 100% dead — no API,
// no DB, told users to edit source). Replaced by /admin/content/founder-letter
// which actually persists changes. Permanent redirect so any bookmarks
// or muscle memory still land in the right place.
export default function LegacyFounderLetterRedirect() {
  redirect('/admin/content/founder-letter')
}

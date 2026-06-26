import { Flower2 } from 'lucide-react'

/**
 * Branded "Photo coming soon" card shown in place of a portfolio/gallery image
 * whose original was lost in the R2 outage (asset.recovery_status set).
 *
 * PUBLIC-FACING: never render the admin recovery note here. The note
 * (where we think the original is) is surfaced only in /admin.
 */
export function MissingPhotoCard({
  className = '',
  rounded = 'rounded-2xl',
  lost = false,
}: {
  className?: string
  rounded?: string
  /** true = no surviving copy ("lost") vs recoverable ("missing") — copy only differs subtly */
  lost?: boolean
}) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-cream to-warm-sand/30 px-6 text-center ${rounded} ${className}`}
      aria-label="Photo coming soon"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 shadow-sm">
        <Flower2 className="h-5 w-5 text-dusty-rose" aria-hidden />
      </span>
      <div>
        <p className="font-serif text-lg leading-tight text-charcoal/70">
          {lost ? 'Photo unavailable' : 'Photo coming soon'}
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-dusty-rose/70">
          LashPop
        </p>
      </div>
    </div>
  )
}

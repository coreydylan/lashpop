import { Hammer } from 'lucide-react'

/**
 * Placeholder for admin sections that are planned but not built yet, so their
 * sidebar links resolve to a clean page instead of a 404. Keep the matching
 * nav entry's status as 'coming-soon' in sections.ts.
 */
export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="h2 text-dune">{title}</h1>
      </div>
      <div className="glass rounded-3xl border border-sage/20 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-golden/30 to-golden/10 flex items-center justify-center mx-auto mb-4">
          <Hammer className="w-7 h-7 text-golden" />
        </div>
        <p className="text-dune font-medium mb-1">Coming soon</p>
        {description && <p className="text-sm text-dune/60 max-w-md mx-auto">{description}</p>}
      </div>
    </div>
  )
}

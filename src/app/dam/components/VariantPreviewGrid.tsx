"use client"

import { useState, useMemo, useCallback } from "react"
import { X, CheckCircle, AlertTriangle, XCircle, Edit, ChevronDown, ChevronUp, Download, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import type {
  VariantPreviewGridProps,
  GeneratedVariant,
  SocialPlatform,
  VariantStatus
} from "@/types/social-variants-ui"
import {
  getPlatformLabel,
  getStatusColor,
  getStatusBgColor
} from "@/types/social-variants-ui"

// Status icon mapping
const STATUS_ICONS: Record<VariantStatus, React.ReactNode> = {
  perfect: <CheckCircle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  error: <XCircle className="w-4 h-4" />,
  pending: <div className="w-4 h-4 border-2 border-sage/30 border-t-sage rounded-full animate-spin" />
}

interface GroupedVariants {
  platform: SocialPlatform
  variants: GeneratedVariant[]
  approvedCount: number
}

export function VariantPreviewGrid({
  variants,
  onApprove,
  onReject,
  onAdjust,
  onClose
}: VariantPreviewGridProps) {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<SocialPlatform>>(new Set())
  const [selectedVariant, setSelectedVariant] = useState<GeneratedVariant | null>(null)
  const [autoSaveApproved, setAutoSaveApproved] = useState(true)
  const [createCollection, setCreateCollection] = useState(true)
  const [autoTag, setAutoTag] = useState(true)

  // Group variants by platform
  const groupedVariants = useMemo<GroupedVariants[]>(() => {
    const groups = new Map<SocialPlatform, GeneratedVariant[]>()

    variants.forEach(variant => {
      const existing = groups.get(variant.platform) || []
      groups.set(variant.platform, [...existing, variant])
    })

    return Array.from(groups.entries()).map(([platform, platformVariants]) => ({
      platform,
      variants: platformVariants,
      approvedCount: platformVariants.filter(v => approvedIds.has(v.id)).length
    }))
  }, [variants, approvedIds])

  // Toggle platform expansion
  const togglePlatform = useCallback((platform: SocialPlatform) => {
    setExpandedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }, [])

  // Toggle variant approval
  const toggleApproval = useCallback((variantId: string) => {
    setApprovedIds(prev => {
      const next = new Set(prev)
      if (next.has(variantId)) {
        next.delete(variantId)
      } else {
        next.add(variantId)
      }
      return next
    })
  }, [])

  // Approve all variants
  const approveAll = useCallback(() => {
    const allIds = variants.map(v => v.id)
    setApprovedIds(new Set(allIds))
  }, [variants])

  // Handle save/export
  const handleSave = useCallback(() => {
    const approvedVariants = Array.from(approvedIds)
    onApprove(approvedVariants)
  }, [approvedIds, onApprove])

  // Handle regenerate all
  const handleRegenerateAll = useCallback(() => {
    const allIds = variants.map(v => v.id)
    onReject(allIds)
  }, [variants, onReject])

  // Handle discard
  const handleDiscard = useCallback(() => {
    onClose()
  }, [onClose])

  const approvedCount = approvedIds.size
  const totalCount = variants.length

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-cream rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-sage/20">
            <div>
              <h2 className="text-2xl font-bold text-dune">Review Variants</h2>
              <p className="text-sm text-sage mt-1">
                {approvedCount} / {totalCount} approved
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-warm-sand hover:bg-sage/20 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-sage" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-240px)] p-8">
            <div className="space-y-6">
              {groupedVariants.map(({ platform, variants: platformVariants, approvedCount: platformApprovedCount }) => {
                const isExpanded = expandedPlatforms.has(platform) || expandedPlatforms.size === 0
                const allApproved = platformApprovedCount === platformVariants.length

                return (
                  <div key={platform} className="border border-sage/20 rounded-2xl overflow-hidden bg-white">
                    {/* Platform Header */}
                    <button
                      onClick={() => togglePlatform(platform)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-warm-sand/30 hover:bg-warm-sand/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-dune">{getPlatformLabel(platform)}</h3>
                        <span className="text-sm text-sage">
                          ({platformApprovedCount} / {platformVariants.length} approved)
                        </span>
                        {allApproved && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-sage" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-sage" />
                      )}
                    </button>

                    {/* Platform Variants Grid */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {platformVariants.map(variant => {
                              const isApproved = approvedIds.has(variant.id)
                              const hasWarnings = variant.warnings.length > 0

                              return (
                                <div
                                  key={variant.id}
                                  className={clsx(
                                    "relative rounded-xl overflow-hidden border-2 transition-all group",
                                    isApproved
                                      ? "border-green-500 ring-2 ring-green-500/20"
                                      : variant.status === "error"
                                      ? "border-red-300"
                                      : variant.status === "warning"
                                      ? "border-yellow-300"
                                      : "border-sage/20 hover:border-dusty-rose/50"
                                  )}
                                >
                                  {/* Thumbnail */}
                                  <button
                                    onClick={() => setSelectedVariant(variant)}
                                    className="w-full aspect-square bg-warm-sand/20 relative overflow-hidden"
                                  >
                                    <div className="absolute inset-0 flex items-center justify-center text-sage/40 text-xs">
                                      {variant.width} × {variant.height}
                                    </div>
                                    {/* In real implementation, show actual preview */}
                                    {variant.previewUrl && (
                                      <img
                                        src={variant.previewUrl}
                                        alt={variant.displayName}
                                        className="w-full h-full object-cover"
                                      />
                                    )}

                                    {/* Status Badge */}
                                    <div className={clsx(
                                      "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center",
                                      getStatusBgColor(variant.status)
                                    )}>
                                      <div className={getStatusColor(variant.status)}>
                                        {STATUS_ICONS[variant.status]}
                                      </div>
                                    </div>

                                    {/* Approved Checkmark */}
                                    {isApproved && (
                                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                      </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                  </button>

                                  {/* Info */}
                                  <div className="p-3 bg-white">
                                    <div className="text-xs font-semibold text-dune truncate">
                                      {variant.displayName}
                                    </div>
                                    <div className="text-xs text-sage mt-0.5">
                                      {variant.width} × {variant.height}
                                    </div>

                                    {/* Quality Score */}
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="flex-1 h-1.5 bg-sage/20 rounded-full overflow-hidden">
                                        <div
                                          className={clsx(
                                            "h-full transition-all",
                                            variant.qualityScore >= 90 ? "bg-green-500" :
                                            variant.qualityScore >= 70 ? "bg-yellow-500" :
                                            "bg-red-500"
                                          )}
                                          style={{ width: `${variant.qualityScore}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-sage font-semibold">
                                        {variant.qualityScore}
                                      </span>
                                    </div>

                                    {/* Warnings */}
                                    {hasWarnings && (
                                      <div className="mt-2 space-y-1">
                                        {variant.warnings.slice(0, 2).map((warning, idx) => (
                                          <div key={idx} className="text-xs text-yellow-700 flex items-start gap-1">
                                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                            <span className="line-clamp-1">{warning}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-3">
                                      <button
                                        onClick={() => toggleApproval(variant.id)}
                                        className={clsx(
                                          "flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                          isApproved
                                            ? "bg-green-600 text-white hover:bg-green-700"
                                            : "bg-dusty-rose text-cream hover:bg-dusty-rose/90"
                                        )}
                                      >
                                        {isApproved ? "Approved" : "Approve"}
                                      </button>
                                      <button
                                        onClick={() => onAdjust(variant.id)}
                                        className="px-3 py-1.5 rounded-lg bg-sage/10 hover:bg-sage/20 transition-colors"
                                        aria-label="Edit variant"
                                      >
                                        <Edit className="w-3.5 h-3.5 text-sage" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Options & Footer */}
          <div className="border-t border-sage/20 bg-warm-sand/30">
            {/* Options */}
            <div className="px-8 py-4 border-b border-sage/10">
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSaveApproved}
                    onChange={(e) => setAutoSaveApproved(e.target.checked)}
                    className="w-4 h-4 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                  />
                  <span className="text-sm text-dune">Auto-save approved variants</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createCollection}
                    onChange={(e) => setCreateCollection(e.target.checked)}
                    className="w-4 h-4 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                  />
                  <span className="text-sm text-dune">Create collection</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoTag}
                    onChange={(e) => setAutoTag(e.target.checked)}
                    className="w-4 h-4 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
                  />
                  <span className="text-sm text-dune">Auto-tag with platform</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 py-6 flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  onClick={handleRegenerateAll}
                  className="px-6 py-2.5 rounded-full text-sage hover:bg-sage/10 transition-colors font-semibold flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Regenerate All
                </button>
                <button
                  onClick={handleDiscard}
                  className="px-6 py-2.5 rounded-full text-sage hover:bg-sage/10 transition-colors font-semibold"
                >
                  Discard
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={approveAll}
                  className="px-6 py-2.5 rounded-full bg-white text-dusty-rose border-2 border-dusty-rose hover:bg-dusty-rose hover:text-cream transition-all font-semibold"
                >
                  Approve All
                </button>
                <button
                  onClick={handleSave}
                  disabled={approvedCount === 0}
                  className={clsx(
                    "px-8 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2",
                    approvedCount === 0
                      ? "bg-sage/20 text-sage/50 cursor-not-allowed"
                      : "bg-dusty-rose text-cream hover:bg-dusty-rose/90 shadow-lg hover:shadow-xl"
                  )}
                >
                  <Download className="w-4 h-4" />
                  Save {approvedCount > 0 ? `(${approvedCount})` : ""}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full-size Preview Modal */}
      <AnimatePresence>
        {selectedVariant && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
              onClick={() => setSelectedVariant(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-8 pointer-events-none"
            >
              <div
                className="bg-cream rounded-2xl p-8 max-w-3xl max-h-[90vh] overflow-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-dune">{selectedVariant.displayName}</h3>
                    <p className="text-sm text-sage mt-1">
                      {selectedVariant.width} × {selectedVariant.height}px • Quality: {selectedVariant.qualityScore}/100
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedVariant(null)}
                    className="w-10 h-10 rounded-full bg-warm-sand hover:bg-sage/20 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-sage" />
                  </button>
                </div>
                <div className="bg-warm-sand/30 rounded-xl p-4 flex items-center justify-center">
                  <div className="text-sage/60 text-sm">
                    Preview would be shown here
                    <br />
                    {selectedVariant.width} × {selectedVariant.height}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

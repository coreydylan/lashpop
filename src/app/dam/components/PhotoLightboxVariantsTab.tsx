"use client"

/**
 * PhotoLightbox Variants Tab
 *
 * This component renders a "Variants" tab inside the PhotoLightbox overlay
 * showing all social media variants generated from the current source asset.
 *
 * Usage:
 * Import this component and add it to the PhotoLightbox's overlay render.
 */

import { useState } from "react"
import { Sparkles, Download, Instagram, Facebook, Twitter, Linkedin, Youtube, Music, Info, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import type { SocialVariantAsset, SocialPlatform } from "@/types/social-variants-ui"
import { getPlatformLabel } from "@/types/social-variants-ui"

interface PhotoLightboxVariantsTabProps {
  sourceAssetId: string
  variants: SocialVariantAsset[]
  onGenerateMore?: () => void
  onExportAll?: () => void
  onVariantClick?: (variant: SocialVariantAsset) => void
}

// Platform icon mapping
const PLATFORM_ICONS: Record<SocialPlatform, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  pinterest: <Info className="w-4 h-4" />,
  tiktok: <Music className="w-4 h-4" />
}

export function PhotoLightboxVariantsTab({
  sourceAssetId,
  variants,
  onGenerateMore,
  onExportAll,
  onVariantClick
}: PhotoLightboxVariantsTabProps) {
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<SocialPlatform>>(new Set())

  // Group variants by platform
  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.platform]) {
      acc[variant.platform] = []
    }
    acc[variant.platform].push(variant)
    return acc
  }, {} as Record<SocialPlatform, SocialVariantAsset[]>)

  const togglePlatform = (platform: SocialPlatform) => {
    setExpandedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }

  // No variants state
  if (variants.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-dusty-rose/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-dusty-rose" />
          </div>
          <h3 className="text-2xl font-bold text-cream mb-3">
            No Variants Yet
          </h3>
          <p className="text-cream/70 mb-8">
            Generate optimized social media variants from this image for Instagram, Facebook, Twitter, and more.
          </p>
          {onGenerateMore && (
            <button
              onClick={onGenerateMore}
              className="px-8 py-3 rounded-full bg-dusty-rose hover:bg-dusty-rose/90 text-cream font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Generate Variants
            </button>
          )}
        </div>
      </div>
    )
  }

  // With variants
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cream/10">
        <div>
          <h3 className="text-xl font-bold text-cream">Social Variants</h3>
          <p className="text-sm text-cream/70 mt-1">
            {variants.length} variant{variants.length !== 1 ? 's' : ''} • {Object.keys(groupedVariants).length} platform{Object.keys(groupedVariants).length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {onExportAll && (
            <button
              onClick={onExportAll}
              className="px-4 py-2 rounded-full bg-dusty-rose/20 hover:bg-dusty-rose/30 text-cream font-semibold transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
          )}
          {onGenerateMore && (
            <button
              onClick={onGenerateMore}
              className="px-4 py-2 rounded-full bg-dusty-rose hover:bg-dusty-rose/90 text-cream font-semibold transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate More
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {Object.entries(groupedVariants).map(([platform, platformVariants]) => {
          const isExpanded = expandedPlatforms.has(platform as SocialPlatform) || expandedPlatforms.size === 0

          return (
            <div
              key={platform}
              className="bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden"
            >
              {/* Platform Header */}
              <button
                onClick={() => togglePlatform(platform as SocialPlatform)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dusty-rose/20 flex items-center justify-center">
                    {PLATFORM_ICONS[platform as SocialPlatform]}
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-cream">
                      {getPlatformLabel(platform as SocialPlatform)}
                    </h4>
                    <p className="text-xs text-cream/60">
                      {platformVariants.length} variant{platformVariants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-cream/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cream/60" />
                )}
              </button>

              {/* Variants Grid */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {platformVariants.map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => onVariantClick?.(variant)}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-black/40 hover:bg-black/20 transition-all border border-cream/10 hover:border-dusty-rose/50"
                        >
                          {/* Thumbnail */}
                          <img
                            src={variant.filePath}
                            alt={variant.displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="text-xs font-semibold text-cream truncate">
                                {variant.displayName}
                              </div>
                              <div className="text-xs text-cream/70 mt-0.5">
                                {variant.width} × {variant.height}
                              </div>
                            </div>
                          </div>

                          {/* Quality indicator */}
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                            <div className={clsx(
                              "text-xs font-bold",
                              variant.qualityScore >= 90 ? "text-green-400" :
                              variant.qualityScore >= 70 ? "text-yellow-400" :
                              "text-red-400"
                            )}>
                              {variant.qualityScore}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

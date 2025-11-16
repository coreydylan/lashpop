"use client"

import { useState } from "react"
import { Instagram, Facebook, Twitter, Linkedin, Youtube, Music, Info, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import clsx from "clsx"
import type {
  SocialVariantCardProps,
  SocialPlatform
} from "@/types/social-variants-ui"
import {
  getPlatformLabel,
  getStatusColor,
  getStatusBgColor
} from "@/types/social-variants-ui"

// Platform icon mapping
const PLATFORM_ICONS: Record<SocialPlatform, React.ReactNode> = {
  instagram: <Instagram className="w-3 h-3" />,
  facebook: <Facebook className="w-3 h-3" />,
  twitter: <Twitter className="w-3 h-3" />,
  linkedin: <Linkedin className="w-3 h-3" />,
  youtube: <Youtube className="w-3 h-3" />,
  pinterest: <Info className="w-3 h-3" />,
  tiktok: <Music className="w-3 h-3" />
}

// Platform colors
const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  facebook: "bg-blue-600",
  twitter: "bg-sky-500",
  linkedin: "bg-blue-700",
  youtube: "bg-red-600",
  pinterest: "bg-red-700",
  tiktok: "bg-black"
}

export function SocialVariantCard({
  variant,
  selected = false,
  onSelect,
  onClick
}: SocialVariantCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    // If there's a select handler and modifier key is pressed, toggle selection
    if (onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault()
      e.stopPropagation()
      onSelect()
      return
    }

    // Otherwise, open lightbox or detail view
    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      className={clsx(
        "relative arch-full overflow-hidden bg-warm-sand/40 group cursor-pointer touch-manipulation shadow-sm hover:shadow-lg transition-all aspect-square",
        selected && "ring-4 ring-dusty-rose/80"
      )}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="w-full h-full relative">
        <img
          src={variant.filePath}
          alt={variant.fileName}
          draggable={false}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          className={clsx(
            "w-full h-full object-cover transition-all duration-500",
            imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
          )}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* Selection overlay */}
      {selected && (
        <>
          <div className="absolute inset-0 rounded-[28px] ring-4 ring-dusty-rose pointer-events-none" />
          <div className="absolute inset-0 bg-dusty-rose/30 pointer-events-none rounded-[28px]" />
        </>
      )}

      {/* Top badges */}
      <div className="absolute top-3 left-3 flex gap-2">
        {/* Platform badge */}
        <div className={clsx(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-white shadow-lg backdrop-blur-sm",
          PLATFORM_COLORS[variant.platform]
        )}>
          {PLATFORM_ICONS[variant.platform]}
          <span className="text-xs font-semibold hidden sm:inline">
            {getPlatformLabel(variant.platform)}
          </span>
        </div>

        {/* Variant type badge */}
        <div className="px-2 py-1 rounded-lg bg-dune/80 backdrop-blur-sm text-cream text-xs font-semibold shadow-lg">
          {variant.displayName}
        </div>
      </div>

      {/* Status indicator */}
      <div className={clsx(
        "absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm",
        getStatusBgColor(variant.status)
      )}>
        <div className={getStatusColor(variant.status)}>
          {variant.status === "perfect" ? (
            <CheckCircle className="w-4 h-4" />
          ) : variant.status === "warning" ? (
            <AlertTriangle className="w-4 h-4" />
          ) : null}
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-2">
          {/* Dimensions */}
          <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-cream text-xs font-semibold shadow-lg">
            {variant.width} × {variant.height}
          </div>

          {/* Export status */}
          {variant.exported && (
            <div className="px-2 py-1 rounded-lg bg-green-600/80 backdrop-blur-sm text-white text-xs font-semibold shadow-lg flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Exported</span>
            </div>
          )}

          {/* Link to source (small preview icon) */}
          {variant.sourceAssetPath && (
            <div
              className="ml-auto w-8 h-8 rounded-lg border-2 border-white/80 overflow-hidden shadow-lg backdrop-blur-sm bg-white/20"
              title="Source image"
            >
              <img
                src={variant.sourceAssetPath}
                alt="Source"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quality indicator bar (subtle) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
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
    </div>
  )
}

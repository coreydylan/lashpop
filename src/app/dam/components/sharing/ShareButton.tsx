"use client"

import { Share2 } from "lucide-react"
import { useState } from "react"
import { ShareModal } from "./ShareModal"

interface ShareButtonProps {
  resourceId: string
  resourceType: "asset" | "collection" | "set"
  isOwner?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "button"
  className?: string
}

export function ShareButton({
  resourceId,
  resourceType,
  isOwner = true,
  size = "md",
  variant = "icon",
  className = ""
}: ShareButtonProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  if (!isOwner) {
    return null // Only owners can share
  }

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsShareModalOpen(true)
          }}
          className={`${sizeClasses[size]} rounded-full bg-white/90 backdrop-blur-sm border border-sage/20 hover:border-dusty-rose/50 flex items-center justify-center transition-all hover:scale-110 shadow-sm ${className}`}
          title="Share"
        >
          <Share2 className={`${iconSizes[size]} text-sage hover:text-dusty-rose transition-colors`} />
        </button>

        {isShareModalOpen && (
          <ShareModal
            resourceId={resourceId}
            resourceType={resourceType}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsShareModalOpen(true)
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-sage/20 hover:border-dusty-rose/50 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4 text-sage" />
        <span className="text-sm font-medium text-dune">Share</span>
      </button>

      {isShareModalOpen && (
        <ShareModal
          resourceId={resourceId}
          resourceType={resourceType}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  )
}

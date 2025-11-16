"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { ShareDialog } from "./ShareDialog"
import { cn } from "@/lib/utils"

interface ShareButtonProps {
  resourceType: "asset" | "collection" | "set"
  resourceId: string
  variant?: "icon" | "button"
  className?: string
}

export function ShareButton({
  resourceType,
  resourceId,
  variant = "button",
  className
}: ShareButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={() => setIsDialogOpen(true)}
          className={cn(
            "w-10 h-10 rounded-full hover:bg-warm-sand/30 flex items-center justify-center transition-colors group",
            className
          )}
          aria-label="Share"
          title="Share"
        >
          <Share2 className="w-5 h-5 text-sage group-hover:text-dusty-rose transition-colors" />
        </button>

        <ShareDialog
          resourceType={resourceType}
          resourceId={resourceId}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className={cn(
          "btn btn-secondary flex items-center gap-2 py-3",
          className
        )}
      >
        <Share2 className="w-5 h-5" />
        <span>Share</span>
      </button>

      <ShareDialog
        resourceType={resourceType}
        resourceId={resourceId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}

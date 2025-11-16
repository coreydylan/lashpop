"use client"

import { Eye, Edit3, Crown } from "lucide-react"

export type PermissionLevel = "owner" | "edit" | "view"

interface PermissionBadgeProps {
  level: PermissionLevel
  size?: "sm" | "md"
  showLabel?: boolean
  className?: string
}

export function PermissionBadge({
  level,
  size = "sm",
  showLabel = true,
  className = ""
}: PermissionBadgeProps) {
  const config = {
    owner: {
      icon: Crown,
      label: "Owner",
      color: "bg-gradient-to-r from-amber-500 to-yellow-600",
      textColor: "text-cream"
    },
    edit: {
      icon: Edit3,
      label: "Can Edit",
      color: "bg-gradient-to-r from-sage to-ocean-mist",
      textColor: "text-cream"
    },
    view: {
      icon: Eye,
      label: "View Only",
      color: "bg-gradient-to-r from-gray-400 to-gray-500",
      textColor: "text-cream"
    }
  }

  const { icon: Icon, label, color, textColor } = config[level]

  const sizeClasses = size === "sm" ? "text-[9px] px-2 py-0.5" : "text-xs px-3 py-1"
  const iconSize = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full ${color} ${textColor} font-semibold uppercase tracking-wide shadow-sm ${sizeClasses} ${className}`}
    >
      <Icon className={iconSize} />
      {showLabel && <span>{label}</span>}
    </div>
  )
}

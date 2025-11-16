"use client"

import { cn } from "@/lib/utils"

export type PermissionLevel = "owner" | "admin" | "editor" | "viewer"

interface PermissionBadgeProps {
  permissionLevel: PermissionLevel
  variant?: "small" | "default"
  className?: string
}

const permissionConfig = {
  owner: {
    label: "Owner",
    bgColor: "bg-ocean-mist",
    textColor: "text-dune",
    borderColor: "border-ocean-mist/40"
  },
  admin: {
    label: "Admin",
    bgColor: "bg-terracotta/20",
    textColor: "text-terracotta",
    borderColor: "border-terracotta/30"
  },
  editor: {
    label: "Editor",
    bgColor: "bg-golden/20",
    textColor: "text-golden",
    borderColor: "border-golden/30"
  },
  viewer: {
    label: "Viewer",
    bgColor: "bg-sage/10",
    textColor: "text-sage",
    borderColor: "border-sage/20"
  }
}

export function PermissionBadge({
  permissionLevel,
  variant = "default",
  className
}: PermissionBadgeProps) {
  const config = permissionConfig[permissionLevel]
  const isSmall = variant === "small"

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium transition-colors",
        config.bgColor,
        config.textColor,
        config.borderColor,
        isSmall ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      {config.label}
    </div>
  )
}

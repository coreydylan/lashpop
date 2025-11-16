"use client"

/**
 * Asset Context Menu
 *
 * Enhanced context menu for assets with social variant generation options.
 * This component can be integrated into the AssetGrid to provide right-click
 * actions for variant generation.
 *
 * Usage:
 * Add this to AssetGrid or AssetCard components to enable right-click menu.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  Sparkles,
  Eye,
  Download,
  Trash2,
  Copy,
  Share2,
  Edit,
  Image as ImageIcon,
  Layers
} from "lucide-react"
import clsx from "clsx"

export interface ContextMenuAction {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: "default" | "primary" | "danger"
  divider?: boolean
}

interface AssetContextMenuProps {
  assetId: string
  hasVariants?: boolean
  onGenerateVariants?: () => void
  onViewVariants?: () => void
  onDownload?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onShare?: () => void
  onEdit?: () => void
  customActions?: ContextMenuAction[]
  children: React.ReactNode
}

export function AssetContextMenu({
  assetId,
  hasVariants = false,
  onGenerateVariants,
  onViewVariants,
  onDownload,
  onDelete,
  onDuplicate,
  onShare,
  onEdit,
  customActions = [],
  children
}: AssetContextMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Build menu actions
  const actions: ContextMenuAction[] = [
    // Variant actions (if supported)
    ...(onGenerateVariants ? [{
      id: "generate-variants",
      label: "Generate Social Variants...",
      icon: <Sparkles className="w-4 h-4" />,
      onClick: onGenerateVariants,
      variant: "primary" as const
    }] : []),
    ...(onViewVariants && hasVariants ? [{
      id: "view-variants",
      label: `View Variants${hasVariants ? '' : ' (None)'}`,
      icon: <Layers className="w-4 h-4" />,
      onClick: onViewVariants,
      divider: true
    }] : []),

    // Standard actions
    ...(onEdit ? [{
      id: "edit",
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: onEdit
    }] : []),
    ...(onDownload ? [{
      id: "download",
      label: "Download",
      icon: <Download className="w-4 h-4" />,
      onClick: onDownload
    }] : []),
    ...(onDuplicate ? [{
      id: "duplicate",
      label: "Duplicate",
      icon: <Copy className="w-4 h-4" />,
      onClick: onDuplicate
    }] : []),
    ...(onShare ? [{
      id: "share",
      label: "Share",
      icon: <Share2 className="w-4 h-4" />,
      onClick: onShare,
      divider: true
    }] : []),

    // Custom actions
    ...customActions,

    // Danger actions
    ...(onDelete ? [{
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onDelete,
      variant: "danger" as const,
      divider: customActions.length === 0 && !onShare
    }] : [])
  ]

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setMenuPosition({ x: e.clientX, y: e.clientY })
    setMenuVisible(true)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuVisible(false)
      }
    }

    if (menuVisible) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuVisible])

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      setMenuVisible(false)
    }

    if (menuVisible) {
      window.addEventListener("scroll", handleScroll, true)
      return () => window.removeEventListener("scroll", handleScroll, true)
    }
  }, [menuVisible])

  // Handle action click
  const handleActionClick = (action: ContextMenuAction) => {
    action.onClick()
    setMenuVisible(false)
  }

  // Context Menu Component
  const ContextMenuPortal = () => {
    if (!menuVisible || typeof window === "undefined") return null

    return createPortal(
      <div
        ref={menuRef}
        className="fixed z-[200] min-w-[220px] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md"
        style={{
          top: `${menuPosition.y}px`,
          left: `${menuPosition.x}px`,
          background: 'linear-gradient(135deg, rgba(250, 247, 241, 0.98) 0%, rgba(235, 224, 203, 0.98) 100%)',
          border: '1px solid rgba(161, 151, 129, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, index) => (
          <div key={action.id}>
            {action.divider && index > 0 && (
              <div className="h-px bg-sage/20 my-1" />
            )}
            <button
              onClick={() => handleActionClick(action)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left",
                action.variant === "primary"
                  ? "text-dusty-rose hover:bg-dusty-rose/10"
                  : action.variant === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-sage hover:bg-warm-sand/50"
              )}
            >
              {action.icon && (
                <span className="flex-shrink-0">
                  {action.icon}
                </span>
              )}
              <span className="flex-1">{action.label}</span>
            </button>
          </div>
        ))}
      </div>,
      document.body
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        className="w-full h-full"
      >
        {children}
      </div>
      <ContextMenuPortal />
    </>
  )
}

/**
 * Example usage with variant count badge
 */
export function AssetCardWithVariants({
  asset,
  variantCount = 0,
  onGenerateVariants,
  onViewVariants,
  children
}: {
  asset: any
  variantCount?: number
  onGenerateVariants?: () => void
  onViewVariants?: () => void
  children: React.ReactNode
}) {
  return (
    <AssetContextMenu
      assetId={asset.id}
      hasVariants={variantCount > 0}
      onGenerateVariants={onGenerateVariants}
      onViewVariants={onViewVariants}
    >
      <div className="relative">
        {children}

        {/* Variant count badge */}
        {variantCount > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dusty-rose/90 backdrop-blur-sm shadow-lg">
              <Layers className="w-3.5 h-3.5 text-cream" />
              <span className="text-xs font-bold text-cream">
                {variantCount}
              </span>
            </div>
          </div>
        )}
      </div>
    </AssetContextMenu>
  )
}

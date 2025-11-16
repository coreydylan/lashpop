"use client"

/* eslint-disable @next/next/no-img-element */

import { Image as ImageIcon, FolderOpen, Eye, Edit, MessageSquare } from "lucide-react"
import Link from "next/link"

// Simple date formatting utility
function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
}

interface SharedResource {
  id: string
  resourceType: "asset" | "set" | "collection"
  resourceId: string
  sharedBy: {
    id: string
    name: string
    imageUrl?: string
  }
  sharedAt: Date
  permission: "view" | "edit" | "comment"
  resource: {
    id: string
    name: string
    thumbnailUrl?: string
    itemCount?: number
  }
}

interface SharedResourceCardProps {
  resource: SharedResource
}

const permissionConfig = {
  view: {
    label: "View",
    icon: Eye,
    color: "bg-sage/10 text-sage",
  },
  edit: {
    label: "Edit",
    icon: Edit,
    color: "bg-dusty-rose/10 text-dusty-rose",
  },
  comment: {
    label: "Comment",
    icon: MessageSquare,
    color: "bg-dune/10 text-dune",
  },
}

export function SharedResourceCard({ resource }: SharedResourceCardProps) {
  const permissionInfo = permissionConfig[resource.permission]
  const PermissionIcon = permissionInfo.icon

  // Determine link based on resource type
  const getResourceLink = () => {
    switch (resource.resourceType) {
      case "asset":
        return `/dam?asset=${resource.resourceId}`
      case "set":
        return `/dam/sets/${resource.resourceId}`
      case "collection":
        return `/dam?collection=${resource.resourceId}`
      default:
        return "/dam"
    }
  }

  return (
    <Link
      href={getResourceLink()}
      className="group block arch-full overflow-hidden bg-white hover:shadow-lg transition-all border border-sage/10 hover:border-dusty-rose/30"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-warm-sand/20 overflow-hidden">
        {resource.resource.thumbnailUrl ? (
          <img
            src={resource.resource.thumbnailUrl}
            alt={resource.resource.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {resource.resourceType === "asset" ? (
              <ImageIcon className="w-12 h-12 text-sage/30" />
            ) : (
              <FolderOpen className="w-12 h-12 text-sage/30" />
            )}
          </div>
        )}

        {/* Permission Badge */}
        <div className="absolute top-2 right-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm ${permissionInfo.color} shadow-sm`}>
            <PermissionIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{permissionInfo.label}</span>
          </div>
        </div>

        {/* Item Count (for sets/collections) */}
        {resource.resource.itemCount !== undefined && resource.resource.itemCount > 0 && (
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white shadow-sm">
              <span className="text-xs font-medium">{resource.resource.itemCount} items</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Resource Name */}
        <h3 className="font-semibold text-dune mb-2 line-clamp-2 group-hover:text-dusty-rose transition-colors">
          {resource.resource.name}
        </h3>

        {/* Shared By */}
        <div className="flex items-center gap-2 mb-2">
          {resource.sharedBy.imageUrl ? (
            <div className="w-6 h-6 rounded-full overflow-hidden border border-sage/20 flex-shrink-0">
              <img
                src={resource.sharedBy.imageUrl}
                alt={resource.sharedBy.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-sage">
                {resource.sharedBy.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <p className="text-sm text-sage">
            <span className="font-medium">{resource.sharedBy.name}</span>
          </p>
        </div>

        {/* Share Date */}
        <p className="text-xs text-sage/70">
          Shared {formatDistanceToNow(new Date(resource.sharedAt))}
        </p>
      </div>
    </Link>
  )
}

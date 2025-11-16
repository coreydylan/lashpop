"use client"

import { useState, useEffect } from "react"
import { UserPlus, UserMinus, Shield, Link2, Trash2, Eye, Clock } from "lucide-react"
import { PermissionBadge, PermissionLevel } from "./PermissionBadge"

type ActivityAction =
  | "share_created"
  | "share_revoked"
  | "permission_updated"
  | "public_link_created"
  | "public_link_revoked"
  | "public_link_accessed"

interface ActivityLog {
  id: string
  action: ActivityAction
  actorId: string
  actorName: string
  actorEmail: string
  targetUserId?: string
  targetUserName?: string
  targetUserEmail?: string
  oldPermission?: PermissionLevel
  newPermission?: PermissionLevel
  createdAt: string
  metadata?: Record<string, any>
}

interface ShareActivityLogProps {
  resourceType: "asset" | "collection" | "set"
  resourceId: string
}

const actionConfig: Record<
  ActivityAction,
  { icon: any; label: string; color: string }
> = {
  share_created: {
    icon: UserPlus,
    label: "Shared with",
    color: "text-golden"
  },
  share_revoked: {
    icon: UserMinus,
    label: "Removed access",
    color: "text-terracotta"
  },
  permission_updated: {
    icon: Shield,
    label: "Updated permission",
    color: "text-ocean-mist"
  },
  public_link_created: {
    icon: Link2,
    label: "Created public link",
    color: "text-dusty-rose"
  },
  public_link_revoked: {
    icon: Trash2,
    label: "Revoked public link",
    color: "text-sage"
  },
  public_link_accessed: {
    icon: Eye,
    label: "Public link viewed",
    color: "text-sage"
  }
}

export function ShareActivityLog({
  resourceType,
  resourceId
}: ShareActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState<ActivityAction | "all">("all")

  useEffect(() => {
    fetchActivities()
  }, [resourceType, resourceId])

  const fetchActivities = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/dam/sharing/activity?resourceType=${resourceType}&resourceId=${resourceId}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch activity log")
      }

      const data = await response.json()
      setActivities(data.activities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity log")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "Just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? "day" : "days"} ago`
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    }
  }

  const getActivityDescription = (activity: ActivityLog) => {
    const config = actionConfig[activity.action]

    switch (activity.action) {
      case "share_created":
        return (
          <span>
            <strong>{activity.actorName}</strong> shared with{" "}
            <strong>{activity.targetUserName}</strong> as{" "}
            <PermissionBadge
              permissionLevel={activity.newPermission || "viewer"}
              variant="small"
              className="inline-flex mx-1"
            />
          </span>
        )

      case "share_revoked":
        return (
          <span>
            <strong>{activity.actorName}</strong> removed{" "}
            <strong>{activity.targetUserName}</strong>'s access
          </span>
        )

      case "permission_updated":
        return (
          <span>
            <strong>{activity.actorName}</strong> changed{" "}
            <strong>{activity.targetUserName}</strong>'s permission from{" "}
            <PermissionBadge
              permissionLevel={activity.oldPermission || "viewer"}
              variant="small"
              className="inline-flex mx-1"
            />{" "}
            to{" "}
            <PermissionBadge
              permissionLevel={activity.newPermission || "viewer"}
              variant="small"
              className="inline-flex mx-1"
            />
          </span>
        )

      case "public_link_created":
        return (
          <span>
            <strong>{activity.actorName}</strong> created a public link
          </span>
        )

      case "public_link_revoked":
        return (
          <span>
            <strong>{activity.actorName}</strong> revoked the public link
          </span>
        )

      case "public_link_accessed":
        return (
          <span>
            Public link was viewed
            {activity.metadata?.ipAddress && (
              <span className="text-sage ml-1">
                from {activity.metadata.ipAddress}
              </span>
            )}
          </span>
        )

      default:
        return <span>{config.label}</span>
    }
  }

  const filteredActivities =
    filterAction === "all"
      ? activities
      : activities.filter((a) => a.action === filterAction)

  if (isLoading) {
    return (
      <div className="px-6 py-8 text-center">
        <div className="inline-block w-8 h-8 border-3 border-sage/30 border-t-sage rounded-full animate-spin" />
        <p className="caption text-sage mt-4">Loading activity...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-6 arch-full bg-terracotta/10 border border-terracotta/30">
        <p className="text-sm text-terracotta">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="caption text-dune">Filter:</label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value as ActivityAction | "all")}
          className="px-4 py-2 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none cursor-pointer text-sm"
        >
          <option value="all">All Activity</option>
          <option value="share_created">Shares Created</option>
          <option value="share_revoked">Shares Revoked</option>
          <option value="permission_updated">Permission Updates</option>
          <option value="public_link_created">Public Links Created</option>
          <option value="public_link_revoked">Public Links Revoked</option>
          <option value="public_link_accessed">Public Link Views</option>
        </select>
      </div>

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="px-6 py-8 text-center text-sage">
          No activity to display
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity, index) => {
            const config = actionConfig[activity.action]
            const Icon = config.icon

            return (
              <div
                key={activity.id}
                className="flex gap-4 px-4 py-4 arch-full bg-warm-sand/20 border border-sage/10 hover:border-sage/20 transition-all"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full bg-warm-sand/40 flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-dune mb-1">
                    {getActivityDescription(activity)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-sage">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

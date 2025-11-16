"use client"

import { useState, useEffect } from "react"
import { Clock, Share2, Link2, UserPlus, UserMinus, Loader2 } from "lucide-react"

interface ShareActivity {
  id: string
  type: "user_added" | "user_removed" | "link_created" | "link_revoked" | "permission_changed"
  userId?: string
  userEmail?: string
  performedBy: string
  performedByEmail: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface ShareActivityLogProps {
  resourceId: string
  resourceType: "asset" | "collection" | "set"
}

export function ShareActivityLog({
  resourceId,
  resourceType
}: ShareActivityLogProps) {
  const [activities, setActivities] = useState<ShareActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [resourceId, resourceType])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dam/sharing/${resourceType}/${resourceId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error("Failed to fetch share activity:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: ShareActivity["type"]) => {
    switch (type) {
      case "user_added":
        return <UserPlus className="w-4 h-4 text-green-600" />
      case "user_removed":
        return <UserMinus className="w-4 h-4 text-dusty-rose" />
      case "link_created":
        return <Link2 className="w-4 h-4 text-sage" />
      case "link_revoked":
        return <Link2 className="w-4 h-4 text-dusty-rose" />
      case "permission_changed":
        return <Share2 className="w-4 h-4 text-ocean-mist" />
      default:
        return <Clock className="w-4 h-4 text-sage" />
    }
  }

  const getActivityText = (activity: ShareActivity) => {
    switch (activity.type) {
      case "user_added":
        return `${activity.performedByEmail} shared with ${activity.userEmail}`
      case "user_removed":
        return `${activity.performedByEmail} removed ${activity.userEmail}'s access`
      case "link_created":
        return `${activity.performedByEmail} created a public link`
      case "link_revoked":
        return `${activity.performedByEmail} revoked the public link`
      case "permission_changed":
        return `${activity.performedByEmail} changed ${activity.userEmail}'s permission to ${activity.metadata?.newPermission}`
      default:
        return "Unknown activity"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-sage animate-spin" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="w-8 h-8 text-sage/40 mx-auto mb-2" />
        <p className="text-sm text-sage">No sharing activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-sage uppercase tracking-wide">
        Activity Log
      </h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2 rounded-lg bg-warm-sand/10"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-dune">{getActivityText(activity)}</p>
              <p className="text-xs text-sage mt-0.5">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

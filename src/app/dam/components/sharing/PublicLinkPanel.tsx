"use client"

import { useState, useEffect } from "react"
import { Link2, Copy, Trash2, Loader2, Eye, Download } from "lucide-react"

interface PublicLink {
  id: string
  token: string
  url: string
  allowDownload: boolean
  expiresAt: Date | null
  createdAt: Date
}

interface PublicLinkPanelProps {
  resourceId: string
  resourceType: "asset" | "collection" | "set"
  isOwner?: boolean
}

export function PublicLinkPanel({
  resourceId,
  resourceType,
  isOwner = false
}: PublicLinkPanelProps) {
  const [link, setLink] = useState<PublicLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchPublicLink()
  }, [resourceId, resourceType])

  const fetchPublicLink = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dam/sharing/${resourceType}/${resourceId}/public-link`)
      if (response.ok) {
        const data = await response.json()
        setLink(data.link || null)
      }
    } catch (error) {
      console.error("Failed to fetch public link:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    try {
      setCreating(true)
      const response = await fetch(`/api/dam/sharing/${resourceType}/${resourceId}/public-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowDownload: true })
      })

      if (response.ok) {
        const data = await response.json()
        setLink(data.link)
      } else {
        throw new Error("Failed to create link")
      }
    } catch (error) {
      console.error("Failed to create public link:", error)
      alert("Failed to create public link")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteLink = async () => {
    if (!confirm("Revoke this public link? It will no longer be accessible.")) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/dam/sharing/${resourceType}/${resourceId}/public-link`, {
        method: "DELETE"
      })

      if (response.ok) {
        setLink(null)
      } else {
        throw new Error("Failed to delete link")
      }
    } catch (error) {
      console.error("Failed to delete public link:", error)
      alert("Failed to revoke public link")
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyLink = () => {
    if (!link) return

    navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOwner) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-sage animate-spin" />
      </div>
    )
  }

  if (!link) {
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-sage uppercase tracking-wide">
          Public Link
        </h4>
        <div className="p-4 rounded-xl bg-warm-sand/20 border-2 border-dashed border-sage/30 text-center">
          <Link2 className="w-8 h-8 text-sage/40 mx-auto mb-2" />
          <p className="text-sm text-sage mb-3">No public link created yet</p>
          <button
            onClick={handleCreateLink}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dune text-cream hover:bg-dune/90 transition-colors disabled:opacity-50 text-sm font-semibold"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Create Public Link
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-sage uppercase tracking-wide">
        Public Link
      </h4>
      <div className="p-4 rounded-xl bg-warm-sand/20 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-sage flex-shrink-0" />
              <p className="text-xs font-medium text-sage">Anyone with the link can view</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={link.url}
                readOnly
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-cream border border-sage/20 text-xs text-dune font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-cream border border-sage/20 hover:border-dusty-rose/50 transition-colors"
                title="Copy link"
              >
                <Copy className={`w-4 h-4 ${copied ? 'text-green-600' : 'text-sage'} transition-colors`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-sage">
          <div className="flex items-center gap-1">
            {link.allowDownload ? (
              <>
                <Download className="w-3 h-3" />
                <span>Download enabled</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>View only</span>
              </>
            )}
          </div>
          {link.expiresAt && (
            <div>
              Expires: {new Date(link.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <button
          onClick={handleDeleteLink}
          disabled={deleting}
          className="flex items-center gap-2 text-xs text-dusty-rose hover:text-dusty-rose/80 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Revoking...
            </>
          ) : (
            <>
              <Trash2 className="w-3 h-3" />
              Revoke Link
            </>
          )}
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Link, Copy, Check, Eye, Calendar, Lock, Trash2, RefreshCw } from "lucide-react"

interface PublicLink {
  id: string
  token: string
  url: string
  expiresAt: string | null
  maxViews: number | null
  viewCount: number
  password: string | null
  createdAt: string
}

interface PublicLinkPanelProps {
  resourceType: "asset" | "collection" | "set"
  resourceId: string
}

export function PublicLinkPanel({
  resourceType,
  resourceId
}: PublicLinkPanelProps) {
  const [publicLink, setPublicLink] = useState<PublicLink | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [password, setPassword] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [maxViews, setMaxViews] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchPublicLink()
  }, [resourceType, resourceId])

  const fetchPublicLink = async () => {
    try {
      const response = await fetch(
        `/api/dam/sharing/public-link?resourceType=${resourceType}&resourceId=${resourceId}`
      )

      if (response.ok) {
        const data = await response.json()
        if (data.link) {
          setPublicLink(data.link)
        }
      }
    } catch (err) {
      console.error("Error fetching public link:", err)
    }
  }

  const handleGenerateLink = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/dam/sharing/public-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          password: password || undefined,
          expiresAt: expirationDate || undefined,
          maxViews: maxViews ? parseInt(maxViews) : undefined
        })
      })

      if (!response.ok) {
        throw new Error("Failed to generate link")
      }

      const data = await response.json()
      setPublicLink(data.link)
      setShowSettings(false)
    } catch (err) {
      console.error("Error generating link:", err)
      alert("Failed to generate public link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateLink = async () => {
    if (!publicLink) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/dam/sharing/public-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          password: password || null,
          expiresAt: expirationDate || null,
          maxViews: maxViews ? parseInt(maxViews) : null
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update link")
      }

      const data = await response.json()
      setPublicLink(data.link)
      setShowSettings(false)
    } catch (err) {
      console.error("Error updating link:", err)
      alert("Failed to update public link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeLink = async () => {
    if (!confirm("Are you sure you want to revoke this public link?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/dam/sharing/public-link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId
        })
      })

      if (!response.ok) {
        throw new Error("Failed to revoke link")
      }

      setPublicLink(null)
      setPassword("")
      setExpirationDate("")
      setMaxViews("")
      setShowSettings(false)
    } catch (err) {
      console.error("Error revoking link:", err)
      alert("Failed to revoke public link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!publicLink) return

    try {
      await navigator.clipboard.writeText(publicLink.url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Error copying link:", err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const isExpired = publicLink?.expiresAt
    ? new Date(publicLink.expiresAt) < new Date()
    : false

  const isMaxViewsReached = publicLink?.maxViews
    ? publicLink.viewCount >= publicLink.maxViews
    : false

  return (
    <div className="space-y-4">
      {!publicLink ? (
        // No link exists - Show generation form
        <div className="space-y-4">
          <div className="px-6 py-6 arch-full bg-warm-sand/20 border border-sage/20 text-center">
            <Link className="w-12 h-12 mx-auto mb-4 text-sage" />
            <p className="body text-dune mb-2">No public link created</p>
            <p className="text-sm text-sage">
              Generate a shareable link for this {resourceType}
            </p>
          </div>

          {showSettings && (
            <div className="space-y-4 px-6 py-6 arch-full bg-cream border border-sage/20">
              <h4 className="caption text-dune mb-4">Link Settings</h4>

              {/* Password Protection */}
              <div>
                <label className="flex items-center gap-2 caption text-dune mb-2">
                  <Lock className="w-4 h-4" />
                  Password Protection (Optional)
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune placeholder-sage/60 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="flex items-center gap-2 caption text-dune mb-2">
                  <Calendar className="w-4 h-4" />
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none"
                />
              </div>

              {/* Max Views */}
              <div>
                <label className="flex items-center gap-2 caption text-dune mb-2">
                  <Eye className="w-4 h-4" />
                  Max Views (Optional)
                </label>
                <input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  className="w-full px-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune placeholder-sage/60 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!showSettings ? (
              <button
                onClick={() => setShowSettings(true)}
                className="btn btn-primary flex-1 py-3"
              >
                Generate Public Link
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateLink}
                  disabled={isLoading}
                  className="btn btn-primary flex-1 py-3 disabled:opacity-50"
                >
                  {isLoading ? "Generating..." : "Create Link"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        // Link exists - Show link info and management
        <div className="space-y-4">
          {/* Link Display */}
          <div className="px-4 py-4 arch-full bg-warm-sand/20 border border-sage/20">
            <div className="flex items-center gap-3 mb-3">
              <Link className="w-5 h-5 text-sage flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-dune truncate font-mono">
                  {publicLink.url}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 arch-full bg-cream hover:bg-warm-sand/40 border border-sage/20 transition-colors"
                aria-label="Copy link"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-golden" />
                    <span className="text-sm text-golden">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sage" />
                    <span className="text-sm text-sage">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Indicators */}
            <div className="flex flex-wrap gap-3 text-sm">
              {publicLink.password && (
                <div className="flex items-center gap-2 text-golden">
                  <Lock className="w-4 h-4" />
                  <span>Password protected</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sage">
                <Eye className="w-4 h-4" />
                <span>
                  {publicLink.viewCount} {publicLink.maxViews ? `/ ${publicLink.maxViews}` : ""} views
                </span>
              </div>

              {publicLink.expiresAt && (
                <div className={`flex items-center gap-2 ${isExpired ? "text-terracotta" : "text-sage"}`}>
                  <Calendar className="w-4 h-4" />
                  <span>
                    {isExpired ? "Expired" : "Expires"} {formatDate(publicLink.expiresAt)}
                  </span>
                </div>
              )}
            </div>

            {/* Warning if link is inactive */}
            {(isExpired || isMaxViewsReached) && (
              <div className="mt-3 px-3 py-2 arch-full bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
                {isExpired
                  ? "This link has expired and is no longer accessible."
                  : "This link has reached its maximum view count."}
              </div>
            )}
          </div>

          {/* Link Management */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-secondary flex items-center gap-2 py-3"
            >
              <RefreshCw className="w-4 h-4" />
              Update Settings
            </button>
            <button
              onClick={handleRevokeLink}
              disabled={isLoading}
              className="btn btn-secondary flex items-center gap-2 py-3 hover:bg-terracotta/10 hover:border-terracotta/30 hover:text-terracotta disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Revoke Link
            </button>
          </div>

          {/* Settings Panel for Updating */}
          {showSettings && (
            <div className="space-y-4 px-6 py-6 arch-full bg-cream border border-sage/20">
              <h4 className="caption text-dune mb-4">Update Link Settings</h4>

              {/* Password Protection */}
              <div>
                <label className="flex items-center gap-2 caption text-dune mb-2">
                  <Lock className="w-4 h-4" />
                  Password Protection
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={publicLink.password ? "••••••••" : "No password"}
                  className="w-full px-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune placeholder-sage/60 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="flex items-center gap-2 caption text-dune mb-2">
                  <Calendar className="w-4 h-4" />
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={expirationDate || (publicLink.expiresAt ? publicLink.expiresAt.split('T')[0] : "")}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none"
                />
              </div>

              {/* Max Views */}
              <div>
                <label className="flex items-center gap-2 caption text-dune mb-2">
                  <Eye className="w-4 h-4" />
                  Max Views
                </label>
                <input
                  type="number"
                  value={maxViews || (publicLink.maxViews?.toString() || "")}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  className="w-full px-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune placeholder-sage/60 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLink}
                  disabled={isLoading}
                  className="btn btn-primary flex-1 py-3 disabled:opacity-50"
                >
                  {isLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

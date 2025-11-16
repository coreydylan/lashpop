"use client"

/* eslint-disable @next/next/no-img-element */

// Force dynamic rendering so middleware runs on every request
export const dynamic = 'force-dynamic'

import { useState, useMemo } from "react"
import { ArrowLeft, LogOut, Users, Share2, FolderOpen, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useSharedResources } from "@/hooks/useSharedResources"
import { SharedResourceCard } from "../../components/SharedResourceCard"

type TabType = "assets" | "sets" | "collections"
type SortBy = "newest" | "oldest"

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

export default function SharedPage() {
  const [activeTab, setActiveTab] = useState<TabType>("assets")
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [sharerFilter, setSharerFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch shared resources
  const { data, isLoading, error } = useSharedResources()

  // Extract unique sharers for filter dropdown
  const sharers = useMemo(() => {
    if (!data?.resources) return []
    const sharerMap = new Map<string, { id: string; name: string }>()
    data.resources.forEach((resource: SharedResource) => {
      if (!sharerMap.has(resource.sharedBy.id)) {
        sharerMap.set(resource.sharedBy.id, {
          id: resource.sharedBy.id,
          name: resource.sharedBy.name
        })
      }
    })
    return Array.from(sharerMap.values())
  }, [data])

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    if (!data?.resources) return []

    let filtered = data.resources.filter((resource: SharedResource) => {
      // Filter by tab
      if (activeTab === "assets" && resource.resourceType !== "asset") return false
      if (activeTab === "sets" && resource.resourceType !== "set") return false
      if (activeTab === "collections" && resource.resourceType !== "collection") return false

      // Filter by sharer
      if (sharerFilter && resource.sharedBy.id !== sharerFilter) return false

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = resource.resource.name.toLowerCase().includes(query)
        const matchesSharer = resource.sharedBy.name.toLowerCase().includes(query)
        if (!matchesName && !matchesSharer) return false
      }

      return true
    })

    // Sort
    filtered.sort((a: SharedResource, b: SharedResource) => {
      const dateA = new Date(a.sharedAt).getTime()
      const dateB = new Date(b.sharedAt).getTime()
      return sortBy === "newest" ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [data, activeTab, sharerFilter, searchQuery, sortBy])

  // Count resources by type
  const counts = useMemo(() => {
    if (!data?.resources) return { assets: 0, sets: 0, collections: 0 }
    return data.resources.reduce(
      (acc: { assets: number; sets: number; collections: number }, resource: SharedResource) => {
        if (resource.resourceType === "asset") acc.assets++
        if (resource.resourceType === "set") acc.sets++
        if (resource.resourceType === "collection") acc.collections++
        return acc
      },
      { assets: 0, sets: 0, collections: 0 }
    )
  }, [data])

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-cream select-none">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dam"
                className="w-10 h-10 rounded-full hover:bg-warm-sand/30 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-sage" />
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Share2 className="w-6 h-6 text-dusty-rose" />
                  <h1 className="h2 text-dune">Shared with Me</h1>
                </div>
                <p className="caption text-sage">
                  View and manage resources shared with you by team members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dam/team" className="btn btn-secondary">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Team</span>
              </Link>
              <button
                onClick={async () => {
                  await fetch("/api/dam/auth/logout", { method: "POST" })
                  window.location.href = "/dam/login"
                }}
                className="btn btn-secondary"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-8 border-b border-sage/20">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("assets")}
              className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                activeTab === "assets"
                  ? "text-dusty-rose"
                  : "text-sage hover:text-dune"
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Assets</span>
                {counts.assets > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-dusty-rose/10 text-dusty-rose rounded-full text-xs">
                    {counts.assets}
                  </span>
                )}
              </div>
              {activeTab === "assets" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dusty-rose" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("sets")}
              className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                activeTab === "sets"
                  ? "text-dusty-rose"
                  : "text-sage hover:text-dune"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>Sets</span>
                {counts.sets > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-dusty-rose/10 text-dusty-rose rounded-full text-xs">
                    {counts.sets}
                  </span>
                )}
              </div>
              {activeTab === "sets" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dusty-rose" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("collections")}
              className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                activeTab === "collections"
                  ? "text-dusty-rose"
                  : "text-sage hover:text-dune"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>Collections</span>
                {counts.collections > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-dusty-rose/10 text-dusty-rose rounded-full text-xs">
                    {counts.collections}
                  </span>
                )}
              </div>
              {activeTab === "collections" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dusty-rose" />
              )}
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search shared items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-sage/20 rounded-full bg-white/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Sharer Filter */}
          <div className="flex gap-2">
            <select
              value={sharerFilter || ""}
              onChange={(e) => setSharerFilter(e.target.value || null)}
              className="px-4 py-2 border border-sage/20 rounded-full bg-white/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50 focus:border-transparent transition-all text-sm"
            >
              <option value="">All Sharers</option>
              {sharers.map((sharer) => (
                <option key={sharer.id} value={sharer.id}>
                  {sharer.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 border border-sage/20 rounded-full bg-white/50 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50 focus:border-transparent transition-all text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-warm-sand/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-10 h-10 text-sage" />
            </div>
            <h3 className="h3 text-dune mb-3">Failed to load shared items</h3>
            <p className="body text-sage">Please try refreshing the page</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-warm-sand/50 rounded-full flex items-center justify-center mx-auto mb-6">
              {activeTab === "assets" && <ImageIcon className="w-10 h-10 text-sage" />}
              {activeTab === "sets" && <FolderOpen className="w-10 h-10 text-sage" />}
              {activeTab === "collections" && <FolderOpen className="w-10 h-10 text-sage" />}
            </div>
            <h3 className="h3 text-dune mb-3">
              {searchQuery || sharerFilter
                ? "No matching items"
                : `No shared ${activeTab} yet`}
            </h3>
            <p className="body text-sage">
              {searchQuery || sharerFilter
                ? "Try adjusting your filters"
                : `When team members share ${activeTab} with you, they'll appear here`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredResources.map((resource: SharedResource) => (
              <SharedResourceCard
                key={`${resource.resourceType}-${resource.resourceId}`}
                resource={resource}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

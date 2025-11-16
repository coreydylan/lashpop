"use client"

/**
 * Smart Collections Sidebar Component
 *
 * Displays auto-populated smart collections for social media variants.
 * Shows collection counts in real-time and allows filtering by collection.
 */

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Calendar,
  Clock,
  AlertTriangle,
  AlertCircle,
  Download,
  Star,
  Smartphone,
  Square,
  Monitor,
  DownloadCloud,
  Archive,
  Folder,
  ChevronDown,
  ChevronRight,
  Loader2
} from "lucide-react"
import clsx from "clsx"

interface SmartCollection {
  id: string
  name: string
  description: string
  icon?: string
  autoUpdate: boolean
  highlight?: 'warning' | 'success' | 'info'
  color?: string
  count?: number
}

interface SmartCollectionsSidebarProps {
  onSelectCollection: (collectionId: string) => void
  selectedCollectionId?: string | null
  className?: string
}

const iconMap: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  calendar: Calendar,
  clock: Clock,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  download: Download,
  star: Star,
  smartphone: Smartphone,
  square: Square,
  monitor: Monitor,
  'download-cloud': DownloadCloud,
  archive: Archive,
  folder: Folder
}

export function SmartCollectionsSidebar({
  onSelectCollection,
  selectedCollectionId,
  className
}: SmartCollectionsSidebarProps) {
  const [collections, setCollections] = useState<SmartCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  // Load smart collections with counts
  useEffect(() => {
    loadCollections()
    // Refresh counts every 30 seconds
    const interval = setInterval(loadCollections, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/dam/collections/smart?includeCounts=true&sidebarOnly=true')
      if (response.ok) {
        const { collections } = await response.json()
        setCollections(collections)
      }
    } catch (error) {
      console.error('Error loading smart collections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (iconName?: string) => {
    if (!iconName) return Folder
    return iconMap[iconName] || Folder
  }

  const getBadgeColor = (highlight?: string, color?: string) => {
    if (highlight === 'warning') return 'bg-orange-100 text-orange-700 border-orange-200'
    if (highlight === 'success') return 'bg-green-100 text-green-700 border-green-200'
    if (highlight === 'info') return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-gray-100 text-gray-600 border-gray-200'
  }

  return (
    <div className={clsx("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 hover:from-blue-100 hover:to-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Smart Collections</h3>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Collections List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
              {collections.map((collection) => {
                const Icon = getIcon(collection.icon)
                const isSelected = selectedCollectionId === collection.id
                const showWarningBadge = collection.highlight === 'warning' && (collection.count || 0) > 0

                return (
                  <button
                    key={collection.id}
                    onClick={() => onSelectCollection(collection.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group text-left",
                      isSelected
                        ? "bg-blue-100 border-2 border-blue-300"
                        : "hover:bg-gray-50 border-2 border-transparent"
                    )}
                    title={collection.description}
                  >
                    {/* Icon with custom color */}
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-white" : "bg-gray-100 group-hover:bg-white"
                      )}
                      style={{
                        backgroundColor: isSelected && collection.color
                          ? `${collection.color}20`
                          : undefined
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{
                          color: collection.color || (isSelected ? '#2563EB' : '#6B7280')
                        }}
                      />
                    </div>

                    {/* Collection info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "text-sm font-medium truncate",
                          isSelected ? "text-blue-900" : "text-gray-700"
                        )}>
                          {collection.name}
                        </span>
                        {showWarningBadge && (
                          <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className={clsx(
                        "text-xs truncate",
                        isSelected ? "text-blue-600" : "text-gray-500"
                      )}>
                        {collection.description}
                      </p>
                    </div>

                    {/* Count badge */}
                    {collection.count !== undefined && (
                      <div
                        className={clsx(
                          "px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-700"
                            : getBadgeColor(collection.highlight, collection.color)
                        )}
                      >
                        {collection.count}
                      </div>
                    )}
                  </button>
                )
              })}

              {!isLoading && collections.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No smart collections available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer hint */}
      {isExpanded && collections.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Auto-updates every 30 seconds • {collections.reduce((sum, c) => sum + (c.count || 0), 0)} total items
          </p>
        </div>
      )}
    </div>
  )
}

"use client"

/**
 * Collection Export Button Component
 *
 * Provides one-click export functionality for entire smart collections.
 * Remembers last export settings and shows progress notifications.
 */

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { ExportManager } from "./ExportManager"
import clsx from "clsx"

interface CollectionExportButtonProps {
  collectionId: string
  collectionName: string
  assetCount: number
  className?: string
}

export function CollectionExportButton({
  collectionId,
  collectionName,
  assetCount,
  className
}: CollectionExportButtonProps) {
  const [isExportManagerOpen, setIsExportManagerOpen] = useState(false)
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [assetIds, setAssetIds] = useState<string[]>([])

  const handleExportClick = async () => {
    setIsLoadingAssets(true)

    try {
      // Fetch all asset IDs from the collection
      const response = await fetch(`/api/dam/collections/smart/${collectionId}`)
      if (!response.ok) {
        throw new Error('Failed to load collection assets')
      }

      const { assets } = await response.json()
      const ids = assets.map((asset: any) => asset.id)

      setAssetIds(ids)
      setIsExportManagerOpen(true)

    } catch (error) {
      console.error('Error loading collection assets:', error)
      alert('Failed to load collection assets for export')
    } finally {
      setIsLoadingAssets(false)
    }
  }

  return (
    <>
      <button
        onClick={handleExportClick}
        disabled={assetCount === 0 || isLoadingAssets}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
          assetCount === 0
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95",
          className
        )}
        title={assetCount === 0 ? "No assets to export" : `Export ${assetCount} asset${assetCount !== 1 ? 's' : ''}`}
      >
        {isLoadingAssets ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="text-sm">Export Collection ({assetCount})</span>
          </>
        )}
      </button>

      {/* Export Manager Modal */}
      {isExportManagerOpen && assetIds.length > 0 && (
        <ExportManager
          assetIds={assetIds}
          open={isExportManagerOpen}
          onClose={() => setIsExportManagerOpen(false)}
          onExportComplete={(result) => {
            console.log('Export completed:', result)
            // Optionally show a success notification
          }}
        />
      )}
    </>
  )
}

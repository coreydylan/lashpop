"use client"

/**
 * ExportManager Component
 *
 * Manages the export of social media variants with configurable options.
 * Provides format selection, quality control, organization strategies, and progress tracking.
 */

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Download,
  FileArchive,
  Settings,
  Info,
  Loader2,
  Check,
  AlertCircle,
  Folder,
  File,
  Image
} from "lucide-react"

export interface ExportResult {
  zipBuffer: Buffer
  fileCount: number
  totalSize: number
  manifest: {
    files: Array<{
      path: string
      size: number
      originalAssetId: string
    }>
  }
}

interface ExportManagerProps {
  assetIds: string[]
  open: boolean
  onClose: () => void
  onExportComplete?: (result: ExportResult) => void
}

interface ExportOptions {
  format: 'original' | 'jpg' | 'png'
  quality: number
  organization: 'flat' | 'by-platform' | 'by-variant' | 'by-source'
  includeMetadata: boolean
  includeSourceImages: boolean
  markAsExported: boolean
}

interface FolderPreview {
  [folder: string]: number
}

export function ExportManager({
  assetIds,
  open,
  onClose,
  onExportComplete
}: ExportManagerProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'original',
    quality: 90,
    organization: 'by-platform',
    includeMetadata: false,
    includeSourceImages: false,
    markAsExported: true
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState(false)

  const [estimatedSize, setEstimatedSize] = useState<number>(0)
  const [folderPreview, setFolderPreview] = useState<FolderPreview>({})

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsExporting(false)
      setExportProgress(0)
      setExportError(null)
      setExportSuccess(false)
      loadPreview()
    }
  }, [open, assetIds, options.organization])

  // Load size estimate and folder preview
  const loadPreview = async () => {
    try {
      const [sizeResponse, previewResponse] = await Promise.all([
        fetch('/api/dam/export/estimate-size', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetIds })
        }),
        fetch('/api/dam/export/folder-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetIds, organization: options.organization })
        })
      ])

      if (sizeResponse.ok) {
        const { size } = await sizeResponse.json()
        setEstimatedSize(size)
      }

      if (previewResponse.ok) {
        const { folders } = await previewResponse.json()
        setFolderPreview(folders)
      }
    } catch (error) {
      console.error('Error loading preview:', error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)
    setExportError(null)

    try {
      const response = await fetch('/api/dam/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIds,
          ...options
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download the ZIP file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `social-variants-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExportSuccess(true)
      setExportProgress(100)

      // Call onExportComplete callback if provided
      if (onExportComplete) {
        onExportComplete({
          zipBuffer: Buffer.from(await blob.arrayBuffer()),
          fileCount: assetIds.length,
          totalSize: blob.size,
          manifest: { files: [] }
        })
      }

      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Export error:', error)
      setExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getOrganizationDescription = (org: string): string => {
    const descriptions = {
      'flat': 'All files in root directory',
      'by-platform': 'Organized into platform folders (instagram/, facebook/, etc.)',
      'by-variant': 'Organized by variant type (instagram-square/, instagram-story/, etc.)',
      'by-source': 'Organized by source image name'
    }
    return descriptions[org as keyof typeof descriptions] || ''
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileArchive className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Export Social Variants</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{assetIds.length} variant{assetIds.length !== 1 ? 's' : ''} selected</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isExporting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['original', 'jpg', 'png'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => setOptions({ ...options, format })}
                      disabled={isExporting}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        options.format === format
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="font-medium">{format.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider (for JPEG) */}
              {options.format === 'jpg' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JPEG Quality: {options.quality}%
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={options.quality}
                    onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) })}
                    disabled={isExporting}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>
              )}

              {/* Organization Strategy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <select
                  value={options.organization}
                  onChange={(e) => setOptions({ ...options, organization: e.target.value as any })}
                  disabled={isExporting}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="flat">Flat (all files in root)</option>
                  <option value="by-platform">By Platform</option>
                  <option value="by-variant">By Variant Type</option>
                  <option value="by-source">By Source Image</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {getOrganizationDescription(options.organization)}
                </p>
              </div>

              {/* Options Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeMetadata}
                    onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
                    disabled={isExporting}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Include metadata JSON files</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add .json files with platform, dimensions, and validation info
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSourceImages}
                    onChange={(e) => setOptions({ ...options, includeSourceImages: e.target.checked })}
                    disabled={isExporting}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Include source images</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Include the original source images used to generate variants
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.markAsExported}
                    onChange={(e) => setOptions({ ...options, markAsExported: e.target.checked })}
                    disabled={isExporting}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Mark as exported</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Update variants to mark them as exported
                    </p>
                  </div>
                </label>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Info className="w-4 h-4" />
                  <span>Export Preview</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">File count:</span>
                    <span className="ml-2 font-medium text-gray-900">{assetIds.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Estimated size:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatBytes(estimatedSize)}</span>
                  </div>
                </div>

                {Object.keys(folderPreview).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-2">Folder Structure:</div>
                    <div className="space-y-1">
                      {Object.entries(folderPreview).map(([folder, count]) => (
                        <div key={folder} className="flex items-center gap-2 text-xs text-gray-600">
                          <Folder className="w-3 h-3" />
                          <span>{folder}</span>
                          <span className="text-gray-400">({count} file{count !== 1 ? 's' : ''})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {exportError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Export failed</p>
                    <p className="text-sm text-red-700 mt-1">{exportError}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {exportSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Export successful!</p>
                    <p className="text-sm text-green-700 mt-1">Your download should start automatically.</p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Exporting...</span>
                    <span className="text-gray-500">{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${exportProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || assetIds.length === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export & Download</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

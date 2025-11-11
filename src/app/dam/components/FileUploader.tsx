"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { TagSelector } from "./TagSelector"

interface FileWithPreview {
  file: File
  preview: string
  id: string
  assetId?: string // ID from backend after upload
  status: "pending" | "uploading" | "success" | "error"
  progress: number
}

interface FileUploaderProps {
  teamMemberId?: string
  onUploadStart?: (fileIds: string[]) => void // Called when files are added
  onUploadComplete?: (assets: any[], keepSelected: boolean) => void // Called when user confirms batch (keepSelected = true for tagging)
  onUploadingIdsChange?: (assetIds: string[]) => void // Called to update asset IDs as they upload
}

export function FileUploader({
  teamMemberId,
  onUploadStart,
  onUploadComplete,
  onUploadingIdsChange
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedAssets, setUploadedAssets] = useState<any[]>([]) // Store completed uploads
  const [batchTags, setBatchTags] = useState<any[]>([]) // Tags to apply to batch
  const [queuedAction, setQueuedAction] = useState<"apply" | "skip" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFilesImmediately = useCallback(async (filesToUpload: FileWithPreview[]) => {
    for (const fileWithPreview of filesToUpload) {
      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithPreview.id
              ? { ...f, status: "uploading", progress: 0 }
              : f
          )
        )

        const formData = new FormData()
        formData.append("files", fileWithPreview.file)
        if (teamMemberId) {
          formData.append("teamMemberId", teamMemberId)
        }

        const response = await fetch("/api/dam/upload", {
          method: "POST",
          body: formData
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const result = await response.json()

        // Update status to success and store asset ID
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithPreview.id
              ? { ...f, status: "success", progress: 100, assetId: result.assets?.[0]?.id }
              : f
          )
        )

        if (result.assets) {
          setUploadedAssets((prev) => [...prev, ...result.assets])
        }
      } catch (error) {
        console.error("Upload error:", error)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithPreview.id ? { ...f, status: "error" } : f
          )
        )
      }
    }
  }, [teamMemberId])

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles = fileArray.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    )

    const filesWithPreview: FileWithPreview[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
      status: "pending",
      progress: 0
    }))

    setFiles((prev) => [...prev, ...filesWithPreview])

    // Notify parent that files were added (for auto-selection)
    if (onUploadStart) {
      onUploadStart(filesWithPreview.map(f => f.id))
    }

    // Start uploading immediately
    uploadFilesImmediately(filesWithPreview)
  }, [onUploadStart, uploadFilesImmediately])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  // Don't auto-select uploading assets anymore - wait for user to confirm batch
  // (Photos stay staged in upload area until tags applied or skipped)

  // Check if all uploads are complete
  const allUploadsComplete = files.length > 0 && files.every(f => f.status === "success")

  // Handler for confirming batch (with or without tags)
  const handleConfirmBatch = useCallback(async (applyTags: boolean) => {
    if (!uploadedAssets.length) return

    // If applying tags, send them to the backend
    if (applyTags && batchTags.length > 0) {
      try {
        const assetIds = uploadedAssets.map(a => a.id)

        // Separate team member tags from regular tags
        const teamMemberTags = batchTags.filter(t => t.category.name === "team")
        const regularTags = batchTags.filter(t => t.category.name !== "team")

        // Apply team member assignments
        if (teamMemberTags.length > 0) {
          const teamMemberId = teamMemberTags[0].id
          await fetch("/api/dam/assets/assign-team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetIds, teamMemberId })
          })
        }

        // Apply regular tags
        if (regularTags.length > 0) {
          await fetch("/api/dam/assets/bulk-tag", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assetIds,
              tagIds: regularTags.map(t => t.id),
              additive: true
            })
          })
        }
      } catch (error) {
        console.error("Failed to apply tags to batch:", error)
      }
    }

    // Notify parent to refresh and optionally select
    if (onUploadComplete) {
      onUploadComplete(uploadedAssets, applyTags)
    }

    // Clear the batch
    setFiles(prev => {
      prev.forEach(f => URL.revokeObjectURL(f.preview))
      return []
    })
    setUploadedAssets([])
    setBatchTags([])
    setQueuedAction(null)
  }, [uploadedAssets, batchTags, onUploadComplete])

  const handleBatchAction = (action: "apply" | "skip") => {
    if (action === "apply" && batchTags.length === 0) return
    if (allUploadsComplete) {
      void handleConfirmBatch(action === "apply")
    } else {
      setQueuedAction(action)
    }
  }

  useEffect(() => {
    if (queuedAction && allUploadsComplete) {
      void handleConfirmBatch(queuedAction === "apply")
    }
  }, [queuedAction, allUploadsComplete, handleConfirmBatch])

  return (
    <motion.div
      layout
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed arch-full overflow-hidden
        transition-all duration-300
        ${
          isDragging
            ? "border-dusty-rose bg-dusty-rose/10"
            : "border-sage/30 hover:border-sage/50 bg-warm-sand/10"
        }
        ${files.length > 0 ? "p-4" : "p-8"}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {files.length === 0 ? (
        /* Empty state - compact dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-4 cursor-pointer py-2"
        >
          <div className="w-12 h-12 rounded-full bg-ocean-mist/30 flex items-center justify-center flex-shrink-0">
            <Upload className="w-6 h-6 text-sage" />
          </div>
          <div>
            <p className="body text-dune font-medium">
              Drop files here or tap to browse
            </p>
            <p className="caption text-sage">
              Upload images or videos
            </p>
          </div>
        </div>
      ) : (
        /* Uploading state - show grid inside dashed card */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="caption text-dune font-semibold uppercase tracking-wide">
              {allUploadsComplete ? `Uploaded ${files.length} Photo${files.length !== 1 ? 's' : ''}` : `Uploading ${files.length} Photo${files.length !== 1 ? 's' : ''}...`}
            </p>
            {!allUploadsComplete && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="caption text-sage hover:text-dune transition-colors"
              >
                + Add more
              </button>
            )}
          </div>

          {/* Batch tags + actions */}
          <div className="border border-sage/20 rounded-2xl p-4 space-y-3 bg-cream/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="body text-dune font-semibold">Batch tags</p>
                <p className="text-xs text-sage">
                  Applied to every photo in this upload
                </p>
              </div>
              {queuedAction && (
                <span className="text-xs font-semibold text-dusty-rose bg-dusty-rose/10 rounded-full px-3 py-1">
                  {queuedAction === "apply"
                    ? "Will apply once uploads finish"
                    : "Will skip tagging when uploads finish"}
                </span>
              )}
            </div>
            <TagSelector
              selectedTags={batchTags}
              onTagsChange={setBatchTags}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleBatchAction("apply")}
                disabled={batchTags.length === 0}
                className={`flex-1 min-w-[180px] py-2.5 px-4 arch-full text-sm font-semibold transition-colors ${
                  batchTags.length === 0
                    ? 'bg-sage/15 text-sage/50 cursor-not-allowed'
                    : 'bg-dusty-rose text-cream hover:bg-dusty-rose/90'
                }`}
              >
                {allUploadsComplete ? "Apply tags & add to library" : "Apply when uploads finish"}
              </button>
              <button
                onClick={() => handleBatchAction("skip")}
                className="min-w-[140px] py-2.5 px-4 arch-full border border-sage/30 text-sm font-semibold text-sage hover:bg-sage/10 transition-colors"
              >
                Skip tagging
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            <AnimatePresence>
              {files.map((fileWithPreview) => (
                <motion.div
                  key={fileWithPreview.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square arch-full overflow-hidden bg-warm-sand/40 shadow-sm"
                >
                  {/* Preview */}
                  <img
                    src={fileWithPreview.preview}
                    alt={fileWithPreview.file.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Progress bar */}
                  {fileWithPreview.status === "uploading" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-dune/30">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="h-full bg-dusty-rose"
                      />
                    </div>
                  )}

                  {/* Status indicator */}
                  {fileWithPreview.status === "uploading" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {fileWithPreview.status === "success" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-cream" />
                      </div>
                    </div>
                  )}

                  {fileWithPreview.status === "error" && (
                    <div className="absolute inset-0 bg-terracotta/60 backdrop-blur-sm flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-cream" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>
      )}
    </motion.div>
  )
}

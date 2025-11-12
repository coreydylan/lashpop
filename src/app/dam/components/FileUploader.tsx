"use client"

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { TagSelector } from "./TagSelector"

const MAX_CONCURRENT_UPLOADS = 3
const MAX_RETRIES = 2
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024 // 200MB
const ALLOWED_MIME_PREFIXES = ["image/", "video/"]

type FileStatus = "pending" | "uploading" | "success" | "error"
type FileRejection = "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE"

interface UploadedAsset {
  id: string
  [key: string]: any
}

interface UploadSuccessResult {
  fileName: string
  status: "success"
  asset: UploadedAsset
}

interface UploadErrorResult {
  fileName: string
  status: "error"
  errorCode?: string
  message?: string
}

type UploadResponsePayload = {
  success: boolean
  assets?: UploadedAsset[]
  results?: (UploadSuccessResult | UploadErrorResult)[]
}

interface UploadError extends Error {
  code?: string
}

interface FileWithPreview {
  file: File
  preview: string
  id: string
  assetId?: string
  status: FileStatus
  progress: number
  retryCount: number
  errorCode?: string
  errorMessage?: string
}

interface Notice {
  type: "info" | "error"
  message: string
}

interface FileUploaderProps {
  teamMemberId?: string
  onUploadStart?: (fileIds: string[]) => void
  onUploadComplete?: (assets: UploadedAsset[], keepSelected: boolean) => void
  onUploadingIdsChange?: (assetIds: string[]) => void
}

const rejectionMessages: Record<FileRejection, string> = {
  UNSUPPORTED_TYPE: "must be images or videos",
  FILE_TOO_LARGE: "exceed the 200MB limit"
}

const createClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const summarizeRejections = (rejections: FileRejection[]) => {
  const counts = rejections.reduce<Record<FileRejection, number>>((acc, reason) => {
    acc[reason] = (acc[reason] ?? 0) + 1
    return acc
  }, {} as Record<FileRejection, number>)

  const parts = Object.entries(counts).map(([reason, count]) => {
    const noun = count === 1 ? "file" : "files"
    return `${count} ${noun} ${rejectionMessages[reason as FileRejection]}`
  })

  return `Skipped ${rejections.length} ${
    rejections.length === 1 ? "file" : "files"
  } — ${parts.join(" & ")}.`
}

const validateFile = (file: File): FileRejection | null => {
  if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
    return "UNSUPPORTED_TYPE"
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "FILE_TOO_LARGE"
  }

  return null
}

export function FileUploader({
  teamMemberId,
  onUploadStart,
  onUploadComplete,
  onUploadingIdsChange
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([])
  const [batchTags, setBatchTags] = useState<any[]>([])
  const [queuedAction, setQueuedAction] = useState<"apply" | "skip" | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isWindowDragging, setIsWindowDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const windowDragDepth = useRef(0)
  const dropZoneDragDepth = useRef(0)

  const uploadStats = useMemo(() => {
    return files.reduce(
      (acc, file) => {
        acc[file.status] += 1
        return acc
      },
      {
        pending: 0,
        uploading: 0,
        success: 0,
        error: 0
      } as Record<FileStatus, number>
    )
  }, [files])

  const totalFiles = files.length
  const allUploadsComplete =
    totalFiles > 0 && uploadStats.pending === 0 && uploadStats.uploading === 0
  const hasQueuedUploads = uploadStats.pending > 0 || uploadStats.uploading > 0

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const fileArray = Array.from(incoming)
      if (fileArray.length === 0) return

      const accepted: FileWithPreview[] = []
      const rejected: FileRejection[] = []

      fileArray.forEach((file) => {
        const rejection = validateFile(file)
        if (rejection) {
          rejected.push(rejection)
          return
        }

        accepted.push({
          file,
          preview: URL.createObjectURL(file),
          id: createClientId(),
          status: "pending",
          progress: 0,
          retryCount: 0
        })
      })

      if (accepted.length) {
        setFiles((prev) => [...prev, ...accepted])
        onUploadStart?.(accepted.map((file) => file.id))
      }

      if (rejected.length) {
        setNotice({
          type: "error",
          message: summarizeRejections(rejected)
        })
      }
    },
    [onUploadStart]
  )

  const uploadFile = useCallback(
    async (fileId: string) => {
      let pendingFile: FileWithPreview | undefined

      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId) {
            pendingFile = file
            return {
              ...file,
              status: "uploading",
              progress: 0,
              errorCode: undefined,
              errorMessage: undefined
            }
          }
          return file
        })
      )

      if (!pendingFile) {
        return
      }

      const formData = new FormData()
      formData.append("files", pendingFile.file)
      if (teamMemberId) {
        formData.append("teamMemberId", teamMemberId)
      }

      try {
        const response = await fetch("/api/dam/upload", {
          method: "POST",
          body: formData
        })
        const payload = (await response.json()) as UploadResponsePayload

        if (!response.ok) {
          const errorResult = payload.results?.[0]
          const error = new Error(
            (errorResult && "message" in errorResult && errorResult.message) || "Upload failed"
          ) as UploadError
          if (errorResult && "errorCode" in errorResult) {
            error.code = errorResult.errorCode
          }
          throw error
        }

        const uploadResult = payload.results?.[0]
        if (!uploadResult || uploadResult.status !== "success") {
          const error = new Error(
            uploadResult && "message" in uploadResult && uploadResult.message
              ? uploadResult.message
              : "Upload failed"
          ) as UploadError
          if (uploadResult && "status" in uploadResult && uploadResult.status === "error") {
            error.code = uploadResult.errorCode ?? "UPLOAD_FAILED"
          }
          throw error
        }

        const asset = uploadResult.asset ?? payload.assets?.[0]
        if (!asset) {
          const error = new Error(
            "Upload completed but asset metadata was not returned."
          ) as UploadError
          error.code = "MISSING_ASSET"
          throw error
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileId
              ? { ...file, status: "success", progress: 100, assetId: asset.id }
              : file
          )
        )

        setUploadedAssets((prev) => {
          if (prev.some((existing) => existing.id === asset.id)) {
            return prev
          }
          return [...prev, asset]
        })
      } catch (error) {
        const uploadError = error as UploadError
        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileId
              ? {
                  ...file,
                  status: "error",
                  progress: 0,
                  errorCode: uploadError.code ?? "UPLOAD_FAILED",
                  errorMessage: uploadError.message || "Upload failed. Please retry."
                }
              : file
          )
        )

        setNotice({
          type: "error",
          message: `Upload failed for ${pendingFile.file.name}: ${
            uploadError.message || "Please retry."
          }`
        })
      }
    },
    [teamMemberId]
  )

  useEffect(() => {
    const uploadingCount = files.filter((file) => file.status === "uploading").length
    const availableSlots = MAX_CONCURRENT_UPLOADS - uploadingCount
    if (availableSlots <= 0) return

    const nextBatch = files
      .filter((file) => file.status === "pending")
      .slice(0, availableSlots)

    nextBatch.forEach((file) => {
      void uploadFile(file.id)
    })
  }, [files, uploadFile])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      dropZoneDragDepth.current = 0
      setIsDragging(false)

      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dropZoneDragDepth.current += 1
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dropZoneDragDepth.current = Math.max(0, dropZoneDragDepth.current - 1)
    if (dropZoneDragDepth.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const removeFile = useCallback((id: string) => {
    let assetIdToRemove: string | undefined

    setFiles((prev) =>
      prev.filter((file) => {
        if (file.id === id) {
          URL.revokeObjectURL(file.preview)
          assetIdToRemove = file.assetId
          return false
        }
        return true
      })
    )

    if (assetIdToRemove) {
      setUploadedAssets((prev) => prev.filter((asset) => asset.id !== assetIdToRemove))
    }
  }, [])

  const handleRetry = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.id !== id || file.retryCount >= MAX_RETRIES) {
          return file
        }

        return {
          ...file,
          status: "pending",
          retryCount: file.retryCount + 1,
          errorCode: undefined,
          errorMessage: undefined
        }
      })
    )
  }, [])

  const handleConfirmBatch = useCallback(
    async (applyTags: boolean) => {
      if (!uploadedAssets.length) {
        setQueuedAction(null)
        setNotice({
          type: "error",
          message: "There are no successful uploads to add yet."
        })
        return
      }

      if (applyTags && batchTags.length > 0) {
        try {
          const assetIds = uploadedAssets.map((asset) => asset.id)
          const teamMemberTags = batchTags.filter((tag) => tag.category?.name === "team")
          const regularTags = batchTags.filter((tag) => tag.category?.name !== "team")

          if (teamMemberTags.length > 0) {
            const memberId = teamMemberTags[0].id
            await fetch("/api/dam/assets/assign-team", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assetIds, teamMemberId: memberId })
            })
          }

          if (regularTags.length > 0) {
            await fetch("/api/dam/assets/bulk-tag", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assetIds,
                tagIds: regularTags.map((tag) => tag.id),
                additive: true
              })
            })
          }
        } catch (error) {
          console.error("Failed to apply tags to batch:", error)
          setNotice({
            type: "error",
            message: "Assets uploaded but tags failed to apply. Please retry."
          })
        }
      }

      onUploadComplete?.(uploadedAssets, applyTags)

      setFiles((prev) => {
        prev.forEach((file) => URL.revokeObjectURL(file.preview))
        return []
      })
      setUploadedAssets([])
      setBatchTags([])
      setQueuedAction(null)
    },
    [uploadedAssets, batchTags, onUploadComplete]
  )

  const handleBatchAction = (action: "apply" | "skip") => {
    if (!hasQueuedUploads && !uploadedAssets.length) {
      setNotice({
        type: "error",
        message: "Upload something first to continue."
      })
      return
    }

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

  useEffect(() => {
    if (!onUploadingIdsChange) return
    const ids = Array.from(
      new Set(
        files
          .filter((file) => file.assetId)
          .map((file) => file.assetId as string)
      )
    )
    onUploadingIdsChange(ids)
  }, [files, onUploadingIdsChange])

  useEffect(() => {
    if (!notice || typeof window === "undefined") return
    const timeout = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleWindowDragEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types?.includes("Files")) return
      event.preventDefault()
      windowDragDepth.current += 1
      setIsWindowDragging(true)
    }

    const handleWindowDragLeave = (event: DragEvent) => {
      if (!event.dataTransfer?.types?.includes("Files")) return
      event.preventDefault()
      windowDragDepth.current = Math.max(0, windowDragDepth.current - 1)
      if (windowDragDepth.current === 0) {
        setIsWindowDragging(false)
      }
    }

    const handleWindowDrop = (event: DragEvent) => {
      if (!event.dataTransfer) return
      event.preventDefault()
      windowDragDepth.current = 0
      setIsWindowDragging(false)
      if (event.dataTransfer.files.length) {
        handleFiles(event.dataTransfer.files)
      }
    }

    const preventDefault = (event: DragEvent) => {
      if (event.dataTransfer) {
        event.preventDefault()
      }
    }

    const handlePaste = (event: ClipboardEvent) => {
      const clipboardFiles = event.clipboardData?.files
      if (clipboardFiles && clipboardFiles.length > 0) {
        handleFiles(clipboardFiles)
      }
    }

    window.addEventListener("dragenter", handleWindowDragEnter)
    window.addEventListener("dragleave", handleWindowDragLeave)
    window.addEventListener("dragover", preventDefault)
    window.addEventListener("drop", handleWindowDrop)
    window.addEventListener("paste", handlePaste)

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter)
      window.removeEventListener("dragleave", handleWindowDragLeave)
      window.removeEventListener("dragover", preventDefault)
      window.removeEventListener("drop", handleWindowDrop)
      window.removeEventListener("paste", handlePaste)
    }
  }, [handleFiles])

  const statusLabel = allUploadsComplete
    ? uploadStats.error > 0
      ? `Finished — ${uploadStats.success} ready · ${uploadStats.error} failed`
      : `Uploaded ${uploadStats.success} Photo${uploadStats.success === 1 ? "" : "s"}`
    : `Uploading ${totalFiles} Photo${totalFiles === 1 ? "" : "s"} • ${
        uploadStats.uploading
      } in progress${uploadStats.pending ? ` · ${uploadStats.pending} queued` : ""}`

  return (
    <>
      {isWindowDragging && (
        <div
          className="fixed inset-0 z-40 bg-dune/40 backdrop-blur-sm flex items-center justify-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            windowDragDepth.current = 0
            setIsWindowDragging(false)
            if (e.dataTransfer?.files?.length) {
              handleFiles(e.dataTransfer.files)
            }
          }}
        >
          <div className="text-center bg-cream/90 rounded-3xl px-8 py-6 shadow-xl border border-sage/20">
            <p className="body text-dune font-semibold">Drop files to start uploading</p>
            <p className="caption text-sage mt-1">You can drag anywhere on the page</p>
          </div>
        </div>
      )}

      <motion.div
        layout
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
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
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-4 cursor-pointer py-2"
          >
            <div className="w-12 h-12 rounded-full bg-ocean-mist/30 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-sage" />
            </div>
            <div>
              <p className="body text-dune font-medium">Drop files here or tap to browse</p>
              <p className="caption text-sage">Upload images or videos (max 200MB)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="caption text-dune font-semibold uppercase tracking-wide">
                {statusLabel}
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

            {notice && (
              <div
                className={`flex items-center justify-between gap-3 text-sm rounded-2xl px-3 py-2 ${
                  notice.type === "error"
                    ? "bg-terracotta/10 text-terracotta"
                    : "bg-sage/10 text-sage"
                }`}
              >
                <span>{notice.message}</span>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="text-current hover:opacity-70 transition-opacity"
                  aria-label="Dismiss notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-sage">
              <span className="px-3 py-1 bg-cream/70 rounded-full">
                Ready: {uploadStats.success}
              </span>
              <span className="px-3 py-1 bg-cream/70 rounded-full">
                Uploading: {uploadStats.uploading}
              </span>
              <span className="px-3 py-1 bg-cream/70 rounded-full">
                Queued: {uploadStats.pending}
              </span>
              <span className="px-3 py-1 bg-cream/70 rounded-full">
                Failed: {uploadStats.error}
              </span>
            </div>

            <div className="border border-sage/20 rounded-2xl p-4 space-y-3 bg-cream/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="body text-dune font-semibold">Batch tags</p>
                  <p className="text-xs text-sage">Applied to every photo in this upload</p>
                </div>
                {queuedAction && (
                  <span className="text-xs font-semibold text-dusty-rose bg-dusty-rose/10 rounded-full px-3 py-1">
                    {queuedAction === "apply"
                      ? "Will apply once uploads finish"
                      : "Will skip tagging when uploads finish"}
                  </span>
                )}
              </div>
              <TagSelector selectedTags={batchTags} onTagsChange={setBatchTags} />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleBatchAction("apply")}
                  disabled={batchTags.length === 0}
                  className={`flex-1 min-w-[180px] py-2.5 px-4 arch-full text-sm font-semibold transition-colors ${
                    batchTags.length === 0
                      ? "bg-sage/15 text-sage/50 cursor-not-allowed"
                      : "bg-dusty-rose text-cream hover:bg-dusty-rose/90"
                  }`}
                >
                  {allUploadsComplete
                    ? "Apply tags & add to library"
                    : "Apply when uploads finish"}
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
                    <img
                      src={fileWithPreview.preview}
                      alt={fileWithPreview.file.name}
                      className="w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      aria-label="Remove file from upload"
                      onClick={() => removeFile(fileWithPreview.id)}
                      className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-dune/50 text-cream flex items-center justify-center backdrop-blur-sm hover:bg-dune/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {fileWithPreview.status === "uploading" && (
                      <>
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-dune/30">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                            className="h-full bg-dusty-rose"
                          />
                        </div>
                      </>
                    )}

                    {fileWithPreview.status === "success" && (
                      <div className="absolute top-2 right-2">
                        <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-cream" />
                        </div>
                      </div>
                    )}

                    {fileWithPreview.status === "error" && (
                      <div className="absolute inset-0 bg-terracotta/75 backdrop-blur-sm flex items-center justify-center px-3 text-center">
                        <div className="space-y-2 text-cream">
                          <AlertCircle className="w-8 h-8 mx-auto" />
                          <p className="text-sm font-semibold leading-tight">
                            {fileWithPreview.errorMessage ?? "Upload failed"}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center text-xs font-semibold">
                            {fileWithPreview.retryCount < MAX_RETRIES && (
                              <button
                                className="px-3 py-1 border border-cream/70 rounded-full hover:bg-cream/10 transition-colors"
                                onClick={() => handleRetry(fileWithPreview.id)}
                              >
                                Retry
                              </button>
                            )}
                            <button
                              className="px-3 py-1 border border-cream/70 rounded-full hover:bg-cream/10 transition-colors"
                              onClick={() => removeFile(fileWithPreview.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}

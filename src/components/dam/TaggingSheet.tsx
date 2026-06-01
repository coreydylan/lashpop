"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { TeamMemberDropdown } from "./TeamMemberDropdown"
import { TagSelector } from "./TagSelector"

interface Asset {
  id: string
  fileName: string
  filePath: string
}

interface SelectedTag {
  id: string
  name: string
  displayName: string
  category: {
    id: string
    name: string
    displayName: string
    color?: string
  }
}

interface TaggingSheetProps {
  isOpen: boolean
  onClose: () => void
  assets: Asset[]
  teamMembers: Array<{ id: string; name: string; imageUrl: string }>
  onSave: (tags: TagData) => void
}

interface TagData {
  teamMemberId?: string
  tagIds: string[]
}

export function TaggingSheet({
  isOpen,
  onClose,
  assets,
  teamMembers,
  onSave
}: TaggingSheetProps) {
  const [teamMemberId, setTeamMemberId] = useState<string | undefined>()
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([])
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0)

  // Reset tags when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTeamMemberId(undefined)
      setSelectedTags([])
      setCurrentAssetIndex(0)
    }
  }, [isOpen])

  const handleSave = () => {
    onSave({
      teamMemberId,
      tagIds: selectedTags.map((t) => t.id)
    })
    onClose()
  }

  const goToPrevious = () => {
    setCurrentAssetIndex((prev) => (prev > 0 ? prev - 1 : assets.length - 1))
  }

  const goToNext = () => {
    setCurrentAssetIndex((prev) => (prev < assets.length - 1 ? prev + 1 : 0))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dune/50 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-cream arch-top z-50 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-4 pb-3">
              <div className="w-16 h-1.5 bg-sage/30 rounded-full" />
            </div>

            {/* Header with Photo Preview */}
            <div className="border-b border-sage/20">
              <div className="flex items-center justify-between px-6 py-5">
                <div>
                  <h2 className="h3 text-dune">
                    Tag {assets.length} {assets.length === 1 ? "Asset" : "Assets"}
                  </h2>
                  <p className="caption text-sage mt-2">
                    Add tags to organize your content
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full hover:bg-warm-sand/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6 text-sage" />
                </button>
              </div>

              {/* Photo Preview Carousel */}
              {assets.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="relative">
                    {/* Main preview */}
                    <div className="relative aspect-video bg-warm-sand/40 arch-full overflow-hidden">
                      <img
                        src={assets[currentAssetIndex].filePath}
                        alt={assets[currentAssetIndex].fileName}
                        className="w-full h-full object-contain"
                      />

                      {/* Navigation arrows */}
                      {assets.length > 1 && (
                        <>
                          <button
                            onClick={goToPrevious}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dune/80 hover:bg-dune backdrop-blur-sm flex items-center justify-center transition-all"
                          >
                            <ChevronLeft className="w-6 h-6 text-cream" />
                          </button>
                          <button
                            onClick={goToNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dune/80 hover:bg-dune backdrop-blur-sm flex items-center justify-center transition-all"
                          >
                            <ChevronRight className="w-6 h-6 text-cream" />
                          </button>
                        </>
                      )}

                      {/* Counter */}
                      {assets.length > 1 && (
                        <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-dune/80 backdrop-blur-sm rounded-full">
                          <span className="caption text-cream">
                            {currentAssetIndex + 1} / {assets.length}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {assets.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {assets.map((asset, index) => (
                          <button
                            key={asset.id}
                            onClick={() => setCurrentAssetIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 arch-full overflow-hidden border-2 transition-all ${
                              index === currentAssetIndex
                                ? "border-dusty-rose ring-2 ring-dusty-rose/30"
                                : "border-sage/20 hover:border-sage/40"
                            }`}
                          >
                            <img
                              src={asset.filePath}
                              alt={asset.fileName}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-8 space-y-10">
              {/* Team Member */}
              <div>
                <label className="caption text-dune mb-4 block">
                  Team Member
                </label>
                <TeamMemberDropdown
                  teamMembers={teamMembers}
                  selectedId={teamMemberId}
                  onSelect={setTeamMemberId}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="caption text-dune mb-4 block">
                  Tags <span className="text-sage">(organize your content)</span>
                </label>
                <TagSelector
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-cream border-t border-sage/20 px-6 py-5 backdrop-blur-sm">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="btn btn-secondary flex-1 py-5 touch-manipulation"
                >
                  Skip
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary flex-1 py-5 touch-manipulation shadow-lg"
                >
                  Save Tags
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

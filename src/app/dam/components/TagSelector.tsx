"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ChevronLeft, X } from "lucide-react"

interface Tag {
  id: string
  name: string
  displayName: string
}

interface TagCategory {
  id: string
  name: string
  displayName: string
  color?: string
  tags: Tag[]
}

interface SelectedTag extends Tag {
  category: {
    id: string
    name: string
    displayName: string
    color?: string
  }
}

interface TagSelectorProps {
  selectedTags: SelectedTag[]
  onTagsChange: (tags: SelectedTag[]) => void
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TagCategory | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchTeamMembers()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/dam/tags")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/dam/team-members")
      const data = await response.json()
      setTeamMembers(data.teamMembers || [])
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }

  const handleAddTag = (category: TagCategory, tag: Tag) => {
    // Check if tag is already selected
    const isAlreadySelected = selectedTags.some((t) => t.id === tag.id)
    if (isAlreadySelected) return

    const newTag: SelectedTag = {
      ...tag,
      category: {
        id: category.id,
        name: category.name,
        displayName: category.displayName,
        color: category.color
      }
    }

    onTagsChange([...selectedTags, newTag])
    // Go back to category view but keep selector open
    setSelectedCategory(null)
  }

  const handleCategoryClick = (category: TagCategory) => {
    setSelectedCategory(category)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
  }

  const handleCancel = () => {
    setSelectedCategory(null)
    setIsAdding(false)
  }

  const handleAddTeamMember = (member: any) => {
    const isAlreadySelected = selectedTags.some((t) => t.id === member.id)
    if (isAlreadySelected) return

    const newTag: SelectedTag = {
      id: member.id,
      name: member.name,
      displayName: member.name,
      category: {
        id: "team",
        name: "team",
        displayName: "Team",
        color: "#BCC9C2"
      }
    }

    onTagsChange([...selectedTags, newTag])
    // Go back to category view but keep selector open
    setSelectedCategory(null)
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId))
  }

  // Combine team category with tag categories
  const allCategories = [
    {
      id: "team",
      name: "team",
      displayName: "Team",
      color: "#BCC9C2",
      tags: teamMembers.map(m => ({
        id: m.id,
        name: m.name,
        displayName: m.name,
        imageUrl: m.imageUrl
      }))
    },
    ...categories
  ]

  return (
    <div className="space-y-3">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-start gap-2">
          <AnimatePresence>
            {selectedTags.map((tag) => (
              <motion.div
                key={tag.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${tag.category.color || "#A19781"} 0%, ${tag.category.color || "#A19781"}CC 100%)`,
                  color: "#FAF7F1"
                }}
              >
                <span className="text-sm font-medium">{tag.displayName}</span>
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label={`Remove ${tag.displayName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tag Picker */}
      <div className="flex items-start gap-3 overflow-hidden">
        {/* Add Tag Button */}
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border ${
            isAdding
              ? "bg-sage text-cream border-sage"
              : "bg-sage/10 hover:bg-sage/20 text-sage border-sage/30"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Tag</span>
        </button>

      {/* Category/Tag Selector - Horizontal scrolling flow */}
      <AnimatePresence mode="wait">
        {isAdding && (
          <motion.div
            key={selectedCategory ? "tags" : "categories"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2 overflow-x-auto flex-nowrap hide-scrollbar"
            style={{ scrollbarWidth: 'thin' }}
          >
            {selectedCategory ? (
              <>
                {/* Back button */}
                <button
                  onClick={handleBackToCategories}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-warm-sand/50 hover:bg-warm-sand text-dune transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                {/* Tags or Team Members */}
                {selectedCategory.tags.map((tag: any) => {
                  const isSelected = selectedTags.some((t) => t.id === tag.id)
                  const isTeamCategory = selectedCategory.id === "team"

                  return (
                    <motion.button
                      key={tag.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => isTeamCategory ? handleAddTeamMember(tag) : handleAddTag(selectedCategory, tag)}
                      disabled={isSelected}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition-all shadow-sm ${
                        isSelected
                          ? "bg-sage/20 text-sage/60 cursor-not-allowed"
                          : "hover:shadow-md"
                      }`}
                      style={{
                        background: isSelected
                          ? undefined
                          : `linear-gradient(135deg, ${selectedCategory.color || "#A19781"} 0%, ${selectedCategory.color || "#A19781"}CC 100%)`,
                        color: isSelected ? undefined : "#FAF7F1"
                      }}
                    >
                      {isTeamCategory && (
                        <div className="relative w-5 h-5 rounded-full overflow-hidden border border-cream/30 flex-shrink-0 bg-warm-sand/40">
                          {!tag.imageUrl || tag.imageUrl.includes('placeholder') ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                            </div>
                          ) : (
                            <img
                              src={tag.imageUrl}
                              alt={tag.displayName}
                              className="absolute"
                              style={
                                tag.cropCloseUpCircle
                                  ? {
                                      width: `${tag.cropCloseUpCircle.scale * 100}%`,
                                      height: `${tag.cropCloseUpCircle.scale * 100}%`,
                                      left: `${50 - (tag.cropCloseUpCircle.x * tag.cropCloseUpCircle.scale)}%`,
                                      top: `${50 - (tag.cropCloseUpCircle.y * tag.cropCloseUpCircle.scale)}%`,
                                      objectFit: 'cover'
                                    }
                                  : {
                                      width: '200%',
                                      height: '200%',
                                      left: '-50%',
                                      top: '-25%',
                                      objectFit: 'cover'
                                    }
                              }
                              onError={(e) => {
                                const target = e.currentTarget
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-3 h-3 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>'
                                }
                              }}
                            />
                          )}
                        </div>
                      )}
                      <span className="text-sm whitespace-nowrap">
                        {tag.displayName}
                        {isSelected && " ✓"}
                      </span>
                    </motion.button>
                  )
                })}
              </>
            ) : (
              <>
                {/* Categories */}
                {allCategories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    onClick={() => handleCategoryClick(category)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full bg-warm-sand/50 hover:bg-warm-sand text-dune transition-all shadow-sm hover:shadow-md"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color || "#A19781" }}
                    />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {category.displayName}
                    </span>
                  </motion.button>
                ))}

                {/* Done/Cancel button */}
                <button
                  onClick={handleCancel}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full transition-colors ${
                    selectedTags.length > 0
                      ? "bg-sage text-cream hover:bg-sage/90"
                      : "bg-terracotta/20 hover:bg-terracotta/30 text-terracotta"
                  }`}
                >
                  <span className="text-sm font-medium whitespace-nowrap">
                    {selectedTags.length > 0 ? "Done" : "Cancel"}
                  </span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

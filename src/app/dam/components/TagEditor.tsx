"use client"

import { useState, useEffect, useRef, Fragment, useCallback } from "react"
import clsx from "clsx"
import {
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  ChevronRight,
  Check,
  Folder,
  Tag
} from "lucide-react"

interface TagCategory {
  id: string
  name: string
  displayName: string
  color: string
  tags?: Array<{
    id: string
    name: string
    displayName: string
  }>
}

interface TagEditorProps {
  categories: TagCategory[]
  onSave: (categories: TagCategory[]) => void
  onClose: () => void
}

export function TagEditor({ categories, onSave, onClose }: TagEditorProps) {
  const [editedCategories, setEditedCategories] = useState<TagCategory[]>(() =>
    JSON.parse(JSON.stringify(categories))
  )
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  )
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleSave = useCallback(() => {
    onSave(editedCategories)
    onClose()
  }, [editedCategories, onClose, onSave])

  const handleDelete = useCallback(() => {
    setEditedCategories(prev => {
      const newCategories = prev.map(cat => ({
        ...cat,
        tags: cat.tags?.filter(tag => !selectedItems.has(`tag-${tag.id}`))
      })).filter(cat => !selectedItems.has(`cat-${cat.id}`))

      setSelectedItems(new Set())
      return newCategories
    })
  }, [selectedItems])

  const handleDeleteTag = useCallback((tagId: string) => {
    setEditedCategories(prev =>
      prev.map(cat => ({
        ...cat,
        tags: cat.tags?.filter(tag => tag.id !== tagId)
      }))
    )
    setSelectedItems(prev => {
      if (!prev.has(`tag-${tagId}`)) return prev
      const next = new Set(prev)
      next.delete(`tag-${tagId}`)
      return next
    })
    if (editingId === `tag-${tagId}`) {
      setEditingId(null)
      setEditValue("")
    }
  }, [editingId])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (editingId) {
        setEditingId(null)
        setEditValue("")
      } else {
        onClose()
      }
    }

    // Multi-select with shift+click or cmd/ctrl+click
    if (e.key === " " && !editingId) {
      e.preventDefault()
      // Toggle selection of focused item
    }

    // Save with cmd/ctrl+s
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault()
      handleSave()
    }

    // Delete selected items
    if (e.key === "Delete" || e.key === "Backspace") {
      if (!editingId && selectedItems.size > 0) {
        e.preventDefault()
        handleDelete()
      }
    }
  }, [editingId, handleDelete, handleSave, onClose, selectedItems])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleRename = (id: string, newName: string, type: 'category' | 'tag') => {
    if (type === 'category') {
      setEditedCategories(prev =>
        prev.map(cat =>
          cat.id === id ? { ...cat, displayName: newName } : cat
        )
      )
    } else {
      setEditedCategories(prev =>
        prev.map(cat => ({
          ...cat,
          tags: cat.tags?.map(tag =>
            tag.id === id ? { ...tag, displayName: newName } : tag
          )
        }))
      )
    }
    setEditingId(null)
    setEditValue("")
  }

  const handleAddCategory = () => {
    const newCategory: TagCategory = {
      id: `cat-${Date.now()}`,
      name: `category-${Date.now()}`,
      displayName: "New Category",
      color: "#A19781",
      tags: []
    }
    setEditedCategories(prev => [...prev, newCategory])
    setEditingId(`cat-${newCategory.id}`)
    setEditValue("New Category")
  }

  const handleAddTag = (categoryId: string) => {
    const newTag = {
      id: `tag-${Date.now()}`,
      name: `tag-${Date.now()}`,
      displayName: "New Tag"
    }
    setEditedCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, tags: [...(cat.tags || []), newTag] }
          : cat
      )
    )
    setEditingId(`tag-${newTag.id}`)
    setEditValue("New Tag")
  }

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const filteredCategories = editedCategories.filter(cat => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    if (cat.displayName.toLowerCase().includes(query)) return true
    return cat.tags?.some(tag =>
      tag.displayName.toLowerCase().includes(query)
    )
  })

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-cream rounded-[32px] shadow-2xl border border-sage/15 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-sage/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-dune">Tag & Category Editor</h2>
              <p className="text-sm text-sage/70 mt-1">
                {selectedItems.size > 0
                  ? `${selectedItems.size} selected • Press Delete to remove`
                  : "Click to select • Double-click to edit • Drag to reorder"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-dusty-rose text-white rounded-full text-sm font-medium hover:bg-dusty-rose/90 transition"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-sage/10 rounded-full transition"
              >
                <X className="w-5 h-5 text-sage/70" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 rounded-[20px] border border-sage/20 bg-white px-4 py-2.5">
            <Tag className="w-4 h-4 text-sage/70" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories and tags..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-sage/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-sage/10 rounded-full transition"
              >
                <X className="w-3 h-3 text-sage/70" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-sage/20 bg-white/70 overflow-hidden">
              {/* Category Header */}
              <div
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 transition cursor-pointer",
                  selectedItems.has(`cat-${category.id}`)
                    ? "bg-dusty-rose/10 border-l-4 border-dusty-rose"
                    : "hover:bg-sage/5"
                )}
                onClick={(e) => {
                  if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    toggleSelection(`cat-${category.id}`)
                  }
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpanded(category.id)
                  }}
                  className="p-1 hover:bg-sage/10 rounded transition"
                >
                  <ChevronRight
                    className={clsx(
                      "w-4 h-4 text-sage/70 transition",
                      expandedCategories.has(category.id) && "rotate-90"
                    )}
                  />
                </button>

                <div
                  className="w-3 h-3 rounded-full border-2 border-sage/30"
                  style={{ backgroundColor: category.color }}
                />

                {editingId === `cat-${category.id}` ? (
                  <input
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRename(category.id, editValue, 'category')}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRename(category.id, editValue, 'category')
                      }
                      if (e.key === "Escape") {
                        setEditingId(null)
                        setEditValue("")
                      }
                    }}
                    className="flex-1 px-2 py-1 bg-white border border-dusty-rose/30 rounded text-sm outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-medium text-dune">{category.displayName}</span>
                    <span className="text-xs text-sage/60">
                      {category.tags?.length || 0} tags
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {selectedItems.has(`cat-${category.id}`) && (
                    <Check className="w-4 h-4 text-dusty-rose" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(`cat-${category.id}`)
                      setEditValue(category.displayName)
                    }}
                    className="p-1.5 hover:bg-sage/10 rounded transition"
                    title="Rename category"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-sage/70" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddTag(category.id)
                    }}
                    className="p-1.5 hover:bg-sage/10 rounded transition"
                    title="Add tag to category"
                  >
                    <Plus className="w-3.5 h-3.5 text-sage/70" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`Delete category "${category.displayName}" and all its tags?`)) {
                        setEditedCategories(prev => prev.filter(c => c.id !== category.id))
                        setSelectedItems(prev => {
                          const next = new Set(prev)
                          next.delete(`cat-${category.id}`)
                          return next
                        })
                      }
                    }}
                    className="p-1.5 hover:bg-red-50 rounded transition"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {expandedCategories.has(category.id) && category.tags && category.tags.length > 0 && (
                <div className="px-4 py-3 border-t border-sage/10 space-y-1">
                  {category.tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={clsx(
                        "group flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer",
                        selectedItems.has(`tag-${tag.id}`)
                          ? "bg-dusty-rose/10 border border-dusty-rose/30"
                          : "hover:bg-sage/5"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (e.shiftKey || e.metaKey || e.ctrlKey) {
                          toggleSelection(`tag-${tag.id}`)
                        } else {
                          setSelectedItems(new Set([`tag-${tag.id}`]))
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setEditingId(`tag-${tag.id}`)
                        setEditValue(tag.displayName)
                      }}
                    >
                      <Tag className="w-3.5 h-3.5 text-sage/50" />

                      {editingId === `tag-${tag.id}` ? (
                        <input
                          ref={editInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleRename(tag.id, editValue, 'tag')}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRename(tag.id, editValue, 'tag')
                            }
                            if (e.key === "Escape") {
                              setEditingId(null)
                              setEditValue("")
                            }
                          }}
                          className="flex-1 px-2 py-1 bg-white border border-dusty-rose/30 rounded text-sm outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex-1 text-sm text-dune">{tag.displayName}</span>
                      )}

                      <div className="flex items-center gap-1">
                        {selectedItems.has(`tag-${tag.id}`) && (
                          <Check className="w-3.5 h-3.5 text-dusty-rose" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(`tag-${tag.id}`)
                            setEditValue(tag.displayName)
                          }}
                          className="p-1 hover:bg-sage/10 rounded transition opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-3 h-3 text-sage/70" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm("Delete this tag?")) {
                              handleDeleteTag(tag.id)
                            }
                          }}
                          className="p-1 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Add Category Button */}
          <button
            onClick={handleAddCategory}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-sage/30 text-sage/70 hover:border-dusty-rose/40 hover:text-dusty-rose hover:bg-dusty-rose/5 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add New Category</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sage/10 flex items-center justify-between">
          <div className="text-xs text-sage/60">
            <kbd className="px-1.5 py-0.5 bg-sage/10 rounded">Space</kbd> Select •
            <kbd className="px-1.5 py-0.5 bg-sage/10 rounded">Enter</kbd> Edit •
            <kbd className="px-1.5 py-0.5 bg-sage/10 rounded">Delete</kbd> Remove •
            <kbd className="px-1.5 py-0.5 bg-sage/10 rounded">⌘S</kbd> Save
          </div>
          {selectedItems.size > 0 && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-full text-sm transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

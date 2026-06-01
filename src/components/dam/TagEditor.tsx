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
  Tag as TagIcon,
  GripVertical,
  Link,
  Lock,
  Settings
} from "lucide-react"

interface TagData {
  id: string
  name: string
  displayName: string
  sortOrder?: number
  parentTagId?: string | null
  serviceCategoryId?: string | null
  serviceId?: string | null
  children?: TagData[]
}

interface TagCategory {
  id: string
  name: string
  displayName: string
  color: string
  tags?: TagData[]
  hierarchicalTags?: TagData[]
  selectionMode?: 'single' | 'multi' | 'limited'
  selectionLimit?: number | null
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

  // Drag and drop state
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null)
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null)

  // Category settings popover
  const [settingsOpenFor, setSettingsOpenFor] = useState<string | null>(null)

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

  const updateCategorySelectionMode = (categoryId: string, mode: 'single' | 'multi' | 'limited', limit?: number) => {
    setEditedCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, selectionMode: mode, selectionLimit: mode === 'limited' ? (limit || 3) : null }
          : cat
      )
    )
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

  // Drag and drop handlers
  const handleDragStart = (tagId: string, categoryId: string) => {
    setDraggedTagId(tagId)
    setDraggedCategoryId(categoryId)
  }

  const handleDragOver = (e: React.DragEvent, tagId: string) => {
    e.preventDefault()
    setDragOverTagId(tagId)
  }

  const handleDrop = (e: React.DragEvent, targetTagId: string, targetCategoryId: string) => {
    e.preventDefault()

    if (!draggedTagId || !draggedCategoryId || draggedTagId === targetTagId || draggedCategoryId !== targetCategoryId) {
      setDraggedTagId(null)
      setDraggedCategoryId(null)
      setDragOverTagId(null)
      return
    }

    setEditedCategories(prev =>
      prev.map(cat => {
        if (cat.id !== targetCategoryId) return cat

        const tags = cat.tags || []
        const draggedIndex = tags.findIndex(t => t.id === draggedTagId)
        const targetIndex = tags.findIndex(t => t.id === targetTagId)

        if (draggedIndex === -1 || targetIndex === -1) return cat

        const newTags = [...tags]
        const [removed] = newTags.splice(draggedIndex, 1)
        newTags.splice(targetIndex, 0, removed)

        // Update sortOrder based on new position
        const updatedTags = newTags.map((tag, index) => ({
          ...tag,
          sortOrder: index
        }))

        return { ...cat, tags: updatedTags }
      })
    )

    setDraggedTagId(null)
    setDraggedCategoryId(null)
    setDragOverTagId(null)
  }

  const handleDragEnd = () => {
    setDraggedTagId(null)
    setDraggedCategoryId(null)
    setDragOverTagId(null)
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
            <TagIcon className="w-4 h-4 text-sage/70" />
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
                    {/* Selection mode indicator */}
                    <span className={clsx(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      category.selectionMode === 'single' && "bg-amber-100 text-amber-700",
                      category.selectionMode === 'limited' && "bg-blue-100 text-blue-700",
                      (!category.selectionMode || category.selectionMode === 'multi') && "bg-green-100 text-green-700"
                    )}>
                      {category.selectionMode === 'single' ? 'Single' :
                       category.selectionMode === 'limited' ? `Max ${category.selectionLimit || 3}` :
                       'Multi'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1 relative">
                  {selectedItems.has(`cat-${category.id}`) && (
                    <Check className="w-4 h-4 text-dusty-rose" />
                  )}
                  {/* Settings button with dropdown */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSettingsOpenFor(settingsOpenFor === category.id ? null : category.id)
                    }}
                    className={clsx(
                      "p-1.5 rounded transition",
                      settingsOpenFor === category.id ? "bg-sage/20" : "hover:bg-sage/10"
                    )}
                    title="Selection mode settings"
                  >
                    <Settings className="w-3.5 h-3.5 text-sage/70" />
                  </button>
                  {/* Settings dropdown */}
                  {settingsOpenFor === category.id && (
                    <div
                      className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-sage/20 z-50 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 border-b border-sage/10">
                        <span className="text-xs font-semibold text-sage uppercase tracking-wide">Selection Mode</span>
                      </div>
                      <button
                        onClick={() => {
                          updateCategorySelectionMode(category.id, 'multi')
                          setSettingsOpenFor(null)
                        }}
                        className={clsx(
                          "w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-sage/5",
                          (!category.selectionMode || category.selectionMode === 'multi') && "bg-green-50"
                        )}
                      >
                        <span>Multi (unlimited)</span>
                        {(!category.selectionMode || category.selectionMode === 'multi') && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          updateCategorySelectionMode(category.id, 'single')
                          setSettingsOpenFor(null)
                        }}
                        className={clsx(
                          "w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-sage/5",
                          category.selectionMode === 'single' && "bg-amber-50"
                        )}
                      >
                        <span>Single (one only)</span>
                        {category.selectionMode === 'single' && (
                          <Check className="w-4 h-4 text-amber-600" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          updateCategorySelectionMode(category.id, 'limited', category.selectionLimit || 3)
                          setSettingsOpenFor(null)
                        }}
                        className={clsx(
                          "w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-sage/5",
                          category.selectionMode === 'limited' && "bg-blue-50"
                        )}
                      >
                        <span>Limited (max {category.selectionLimit || 3})</span>
                        {category.selectionMode === 'limited' && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                      {category.selectionMode === 'limited' && (
                        <div className="px-3 py-2 border-t border-sage/10">
                          <label className="text-xs text-sage block mb-1">Max tags:</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={category.selectionLimit || 3}
                            onChange={(e) => {
                              const limit = parseInt(e.target.value) || 3
                              updateCategorySelectionMode(category.id, 'limited', limit)
                            }}
                            className="w-full px-2 py-1 text-sm border border-sage/20 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
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
                  {/* Use hierarchicalTags if available to show proper nesting */}
                  {(category.hierarchicalTags || category.tags).map((tag) => {
                    const isServiceLinked = !!(tag.serviceCategoryId || tag.serviceId)
                    const hasChildren = tag.children && tag.children.length > 0

                    return (
                      <Fragment key={tag.id}>
                        {/* Parent tag */}
                        <div
                          draggable={editingId !== `tag-${tag.id}` && !isServiceLinked}
                          onDragStart={() => !isServiceLinked && handleDragStart(tag.id, category.id)}
                          onDragOver={(e) => !isServiceLinked && handleDragOver(e, tag.id)}
                          onDrop={(e) => !isServiceLinked && handleDrop(e, tag.id, category.id)}
                          onDragEnd={handleDragEnd}
                          className={clsx(
                            "group flex items-center gap-3 px-3 py-2 rounded-xl transition",
                            isServiceLinked ? "cursor-default" : (editingId === `tag-${tag.id}` ? "cursor-text" : "cursor-move"),
                            draggedTagId === tag.id && "opacity-50",
                            dragOverTagId === tag.id && draggedTagId !== tag.id && "border-t-2 border-dusty-rose",
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
                            if (isServiceLinked) return // Don't allow editing service-linked tags
                            e.stopPropagation()
                            setEditingId(`tag-${tag.id}`)
                            setEditValue(tag.displayName)
                          }}
                        >
                          {isServiceLinked ? (
                            <span title="Linked to service">
                              <Link className="w-3.5 h-3.5 text-purple-400" />
                            </span>
                          ) : (
                            <GripVertical className="w-3.5 h-3.5 text-sage/40" />
                          )}

                          {editingId === `tag-${tag.id}` && !isServiceLinked ? (
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
                            <span className={clsx(
                              "flex-1 text-sm",
                              hasChildren ? "font-medium text-dune" : "text-dune"
                            )}>
                              {tag.displayName}
                              {hasChildren && (
                                <span className="ml-2 text-xs text-sage/60">({tag.children?.length})</span>
                              )}
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            {isServiceLinked && (
                              <span className="text-xs text-purple-400 mr-1" title="Synced from services">
                                <Lock className="w-3 h-3 inline" />
                              </span>
                            )}
                            {selectedItems.has(`tag-${tag.id}`) && (
                              <Check className="w-3.5 h-3.5 text-dusty-rose" />
                            )}
                            {!isServiceLinked && (
                              <>
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
                              </>
                            )}
                          </div>
                        </div>

                        {/* Child tags (indented) */}
                        {hasChildren && tag.children?.map((childTag) => {
                          const isChildServiceLinked = !!(childTag.serviceCategoryId || childTag.serviceId)

                          return (
                            <div
                              key={childTag.id}
                              className={clsx(
                                "group flex items-center gap-3 px-3 py-2 rounded-xl transition ml-6",
                                isChildServiceLinked ? "cursor-default" : "cursor-move",
                                selectedItems.has(`tag-${childTag.id}`)
                                  ? "bg-dusty-rose/10 border border-dusty-rose/30"
                                  : "hover:bg-sage/5"
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                  toggleSelection(`tag-${childTag.id}`)
                                } else {
                                  setSelectedItems(new Set([`tag-${childTag.id}`]))
                                }
                              }}
                            >
                              {isChildServiceLinked ? (
                                <span title="Linked to service">
                                  <Link className="w-3.5 h-3.5 text-purple-400" />
                                </span>
                              ) : (
                                <GripVertical className="w-3.5 h-3.5 text-sage/40" />
                              )}

                              <span className="flex-1 text-sm text-dune/80">{childTag.displayName}</span>

                              <div className="flex items-center gap-1">
                                {isChildServiceLinked && (
                                  <span className="text-xs text-purple-400" title="Synced from services">
                                    <Lock className="w-3 h-3 inline" />
                                  </span>
                                )}
                                {selectedItems.has(`tag-${childTag.id}`) && (
                                  <Check className="w-3.5 h-3.5 text-dusty-rose" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </Fragment>
                    )
                  })}
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

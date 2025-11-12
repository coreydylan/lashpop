"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import clsx from "clsx"
import {
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  GripVertical,
  Folder
} from "lucide-react"

interface Collection {
  id: string
  name: string
  displayName: string
  description?: string | null
  sortOrder: number
  color?: string | null
}

interface CollectionManagerProps {
  collections: Collection[]
  onSave: (collections: Collection[]) => void
  onClose: () => void
}

export function CollectionManager({ collections, onSave, onClose }: CollectionManagerProps) {
  const [editedCollections, setEditedCollections] = useState<Collection[]>(() =>
    JSON.parse(JSON.stringify(collections)).sort((a: Collection, b: Collection) => a.sortOrder - b.sortOrder)
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  useEffect(() => {
    if (isAddingNew && newInputRef.current) {
      newInputRef.current.focus()
    }
  }, [isAddingNew])

  const handleSave = useCallback(() => {
    onSave(editedCollections)
    onClose()
  }, [editedCollections, onClose, onSave])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (editingId) {
        setEditingId(null)
        setEditValue("")
      } else if (isAddingNew) {
        setIsAddingNew(false)
        setNewCollectionName("")
      } else {
        onClose()
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault()
      handleSave()
    }
  }, [editingId, isAddingNew, handleSave, onClose])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleRename = (id: string, newName: string) => {
    setEditedCollections(prev =>
      prev.map(col =>
        col.id === id ? { ...col, displayName: newName } : col
      )
    )
    setEditingId(null)
    setEditValue("")
  }

  const handleDelete = (id: string) => {
    if (confirm("Delete this collection? Assets will keep their other tags.")) {
      setEditedCollections(prev => prev.filter(col => col.id !== id))
    }
  }

  const handleAddNew = () => {
    if (!newCollectionName.trim()) return

    const newCollection: Collection = {
      id: `tag-${Date.now()}`,
      name: newCollectionName.toLowerCase().replace(/\s+/g, '_'),
      displayName: newCollectionName.trim(),
      description: null,
      sortOrder: Math.max(...editedCollections.map(c => c.sortOrder), -1) + 1,
      color: null
    }

    setEditedCollections(prev => [...prev, newCollection])
    setIsAddingNew(false)
    setNewCollectionName("")
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (draggedId && draggedId !== id) {
      setDragOverId(id)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    setEditedCollections(prev => {
      const draggedIndex = prev.findIndex(c => c.id === draggedId)
      const targetIndex = prev.findIndex(c => c.id === targetId)

      if (draggedIndex === -1 || targetIndex === -1) return prev

      const newCollections = [...prev]
      const [draggedItem] = newCollections.splice(draggedIndex, 1)
      newCollections.splice(targetIndex, 0, draggedItem)

      // Update sortOrder for all collections
      return newCollections.map((col, index) => ({
        ...col,
        sortOrder: index
      }))
    })

    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dune/80 backdrop-blur-sm">
      <div className="bg-cream rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border-2 border-sage/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ocean-mist/30 flex items-center justify-center">
              <Folder className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dune">Manage Collections</h2>
              <p className="caption text-sage">Create, rename, and organize collections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-sage/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-sage" />
          </button>
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {editedCollections.map((collection) => (
              <div
                key={collection.id}
                draggable
                onDragStart={(e) => handleDragStart(e, collection.id)}
                onDragOver={(e) => handleDragOver(e, collection.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, collection.id)}
                className={clsx(
                  "group flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all",
                  dragOverId === collection.id
                    ? "border-dusty-rose bg-dusty-rose/10"
                    : "border-sage/20 hover:border-sage/40 bg-warm-sand/10"
                )}
              >
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-sage/40 group-hover:text-sage/60">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Collection name */}
                {editingId === collection.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRename(collection.id, editValue)
                      } else if (e.key === "Escape") {
                        setEditingId(null)
                        setEditValue("")
                      }
                    }}
                    onBlur={() => {
                      if (editValue.trim()) {
                        handleRename(collection.id, editValue)
                      } else {
                        setEditingId(null)
                        setEditValue("")
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border-2 border-dusty-rose bg-cream text-dune body focus:outline-none"
                  />
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    {collection.color && (
                      <div
                        className="w-4 h-4 rounded-full border border-sage/20"
                        style={{ backgroundColor: collection.color }}
                      />
                    )}
                    <span className="body text-dune font-medium">
                      {collection.displayName}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(collection.id)
                      setEditValue(collection.displayName)
                    }}
                    className="p-2 rounded-lg hover:bg-sage/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-sage" />
                  </button>
                  <button
                    onClick={() => handleDelete(collection.id)}
                    className="p-2 rounded-lg hover:bg-dusty-rose/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-dusty-rose" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add new collection */}
            {isAddingNew ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dusty-rose bg-dusty-rose/5">
                <div className="w-4 h-4" /> {/* Spacer for drag handle */}
                <input
                  ref={newInputRef}
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddNew()
                    } else if (e.key === "Escape") {
                      setIsAddingNew(false)
                      setNewCollectionName("")
                    }
                  }}
                  onBlur={() => {
                    if (newCollectionName.trim()) {
                      handleAddNew()
                    } else {
                      setIsAddingNew(false)
                      setNewCollectionName("")
                    }
                  }}
                  placeholder="Collection name..."
                  className="flex-1 px-3 py-1.5 rounded-xl border-2 border-dusty-rose bg-cream text-dune body focus:outline-none placeholder:text-sage/50"
                />
              </div>
            ) : (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-sage/30 hover:border-dusty-rose/50 transition-colors group"
              >
                <Plus className="w-4 h-4 text-sage group-hover:text-dusty-rose" />
                <span className="body text-sage group-hover:text-dusty-rose font-medium">
                  Add Collection
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-sage/20">
          <p className="caption text-sage">
            {editedCollections.length} collection{editedCollections.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full body text-sage hover:bg-sage/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-dune text-cream hover:bg-dune/90 transition-colors body font-semibold"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

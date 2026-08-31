"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  HelpCircle, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star,
  RefreshCw, 
  Save, 
  Check, 
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  FolderPlus,
  AlertCircle
} from 'lucide-react'
import { MiniRichEditor } from '@/components/admin/MiniRichEditor'

interface FAQCategory {
  id: string
  name: string
  displayName: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

interface FAQItem {
  id: string
  categoryId: string
  question: string
  answer: string
  displayOrder: number
  isActive: boolean
  isFeatured: boolean
}

export default function FAQManagerPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([])
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null) // categoryId
  const [newCategory, setNewCategory] = useState({ displayName: '', description: '' })
  const [newItem, setNewItem] = useState({ question: '', answer: '', isFeatured: false })

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/website/faqs')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async () => {
    if (!newCategory.displayName.trim()) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/website/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          data: {
            displayName: newCategory.displayName,
            description: newCategory.description,
            displayOrder: categories.length
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCategories([...categories, data.category])
        setNewCategory({ displayName: '', description: '' })
        setIsAddingCategory(false)
        showSaved()
      }
    } catch (error) {
      console.error('Error creating category:', error)
    } finally {
      setSaving(false)
    }
  }

  const createItem = async (categoryId: string) => {
    if (!newItem.question.trim() || !newItem.answer.trim()) return
    
    setSaving(true)
    try {
      const categoryItems = items.filter(i => i.categoryId === categoryId)
      const response = await fetch('/api/admin/website/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item',
          data: {
            categoryId,
            question: newItem.question,
            answer: newItem.answer,
            isFeatured: newItem.isFeatured,
            displayOrder: categoryItems.length
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setItems([...items, data.item])
        setNewItem({ question: '', answer: '', isFeatured: false })
        setIsAddingItem(null)
        showSaved()
      }
    } catch (error) {
      console.error('Error creating item:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = async (category: FAQCategory) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/website/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          id: category.id,
          data: {
            displayName: category.displayName,
            description: category.description,
            isActive: category.isActive,
            displayOrder: category.displayOrder
          }
        })
      })

      if (response.ok) {
        setCategories(categories.map(c => c.id === category.id ? category : c))
        setEditingCategory(null)
        showSaved()
      }
    } catch (error) {
      console.error('Error updating category:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateItem = async (item: FAQItem) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/website/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item',
          id: item.id,
          data: {
            question: item.question,
            answer: item.answer,
            isActive: item.isActive,
            isFeatured: item.isFeatured,
            displayOrder: item.displayOrder
          }
        })
      })

      if (response.ok) {
        setItems(items.map(i => i.id === item.id ? item : i))
        setEditingItem(null)
        showSaved()
      }
    } catch (error) {
      console.error('Error updating item:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category and every question in it?')) return
    
    try {
      const response = await fetch(`/api/admin/website/faqs?type=category&id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== id))
        setItems(items.filter(i => i.categoryId !== id))
        showSaved()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this question and answer?')) return
    
    try {
      const response = await fetch(`/api/admin/website/faqs?type=item&id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setItems(items.filter(i => i.id !== id))
        showSaved()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const toggleItemActive = async (item: FAQItem) => {
    await updateItem({ ...item, isActive: !item.isActive })
  }

  const toggleItemFeatured = async (item: FAQItem) => {
    await updateItem({ ...item, isFeatured: !item.isFeatured })
  }

  const toggleCategoryActive = async (category: FAQCategory) => {
    await updateCategory({ ...category, isActive: !category.isActive })
  }

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getCategoryItems = (categoryId: string) => 
    items.filter(i => i.categoryId === categoryId).sort((a, b) => a.displayOrder - b.displayOrder)

  const featuredCount = items.filter(i => i.isFeatured && i.isActive).length
  const totalActive = items.filter(i => i.isActive).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="grid gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sage/30 to-sage/10 sm:flex">
              <HelpCircle className="w-6 h-6 text-sage" />
            </div>
            <div className="min-w-0">
              <h1 className="h2 text-dune">Frequently asked questions</h1>
              <p className="text-sm text-dune/60">
                {categories.length} categories · {totalActive} shown on website · {featuredCount} in Top FAQs
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <button
              onClick={fetchFAQs}
              className="btn btn-secondary"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="btn btn-primary"
            >
              <FolderPlus className="w-4 h-4" />
              Add category
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 grid grid-cols-3 divide-x divide-sage/15 border-y border-sage/20 bg-white"
      >
        <div className="min-w-0 px-2 py-3 text-center sm:p-4">
          <div className="text-2xl font-serif text-dune">{categories.length}</div>
          <div className="text-[10px] text-dune/55 uppercase tracking-wide sm:text-xs sm:tracking-wider">Categories</div>
        </div>
        <div className="min-w-0 px-2 py-3 text-center sm:p-4">
          <div className="text-2xl font-serif text-sage">{totalActive}</div>
          <div className="text-[10px] text-dune/55 uppercase tracking-wide sm:text-xs sm:tracking-wider">Shown</div>
        </div>
        <div className="min-w-0 px-2 py-3 text-center sm:p-4">
          <div className="text-2xl font-serif text-golden">{featuredCount}</div>
          <div className="text-[10px] text-dune/55 uppercase tracking-wide sm:text-xs sm:tracking-wider">Top FAQs</div>
        </div>
      </motion.div>

      {/* Saved Indicator */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-ocean-mist text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Saved
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsAddingCategory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-lg bg-cream p-4 shadow-2xl sm:rounded-2xl sm:p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-serif text-lg text-dune mb-4">Add category</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider block mb-2">Name</label>
                  <input
                    type="text"
                    value={newCategory.displayName}
                    onChange={e => setNewCategory({ ...newCategory, displayName: e.target.value })}
                    placeholder="e.g., Lash Extensions"
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider block mb-2">Short description (optional)</label>
                  <input
                    type="text"
                    value={newCategory.description}
                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Brief description"
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddingCategory(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={createCategory}
                  disabled={saving || !newCategory.displayName.trim()}
                  className="flex-1 btn btn-primary"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add category
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories & Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {categories.length === 0 ? (
          <div className="glass rounded-lg border border-sage/20 p-8 text-center sm:rounded-2xl sm:p-12">
            <AlertCircle className="w-12 h-12 text-dune/30 mx-auto mb-4" />
            <p className="text-dune/60 mb-4">No question categories yet.</p>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="btn btn-primary"
            >
              <FolderPlus className="w-4 h-4" />
              Add first category
            </button>
          </div>
        ) : (
          categories.map(category => (
            <motion.div
              key={category.id}
              layout
              className="glass overflow-hidden rounded-lg border border-sage/20 sm:rounded-2xl"
            >
              {/* Category Header */}
              <div className="p-4 bg-warm-sand/30 border-b border-sage/10">
                <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                      className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center text-dune/60 hover:bg-white transition-colors"
                    >
                      {expandedCategory === category.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    {editingCategory?.id === category.id ? (
                      <input
                        type="text"
                        value={editingCategory.displayName}
                        onChange={e => setEditingCategory({ ...editingCategory, displayName: e.target.value })}
                        className="min-w-0 flex-1 rounded-lg border border-sage/20 bg-white px-3 py-1 focus:outline-none focus:border-dusty-rose/50"
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0">
                        <h3 className={`font-medium ${category.isActive ? 'text-dune' : 'text-dune/50'}`}>
                          {category.displayName}
                        </h3>
                        <p className="text-xs text-dune/50">
                          {getCategoryItems(category.id).length} questions
                        </p>
                      </div>
                    )}
                  </div>

                  <div className={`grid w-full gap-2 sm:flex sm:w-auto ${editingCategory?.id === category.id ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {editingCategory?.id === category.id ? (
                      <>
                        <button
                          onClick={() => updateCategory(editingCategory)}
                          className="flex min-h-11 w-full items-center justify-center rounded-md bg-ocean-mist/20 text-ocean-mist hover:bg-ocean-mist/30 sm:size-11"
                          aria-label={`Save changes to ${category.displayName}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="flex min-h-11 w-full items-center justify-center rounded-md bg-sage/10 text-dune/50 hover:bg-sage/20 sm:size-11"
                          aria-label={`Cancel editing ${category.displayName}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleCategoryActive(category)}
                          className={`flex min-h-11 w-full items-center justify-center rounded-md transition-all sm:size-11 ${
                            category.isActive
                              ? 'bg-ocean-mist/20 text-ocean-mist hover:bg-ocean-mist/30'
                              : 'bg-sage/10 text-dune/40 hover:bg-sage/20'
                          }`}
                          title={category.isActive ? 'Hide category' : 'Show category'}
                          aria-label={`${category.isActive ? 'Hide' : 'Show'} ${category.displayName}`}
                        >
                          {category.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="flex min-h-11 w-full items-center justify-center rounded-md bg-sage/10 text-dune/50 hover:bg-sage/20 sm:size-11"
                          aria-label={`Edit ${category.displayName}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="flex min-h-11 w-full items-center justify-center rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 sm:size-11"
                          aria-label={`Delete ${category.displayName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Items */}
              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {getCategoryItems(category.id).map((item, index) => (
                        <div
                          key={item.id}
                          className={`rounded-lg border p-3 transition-all sm:rounded-xl sm:p-4 ${
                            item.isActive 
                              ? 'bg-white/50 border-sage/10' 
                              : 'bg-sage/5 border-sage/5 opacity-60'
                          }`}
                        >
                          {editingItem?.id === item.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingItem.question}
                                onChange={e => setEditingItem({ ...editingItem, question: e.target.value })}
                                placeholder="Question"
                                className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose/50"
                              />
                              <MiniRichEditor
                                value={editingItem.answer}
                                onChange={(html) => setEditingItem({ ...editingItem, answer: html })}
                                placeholder="Enter your answer…"
                                minHeight={100}
                              />
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingItem.isFeatured}
                                    onChange={e => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                                    className="w-4 h-4 accent-golden"
                                  />
                                  <span className="text-sm text-dune/70">Show in Top FAQs</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2 sm:flex">
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="px-3 py-1.5 text-sm bg-sage/10 text-dune/60 rounded-lg hover:bg-sage/20"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => updateItem(editingItem)}
                                    className="px-3 py-1.5 text-sm bg-dusty-rose text-white rounded-lg hover:bg-terracotta"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:flex">
                              <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center text-xs text-dune/50 flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-dune text-sm">{item.question}</h4>
                                  {item.isFeatured && (
                                    <Star className="w-4 h-4 text-golden fill-golden flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-dune/60 line-clamp-2">{item.answer}</p>
                              </div>
                              <div className="col-span-2 grid grid-cols-4 gap-1 sm:col-span-1 sm:ml-auto sm:flex sm:flex-shrink-0">
                                <button
                                  onClick={() => toggleItemFeatured(item)}
                                  className={`flex min-h-11 w-full items-center justify-center rounded-md transition-all sm:size-11 ${
                                    item.isFeatured
                                      ? 'bg-golden/20 text-golden'
                                      : 'bg-sage/10 text-dune/30 hover:text-golden'
                                  }`}
                                  title={item.isFeatured ? 'Remove from Top FAQs' : 'Add to Top FAQs'}
                                  aria-label={`${item.isFeatured ? 'Remove' : 'Add'} ${item.question} ${item.isFeatured ? 'from' : 'to'} Top FAQs`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-golden' : ''}`} />
                                </button>
                                <button
                                  onClick={() => toggleItemActive(item)}
                                  className={`flex min-h-11 w-full items-center justify-center rounded-md transition-all sm:size-11 ${
                                    item.isActive
                                      ? 'bg-ocean-mist/20 text-ocean-mist'
                                      : 'bg-sage/10 text-dune/30'
                                  }`}
                                  aria-label={`${item.isActive ? 'Hide' : 'Show'} ${item.question}`}
                                >
                                  {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="flex min-h-11 w-full items-center justify-center rounded-md bg-sage/10 text-dune/40 hover:bg-sage/20 sm:size-11"
                                  aria-label={`Edit ${item.question}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="flex min-h-11 w-full items-center justify-center rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 sm:size-11"
                                  aria-label={`Delete ${item.question}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add New Item */}
                      {isAddingItem === category.id ? (
                        <div className="space-y-3 rounded-lg border border-dusty-rose/20 bg-dusty-rose/5 p-3 sm:rounded-xl sm:p-4">
                          <input
                            type="text"
                            value={newItem.question}
                            onChange={e => setNewItem({ ...newItem, question: e.target.value })}
                            placeholder="Question"
                            className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose/50"
                            autoFocus
                          />
                          <MiniRichEditor
                            value={newItem.answer}
                            onChange={(html) => setNewItem({ ...newItem, answer: html })}
                            placeholder="Enter your answer…"
                            minHeight={80}
                          />
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newItem.isFeatured}
                                onChange={e => setNewItem({ ...newItem, isFeatured: e.target.checked })}
                                className="w-4 h-4 accent-golden"
                              />
                              <span className="text-sm text-dune/70">Show in Top FAQs</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2 sm:flex">
                              <button
                                onClick={() => {
                                  setIsAddingItem(null)
                                  setNewItem({ question: '', answer: '', isFeatured: false })
                                }}
                                className="px-3 py-1.5 text-sm bg-sage/10 text-dune/60 rounded-lg hover:bg-sage/20"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => createItem(category.id)}
                                disabled={!newItem.question.trim() || !newItem.answer.trim()}
                                className="px-3 py-1.5 text-sm bg-dusty-rose text-white rounded-lg hover:bg-terracotta disabled:opacity-50"
                              >
                                Add question
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsAddingItem(category.id)}
                          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-sage/25 p-3 text-dune/50 transition-colors hover:border-dusty-rose/30 hover:text-dusty-rose"
                        >
                          <Plus className="w-4 h-4" />
                          Add question to this category
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 rounded-lg border border-sage/20 bg-sage/10 p-4"
      >
        <p className="text-xs text-dune/70">
          Add a question to Top FAQs to feature it near the top of the page. Show or hide questions without deleting them.
          Use the editor toolbar for bold text, italics, lists, and links. Use HTML mode only when you need to edit the code.
        </p>
      </motion.div>
    </div>
  )
}

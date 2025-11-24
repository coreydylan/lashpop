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
    if (!confirm('Delete this category and all its FAQs?')) return
    
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
    if (!confirm('Delete this FAQ?')) return
    
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage/30 to-sage/10 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-sage" />
            </div>
            <div>
              <h1 className="h2 text-dune">FAQ Manager</h1>
              <p className="text-sm text-dune/60">
                {categories.length} categories • {totalActive} active FAQs • {featuredCount} featured
              </p>
            </div>
          </div>
          <div className="flex gap-3">
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
              Add Category
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        <div className="glass rounded-2xl p-4 border border-sage/20 text-center">
          <div className="text-2xl font-serif text-dune">{categories.length}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Categories</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-sage/30 text-center">
          <div className="text-2xl font-serif text-sage">{totalActive}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Active FAQs</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-golden/30 text-center">
          <div className="text-2xl font-serif text-golden">{featuredCount}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Featured (Top FAQs)</div>
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
            Saved!
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
              className="bg-cream rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-serif text-lg text-dune mb-4">New Category</h3>
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
                  <label className="text-xs text-dune/50 uppercase tracking-wider block mb-2">Description (optional)</label>
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
                  Create
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
          <div className="glass rounded-3xl p-12 border border-sage/20 text-center">
            <AlertCircle className="w-12 h-12 text-dune/30 mx-auto mb-4" />
            <p className="text-dune/60 mb-4">No FAQ categories yet</p>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="btn btn-primary"
            >
              <FolderPlus className="w-4 h-4" />
              Create First Category
            </button>
          </div>
        ) : (
          categories.map(category => (
            <motion.div
              key={category.id}
              layout
              className="glass rounded-3xl border border-sage/20 overflow-hidden"
            >
              {/* Category Header */}
              <div className="p-4 bg-warm-sand/30 border-b border-sage/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
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
                        className="px-3 py-1 bg-white border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose/50"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <h3 className={`font-medium ${category.isActive ? 'text-dune' : 'text-dune/50'}`}>
                          {category.displayName}
                        </h3>
                        <p className="text-xs text-dune/50">
                          {getCategoryItems(category.id).length} FAQs
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editingCategory?.id === category.id ? (
                      <>
                        <button
                          onClick={() => updateCategory(editingCategory)}
                          className="w-8 h-8 rounded-lg bg-ocean-mist/20 text-ocean-mist hover:bg-ocean-mist/30 flex items-center justify-center"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="w-8 h-8 rounded-lg bg-sage/10 text-dune/50 hover:bg-sage/20 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleCategoryActive(category)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            category.isActive
                              ? 'bg-ocean-mist/20 text-ocean-mist hover:bg-ocean-mist/30'
                              : 'bg-sage/10 text-dune/40 hover:bg-sage/20'
                          }`}
                          title={category.isActive ? 'Hide category' : 'Show category'}
                        >
                          {category.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="w-8 h-8 rounded-lg bg-sage/10 text-dune/50 hover:bg-sage/20 flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center"
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
                          className={`p-4 rounded-2xl border transition-all ${
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
                              <textarea
                                value={editingItem.answer}
                                onChange={e => setEditingItem({ ...editingItem, answer: e.target.value })}
                                placeholder="Answer (HTML supported)"
                                rows={4}
                                className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose/50 text-sm"
                              />
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingItem.isFeatured}
                                    onChange={e => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                                    className="w-4 h-4 accent-golden"
                                  />
                                  <span className="text-sm text-dune/70">Featured in Top FAQs</span>
                                </label>
                                <div className="flex gap-2">
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
                            <div className="flex items-start gap-3">
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
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => toggleItemFeatured(item)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                    item.isFeatured
                                      ? 'bg-golden/20 text-golden'
                                      : 'bg-sage/10 text-dune/30 hover:text-golden'
                                  }`}
                                  title={item.isFeatured ? 'Remove from Top FAQs' : 'Add to Top FAQs'}
                                >
                                  <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-golden' : ''}`} />
                                </button>
                                <button
                                  onClick={() => toggleItemActive(item)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                    item.isActive
                                      ? 'bg-ocean-mist/20 text-ocean-mist'
                                      : 'bg-sage/10 text-dune/30'
                                  }`}
                                >
                                  {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="w-7 h-7 rounded-lg bg-sage/10 text-dune/40 hover:bg-sage/20 flex items-center justify-center"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"
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
                        <div className="p-4 bg-dusty-rose/5 rounded-2xl border border-dusty-rose/20 space-y-3">
                          <input
                            type="text"
                            value={newItem.question}
                            onChange={e => setNewItem({ ...newItem, question: e.target.value })}
                            placeholder="Question"
                            className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose/50"
                            autoFocus
                          />
                          <textarea
                            value={newItem.answer}
                            onChange={e => setNewItem({ ...newItem, answer: e.target.value })}
                            placeholder="Answer (HTML supported)"
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose/50 text-sm"
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newItem.isFeatured}
                                onChange={e => setNewItem({ ...newItem, isFeatured: e.target.checked })}
                                className="w-4 h-4 accent-golden"
                              />
                              <span className="text-sm text-dune/70">Featured in Top FAQs</span>
                            </label>
                            <div className="flex gap-2">
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
                                Add FAQ
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsAddingItem(category.id)}
                          className="w-full p-3 border-2 border-dashed border-sage/20 rounded-xl text-dune/50 hover:border-dusty-rose/30 hover:text-dusty-rose transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add FAQ to this category
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
        className="mt-6 p-4 bg-sage/10 rounded-2xl border border-sage/20"
      >
        <p className="text-xs text-dune/70">
          <strong>Tips:</strong> Mark FAQs as &quot;Featured&quot; (⭐) to include them in the &quot;Top FAQs&quot; section. 
          Toggle visibility (👁) to show/hide FAQs on the website. Answers support basic HTML for formatting.
        </p>
      </motion.div>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, GripVertical } from "lucide-react"

interface FAQ {
  id: string
  question: string
  answer: string
  displayOrder: number
  isVisible: boolean
  category: string | null
}

export default function FAQsManager() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/landing-v2/faqs")
      if (response.ok) {
        const data = await response.json()
        setFaqs(data.faqs || [])
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error)
    } finally {
      setLoading(false)
    }
  }

  const createNewFaq = () => {
    setEditingFaq({
      id: `new-${Date.now()}`,
      question: "",
      answer: "",
      displayOrder: faqs.length,
      isVisible: true,
      category: null
    })
    setShowEditor(true)
  }

  const saveFaq = async () => {
    if (!editingFaq) return

    try {
      const isNew = editingFaq.id.startsWith("new-")
      const url = isNew
        ? "/api/admin/landing-v2/faqs"
        : `/api/admin/landing-v2/faqs/${editingFaq.id}`

      const response = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFaq)
      })

      if (response.ok) {
        const data = await response.json()
        if (isNew) {
          setFaqs([...faqs, data.faq])
        } else {
          setFaqs(faqs.map(f => f.id === editingFaq.id ? data.faq : f))
        }
        setShowEditor(false)
        setEditingFaq(null)
      } else {
        throw new Error("Failed to save FAQ")
      }
    } catch (error) {
      console.error("Error saving FAQ:", error)
      alert("Failed to save FAQ")
    }
  }

  const deleteFaq = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return

    try {
      const response = await fetch(`/api/admin/landing-v2/faqs/${faqId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setFaqs(faqs.filter(f => f.id !== faqId))
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error)
      alert("Failed to delete FAQ")
    }
  }

  const toggleVisibility = async (faqId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/admin/landing-v2/faqs/${faqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !currentState })
      })

      if (response.ok) {
        setFaqs(faqs.map(f => f.id === faqId ? { ...f, isVisible: !currentState } : f))
      }
    } catch (error) {
      console.error("Error toggling visibility:", error)
    }
  }

  if (loading) {
    return (
      <div className="glass border border-sage/20 rounded-3xl p-12 shadow-xl flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-dune">FAQs Manager</h2>
          <p className="text-sm text-dune/60 mt-1">Manage frequently asked questions</p>
        </div>
        <button
          onClick={createNewFaq}
          className="flex items-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light"
        >
          <Plus className="w-4 h-4" />
          <span>Add FAQ</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-dune mb-1">{faqs.length}</div>
          <div className="text-xs text-dune/60">Total FAQs</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-ocean-mist mb-1">
            {faqs.filter(f => f.isVisible).length}
          </div>
          <div className="text-xs text-dune/60">Visible</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-golden mb-1">
            {new Set(faqs.map(f => f.category).filter(Boolean)).size}
          </div>
          <div className="text-xs text-dune/60">Categories</div>
        </div>
      </div>

      {/* FAQs List */}
      <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
        <div className="space-y-3">
          {faqs.sort((a, b) => a.displayOrder - b.displayOrder).map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`p-4 rounded-2xl border transition-all ${
                faq.isVisible
                  ? "bg-cream/50 border-sage/10 hover:border-dusty-rose/20"
                  : "bg-dune/5 border-dune/10 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <GripVertical className="w-5 h-5 text-dune/40 flex-shrink-0 mt-1 cursor-move" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-dune">{faq.question}</h3>
                        {!faq.isVisible && (
                          <div className="px-2 py-0.5 bg-dune/20 text-dune/60 rounded-full text-xs font-semibold uppercase tracking-wide border border-dune/30">
                            Hidden
                          </div>
                        )}
                        {faq.category && (
                          <div className="px-2 py-0.5 bg-sage/20 text-sage rounded-full text-xs border border-sage/30">
                            {faq.category}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-dune/60 line-clamp-2">{faq.answer}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(faq.id, faq.isVisible)}
                    className={`p-2 rounded-full transition-all ${
                      faq.isVisible
                        ? "bg-ocean-mist/10 text-ocean-mist hover:bg-ocean-mist/20"
                        : "bg-dune/10 text-dune/40 hover:bg-dune/20"
                    }`}
                    title={faq.isVisible ? "Hide FAQ" : "Show FAQ"}
                  >
                    {faq.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => {
                      setEditingFaq(faq)
                      setShowEditor(true)
                    }}
                    className="p-2 rounded-full bg-dusty-rose/10 text-dusty-rose hover:bg-dusty-rose/20 transition-all"
                    title="Edit FAQ"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteFaq(faq.id)}
                    className="p-2 rounded-full bg-terracotta/10 text-terracotta hover:bg-terracotta/20 transition-all"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {faqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-dune/60 mb-4">No FAQs found</p>
              <button
                onClick={createNewFaq}
                className="inline-flex items-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First FAQ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && editingFaq && (
        <div className="fixed inset-0 bg-dune/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border border-sage/20 rounded-3xl p-8 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-dune">
                {editingFaq.id.startsWith("new-") ? "Add New FAQ" : "Edit FAQ"}
              </h3>
              <button
                onClick={() => {
                  setShowEditor(false)
                  setEditingFaq(null)
                }}
                className="p-2 rounded-full bg-dune/10 text-dune/60 hover:bg-dune/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dune/80 mb-2">Question</label>
                <input
                  type="text"
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all"
                  placeholder="What are your hours?"
                />
              </div>

              <div>
                <label className="block text-sm text-dune/80 mb-2">Answer</label>
                <textarea
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all resize-none"
                  placeholder="We're open Monday-Saturday from 9am-7pm..."
                />
              </div>

              <div>
                <label className="block text-sm text-dune/80 mb-2">Category (optional)</label>
                <input
                  type="text"
                  value={editingFaq.category || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value || null })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all"
                  placeholder="General, Services, Booking, etc."
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-cream/50 rounded-xl">
                <label className="text-sm text-dune/80">Visible on website</label>
                <button
                  onClick={() => setEditingFaq({ ...editingFaq, isVisible: !editingFaq.isVisible })}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    editingFaq.isVisible ? "bg-ocean-mist" : "bg-dune/20"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    editingFaq.isVisible ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={saveFaq}
                  disabled={!editingFaq.question || !editingFaq.answer}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>Save FAQ</span>
                </button>
                <button
                  onClick={() => {
                    setShowEditor(false)
                    setEditingFaq(null)
                  }}
                  className="px-6 py-3 bg-dune/10 text-dune/80 rounded-full hover:bg-dune/20 transition-all font-light"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Help Text */}
      <div className="glass border border-golden/20 rounded-2xl p-4 bg-golden/10">
        <p className="text-sm text-dune/70">
          <strong>Pro Tip:</strong> Organize FAQs by category to group related questions together.
          Drag FAQs to reorder them on the page.
        </p>
      </div>
    </div>
  )
}

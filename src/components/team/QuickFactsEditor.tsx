'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Plus,
  X,
  GripVertical,
  Save,
  Trash2,
  Check,
  Coffee,
  Wine,
  Tv,
  Film,
  Heart,
  Sparkles,
  Star,
  PawPrint,
  Music,
  UtensilsCrossed,
  BookOpen,
  Plane,
  Trophy,
  Sparkle,
  Info,
  ChevronDown,
  type LucideIcon
} from 'lucide-react'

// Quick fact type definitions with icons
const QUICK_FACT_TYPES = {
  coffee: { label: "Go-To Coffee", icon: Coffee, emoji: "☕" },
  drink: { label: "Favorite Drink", icon: Wine, emoji: "🍹" },
  tv_show: { label: "Favorite TV Show", icon: Tv, emoji: "📺" },
  movie: { label: "Favorite Movie", icon: Film, emoji: "🎬" },
  hobby: { label: "Hobby", icon: Heart, emoji: "❤️" },
  hidden_talent: { label: "Hidden Talent", icon: Sparkles, emoji: "✨" },
  fun_fact: { label: "Fun Fact", icon: Star, emoji: "⭐" },
  pet: { label: "Pet", icon: PawPrint, emoji: "🐾" },
  music: { label: "Favorite Music", icon: Music, emoji: "🎵" },
  food: { label: "Favorite Food", icon: UtensilsCrossed, emoji: "🍽️" },
  book: { label: "Favorite Book", icon: BookOpen, emoji: "📚" },
  travel: { label: "Dream Destination", icon: Plane, emoji: "✈️" },
  sport: { label: "Sport", icon: Trophy, emoji: "🏆" },
  zodiac: { label: "Zodiac Sign", icon: Sparkle, emoji: "♈" },
  custom: { label: "Custom", icon: Info, emoji: "💫" },
} as const

type QuickFactType = keyof typeof QUICK_FACT_TYPES

interface QuickFact {
  id: string
  factType: string
  customLabel: string | null
  value: string
  customIcon: string | null
  displayOrder: number
}

interface QuickFactsEditorProps {
  memberId: string
  memberName: string
  initialFacts?: QuickFact[]
  onFactsChange?: (facts: QuickFact[]) => void
}

export function QuickFactsEditor({
  memberId,
  memberName,
  initialFacts = [],
  onFactsChange
}: QuickFactsEditorProps) {
  const [facts, setFacts] = useState<QuickFact[]>(initialFacts)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newFact, setNewFact] = useState({
    factType: 'fun_fact' as QuickFactType,
    value: '',
    customLabel: '',
  })

  useEffect(() => {
    setFacts(initialFacts)
  }, [initialFacts])

  const handleAddFact = async () => {
    if (!newFact.value.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/website/team/quick-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamMemberId: memberId,
          factType: newFact.factType,
          value: newFact.value.trim(),
          customLabel: newFact.customLabel.trim() || null,
        }),
      })

      if (response.ok) {
        const { fact } = await response.json()
        const updatedFacts = [...facts, fact]
        setFacts(updatedFacts)
        onFactsChange?.(updatedFacts)
        setNewFact({ factType: 'fun_fact', value: '', customLabel: '' })
        setIsAddingNew(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error adding quick fact:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateFact = async (id: string, updates: Partial<QuickFact>) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/website/team/quick-facts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })

      if (response.ok) {
        const { fact } = await response.json()
        const updatedFacts = facts.map(f => f.id === id ? fact : f)
        setFacts(updatedFacts)
        onFactsChange?.(updatedFacts)
        setEditingId(null)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error updating quick fact:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quick fact?')) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/website/team/quick-facts?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const updatedFacts = facts.filter(f => f.id !== id)
        setFacts(updatedFacts)
        onFactsChange?.(updatedFacts)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error deleting quick fact:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReorder = async (newOrder: QuickFact[]) => {
    setFacts(newOrder)

    try {
      await fetch('/api/admin/website/team/quick-facts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamMemberId: memberId,
          factIds: newOrder.map(f => f.id),
        }),
      })
      onFactsChange?.(newOrder)
    } catch (error) {
      console.error('Error reordering quick facts:', error)
    }
  }

  const getFactTypeInfo = (factType: string) => {
    return QUICK_FACT_TYPES[factType as QuickFactType] || QUICK_FACT_TYPES.custom
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-dune flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-dusty-rose" />
          Quick Facts
          {saved && (
            <span className="text-xs text-ocean-mist flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </h4>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-dusty-rose/10 text-dusty-rose rounded-full hover:bg-dusty-rose/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Fact
        </button>
      </div>

      {/* Existing Facts List */}
      {facts.length > 0 && (
        <Reorder.Group
          axis="y"
          values={facts}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {facts.map((fact) => {
            const typeInfo = getFactTypeInfo(fact.factType)
            const Icon = typeInfo.icon
            const isEditing = editingId === fact.id

            return (
              <Reorder.Item
                key={fact.id}
                value={fact}
                className="group"
              >
                <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  isEditing
                    ? 'bg-dusty-rose/5 border-dusty-rose/20'
                    : 'bg-sage/5 border-sage/10 hover:bg-sage/10'
                }`}>
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-dune/30 hover:text-dune/50 pt-1">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon className="w-4 h-4 text-dusty-rose" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <EditFactForm
                        fact={fact}
                        onSave={(updates) => handleUpdateFact(fact.id, updates)}
                        onCancel={() => setEditingId(null)}
                        saving={saving}
                      />
                    ) : (
                      <>
                        <div className="text-[10px] uppercase tracking-wider text-dune/50 mb-0.5">
                          {fact.customLabel || typeInfo.label}
                        </div>
                        <div className="text-sm text-dune/80 break-words">
                          {fact.value}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(fact.id)}
                        className="w-7 h-7 rounded-lg hover:bg-sage/20 flex items-center justify-center text-dune/40 hover:text-dune/70 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteFact(fact.id)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-dune/40 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      )}

      {/* Empty State */}
      {facts.length === 0 && !isAddingNew && (
        <div className="text-center py-6 text-dune/40 text-sm">
          No quick facts yet. Add coffee orders, TV shows, hobbies...
        </div>
      )}

      {/* Add New Fact Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-dusty-rose/5 border border-dusty-rose/20 rounded-xl space-y-3">
              {/* Fact Type Selector */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(QUICK_FACT_TYPES).map(([key, info]) => {
                  const Icon = info.icon
                  const isSelected = newFact.factType === key
                  return (
                    <button
                      key={key}
                      onClick={() => setNewFact({ ...newFact, factType: key as QuickFactType })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-dusty-rose text-white'
                          : 'bg-white text-dune/70 hover:bg-dusty-rose/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {info.label}
                    </button>
                  )
                })}
              </div>

              {/* Custom Label (for custom type) */}
              {newFact.factType === 'custom' && (
                <input
                  type="text"
                  placeholder="Custom label (e.g., 'Guilty Pleasure')"
                  value={newFact.customLabel}
                  onChange={(e) => setNewFact({ ...newFact, customLabel: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dusty-rose/20 focus:border-dusty-rose/40"
                />
              )}

              {/* Value Input */}
              <input
                type="text"
                placeholder={`Enter ${QUICK_FACT_TYPES[newFact.factType].label.toLowerCase()}...`}
                value={newFact.value}
                onChange={(e) => setNewFact({ ...newFact, value: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dusty-rose/20 focus:border-dusty-rose/40"
                autoFocus
              />

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsAddingNew(false)
                    setNewFact({ factType: 'fun_fact', value: '', customLabel: '' })
                  }}
                  className="px-4 py-2 text-sm text-dune/60 hover:text-dune transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFact}
                  disabled={!newFact.value.trim() || saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-dusty-rose text-white rounded-lg hover:bg-dusty-rose/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Fact
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inline edit form component
function EditFactForm({
  fact,
  onSave,
  onCancel,
  saving,
}: {
  fact: QuickFact
  onSave: (updates: Partial<QuickFact>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [value, setValue] = useState(fact.value)
  const [customLabel, setCustomLabel] = useState(fact.customLabel || '')

  return (
    <div className="space-y-2">
      {fact.factType === 'custom' && (
        <input
          type="text"
          placeholder="Custom label"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-sage/20 rounded focus:outline-none focus:ring-1 focus:ring-dusty-rose/30"
        />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-2 py-1 text-sm border border-sage/20 rounded focus:outline-none focus:ring-1 focus:ring-dusty-rose/30"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ value, customLabel: customLabel || null })}
          disabled={saving}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-ocean-mist text-white rounded hover:bg-ocean-mist/90 disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-dune/60 hover:text-dune"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

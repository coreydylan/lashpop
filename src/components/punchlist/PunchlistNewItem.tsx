'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createPunchlistItem } from '@/actions/punchlist'
import type { PunchlistUser, PunchlistPriority } from '@/db/schema/punchlist'
import { Plus, X, Loader2 } from 'lucide-react'

interface PunchlistNewItemProps {
  users: PunchlistUser[]
  onItemCreated: () => void
}

const priorityOptions: { value: PunchlistPriority; label: string; icon: string }[] = [
  { value: 'low', label: 'Low', icon: '○' },
  { value: 'medium', label: 'Medium', icon: '◐' },
  { value: 'high', label: 'High', icon: '●' }
]

const categoryOptions = [
  'Homepage',
  'Services',
  'Team',
  'Booking',
  'DAM',
  'Mobile',
  'Performance',
  'Other'
]

export function PunchlistNewItem({ users, onItemCreated }: PunchlistNewItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as PunchlistPriority,
    category: '',
    assignedToId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const item = await createPunchlistItem({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        category: formData.category || undefined,
        assignedToId: formData.assignedToId || undefined
      })

      if (item) {
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: '',
          assignedToId: ''
        })
        setIsOpen(false)
        onItemCreated()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      assignedToId: ''
    })
  }

  return (
    <div>
      {/* Add button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-full',
            'bg-dusty-rose text-white font-medium',
            'hover:bg-dusty-rose/90 transition-all duration-200',
            'shadow-sm hover:shadow-md'
          )}
        >
          <Plus className="w-5 h-5" />
          Add Item
        </motion.button>
      )}

      {/* Form */}
      <AnimatePresence>
        {isOpen && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">New Punchlist Item</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Title */}
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="What needs to be done?"
                className={cn(
                  'w-full px-4 py-3 text-base rounded-xl border border-gray-200',
                  'bg-gray-50 focus:bg-white focus:border-dusty-rose/50 focus:ring-1 focus:ring-dusty-rose/20',
                  'outline-none transition-all'
                )}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details (optional)"
                rows={3}
                className={cn(
                  'w-full px-4 py-3 text-sm rounded-xl border border-gray-200',
                  'bg-gray-50 focus:bg-white focus:border-dusty-rose/50 focus:ring-1 focus:ring-dusty-rose/20',
                  'outline-none transition-all resize-none'
                )}
              />
            </div>

            {/* Options row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Priority */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Priority</label>
                <div className="flex gap-1">
                  {priorityOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: option.value })}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                        formData.priority === option.value
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                      title={option.label}
                    >
                      {option.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200',
                    'bg-gray-50 focus:bg-white focus:border-dusty-rose/50',
                    'outline-none transition-all'
                  )}
                >
                  <option value="">None</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign to */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Assign to</label>
                <select
                  value={formData.assignedToId}
                  onChange={e => setFormData({ ...formData, assignedToId: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200',
                    'bg-gray-50 focus:bg-white focus:border-dusty-rose/50',
                    'outline-none transition-all'
                  )}
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium',
                  'text-gray-600 hover:bg-gray-100 transition-colors'
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.title.trim() || isSubmitting}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-medium transition-all',
                  'bg-dusty-rose text-white hover:bg-dusty-rose/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-2'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Item'
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

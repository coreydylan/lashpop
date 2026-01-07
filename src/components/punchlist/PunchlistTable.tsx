'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { PunchlistItemWithRelations } from '@/actions/punchlist'
import type { PunchlistUser, PunchlistStatus, PunchlistPriority } from '@/db/schema/punchlist'
import {
  Circle,
  CircleDot,
  CircleDashed,
  CheckCircle2,
  XCircle,
  ChevronDown,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Trash2
} from 'lucide-react'

// Status config with icons
const statusConfig: Record<PunchlistStatus, {
  icon: React.ElementType
  label: string
  color: string
  bgColor: string
}> = {
  open: {
    icon: Circle,
    label: 'Open',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50'
  },
  in_progress: {
    icon: CircleDot,
    label: 'In Progress',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50'
  },
  needs_review: {
    icon: CircleDashed,
    label: 'Review',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50'
  },
  complete: {
    icon: CheckCircle2,
    label: 'Complete',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50'
  },
  closed: {
    icon: XCircle,
    label: 'Closed',
    color: 'text-gray-300',
    bgColor: 'bg-gray-50'
  }
}

const priorityConfig: Record<PunchlistPriority, {
  icon: string
  label: string
  color: string
}> = {
  low: { icon: '○', label: 'Low', color: 'text-gray-300' },
  medium: { icon: '◑', label: 'Medium', color: 'text-amber-400' },
  high: { icon: '●', label: 'Urgent', color: 'text-red-500' }
}

interface PunchlistTableProps {
  items: PunchlistItemWithRelations[]
  users: PunchlistUser[]
  currentUser: PunchlistUser
  onStatusChange: (itemId: string, status: PunchlistStatus) => Promise<void>
  onPriorityChange: (itemId: string, priority: PunchlistPriority) => Promise<void>
  onTitleChange: (itemId: string, title: string) => Promise<void>
  onCreateItem: (title: string) => Promise<void>
  onDeleteItem: (itemId: string) => Promise<void>
  onOpenComments: (itemId: string) => void
}

// Inline Status Picker
function StatusPicker({
  status,
  onChange,
  disabled
}: {
  status: PunchlistStatus
  onChange: (status: PunchlistStatus) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const config = statusConfig[status]
  const Icon = config.icon

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
          'hover:bg-gray-100',
          config.color
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{config.label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[140px]"
          >
            {(Object.keys(statusConfig) as PunchlistStatus[]).map(s => {
              const cfg = statusConfig[s]
              const StatusIcon = cfg.icon
              return (
                <button
                  key={s}
                  onClick={() => { onChange(s); setIsOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors',
                    s === status && 'bg-gray-50'
                  )}
                >
                  <StatusIcon className={cn('w-4 h-4', cfg.color)} />
                  <span className="text-gray-700">{cfg.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inline Priority Picker
function PriorityPicker({
  priority,
  onChange,
  disabled
}: {
  priority: PunchlistPriority
  onChange: (priority: PunchlistPriority) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const config = priorityConfig[priority]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-md text-sm transition-colors',
          'hover:bg-gray-100',
          config.color
        )}
        title={config.label}
      >
        {config.icon}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[100px]"
          >
            {(Object.keys(priorityConfig) as PunchlistPriority[]).map(p => {
              const cfg = priorityConfig[p]
              return (
                <button
                  key={p}
                  onClick={() => { onChange(p); setIsOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors',
                    p === priority && 'bg-gray-50'
                  )}
                >
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className="text-gray-700">{cfg.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inline Editable Title
function EditableTitle({
  value,
  onSave,
  placeholder = 'Untitled',
  disabled,
  isClosed
}: {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  disabled?: boolean
  isClosed?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    } else {
      setEditValue(value)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="flex-1 px-1 py-0.5 text-sm bg-white border border-blue-400 rounded outline-none ring-2 ring-blue-100"
      />
    )
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={cn(
        'flex-1 text-left text-sm truncate px-1 py-0.5 rounded transition-colors',
        'hover:bg-gray-50',
        isClosed ? 'text-gray-400 line-through' : 'text-gray-800'
      )}
    >
      {value || placeholder}
    </button>
  )
}

// Row Actions Menu
function RowActions({
  onDelete,
  onOpenComments,
  commentCount
}: {
  onDelete: () => void
  onOpenComments: () => void
  commentCount: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <button
        onClick={onOpenComments}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        )}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {commentCount > 0 && <span>{commentCount}</span>}
      </button>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 top-full right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[120px]"
          >
            <button
              onClick={() => { onDelete(); setIsOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// New Item Row
function NewItemRow({ onCreate }: { onCreate: (title: string) => void }) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (trimmed) {
      onCreate(trimmed)
      setTitle('')
    }
    setIsCreating(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      setTitle('')
      setIsCreating(false)
    }
  }

  if (isCreating) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100">
        <div className="w-7 h-7 flex items-center justify-center">
          <Circle className="w-4 h-4 text-gray-300" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className="flex-1 px-2 py-1 text-sm bg-white border border-blue-400 rounded outline-none ring-2 ring-blue-100"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <div className="w-7 h-7 flex items-center justify-center">
        <Plus className="w-4 h-4" />
      </div>
      <span className="text-sm">Add item...</span>
    </button>
  )
}

// Main Table Component
export function PunchlistTable({
  items,
  users,
  currentUser,
  onStatusChange,
  onPriorityChange,
  onTitleChange,
  onCreateItem,
  onDeleteItem,
  onOpenComments
}: PunchlistTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
        <div className="w-7" /> {/* Status icon space */}
        <div className="w-7" /> {/* Priority space */}
        <div className="flex-1">Title</div>
        <div className="w-24 text-right hidden sm:block">Assignee</div>
        <div className="w-20" /> {/* Actions space */}
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        <AnimatePresence initial={false}>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors group"
            >
              {/* Status */}
              <StatusPicker
                status={item.status as PunchlistStatus}
                onChange={status => onStatusChange(item.id, status)}
              />

              {/* Priority */}
              <PriorityPicker
                priority={item.priority as PunchlistPriority}
                onChange={priority => onPriorityChange(item.id, priority)}
              />

              {/* Title */}
              <EditableTitle
                value={item.title}
                onSave={title => onTitleChange(item.id, title)}
                isClosed={item.status === 'closed'}
              />

              {/* Assignee */}
              <div className="w-24 text-right hidden sm:block">
                {item.assignedTo && (
                  <span className="text-xs text-gray-500">
                    {item.assignedTo.name.split(' ')[0]}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="w-20 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <RowActions
                  onDelete={() => onDeleteItem(item.id)}
                  onOpenComments={() => onOpenComments(item.id)}
                  commentCount={item.commentCount}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New Item Row */}
        <NewItemRow onCreate={onCreateItem} />
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="px-3 py-8 text-center">
          <p className="text-sm text-gray-400">No items yet</p>
        </div>
      )}
    </div>
  )
}

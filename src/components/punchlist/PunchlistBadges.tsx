'use client'

import { cn } from '@/lib/utils'
import type { PunchlistStatus, PunchlistPriority } from '@/db/schema/punchlist'

// Status Badge
const statusConfig: Record<
  PunchlistStatus,
  { label: string; className: string; dotColor: string }
> = {
  open: {
    label: 'Open',
    className: 'bg-sage/10 text-sage border-sage/20',
    dotColor: 'bg-sage'
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-golden/10 text-golden border-golden/20',
    dotColor: 'bg-golden'
  },
  needs_review: {
    label: 'Needs Review',
    className: 'bg-dusty-rose/10 text-dusty-rose border-dusty-rose/20',
    dotColor: 'bg-dusty-rose'
  },
  complete: {
    label: 'Complete',
    className: 'bg-ocean-mist/20 text-dune border-ocean-mist/30',
    dotColor: 'bg-ocean-mist'
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    dotColor: 'bg-gray-400'
  }
}

interface StatusBadgeProps {
  status: PunchlistStatus
  size?: 'sm' | 'md'
  showDot?: boolean
  className?: string
}

export function PunchlistStatusBadge({
  status,
  size = 'md',
  showDot = true,
  className
}: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className,
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      )}
      {config.label}
    </span>
  )
}

// Priority Badge
const priorityConfig: Record<
  PunchlistPriority,
  { label: string; className: string; icon: string }
> = {
  low: {
    label: 'Low',
    className: 'text-gray-500',
    icon: '○'
  },
  medium: {
    label: 'Medium',
    className: 'text-golden',
    icon: '◐'
  },
  high: {
    label: 'High',
    className: 'text-terracotta',
    icon: '●'
  }
}

interface PriorityBadgeProps {
  priority: PunchlistPriority
  showLabel?: boolean
  className?: string
}

export function PunchlistPriorityBadge({
  priority,
  showLabel = false,
  className
}: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm', config.className, className)}
      title={`${config.label} priority`}
    >
      <span className="text-base">{config.icon}</span>
      {showLabel && <span className="font-medium">{config.label}</span>}
    </span>
  )
}

// Role Badge
const roleConfig: Record<string, { label: string; className: string }> = {
  owner: {
    label: 'Owner',
    className: 'bg-sage/10 text-sage border-sage/20'
  },
  client: {
    label: 'Client',
    className: 'bg-dusty-rose/10 text-dusty-rose border-dusty-rose/20'
  },
  team: {
    label: 'Team',
    className: 'bg-ocean-mist/20 text-dune border-ocean-mist/30'
  }
}

interface RoleBadgeProps {
  role: string
  className?: string
}

export function PunchlistRoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.team

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

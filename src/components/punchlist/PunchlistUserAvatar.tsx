'use client'

import { cn } from '@/lib/utils'
import type { PunchlistUser } from '@/db/schema/punchlist'

interface PunchlistUserAvatarProps {
  user: PunchlistUser
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

const colorClasses: Record<string, string> = {
  sage: 'bg-sage/20 text-sage border-sage/30',
  'dusty-rose': 'bg-dusty-rose/20 text-dusty-rose border-dusty-rose/30',
  'ocean-mist': 'bg-ocean-mist/30 text-dune border-ocean-mist/40',
  golden: 'bg-golden/20 text-golden border-golden/30',
  terracotta: 'bg-terracotta/20 text-terracotta border-terracotta/30'
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base'
}

export function PunchlistUserAvatar({
  user,
  size = 'md',
  showName = false,
  className
}: PunchlistUserAvatarProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colorClass = colorClasses[user.avatarColor] || colorClasses.sage

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-medium border',
          colorClass,
          sizeClasses[size]
        )}
        title={user.name}
      >
        {initials}
      </div>
      {showName && (
        <span className="text-sm text-gray-700 font-medium">{user.name}</span>
      )}
    </div>
  )
}

export function PunchlistUserAvatarGroup({
  users,
  max = 3,
  size = 'sm'
}: {
  users: PunchlistUser[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const displayed = users.slice(0, max)
  const remaining = users.length - max

  return (
    <div className="flex items-center -space-x-2">
      {displayed.map(user => (
        <PunchlistUserAvatar
          key={user.id}
          user={user}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium bg-gray-100 text-gray-600 border border-gray-200 ring-2 ring-white',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

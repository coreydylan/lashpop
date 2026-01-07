'use server'

import { getDb } from '@/db'
import {
  punchlistUsers,
  punchlistItems,
  punchlistComments,
  punchlistActivity,
  punchlistSessions
} from '@/db/schema/punchlist'
import { eq, desc, asc, and } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import type {
  PunchlistUser,
  PunchlistItem,
  PunchlistComment,
  PunchlistActivityEntry,
  PunchlistStatus,
  PunchlistPriority
} from '@/db/schema/punchlist'

// Extended types with relations
export interface PunchlistItemWithRelations extends PunchlistItem {
  createdBy: PunchlistUser
  assignedTo: PunchlistUser | null
  closedBy: PunchlistUser | null
  commentCount: number
}

export interface PunchlistCommentWithUser extends PunchlistComment {
  user: PunchlistUser
}

export interface PunchlistActivityWithUser extends PunchlistActivityEntry {
  user: PunchlistUser
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Get user by phone number (for login)
 */
export async function getPunchlistUserByPhone(phoneNumber: string): Promise<PunchlistUser | null> {
  try {
    const db = getDb()
    const users = await db
      .select()
      .from(punchlistUsers)
      .where(eq(punchlistUsers.phoneNumber, phoneNumber))
      .limit(1)

    return users[0] || null
  } catch (error) {
    console.error('Error fetching punchlist user:', error)
    return null
  }
}

/**
 * Create a session for a user
 */
export async function createPunchlistSession(userId: string): Promise<string | null> {
  try {
    const db = getDb()
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.insert(punchlistSessions).values({
      userId,
      token,
      expiresAt
    })

    // Set the cookie
    const cookieStore = await cookies()
    cookieStore.set('punchlist_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    })

    return token
  } catch (error) {
    console.error('Error creating punchlist session:', error)
    return null
  }
}

/**
 * Get current logged-in user from session
 */
export async function getCurrentPunchlistUser(): Promise<PunchlistUser | null> {
  try {
    const db = getDb()
    const cookieStore = await cookies()
    const token = cookieStore.get('punchlist_auth')?.value

    if (!token) return null

    const sessions = await db
      .select()
      .from(punchlistSessions)
      .where(eq(punchlistSessions.token, token))
      .limit(1)

    const session = sessions[0]
    if (!session || new Date(session.expiresAt) < new Date()) {
      return null
    }

    const users = await db
      .select()
      .from(punchlistUsers)
      .where(eq(punchlistUsers.id, session.userId))
      .limit(1)

    return users[0] || null
  } catch (error) {
    console.error('Error getting current punchlist user:', error)
    return null
  }
}

/**
 * Logout - destroy session
 */
export async function logoutPunchlist(): Promise<void> {
  try {
    const db = getDb()
    const cookieStore = await cookies()
    const token = cookieStore.get('punchlist_auth')?.value

    if (token) {
      await db.delete(punchlistSessions).where(eq(punchlistSessions.token, token))
    }

    cookieStore.delete('punchlist_auth')
  } catch (error) {
    console.error('Error logging out:', error)
  }
}

// ============================================
// USER FUNCTIONS
// ============================================

/**
 * Get all punchlist users
 */
export async function getAllPunchlistUsers(): Promise<PunchlistUser[]> {
  try {
    const db = getDb()
    return await db.select().from(punchlistUsers).orderBy(asc(punchlistUsers.name))
  } catch (error) {
    console.error('Error fetching punchlist users:', error)
    return []
  }
}

/**
 * Update user phone number
 */
export async function updatePunchlistUserPhone(
  userId: string,
  phoneNumber: string
): Promise<boolean> {
  try {
    const db = getDb()
    await db
      .update(punchlistUsers)
      .set({ phoneNumber, updatedAt: new Date() })
      .where(eq(punchlistUsers.id, userId))
    return true
  } catch (error) {
    console.error('Error updating phone number:', error)
    return false
  }
}

// ============================================
// ITEM FUNCTIONS
// ============================================

/**
 * Get all punchlist items with relations
 */
export async function getPunchlistItems(
  statusFilter?: PunchlistStatus
): Promise<PunchlistItemWithRelations[]> {
  try {
    const db = getDb()
    // Get all users for mapping
    const users = await db.select().from(punchlistUsers)
    const userMap = new Map(users.map(u => [u.id, u]))

    // Get all comments for count
    const comments = await db.select().from(punchlistComments)
    const commentCounts = new Map<string, number>()
    comments.forEach(c => {
      commentCounts.set(c.itemId, (commentCounts.get(c.itemId) || 0) + 1)
    })

    // Get items
    let query = db.select().from(punchlistItems)

    if (statusFilter) {
      query = query.where(eq(punchlistItems.status, statusFilter)) as typeof query
    }

    const items = await query.orderBy(
      desc(punchlistItems.createdAt)
    )

    return items.map(item => ({
      ...item,
      createdBy: userMap.get(item.createdById)!,
      assignedTo: item.assignedToId ? userMap.get(item.assignedToId) || null : null,
      closedBy: item.closedById ? userMap.get(item.closedById) || null : null,
      commentCount: commentCounts.get(item.id) || 0
    }))
  } catch (error) {
    console.error('Error fetching punchlist items:', error)
    return []
  }
}

/**
 * Get a single punchlist item with full details
 */
export async function getPunchlistItem(itemId: string): Promise<PunchlistItemWithRelations | null> {
  try {
    const db = getDb()
    const items = await db
      .select()
      .from(punchlistItems)
      .where(eq(punchlistItems.id, itemId))
      .limit(1)

    if (!items[0]) return null

    const item = items[0]
    const users = await db.select().from(punchlistUsers)
    const userMap = new Map(users.map(u => [u.id, u]))

    const comments = await db
      .select()
      .from(punchlistComments)
      .where(eq(punchlistComments.itemId, itemId))

    return {
      ...item,
      createdBy: userMap.get(item.createdById)!,
      assignedTo: item.assignedToId ? userMap.get(item.assignedToId) || null : null,
      closedBy: item.closedById ? userMap.get(item.closedById) || null : null,
      commentCount: comments.length
    }
  } catch (error) {
    console.error('Error fetching punchlist item:', error)
    return null
  }
}

/**
 * Create a new punchlist item
 */
export async function createPunchlistItem(data: {
  title: string
  description?: string
  priority?: PunchlistPriority
  category?: string
  assignedToId?: string
}): Promise<PunchlistItem | null> {
  try {
    const db = getDb()
    const currentUser = await getCurrentPunchlistUser()
    if (!currentUser) return null

    const [item] = await db
      .insert(punchlistItems)
      .values({
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'medium',
        category: data.category || null,
        assignedToId: data.assignedToId || null,
        createdById: currentUser.id
      })
      .returning()

    // Log activity
    await db.insert(punchlistActivity).values({
      itemId: item.id,
      userId: currentUser.id,
      action: 'created',
      newValue: data.title
    })

    return item
  } catch (error) {
    console.error('Error creating punchlist item:', error)
    return null
  }
}

/**
 * Update a punchlist item
 */
export async function updatePunchlistItem(
  itemId: string,
  data: {
    title?: string
    description?: string
    priority?: PunchlistPriority
    category?: string
    assignedToId?: string | null
  }
): Promise<boolean> {
  try {
    const db = getDb()
    const currentUser = await getCurrentPunchlistUser()
    if (!currentUser) return false

    await db
      .update(punchlistItems)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(punchlistItems.id, itemId))

    return true
  } catch (error) {
    console.error('Error updating punchlist item:', error)
    return false
  }
}

/**
 * Update item status
 */
export async function updatePunchlistItemStatus(
  itemId: string,
  newStatus: PunchlistStatus
): Promise<boolean> {
  try {
    const db = getDb()
    const currentUser = await getCurrentPunchlistUser()
    if (!currentUser) return false

    // Get current item for activity log
    const items = await db
      .select()
      .from(punchlistItems)
      .where(eq(punchlistItems.id, itemId))
      .limit(1)

    if (!items[0]) return false
    const oldStatus = items[0].status

    // Update the status
    const updateData: Partial<PunchlistItem> = {
      status: newStatus,
      updatedAt: new Date()
    }

    // If closing, set closed info
    if (newStatus === 'closed') {
      updateData.closedAt = new Date()
      updateData.closedById = currentUser.id
    }

    // If reopening, clear closed info
    if (oldStatus === 'closed' && newStatus !== 'closed') {
      updateData.closedAt = null
      updateData.closedById = null
    }

    await db
      .update(punchlistItems)
      .set(updateData)
      .where(eq(punchlistItems.id, itemId))

    // Log activity
    await db.insert(punchlistActivity).values({
      itemId,
      userId: currentUser.id,
      action: newStatus === 'closed' ? 'closed' : oldStatus === 'closed' ? 'reopened' : 'status_changed',
      oldValue: oldStatus,
      newValue: newStatus
    })

    return true
  } catch (error) {
    console.error('Error updating punchlist item status:', error)
    return false
  }
}

/**
 * Delete a punchlist item (owner only)
 */
export async function deletePunchlistItem(itemId: string): Promise<boolean> {
  try {
    const db = getDb()
    const currentUser = await getCurrentPunchlistUser()
    if (!currentUser || currentUser.role !== 'owner') return false

    await db.delete(punchlistItems).where(eq(punchlistItems.id, itemId))
    return true
  } catch (error) {
    console.error('Error deleting punchlist item:', error)
    return false
  }
}

// ============================================
// COMMENT FUNCTIONS
// ============================================

/**
 * Get comments for an item
 */
export async function getPunchlistComments(itemId: string): Promise<PunchlistCommentWithUser[]> {
  try {
    const db = getDb()
    const users = await db.select().from(punchlistUsers)
    const userMap = new Map(users.map(u => [u.id, u]))

    const comments = await db
      .select()
      .from(punchlistComments)
      .where(eq(punchlistComments.itemId, itemId))
      .orderBy(asc(punchlistComments.createdAt))

    return comments.map(comment => ({
      ...comment,
      user: userMap.get(comment.userId)!
    }))
  } catch (error) {
    console.error('Error fetching punchlist comments:', error)
    return []
  }
}

/**
 * Add a comment to an item
 */
export async function addPunchlistComment(
  itemId: string,
  content: string
): Promise<PunchlistComment | null> {
  try {
    const db = getDb()
    const currentUser = await getCurrentPunchlistUser()
    if (!currentUser) return null

    const [comment] = await db
      .insert(punchlistComments)
      .values({
        itemId,
        userId: currentUser.id,
        content
      })
      .returning()

    // Log activity
    await db.insert(punchlistActivity).values({
      itemId,
      userId: currentUser.id,
      action: 'commented',
      newValue: content.substring(0, 100) // Truncate for log
    })

    // Update item's updatedAt
    await db
      .update(punchlistItems)
      .set({ updatedAt: new Date() })
      .where(eq(punchlistItems.id, itemId))

    return comment
  } catch (error) {
    console.error('Error adding punchlist comment:', error)
    return null
  }
}

// ============================================
// ACTIVITY FUNCTIONS
// ============================================

/**
 * Get activity log for an item
 */
export async function getPunchlistActivity(itemId: string): Promise<PunchlistActivityWithUser[]> {
  try {
    const db = getDb()
    const users = await db.select().from(punchlistUsers)
    const userMap = new Map(users.map(u => [u.id, u]))

    const activity = await db
      .select()
      .from(punchlistActivity)
      .where(eq(punchlistActivity.itemId, itemId))
      .orderBy(desc(punchlistActivity.createdAt))

    return activity.map(entry => ({
      ...entry,
      user: userMap.get(entry.userId)!
    }))
  } catch (error) {
    console.error('Error fetching punchlist activity:', error)
    return []
  }
}

// ============================================
// STATS FUNCTIONS
// ============================================

/**
 * Get punchlist stats for dashboard
 */
export async function getPunchlistStats(): Promise<{
  total: number
  open: number
  inProgress: number
  needsReview: number
  complete: number
  closed: number
}> {
  try {
    const db = getDb()
    const items = await db.select().from(punchlistItems)

    return {
      total: items.length,
      open: items.filter(i => i.status === 'open').length,
      inProgress: items.filter(i => i.status === 'in_progress').length,
      needsReview: items.filter(i => i.status === 'needs_review').length,
      complete: items.filter(i => i.status === 'complete').length,
      closed: items.filter(i => i.status === 'closed').length
    }
  } catch (error) {
    console.error('Error fetching punchlist stats:', error)
    return { total: 0, open: 0, inProgress: 0, needsReview: 0, complete: 0, closed: 0 }
  }
}

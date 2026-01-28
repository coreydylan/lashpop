/**
 * Script to update team member display order
 * Order specified in LASH-31: Emily, Rachel, Kelly, Renee, Adrianna, Ashley, Savannah, Ava, Evie, Haley, Bethany, Kelly R, Kim, Nancy, Grace, Elena
 */

import { getDb } from '../src/db'
import { teamMembers } from '../src/db/schema/team_members'
import { eq, ilike } from 'drizzle-orm'

// Desired order from LASH-31
const desiredOrder = [
  'Emily',
  'Rachel',
  'Kelly',      // Kelly Katona (first Kelly)
  'Renee',
  'Adrianna',
  'Ashley',
  'Savannah',
  'Ava',
  'Evie',
  'Haley',
  'Bethany',
  'Kelly R',    // Kelly Richter
  'Kimberly',   // Kim = Kimberly Starnes
  'Nancy',
  'Grace',
  'Elena'
]

// Zero-pad order numbers for proper text sorting
function padOrder(num: number): string {
  return num.toString().padStart(2, '0')
}

async function updateTeamOrder() {
  const db = getDb()

  // Get all team members
  const allMembers = await db.select().from(teamMembers)

  console.log(`Found ${allMembers.length} team members`)
  console.log('Current members:', allMembers.map(m => `${m.name} (order: ${m.displayOrder})`).join(', '))

  // Track which members have been assigned an order
  const assignedIds = new Set<string>()

  // Update display order for each member in the desired order
  for (let i = 0; i < desiredOrder.length; i++) {
    const nameToMatch = desiredOrder[i]
    const order = padOrder(i)

    // Find matching member(s)
    const matchingMembers = allMembers.filter(m => {
      const memberFirstName = m.name.split(' ')[0].toLowerCase()
      const targetName = nameToMatch.toLowerCase()

      // Handle "Kelly R" case - match by first name and last initial
      if (nameToMatch === 'Kelly R') {
        return m.name.toLowerCase().startsWith('kelly') &&
               m.name.split(' ')[1]?.toLowerCase().startsWith('r')
      }

      // Handle regular "Kelly" - match first Kelly that's not "Kelly R"
      if (nameToMatch === 'Kelly') {
        return memberFirstName === 'kelly' &&
               !m.name.split(' ')[1]?.toLowerCase().startsWith('r')
      }

      // Standard first name match
      return memberFirstName === targetName
    })

    if (matchingMembers.length === 0) {
      console.log(`No match found for: ${nameToMatch}`)
      continue
    }

    if (matchingMembers.length > 1) {
      console.log(`Multiple matches for ${nameToMatch}: ${matchingMembers.map(m => m.name).join(', ')}`)
    }

    // Get first unassigned match
    const member = matchingMembers.find(m => !assignedIds.has(m.id))
    if (!member) {
      console.log(`All matches for ${nameToMatch} already assigned`)
      continue
    }

    assignedIds.add(member.id)
    console.log(`Setting ${member.name} to order ${order}`)

    await db
      .update(teamMembers)
      .set({ displayOrder: order, updatedAt: new Date() })
      .where(eq(teamMembers.id, member.id))
  }

  // Set any remaining members not in the list to a high order number
  const remainingMembers = allMembers.filter(m => !assignedIds.has(m.id))

  for (let i = 0; i < remainingMembers.length; i++) {
    const member = remainingMembers[i]
    const order = padOrder(desiredOrder.length + i)
    console.log(`Setting remaining member ${member.name} to order ${order}`)

    await db
      .update(teamMembers)
      .set({ displayOrder: order, updatedAt: new Date() })
      .where(eq(teamMembers.id, member.id))
  }

  // Verify final order
  const updatedMembers = await db
    .select()
    .from(teamMembers)
    .orderBy(teamMembers.displayOrder)

  console.log('\nFinal order:')
  updatedMembers.forEach((m, i) => {
    console.log(`${i + 1}. ${m.name} (displayOrder: ${m.displayOrder})`)
  })

  console.log('\nTeam order updated successfully!')
}

updateTeamOrder()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error updating team order:', error)
    process.exit(1)
  })

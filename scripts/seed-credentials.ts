/**
 * Seed credentials for active team members per the spec Corey provided.
 * Idempotent: safe to re-run; overwrites the `credentials` jsonb column.
 *
 * Run: DATABASE_URL=... npx tsx scripts/seed-credentials.ts
 */
import { getDb } from '../src/db'
import { teamMembers, type TeamMemberCredential } from '../src/db/schema/team_members'
import { eq } from 'drizzle-orm'

type Seed = {
  match: { name: string; role?: string } // role disambiguates duplicate name rows
  credentials: TeamMemberCredential[]
}

const license = (name: string): TeamMemberCredential => ({ type: 'license', name })
const cert = (name: string): TeamMemberCredential => ({ type: 'certification', name })
const award = (name: string): TeamMemberCredential => ({ type: 'award', name })

const seeds: Seed[] = [
  {
    match: { name: 'Emily Rogers' },
    credentials: [license('Licensed Esthetician'), award('Lashpop Pro Boss Bitch')],
  },
  {
    match: { name: 'Rachel Edwards' },
    credentials: [license('Licensed Esthetician'), cert('Lashpop Pro Certified')],
  },
  {
    match: { name: 'Paige Gordon' },
    credentials: [license('Licensed Esthetician'), cert('Lashpop Pro Certified')],
  },
  {
    match: { name: 'Tori Burnett' },
    credentials: [license('Licensed Cosmetologist'), cert('Lashpop Pro Certified')],
  },
  {
    match: { name: 'Kelly Katona' },
    credentials: [license('Licensed Esthetician')],
  },
  {
    match: { name: 'Renee Belton' },
    credentials: [
      license('Licensed Esthetician'),
      cert('Microblading / Permanent Makeup Certified'),
    ],
  },
  {
    match: { name: 'Adrianna Payne' },
    credentials: [license('Licensed Cosmetologist')],
  },
  {
    match: { name: 'Ashley Petersen' },
    credentials: [license('Licensed Esthetician')],
  },
  {
    match: { name: 'Ava Mata' },
    credentials: [license('Licensed Cosmetologist')],
  },
  {
    match: { name: 'Evie Ells', role: 'Lash Artist & Brow Specialist' },
    credentials: [license('Licensed Esthetician')],
  },
  {
    match: { name: 'Savannah Scherer' },
    credentials: [license('Licensed Esthetician')],
  },
  {
    match: { name: 'Haley Walker' },
    credentials: [license('Licensed Esthetician')],
  },
  {
    match: { name: 'Bethany Peterson' },
    credentials: [license('Licensed Cosmetologist')],
  },
  {
    match: { name: 'Kelly Richter' },
    credentials: [license('Licensed Esthetician')],
  },
  {
    match: { name: 'Elena Castellanos' },
    credentials: [cert('Certified Fibroblast and Jet Plasma Technician')],
  },
  {
    match: { name: 'Grace Ramos', role: 'Nurse Injector' },
    credentials: [
      license('Registered Nurse (RN)'),
      license("Women's Health Nurse Practitioner"),
      cert('Facial Esthetics Certified'),
    ],
  },
]

async function main() {
  const db = getDb()
  let updated = 0
  let skipped = 0

  for (const seed of seeds) {
    // Find row(s) matching name + (optionally) role.
    const rows = await db
      .select({ id: teamMembers.id, name: teamMembers.name, role: teamMembers.role, isActive: teamMembers.isActive })
      .from(teamMembers)
      .where(eq(teamMembers.name, seed.match.name))

    const candidates = seed.match.role
      ? rows.filter((r) => r.role === seed.match.role)
      : rows.filter((r) => r.isActive)

    if (candidates.length === 0) {
      console.warn(`  - skip ${seed.match.name}: no matching active row`)
      skipped++
      continue
    }

    if (candidates.length > 1) {
      console.warn(
        `  - skip ${seed.match.name}: ambiguous (${candidates.length} matches), specify role`
      )
      skipped++
      continue
    }

    const target = candidates[0]
    await db
      .update(teamMembers)
      .set({ credentials: seed.credentials, updatedAt: new Date() })
      .where(eq(teamMembers.id, target.id))
    console.log(`  ✓ ${target.name} (${target.role}) → ${seed.credentials.length} credential(s)`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}. Skipped: ${skipped}.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

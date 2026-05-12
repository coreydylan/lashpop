import { config } from "dotenv"
config({ path: ".env.local" })

import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { teamQuickFacts } from "@/db/schema/team_quick_facts"
import { and, eq, ilike } from "drizzle-orm"

const db = getDb()

type FactToAdd = { factType: string; value: string; customLabel?: string }

// Members where we append a fun_fact quickFact (data already lives in their funFact text column,
// but the frontend prefers quickFacts so the funFact never renders).
// Savannah gets a tv_show quickFact since "Survivor" is a TV show.
const appendFacts: Record<string, FactToAdd[]> = {
  "Haley Walker": [
    { factType: "fun_fact", value: "Enjoys renovating her 1960's home" },
  ],
  "Nancy Nicole": [
    { factType: "fun_fact", value: "I remember my clients' lash maps better than my passwords" },
  ],
  "Savannah Scherer": [
    { factType: "tv_show", value: "Survivor" },
  ],
}

// Paige's funFact is a single concatenated string — split into typed quickFacts to match
// the format used for everyone else.
const paigeFacts: FactToAdd[] = [
  { factType: "fun_fact", value: "Girl mom of 3" },
  { factType: "movie", value: "Dan in Real Life" },
  { factType: "coffee", value: "Sugar Free Vanilla Protein Latte" },
]

async function appendQuickFact(memberName: string, fact: FactToAdd) {
  const matches = await db
    .select()
    .from(teamMembers)
    .where(ilike(teamMembers.name, memberName))

  if (matches.length !== 1) {
    console.log(`⚠️  Expected exactly 1 match for "${memberName}", got ${matches.length}. Skipping.`)
    return
  }
  const member = matches[0]

  const existing = await db
    .select()
    .from(teamQuickFacts)
    .where(eq(teamQuickFacts.teamMemberId, member.id))

  // Skip if a fact with the same factType+value already exists (idempotent re-runs).
  const duplicate = existing.find(
    (f) => f.factType === fact.factType && f.value.trim() === fact.value.trim()
  )
  if (duplicate) {
    console.log(`   ⏭️  ${memberName}: already has ${fact.factType} = "${fact.value}". Skipping.`)
    return
  }

  const nextOrder = existing.length
    ? Math.max(...existing.map((f) => f.displayOrder ?? 0)) + 1
    : 0

  await db.insert(teamQuickFacts).values({
    teamMemberId: member.id,
    factType: fact.factType,
    value: fact.value,
    customLabel: fact.customLabel ?? null,
    displayOrder: nextOrder,
  })
  console.log(`   ✅ ${memberName}: added ${fact.factType} = "${fact.value}" (order=${nextOrder})`)
}

async function main() {
  console.log("🚀 Adding fun-fact quickFacts...\n")

  for (const [memberName, facts] of Object.entries(appendFacts)) {
    console.log(`👤 ${memberName}`)
    for (const fact of facts) {
      await appendQuickFact(memberName, fact)
    }
  }

  console.log(`\n👤 Paige Gordon (split concatenated funFact)`)
  for (const fact of paigeFacts) {
    await appendQuickFact("Paige Gordon", fact)
  }

  console.log("\n✨ Done.")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

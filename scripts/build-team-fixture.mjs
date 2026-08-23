// Regenerates src/test-fixtures/homepage-team.json from the seeded synthetic
// roster in src/test-fixtures/roster-scenario.json, applying the same
// publication rule the live page applies: is_active AND show_on_website.
//
// The old fixture was an export of production output, so a roster change made
// the browser baselines red and the suite recorded regressions instead of
// failing on them. Nothing here touches D1.
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const dir = resolve(process.cwd(), 'src/test-fixtures')

export async function buildTeamFixture() {
  const scenario = JSON.parse(await readFile(resolve(dir, 'roster-scenario.json'), 'utf8'))
  const teamMembers = scenario.members
    .filter((member) => member.isActive && member.showOnWebsite)
    .map(({ isActive, showOnWebsite, ...member }) => member)
  return { teamMembers }
}

const fixture = await buildTeamFixture()

if (process.argv.includes('--check')) {
  const current = JSON.parse(await readFile(resolve(dir, 'homepage-team.json'), 'utf8'))
  if (JSON.stringify(current) !== JSON.stringify(fixture)) {
    console.error('homepage-team.json is out of date with roster-scenario.json. Run: npm run fixtures:team:build')
    process.exit(1)
  }
  console.log(`homepage-team.json matches the scenario (${fixture.teamMembers.length} published)`)
} else {
  await writeFile(resolve(dir, 'homepage-team.json'), `${JSON.stringify(fixture, null, 2)}\n`)
  console.log(`wrote homepage-team.json (${fixture.teamMembers.length} published)`)
}

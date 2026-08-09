import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const fixtureDir = resolve(process.cwd(), "src/test-fixtures")
const names = [
  "homepage-services.json",
  "homepage-team.json",
  "homepage-content.json",
  "homepage-social.json",
  "homepage-quiz.json",
]
const forbiddenKeys = new Set([
  "adminLockedFields",
  "bioOverride",
  "editorNotes",
  "externalServiceCategories",
  "imageOverride",
  "licenseNumber",
  "rawPayload",
  "teamMemberId",
  "vagaroData",
  "vagaroEmployeeId",
])

function inspect(value, location) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspect(entry, `${location}[${index}]`))
    return
  }
  if (!value || typeof value !== "object") return

  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenKeys.has(key), `${location} contains forbidden field ${key}`)
    inspect(child, `${location}.${key}`)
  }
}

const fixtures = Object.fromEntries(await Promise.all(names.map(async (name) => {
  const parsed = JSON.parse(await readFile(resolve(fixtureDir, name), "utf8"))
  inspect(parsed, name)
  return [name, parsed]
})))

const team = fixtures["homepage-team.json"].teamMembers
assert(team.length > 0, "Team fixture must contain the approved public team")
assert(team.every((member) => member.phone === ""), "Browser fixtures must not store staff phone numbers")
assert(team.every((member) => !("email" in member)), "Browser fixtures must not store staff email addresses")

const services = fixtures["homepage-services.json"].services
assert(services.length > 1, "Service fixture must exercise multiple service cards")
assert(services.every((service) => service.categorySlug === "lashes"), "Only the tested lash service category belongs in the browser fixture")
assert(services.some((service) => service.slug === "classic-fill"), "Service fixture must preserve the Classic Fill contract")

const quizPhotos = fixtures["homepage-quiz.json"].quizPhotos
for (const style of ["classic", "hybrid", "wetAngel", "volume"]) {
  assert(
    quizPhotos[style]?.filter((photo) => photo.isEnabled).length >= 2,
    `Quiz fixture needs at least two enabled ${style} photos`,
  )
}

console.log(`Browser fixtures verified: ${names.length} public-only snapshots.`)

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import capabilities from "../docs/admin/capabilities.json"
import { OWNER_GUIDE_AREAS, OWNER_GUIDE_ARTICLES } from "../src/lib/admin/owner-guide-content"

const root = process.cwd()
const target = resolve(root, "docs/admin/OWNER_GUIDE.md")
const checkOnly = process.argv.includes("--check")
const failures: string[] = []
const bannedJargon = ["metadata", "taxonomy", "schema", "api", "d1", "r2", "backend", "frontend", "pipeline", "deployment"]

const capabilityById = new Map(capabilities.capabilities.map((capability) => [capability.id, capability]))
const articleByCapability = new Map(OWNER_GUIDE_ARTICLES.map((article) => [article.capabilityId, article]))

for (const capability of capabilities.capabilities) {
  const article = articleByCapability.get(capability.id)
  if (!article) {
    failures.push(`Missing guide article for ${capability.id}`)
    continue
  }
  for (const question of capability.questions) {
    if (!article.questions.includes(question)) failures.push(`${capability.id} is missing question: ${question}`)
  }
}

for (const article of OWNER_GUIDE_ARTICLES) {
  if (!capabilityById.has(article.capabilityId)) failures.push(`${article.id} uses unknown capability ${article.capabilityId}`)
  if (article.steps.length < 3) failures.push(`${article.id} needs at least 3 steps`)
  if (article.check.length < 2) failures.push(`${article.id} needs at least 2 checks`)
  const imagePath = resolve(root, "public", article.screenshot.replace(/^\//, ""))
  if (!existsSync(imagePath)) failures.push(`${article.id} screenshot is missing: ${article.screenshot}`)

  const userCopy = [article.title, article.summary, ...(article.before ?? []), ...article.steps.flatMap((step) => [step.title, step.detail]), ...article.check, article.warning ?? ""].join(" ").toLowerCase()
  for (const word of bannedJargon) {
    if (new RegExp(`\\b${word}\\b`, "i").test(userCopy)) failures.push(`${article.id} contains banned jargon: ${word}`)
  }
  for (const sentence of userCopy.split(/[.!?]+/)) {
    const words = sentence.trim().split(/\s+/).filter(Boolean)
    if (words.length > 35) failures.push(`${article.id} has a sentence over 35 words: ${words.slice(0, 8).join(" ")}…`)
  }
}

if (failures.length > 0) {
  console.error(`Owner guide validation failed:\n- ${failures.join("\n- ")}`)
  process.exit(1)
}

const lines: string[] = [
  "# LashPop Admin owner guide",
  "",
  "Use this guide when you need to complete a task in LashPop Admin. Search the in-app **Owner guide** for the easiest way to use these instructions.",
  "",
  "## How this guide is written",
  "",
  "This guide follows the GOV.UK approach to clear content: start with the task, use everyday words, write in the active voice and keep sentences short. Screenshots support the instructions, but the written steps contain everything you need.",
  "",
  "- [Use clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/)",
  "- [Identify user needs](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/identify-user-needs/)",
  "- [Use the right tone](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/tone-of-voice/right-tone/)",
  "- [Publish accessible documents](https://www.gov.uk/guidance/publishing-accessible-documents)",
  "",
  "## Before you change anything",
  "",
  "1. Open the page you plan to change in one browser tab.",
  "2. Open the public website in another tab.",
  "3. Make one clear change at a time.",
  "4. Read every warning before you save.",
  "5. Check the public result on a phone and computer.",
  "6. Use Activity history or Website versions when you need to understand or undo an earlier change.",
  "",
]

for (const area of OWNER_GUIDE_AREAS) {
  lines.push(`## ${area}`, "")
  for (const article of OWNER_GUIDE_ARTICLES.filter((candidate) => candidate.area === area)) {
    lines.push(`<!-- capability:${article.capabilityId} -->`, `### ${article.title}`, "", article.summary, "")
    lines.push(`**Open:** ${article.screen}`, "")
    lines.push("**Questions this guide answers**", "", ...article.questions.map((question) => `- ${question}`), "")
    if (article.warning) lines.push(`> **Before you continue:** ${article.warning}`, "")
    if (article.before?.length) lines.push("#### Before you start", "", ...article.before.map((item) => `- ${item}`), "")
    lines.push("#### Steps", "")
    article.steps.forEach((step, index) => {
      lines.push(`${index + 1}. **${step.title}.** ${step.detail}${step.outsideAdmin ? " This step happens in Vagaro." : ""}`)
    })
    lines.push("", "#### Check your work", "", ...article.check.map((item) => `- ${item}`), "")
    lines.push(`![${article.screenshotAlt}](../../public${article.screenshot})`, "")
  }
}

lines.push(
  "## If something looks wrong",
  "",
  "Stop before saving another change. Check Activity history to see what changed. Use Website versions only when you have found and checked the last correct version.",
  "",
  "For booking, price, availability or staff-service problems, check Vagaro first. For a new booking connection, contact the website manager and keep the item hidden until they confirm it is ready.",
  "",
)

const output = `${lines.join("\n").trimEnd()}\n`

if (checkOnly) {
  const current = existsSync(target) ? readFileSync(target, "utf8") : ""
  if (current !== output) {
    console.error("docs/admin/OWNER_GUIDE.md is out of date. Run npm run guide:generate.")
    process.exit(1)
  }
  console.log(`Owner guide verified: ${OWNER_GUIDE_ARTICLES.length} plain-language guides with searchable screenshots.`)
} else {
  writeFileSync(target, output)
  console.log(`Wrote ${target}`)
}

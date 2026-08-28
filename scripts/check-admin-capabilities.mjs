import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const contractPath = resolve(root, 'docs/admin/capabilities.json')
const guidePath = resolve(root, 'docs/admin/OWNER_GUIDE.md')
const sectionsPath = resolve(root, 'src/components/admin-shell/sections.ts')

const fail = (message) => {
  console.error(`Admin capability contract: ${message}`)
  process.exitCode = 1
}

if (!existsSync(contractPath)) {
  fail('docs/admin/capabilities.json is missing')
  process.exit()
}

const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const schemaPath = resolve(root, 'docs/admin', contract.$schema ?? '')
const capabilities = Array.isArray(contract.capabilities) ? contract.capabilities : []
const ids = new Set()
const coveredRoutes = new Set()
let guideScreenshotCount = 0

if (!Number.isInteger(contract.version) || contract.version < 1) fail('version must be a positive integer')
if (!contract.$schema || !existsSync(schemaPath)) fail('the referenced JSON schema is missing')
if (capabilities.length === 0) fail('at least one owner capability is required')

for (const capability of capabilities) {
  if (!capability.id || ids.has(capability.id)) fail(`capability id is missing or duplicated: ${capability.id ?? '(missing)'}`)
  ids.add(capability.id)

  if (!capability.route?.startsWith('/admin')) fail(`${capability.id} must name an /admin route`)
  coveredRoutes.add(capability.route)

  if (!Array.isArray(capability.questions) || capability.questions.length === 0) {
    fail(`${capability.id} needs at least one plain-English owner question`)
  } else {
    for (const question of capability.questions) {
      if (!/^(How|Where|What)\b/.test(question) || !question.endsWith('?')) {
        fail(`${capability.id} has a question that is not owner-readable: ${question}`)
      }
    }
  }

  if (!Array.isArray(capability.evidence) || capability.evidence.length === 0) {
    fail(`${capability.id} has no code evidence`)
    continue
  }

  for (const evidence of capability.evidence) {
    const filePath = resolve(root, evidence.file)
    if (!existsSync(filePath)) {
      fail(`${capability.id} evidence file is missing: ${evidence.file}`)
      continue
    }
    const source = readFileSync(filePath, 'utf8')
    for (const token of evidence.contains ?? []) {
      if (!source.includes(token)) fail(`${capability.id} lost expected control text "${token}" in ${evidence.file}`)
    }
  }
}

const sectionsSource = readFileSync(sectionsPath, 'utf8')
const navRoutes = new Set(Array.from(sectionsSource.matchAll(/href:\s*'([^']+)'/g), (match) => match[1]))
for (const route of navRoutes) {
  if (!coveredRoutes.has(route)) fail(`admin navigation route is not covered by the owner contract: ${route}`)
}

if (!existsSync(guidePath)) {
  fail('docs/admin/OWNER_GUIDE.md is missing')
} else {
  const guide = readFileSync(guidePath, 'utf8')
  for (const capability of capabilities) {
    if (!guide.includes(`<!-- capability:${capability.id} -->`)) {
      fail(`owner guide is missing capability:${capability.id}`)
    }
    for (const question of capability.questions ?? []) {
      if (!guide.includes(`### ${question}`)) {
        fail(`owner guide is missing the canonical question: ${question}`)
      }
    }
  }

  const screenshotPaths = Array.from(
    guide.matchAll(/\]\((screenshots\/[^)]+)\)/g),
    (match) => match[1],
  )
  guideScreenshotCount = new Set(screenshotPaths).size
  if (guideScreenshotCount < 20) {
    fail(`owner guide must keep visual coverage; found only ${guideScreenshotCount} screenshots`)
  }
  for (const screenshotPath of screenshotPaths) {
    if (!existsSync(resolve(root, 'docs/admin', screenshotPath))) {
      fail(`owner guide screenshot is missing: ${screenshotPath}`)
    }
  }
}

if (!process.exitCode) {
  console.log(`Admin capability contract passed: ${capabilities.length} owner jobs cover ${navRoutes.size} navigation routes with ${guideScreenshotCount} guide screenshots.`)
}

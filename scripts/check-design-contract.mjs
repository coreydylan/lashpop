import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

const projectRoot = process.cwd()
const contractPath = resolve(projectRoot, 'docs/design/brand-contract.json')
const contractCssPath = resolve(projectRoot, 'src/styles/brand-contract.css')
const contract = JSON.parse(await readFile(contractPath, 'utf8'))
const contractCss = await readFile(contractCssPath, 'utf8')
const errors = []

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

for (const [name, expectedValue] of Object.entries(contract.tokens)) {
  const matches = [...contractCss.matchAll(new RegExp(`--${escapeRegExp(name)}\\s*:\\s*([^;]+);`, 'g'))]
  if (matches.length !== 1) {
    errors.push(`Expected exactly one --${name} declaration in src/styles/brand-contract.css; found ${matches.length}.`)
    continue
  }
  const actualValue = matches[0][1].trim()
  if (actualValue !== expectedValue) {
    errors.push(`--${name} is "${actualValue}"; contract requires "${expectedValue}".`)
  }
}

const globalsCss = await readFile(resolve(projectRoot, 'src/app/globals.css'), 'utf8')
if (!globalsCss.startsWith("@import '../styles/brand-contract.css';")) {
  errors.push('src/app/globals.css must import the canonical brand contract first.')
}

const layout = await readFile(resolve(projectRoot, 'src/app/layout.tsx'), 'utf8')
for (const requiredSnippet of ['Inter', 'Playfair_Display', "variable: '--font-inter'", "variable: '--font-playfair'"]) {
  if (!layout.includes(requiredSnippet)) errors.push(`src/app/layout.tsx is missing the locked font setup: ${requiredSnippet}`)
}
const googleFontImport = layout.match(/import\s*\{([^}]+)\}\s*from\s*['"]next\/font\/google['"]/)
const loadedGoogleFonts = googleFontImport
  ? googleFontImport[1].split(',').map((name) => name.trim()).filter(Boolean).sort()
  : []
const approvedGoogleFonts = ['Inter', 'Playfair_Display'].sort()
if (JSON.stringify(loadedGoogleFonts) !== JSON.stringify(approvedGoogleFonts)) {
  errors.push(`Only Inter and Playfair Display may be loaded from next/font/google; found: ${loadedGoogleFonts.join(', ') || 'none'}.`)
}
if (/from\s*['"]next\/font\/local['"]/.test(layout) || globalsCss.includes('@font-face')) {
  errors.push('No local or @font-face font may be loaded without explicit approval and a contract update.')
}

const tailwindConfig = await readFile(resolve(projectRoot, 'tailwind.config.ts'), 'utf8')
for (const name of ['ivory', 'cream', 'blush-light', 'peach', 'blush', 'rose-mist', 'dusty-rose', 'soft-terracotta', 'warm-terracotta', 'terracotta-light', 'terracotta', 'rust', 'sage', 'warm-sand', 'golden', 'gold', 'ocean-mist', 'dune']) {
  if (!tailwindConfig.includes(`var(--${name})`)) errors.push(`tailwind.config.ts must map the locked --${name} token.`)
}
for (const name of ['--font-inter', '--font-playfair']) {
  if (!tailwindConfig.includes(name)) errors.push(`tailwind.config.ts must retain the locked ${name} font mapping.`)
}

async function listSourceFiles(target) {
  const targetStat = await stat(target)
  if (targetStat.isFile()) return [target]
  const entries = await readdir(target, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => listSourceFiles(resolve(target, entry.name))))
  return nested.flat()
}

const allowedExtensions = new Set(['.css', '.js', '.jsx', '.mjs', '.ts', '.tsx'])
const approvedHex = new Set(contract.approvedHexLiterals.map((value) => value.toLowerCase()))
const protectedFiles = (await Promise.all(
  contract.protectedRoots.map((root) => listSourceFiles(resolve(projectRoot, root)))
)).flat().filter((file) => allowedExtensions.has(extname(file)))

for (const file of protectedFiles) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
    const value = match[0].toLowerCase()
    if (!approvedHex.has(value)) {
      errors.push(`${file.slice(projectRoot.length + 1)} contains unapproved color ${value}. Add no new color without written approval and a contract update.`)
    }
  }
}

if (errors.length) {
  console.error('Design contract check failed:\n')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Design contract verified: ${Object.keys(contract.tokens).length} locked tokens, ${protectedFiles.length} protected files, ${approvedHex.size} approved existing color literals.`)

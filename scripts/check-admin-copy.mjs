#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { findBannedAdminCopy } from './admin-copy-lexicon.mjs'
import { extractAdminCopyStrings } from './admin-copy-source-extractor.mjs'

const ROOT = process.cwd()
const SOURCE_ROOTS = [
  'src/app/admin',
  'src/app/api/admin',
  'src/components/admin',
  'src/components/admin-analytics',
  'src/components/admin-guide',
  'src/components/admin-media',
  'src/components/admin-shell',
  'src/components/dam',
  'src/components/team',
  'src/lib/admin',
  'src/lib/admin-analytics.ts',
]

const isSourceFile = (file) => /\.(?:ts|tsx)$/.test(file) && !/\.(?:test|spec)\.(?:ts|tsx)$/.test(file)

async function collectFiles(directory) {
  const absolute = path.join(ROOT, directory)
  const target = await stat(absolute)
  if (target.isFile()) return isSourceFile(directory) ? [directory] : []
  const entries = await readdir(absolute, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relative = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(relative))
    else if (isSourceFile(relative)) files.push(relative)
  }
  return files
}

const files = (await Promise.all(SOURCE_ROOTS.map(collectFiles))).flat().sort()
const entries = []

for (const file of files) {
  const sourceText = await readFile(path.join(ROOT, file), 'utf8')
  entries.push(...extractAdminCopyStrings({ file, sourceText }))
}

const unique = [...new Map(entries.map((entry) => [`${entry.file}:${entry.line}:${entry.text}`, entry])).values()]
const violations = []

for (const entry of unique) {
  for (const rule of findBannedAdminCopy(entry.text)) {
    violations.push({ ...entry, reason: rule.reason })
  }
}

if (violations.length) {
  console.error(`Admin copy check failed: ${violations.length} vague or internal phrase${violations.length === 1 ? '' : 's'} found in ${unique.length} user-facing strings across ${new Set(unique.map((entry) => entry.file)).size} files.`)
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line} — “${violation.text}” (${violation.reason})`)
  }
  process.exit(1)
}

console.log(`Admin copy verified: ${unique.length} user-facing strings across ${new Set(unique.map((entry) => entry.file)).size} files.`)

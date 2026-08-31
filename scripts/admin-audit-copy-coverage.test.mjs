import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const root = process.cwd()

async function sourceFiles(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relative = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(relative))
    else if (/\.(?:ts|tsx)$/.test(entry.name) && !/\.(?:test|spec)\./.test(entry.name)) files.push(relative)
  }
  return files
}

function propertyName(node) {
  return ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : ''
}

function stringLiterals(node) {
  if (ts.isStringLiteralLike(node)) return [node.text]
  if (ts.isConditionalExpression(node)) return [
    ...stringLiterals(node.whenTrue),
    ...stringLiterals(node.whenFalse),
  ]
  if (ts.isParenthesizedExpression(node)) return stringLiterals(node.expression)
  return []
}

async function auditCopyMappings() {
  const mappingPath = 'src/lib/admin/audit-copy.ts'
  const mappingText = await readFile(path.join(root, mappingPath), 'utf8')
  const mappingSource = ts.createSourceFile(mappingPath, mappingText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const mappings = new Map()

  function collectMappings(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      const values = new Map()
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteralLike(property.initializer)) {
          values.set(propertyName(property.name), property.initializer.text)
        }
      }
      mappings.set(node.name.text, values)
    }
    ts.forEachChild(node, collectMappings)
  }
  collectMappings(mappingSource)

  return mappings
}

async function recordedPropertyLiterals(propertyNameToFind) {
  const files = await sourceFiles('src')
  const recorded = new Set()
  for (const file of files) {
    const text = await readFile(path.join(root, file), 'utf8')
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)

    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'recordAdminAction') {
        const argument = node.arguments[0]
        if (argument && ts.isObjectLiteralExpression(argument)) {
          const property = argument.properties.find((candidate) => ts.isPropertyAssignment(candidate) && propertyName(candidate.name) === propertyNameToFind)
          if (property && ts.isPropertyAssignment(property)) {
            for (const value of stringLiterals(property.initializer)) recorded.add(value)
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }

  return recorded
}

test('every recorded Admin action has an operator-readable label', async () => {
  const mappings = await auditCopyMappings()
  const labels = mappings.get('ACTION_LABELS') ?? new Map()
  const recorded = await recordedPropertyLiterals('action')

  const missing = [...recorded].filter((action) => !labels.has(action)).sort()
  assert.deepEqual(missing, [], `Missing Admin audit copy for: ${missing.join(', ')}`)
})

test('every recorded Admin target has an operator-readable label', async () => {
  const mappings = await auditCopyMappings()
  const labels = mappings.get('TARGET_LABELS') ?? new Map()
  const recorded = await recordedPropertyLiterals('targetType')

  // These targets are persisted by atomic SQL batches rather than through
  // recordAdminAction, so keep them in the same operator-facing vocabulary.
  const sqlBatchTargets = ['newsletter_subscription', 'team_members', 'user', 'website_settings']
  for (const target of sqlBatchTargets) recorded.add(target)

  const missing = [...recorded].filter((target) => !labels.has(target)).sort()
  assert.deepEqual(missing, [], `Missing Admin target copy for: ${missing.join(', ')}`)
})

test('internal storage terms stay out of target labels', async () => {
  const mappings = await auditCopyMappings()
  const labels = mappings.get('TARGET_LABELS') ?? new Map()
  const expected = new Map([
    ['dam_asset', 'Media'],
    ['dam_asset_batch', 'Media'],
    ['dam_user_settings', 'Media settings'],
    ['review_pipeline', 'Automatic review settings'],
    ['tag_taxonomy', 'Media tags'],
  ])

  for (const [target, label] of expected) {
    assert.equal(labels.get(target), label, `${target} should read as ${label}`)
  }
})

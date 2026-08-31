import assert from 'node:assert/strict'
import test from 'node:test'
import { findBannedAdminCopy } from './admin-copy-lexicon.mjs'
import { extractAdminCopyStrings } from './admin-copy-source-extractor.mjs'

function extract(sourceText) {
  return extractAdminCopyStrings({ file: 'fixture.tsx', sourceText })
}

function texts(sourceText) {
  return extract(sourceText).map((entry) => entry.text)
}

test('follows conditional branches rendered by JSX without scanning the condition', () => {
  const sourceText = `
    export function Fixture({ ok, view }) {
      return (
        <main>
          {ok ? 'How attention moved' : 'literal good copy'}
          {view === 'taxonomy'}
        </main>
      )
    }
  `

  const extracted = texts(sourceText)
  assert.ok(extracted.includes('How attention moved'))
  assert.ok(extracted.includes('literal good copy'))
  assert.ok(!extracted.includes('taxonomy'))
})

test('joins static string concatenations that are rendered by JSX', () => {
  const sourceText = `
    export function Fixture() {
      return <p>{'Traffic ' + 'rhythm'}</p>
    }
  `

  const extracted = texts(sourceText)
  assert.ok(extracted.includes('Traffic rhythm'))
  assert.notEqual(findBannedAdminCopy('Traffic rhythm').length, 0)
})

test('follows local helper return values when the helper is called from JSX', () => {
  const sourceText = `
    function formatRatio(hasStarts) {
      if (!hasStarts) return 'Not enough signal'
      return '50%'
    }

    export function Fixture({ hasStarts }) {
      return <output>{formatRatio(hasStarts)}</output>
    }
  `

  const extracted = extract(sourceText)
  const violation = extracted.find((entry) => entry.text === 'Not enough signal')
  assert.ok(violation)
  assert.equal(violation.line, 3)
  assert.notEqual(findBannedAdminCopy(violation.text).length, 0)
})

test('keeps comparison and DTO values out while scanning explicit copy fields', () => {
  const sourceText = `
    const option = {
      view: 'taxonomy',
      label: 'Booking categories',
    }

    export function Fixture({ view }) {
      const selected = view === 'taxonomy'
      return <button aria-label={option.label}>{selected ? 'Selected' : 'Choose'}</button>
    }
  `

  const extracted = texts(sourceText)
  assert.ok(extracted.includes('Booking categories'))
  assert.ok(extracted.includes('Selected'))
  assert.ok(extracted.includes('Choose'))
  assert.ok(!extracted.includes('taxonomy'))
})

test('passes extracted render-path strings to the lexicon', () => {
  const sourceText = `
    const helper = () => 'Not enough signal'
    export function Fixture({ ok }) {
      return <>{ok ? 'How attention moved' : 'literal good copy'}{'Traffic ' + 'rhythm'}{helper()}</>
    }
  `

  const violations = extract(sourceText).flatMap((entry) => (
    findBannedAdminCopy(entry.text).map((rule) => ({ ...entry, reason: rule.reason }))
  ))

  assert.deepEqual(
    [...new Set(violations.map((violation) => violation.text))].sort(),
    ['How attention moved', 'Not enough signal', 'Traffic rhythm'],
  )
})

test('scans attributes on nested and self-closing JSX render branches', () => {
  const sourceText = `
    export function Fixture({ show, view }) {
      return <>{show && <button aria-label="Browse DAM" />}{view === 'taxonomy'}</>
    }
  `

  const extracted = texts(sourceText)
  assert.ok(extracted.includes('Browse DAM'))
  assert.notEqual(findBannedAdminCopy('Browse DAM').length, 0)
  assert.ok(!extracted.includes('taxonomy'))
})

test('follows JSX returned by collection render callbacks', () => {
  const sourceText = `
    export function Fixture({ items }) {
      return <section>{items.map(() => <span>How attention moved</span>)}</section>
    }
  `

  const extracted = texts(sourceText)
  assert.ok(extracted.includes('How attention moved'))
  assert.notEqual(findBannedAdminCopy('How attention moved').length, 0)
})

test('scans visible Owner guide and workflow schema fields', () => {
  const sourceText = `
    const article = {
      summary: 'How attention moved',
      questions: ['Traffic rhythm'],
      before: ['Operator read'],
      check: ['Pages earning attention'],
      warning: 'Not enough signal',
      expectedResult: 'Success signals',
      keywords: ['taxonomy'],
    }
  `

  const extracted = texts(sourceText)
  for (const copy of ['How attention moved', 'Traffic rhythm', 'Operator read', 'Pages earning attention', 'Not enough signal', 'Success signals']) {
    assert.ok(extracted.includes(copy), copy)
  }
  assert.ok(!extracted.includes('taxonomy'))
})

test('scans constrained user-visible status setters', () => {
  const sourceText = `
    setNotice('How attention moved')
    setSyncMessage('Traffic rhythm')
    setSignOutError('Operator read')
    setAnnouncement('Pages earning attention')
    setUploadError('Not enough signal')
    setInternalState('taxonomy')
  `

  const extracted = texts(sourceText)
  for (const copy of ['How attention moved', 'Traffic rhythm', 'Operator read', 'Pages earning attention', 'Not enough signal']) {
    assert.ok(extracted.includes(copy), copy)
  }
  assert.ok(!extracted.includes('taxonomy'))
})

test('scans nested workflow containers and copy-named keyed maps', () => {
  const sourceText = `
    const ROLE_COPY = {
      owner: 'How attention moved',
      viewer: 'Traffic rhythm',
    }
    const VAGARO_OWNER_WORKFLOWS = {
      service: {
        summary: 'Literal service summary',
        vagaroSteps: ['Operator read'],
        afterSyncSteps: ['Pages earning attention'],
        officialHelp: [{ label: 'Not enough signal', href: 'https://example.com' }],
      },
    }
  `

  const extracted = texts(sourceText)
  for (const copy of ['How attention moved', 'Traffic rhythm', 'Literal service summary', 'Operator read', 'Pages earning attention', 'Not enough signal']) {
    assert.ok(extracted.includes(copy), copy)
  }
  assert.ok(!extracted.includes('https://example.com'))
})

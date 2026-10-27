import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Regression test for the 0010 cascade incident (2026-08-23).
//
// D1 runs with foreign keys ON. A rebuild migration that drops team_members
// therefore fires ON DELETE CASCADE on every child table. This test applies
// the real migration chain to an in-memory SQLite with foreign keys ON, puts a
// row in each child table before the last migration runs, and asserts nothing
// disappears. Any future rebuild of a parent table has to keep this green.

const MIGRATIONS_DIR = path.join(process.cwd(), 'workers/lashpop-db/migrations');
const LEGACY_DRIZZLE_DIR = path.join(process.cwd(), 'drizzle');

const CHILD_TABLES = [
  'sets',
  'team_member_categories',
  'team_member_highlights',
  'team_member_photos',
  'team_member_services',
  'team_member_services_vagaro',
  'team_quick_facts',
  'assets',
  'reviews',
];

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function apply(db: DatabaseSync, file: string): void {
  const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  for (const stmt of sql.split('--> statement-breakpoint')) {
    const trimmed = stmt.trim();
    if (trimmed) db.exec(trimmed);
  }
}

type Col = { name: string; type: string; nn: number; dflt_value: unknown; pk: number };

function columns(db: DatabaseSync, table: string): Col[] {
  return db.prepare(`SELECT name, type, "notnull" AS nn, dflt_value, pk FROM pragma_table_info(?)`).all(table) as unknown as Col[];
}

// Build the smallest insert that satisfies the table: primary keys plus every
// NOT NULL column with no default. Text gets a marker, numerics get 1.
function insertRow(db: DatabaseSync, table: string, overrides: Record<string, unknown>): void {
  const cols = columns(db, table);
  const values: Record<string, unknown> = {};
  for (const col of cols) {
    const needed = col.pk > 0 || (col.nn === 1 && col.dflt_value === null);
    if (!needed) continue;
    const type = (col.type || '').toLowerCase();
    values[col.name] = type.includes('int') || type.includes('real') || type.includes('num') ? 1 : `test-${table}-${col.name}`;
  }
  Object.assign(values, overrides);
  const names = Object.keys(values);
  const sql = `INSERT INTO \`${table}\` (${names.map((n) => `\`${n}\``).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`;
  db.prepare(sql).run(...names.map((n) => values[n] as never));
}

test('migrations do not cascade-delete child rows of team_members', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  assert.equal(
    (db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }).foreign_keys,
    1,
    'the test is worthless without foreign keys enforced - this is what D1 does',
  );

  const files = migrationFiles();
  const last = files[files.length - 1];
  for (const file of files.slice(0, -1)) apply(db, file);

  const memberId = 'cascade-test-member';
  insertRow(db, 'team_members', { id: memberId, name: 'Cascade Test', show_on_website: 1, is_active: 1 });

  const present: string[] = [];
  for (const table of CHILD_TABLES) {
    const cols = columns(db, table).map((c) => c.name);
    if (!cols.includes('team_member_id')) continue;
    try {
      insertRow(db, table, { team_member_id: memberId });
    } catch {
      // The table has another required foreign key we are not stubbing out.
      // Skip it; the tables we can populate are enough to catch a cascade.
      continue;
    }
    present.push(table);
  }
  assert.ok(present.length >= 4, `expected several populated child tables, found ${present.length}: ${present.join(', ')}`);

  const before = Object.fromEntries(
    present.map((t) => [t, (db.prepare(`SELECT count(*) AS n FROM \`${t}\``).get() as { n: number }).n]),
  );

  apply(db, last);

  for (const table of present) {
    const after = (db.prepare(`SELECT count(*) AS n FROM \`${table}\``).get() as { n: number }).n;
    assert.equal(after, before[table], `${last} deleted rows from ${table} (${before[table]} -> ${after})`);
    const linked = (
      db.prepare(`SELECT count(*) AS n FROM \`${table}\` WHERE team_member_id = ?`).get(memberId) as { n: number }
    ).n;
    assert.equal(linked, 1, `${last} orphaned or nulled the ${table} link to team_members`);
  }

  const check = db.prepare('PRAGMA foreign_key_check').all();
  assert.equal(check.length, 0, `foreign_key_check found violations: ${JSON.stringify(check)}`);
  db.close();
});

test('show_on_website defaults to hidden after the migration chain', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const file of migrationFiles()) apply(db, file);

  insertRow(db, 'team_members', { id: 'default-test', name: 'Default Test' });
  const row = db.prepare('SELECT show_on_website FROM team_members WHERE id = ?').get('default-test') as {
    show_on_website: number;
  };
  assert.equal(row.show_on_website, 0, 'an insert that omits show_on_website must land hidden');
  db.close();
});

test("Evie's Instagram migration updates only the verified team row and records one audit", () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  const files = migrationFiles();
  const migration = '0011_update_evie_instagram.sql';
  const migrationIndex = files.indexOf(migration);
  assert.notEqual(migrationIndex, -1, `${migration} must remain in the migration chain`);
  for (const file of files.slice(0, migrationIndex)) apply(db, file);

  const evieId = '50317859-e156-467c-9380-bfbc8b0babd2';
  insertRow(db, 'team_members', {
    id: evieId,
    name: 'Evie Ells',
    instagram: null,
    instagram_url: null,
  });
  insertRow(db, 'team_members', {
    id: 'unrelated-member',
    name: 'Unrelated Member',
    instagram: 'keep-this-handle',
  });

  apply(db, migration);

  const evie = db.prepare(
    'SELECT instagram, instagram_url FROM team_members WHERE id = ?',
  ).get(evieId) as { instagram: string; instagram_url: string };
  assert.equal(evie.instagram, 'thedarlinspot');
  assert.equal(evie.instagram_url, 'https://instagram.com/thedarlinspot');
  const unrelated = db.prepare(
    'SELECT instagram FROM team_members WHERE id = ?',
  ).get('unrelated-member') as { instagram: string };
  assert.equal(unrelated.instagram, 'keep-this-handle');

  const audits = db.prepare(
    "SELECT count(*) AS n FROM admin_audit_log WHERE action = 'team.instagram.update' AND target_id = ?",
  ).get(evieId) as { n: number };
  assert.equal(audits.n, 1);
  db.close();
});

test('website notes migration applies only the guarded client-approved data corrections', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  const files = migrationFiles();
  const migration = '0013_lashpop_website_notes.sql';
  const migrationIndex = files.indexOf(migration);
  assert.notEqual(migrationIndex, -1, `${migration} must remain in the production migration chain`);
  const duplicatePaths = readdirSync(LEGACY_DRIZZLE_DIR)
    .filter((file) => /lashpop_website_notes\.sql$/.test(file));
  assert.deepEqual(
    duplicatePaths,
    [],
    'website notes must use only the Worker/D1 production migration chain',
  );
  const migrationSource = readFileSync(path.join(MIGRATIONS_DIR, migration), 'utf8');
  assert.match(migrationSource, /Rollback \(also guarded to avoid overwriting later edits\)/);
  for (const file of files.slice(0, migrationIndex)) apply(db, file);

  insertRow(db, 'website_settings', {
    id: 'studio-settings',
    section: 'studio',
    config: JSON.stringify({
      address: { street: '429 South Coast Highway' },
      coordinates: { lat: 33.1959, lng: -117.3795 },
    }),
  });
  insertRow(db, 'service_categories', {
    id: 'unrelated-category',
    name: 'Unrelated Category',
    slug: 'unrelated-category',
    display_name: 'Unrelated Public Label',
  });

  const unrelatedCategoryBefore = db.prepare(
    "SELECT name, display_name FROM service_categories WHERE slug = 'unrelated-category'",
  ).get() as { name: string; display_name: string };
  const unrelatedVagaroId = 'vsc-15071993';
  db.prepare('UPDATE vagaro_service_categories SET team_label = ? WHERE id = ?').run('Brows', unrelatedVagaroId);

  apply(db, migration);

  const tattoos = db.prepare(
    "SELECT name, display_name FROM service_categories WHERE slug = 'fine-line-tattoos'",
  ).get() as { name: string; display_name: string };
  assert.equal(tattoos.name, 'Tiny Tattoos');
  assert.equal(tattoos.display_name, 'Tiny Tattoos');

  const vagaro = db.prepare(
    "SELECT team_label FROM vagaro_service_categories WHERE id = 'vsc-39970485'",
  ).get() as { team_label: string };
  assert.equal(vagaro.team_label, 'Tiny Tattoos');

  const studio = db.prepare(
    "SELECT json_extract(config, '$.coordinates.lat') AS lat, json_extract(config, '$.coordinates.lng') AS lng FROM website_settings WHERE section = 'studio'",
  ).get() as { lat: number; lng: number };
  assert.equal(studio.lat, 33.1913757);
  assert.equal(studio.lng, -117.3758363);

  const unrelatedCategoryAfter = db.prepare(
    "SELECT name, display_name FROM service_categories WHERE slug = 'unrelated-category'",
  ).get() as { name: string; display_name: string };
  assert.equal(unrelatedCategoryAfter.name, unrelatedCategoryBefore.name);
  assert.equal(unrelatedCategoryAfter.display_name, unrelatedCategoryBefore.display_name);
  const unrelatedVagaro = db.prepare(
    'SELECT team_label FROM vagaro_service_categories WHERE id = ?',
  ).get(unrelatedVagaroId) as { team_label: string };
  assert.equal(unrelatedVagaro.team_label, 'Brows');

  const ownerEditedConfig = JSON.stringify({
    address: { street: '429 South Coast Highway' },
    coordinates: { lat: 33.2, lng: -117.38 },
  });
  db.prepare("UPDATE website_settings SET config = ? WHERE section = 'studio'").run(ownerEditedConfig);
  apply(db, migration);
  const replayedConfig = db.prepare(
    "SELECT config FROM website_settings WHERE section = 'studio'",
  ).get() as { config: string };
  assert.equal(replayedConfig.config, ownerEditedConfig, 'a replay must preserve a later owner coordinate edit');

  const check = db.prepare('PRAGMA foreign_key_check').all();
  assert.equal(check.length, 0, `foreign_key_check found violations: ${JSON.stringify(check)}`);
  db.close();
});

const EMILY_MIGRATION = '0014_emily_team_edits.sql';
const PAIGE_ID = '0bf9968f-69ea-4e66-ae3a-8c80ec3c7296';
const KELLY_R_ID = 'ff5f9b78-e530-4b7f-808b-c20f90f6e5da';
const KELLY_K_ID = 'f99aef2d-9a3a-4868-a17b-9a74ed274bcc';
const KELLY_FACT_ID = 'fc789695-c63c-46fd-be93-4f08bfcb6096';
const KELLY_MOVIE_ID = '4f02a8f7-e218-4b1b-b0e1-0d64ce04c8f5';
const OLD_KELLY_FACT = 'Can recite The Nightmare Before Christmas word for word';

function emilyMigrationDatabase(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const files = migrationFiles();
  const index = files.indexOf(EMILY_MIGRATION);
  assert.notEqual(index, -1);
  for (const file of files.slice(0, index)) apply(db, file);
  insertRow(db, 'team_members', { id: PAIGE_ID, name: 'Paige Gordon', is_active: 1, show_on_website: 1 });
  insertRow(db, 'team_members', { id: KELLY_R_ID, name: 'Kelly Richter', fun_fact: OLD_KELLY_FACT, is_active: 1, show_on_website: 1 });
  insertRow(db, 'team_members', { id: KELLY_K_ID, name: 'Kelly Katona', fun_fact: 'Keep Kelly Katona', is_active: 1, show_on_website: 1 });
  insertRow(db, 'team_quick_facts', { id: KELLY_FACT_ID, team_member_id: KELLY_R_ID, fact_type: 'fun_fact', value: OLD_KELLY_FACT });
  insertRow(db, 'team_quick_facts', { id: KELLY_MOVIE_ID, team_member_id: KELLY_R_ID, fact_type: 'movie', value: 'The Nightmare Before Christmas' });
  insertRow(db, 'team_quick_facts', { id: 'kelly-coffee', team_member_id: KELLY_R_ID, fact_type: 'coffee', value: 'Iced vanilla latte' });
  insertRow(db, 'team_quick_facts', { id: 'kelly-k-movie', team_member_id: KELLY_K_ID, fact_type: 'movie', value: 'Pride & Prejudice' });
  insertRow(db, 'team_member_photos', { id: 'paige-photo', team_member_id: PAIGE_ID });
  return db;
}

test('Emily team edits hide Paige, update only Kelly Richter and are safe to replay', () => {
  const db = emilyMigrationDatabase();
  const beforeKellyK = db.prepare('SELECT * FROM team_members WHERE id = ?').get(KELLY_K_ID);
  const beforeFacts = db.prepare('SELECT * FROM team_quick_facts WHERE id IN (?, ?) ORDER BY id').all('kelly-coffee', 'kelly-k-movie');
  const beforePhoto = db.prepare('SELECT * FROM team_member_photos WHERE id = ?').get('paige-photo');
  apply(db, EMILY_MIGRATION);

  const paige = db.prepare('SELECT show_on_website, is_active, show_on_website_actor, show_on_website_reason FROM team_members WHERE id = ?').get(PAIGE_ID) as {
    show_on_website: number; is_active: number; show_on_website_actor: string; show_on_website_reason: string;
  };
  assert.equal(paige.show_on_website, 0);
  assert.equal(paige.is_active, 1, 'website removal must not deactivate a provider');
  assert.equal(paige.show_on_website_actor, 'migration:0014_emily_team_edits');
  assert.match(paige.show_on_website_reason, /Emily Rogers/);
  assert.deepEqual(db.prepare('SELECT * FROM team_member_photos WHERE id = ?').get('paige-photo'), beforePhoto);
  assert.equal(db.prepare('SELECT fun_fact FROM team_members WHERE id = ?').get(KELLY_R_ID)?.fun_fact, 'I’ve traveled to 11 countries');
  assert.equal(db.prepare('SELECT value FROM team_quick_facts WHERE id = ?').get(KELLY_FACT_ID)?.value, 'I’ve traveled to 11 countries');
  assert.equal(db.prepare('SELECT value FROM team_quick_facts WHERE id = ?').get(KELLY_MOVIE_ID)?.value, 'Twilight');
  assert.deepEqual(db.prepare('SELECT * FROM team_members WHERE id = ?').get(KELLY_K_ID), beforeKellyK);
  assert.deepEqual(db.prepare('SELECT * FROM team_quick_facts WHERE id IN (?, ?) ORDER BY id').all('kelly-coffee', 'kelly-k-movie'), beforeFacts);
  const audit = db.prepare("SELECT target_id, diff FROM admin_audit_log WHERE notes LIKE 'Migration 0014:%' ORDER BY target_id").all();
  assert.equal(audit.length, 4);
  assert.deepEqual(JSON.parse((audit.find(row => row.target_id === KELLY_MOVIE_ID) as { diff: string }).diff), {
    before: { value: 'The Nightmare Before Christmas' }, after: { value: 'Twilight' },
  });
  const state = db.prepare('SELECT * FROM team_members ORDER BY id').all();
  const facts = db.prepare('SELECT * FROM team_quick_facts ORDER BY id').all();
  apply(db, EMILY_MIGRATION);
  assert.deepEqual(db.prepare('SELECT * FROM team_members ORDER BY id').all(), state);
  assert.deepEqual(db.prepare('SELECT * FROM team_quick_facts ORDER BY id').all(), facts);
  assert.deepEqual(db.prepare("SELECT target_id, diff FROM admin_audit_log WHERE notes LIKE 'Migration 0014:%' ORDER BY target_id").all(), audit);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
});

test('Emily migration preserves subsequent owner edits and renamed or mismatched identities', () => {
  const db = emilyMigrationDatabase();
  db.prepare('UPDATE team_members SET show_on_website_reason = ? WHERE id = ?').run('Owner chose to publish Paige', PAIGE_ID);
  db.prepare('UPDATE team_members SET fun_fact = ? WHERE id = ?').run('A newer fun fact', KELLY_R_ID);
  db.prepare('UPDATE team_quick_facts SET value = ? WHERE id = ?').run('A newer movie', KELLY_MOVIE_ID);
  db.prepare('UPDATE team_quick_facts SET team_member_id = ? WHERE id = ?').run(KELLY_K_ID, KELLY_FACT_ID);
  const members = db.prepare('SELECT * FROM team_members ORDER BY id').all();
  const facts = db.prepare('SELECT * FROM team_quick_facts ORDER BY id').all();
  apply(db, EMILY_MIGRATION);
  assert.deepEqual(db.prepare('SELECT * FROM team_members ORDER BY id').all(), members);
  assert.deepEqual(db.prepare('SELECT * FROM team_quick_facts ORDER BY id').all(), facts);
  assert.equal(db.prepare("SELECT count(*) AS n FROM admin_audit_log WHERE notes LIKE 'Migration 0014:%'").get()?.n, 0);

  db.prepare('UPDATE team_members SET name = ? WHERE id = ?').run('Another Paige', PAIGE_ID);
  db.prepare('UPDATE team_members SET name = ?, fun_fact = ? WHERE id = ?').run('Another Kelly', OLD_KELLY_FACT, KELLY_R_ID);
  db.prepare('UPDATE team_quick_facts SET value = ? WHERE id = ?').run('The Nightmare Before Christmas', KELLY_MOVIE_ID);
  apply(db, EMILY_MIGRATION);
  assert.equal(db.prepare('SELECT value FROM team_quick_facts WHERE id = ?').get(KELLY_MOVIE_ID)?.value, 'The Nightmare Before Christmas');
  assert.equal(db.prepare("SELECT count(*) AS n FROM admin_audit_log WHERE notes LIKE 'Migration 0014:%'").get()?.n, 0);
  db.close();
});

test('documented Emily rollback restores the requested fields and preserves later edits', () => {
  const db = emilyMigrationDatabase();
  const runbook = readFileSync(path.join(process.cwd(), 'docs/ops/emily-team-edits-2026-10-27.md'), 'utf8');
  const rollback = runbook.match(/```sql\n([\s\S]*?)\n```/)?.[1];
  assert.ok(rollback, 'the release runbook must contain executable rollback SQL');
  apply(db, EMILY_MIGRATION);
  db.exec(rollback);
  assert.equal(db.prepare('SELECT show_on_website FROM team_members WHERE id = ?').get(PAIGE_ID)?.show_on_website, 1);
  assert.equal(db.prepare('SELECT show_on_website_actor FROM team_members WHERE id = ?').get(PAIGE_ID)?.show_on_website_actor, null);
  assert.equal(db.prepare('SELECT fun_fact FROM team_members WHERE id = ?').get(KELLY_R_ID)?.fun_fact, OLD_KELLY_FACT);
  assert.equal(db.prepare('SELECT value FROM team_quick_facts WHERE id = ?').get(KELLY_FACT_ID)?.value, OLD_KELLY_FACT);
  assert.equal(db.prepare('SELECT value FROM team_quick_facts WHERE id = ?').get(KELLY_MOVIE_ID)?.value, 'The Nightmare Before Christmas');

  apply(db, EMILY_MIGRATION);
  db.prepare('UPDATE team_members SET show_on_website_actor = ? WHERE id = ?').run('owner:later-edit', PAIGE_ID);
  db.prepare('UPDATE team_members SET fun_fact = ? WHERE id = ?').run('Newer fact', KELLY_R_ID);
  db.prepare('UPDATE team_quick_facts SET value = ? WHERE id = ?').run('Newer movie', KELLY_MOVIE_ID);
  db.exec(rollback);
  assert.equal(db.prepare('SELECT show_on_website FROM team_members WHERE id = ?').get(PAIGE_ID)?.show_on_website, 0);
  assert.equal(db.prepare('SELECT fun_fact FROM team_members WHERE id = ?').get(KELLY_R_ID)?.fun_fact, 'Newer fact');
  assert.equal(db.prepare('SELECT value FROM team_quick_facts WHERE id = ?').get(KELLY_MOVIE_ID)?.value, 'Newer movie');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
});

test('auth schema additions preserve existing users, session tokens, expiry and verification rows', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const files = migrationFiles();
  const migration = '0015_auth_schema_compatibility.sql';
  const index = files.indexOf(migration);
  assert.notEqual(index, -1);
  for (const file of files.slice(0, index)) apply(db, file);
  insertRow(db, 'user', { id: 'existing-auth-user', name: null, email: null, phone_number: '+15555550123', admin_role: 'owner', dam_access: 1 });
  insertRow(db, 'session', { id: 'existing-session', user_id: 'existing-auth-user', token: 'existing-opaque-token', expires_at: 2_000_000_000_000, created_at: 1_700_000_000_000 });
  insertRow(db, 'verification', { id: 'existing-verification', identifier: 'local-fixture', value: 'fixture-value', expires_at: 2_000_000_000_000, created_at: 1_700_000_000_001 });
  const user = db.prepare('SELECT * FROM user').all();
  const session = db.prepare('SELECT * FROM session').get()!;
  const verification = db.prepare('SELECT * FROM verification').get()!;
  apply(db, migration);
  assert.deepEqual(db.prepare('SELECT * FROM user').all(), user);
  for (const [column, value] of Object.entries(session)) {
    assert.equal(db.prepare('SELECT * FROM session').get()?.[column], value);
  }
  for (const [column, value] of Object.entries(verification)) {
    assert.equal(db.prepare('SELECT * FROM verification').get()?.[column], value);
  }
  assert.equal(db.prepare('SELECT updated_at FROM session').get()?.updated_at, session.created_at);
  assert.equal(db.prepare('SELECT updated_at FROM verification').get()?.updated_at, verification.created_at);
  assert.equal(db.prepare('SELECT count(*) AS n FROM account').get()?.n, 0);
  // The previous production app can continue writing its original column set
  // during the additive migration/deployment window.
  insertRow(db, 'session', { id: 'legacy-insert', user_id: 'existing-auth-user', token: 'legacy-insert-token' });
  assert.equal(db.prepare("SELECT updated_at FROM session WHERE id = 'legacy-insert'").get()?.updated_at, 0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare('PRAGMA quick_check').get()?.quick_check, 'ok');
  db.close();
});

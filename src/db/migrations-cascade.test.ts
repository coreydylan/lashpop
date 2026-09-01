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

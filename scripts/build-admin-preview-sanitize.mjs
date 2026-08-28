import { writeFileSync } from 'node:fs'

const outputPath = process.argv[2]
const ownerUserId = process.env.PREVIEW_OWNER_USER_ID

if (!outputPath) throw new Error('An output SQL path is required')
if (!ownerUserId) throw new Error('PREVIEW_OWNER_USER_ID is required')

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`
const now = "cast((julianday('now') - 2440587.5)*86400000 as integer)"

const sql = `
PRAGMA foreign_keys=OFF;

DELETE FROM "session";
DELETE FROM "verification";
DELETE FROM "request_rate_limits";
DELETE FROM "profiles";
DELETE FROM "friend_booking_requests";
DELETE FROM "appointments";
DELETE FROM "customers";
DELETE FROM "business_locations";
DELETE FROM "form_responses";
DELETE FROM "transactions";
DELETE FROM "vagaro_customers";
DELETE FROM "newsletter_subscriptions";
DELETE FROM "work_with_us_submissions";
DELETE FROM "dam_user_actions";
DELETE FROM "dam_user_settings";
DELETE FROM "admin_audit_log";
DELETE FROM "punchlist_activity";
DELETE FROM "punchlist_comments";
DELETE FROM "punchlist_items";
DELETE FROM "punchlist_sessions";
DELETE FROM "punchlist_users";
DELETE FROM "scrollytelling_playback_events";

DELETE FROM "user" WHERE "id" <> ${sqlString(ownerUserId)};
UPDATE "user"
SET "name" = 'Preview Owner',
    "email" = NULL,
    "image" = NULL,
    "dam_access" = 1,
    "admin_role" = 'owner',
    "phone_number_verified" = 1,
    "updated_at" = ${now}
WHERE "id" = ${sqlString(ownerUserId)};

INSERT INTO "user" (
  "id", "phone_number", "phone_number_verified", "email", "email_verified",
  "name", "image", "dam_access", "created_at", "updated_at", "admin_role"
) VALUES
  ('preview-publisher', NULL, 0, 'publisher@example.invalid', 0, 'Preview Publisher', NULL, 1, ${now}, ${now}, 'publisher'),
  ('preview-viewer', NULL, 0, 'viewer@example.invalid', 0, 'Preview Viewer', NULL, 1, ${now}, ${now}, 'viewer');

UPDATE "team_members" SET "email" = NULL, "phone" = '';

INSERT INTO "newsletter_subscriptions" (
  "id", "email", "subscribed_at", "source", "status", "notes", "unsubscribed_at", "updated_at"
) VALUES
  ('preview-newsletter-active', 'active@example.invalid', ${now}, 'preview_fixture', 'active', 'Synthetic preview record', NULL, ${now}),
  ('preview-newsletter-unsubscribed', 'unsubscribed@example.invalid', ${now} - 86400000, 'preview_fixture', 'unsubscribed', 'Synthetic preview record', ${now}, ${now}),
  ('preview-newsletter-suppressed', 'suppressed@example.invalid', ${now} - 172800000, 'preview_fixture', 'suppressed', 'Synthetic preview record', NULL, ${now});

INSERT INTO "work_with_us_submissions" (
  "id", "path", "name", "email", "phone", "experience", "specialty", "message",
  "instagram", "current_business", "desired_start_date", "booth_days", "created_at"
) VALUES
  ('preview-application-employee', 'employee', 'Preview Applicant', 'applicant@example.invalid', '(555) 010-0200', 'Synthetic experience for the branch preview.', '["Lashes","Brows"]', 'This is a synthetic application used only for admin acceptance testing.', '@preview', NULL, 'Flexible', NULL, ${now}),
  ('preview-application-booth', 'booth', 'Preview Booth Renter', 'booth@example.invalid', '(555) 010-0300', 'Synthetic booth-rental inquiry.', '["Skincare"]', 'This record is safe to open, filter, and screenshot.', '@previewbooth', 'Preview Beauty Co.', 'Next month', 3, ${now} - 86400000);

PRAGMA foreign_keys=ON;
PRAGMA foreign_key_check;
`

writeFileSync(outputPath, sql, { mode: 0o600 })

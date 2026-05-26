-- Admin audit log: records every write performed via /admin/* and /dam/*.
-- See src/db/schema/admin_audit_log.ts for the full contract.

CREATE TABLE IF NOT EXISTS "admin_audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "actor_user_id" text,
  "surface" text NOT NULL,
  "action" text NOT NULL,
  "target_type" text,
  "target_id" text,
  "diff" jsonb,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "admin_audit_log_actor_user_id_user_id_fk"
    FOREIGN KEY ("actor_user_id") REFERENCES "user"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "admin_audit_log_actor_idx"
  ON "admin_audit_log" ("actor_user_id");

CREATE INDEX IF NOT EXISTS "admin_audit_log_surface_idx"
  ON "admin_audit_log" ("surface");

CREATE INDEX IF NOT EXISTS "admin_audit_log_action_idx"
  ON "admin_audit_log" ("action");

CREATE INDEX IF NOT EXISTS "admin_audit_log_target_idx"
  ON "admin_audit_log" ("target_type", "target_id");

CREATE INDEX IF NOT EXISTS "admin_audit_log_created_at_idx"
  ON "admin_audit_log" ("created_at");

/**
 * Manual Migration Script
 * Safely creates new tables for phone auth system
 */

import { getDb } from '../src/db'
import { sql } from 'drizzle-orm'

async function runMigration() {
  console.log('Starting migration...')
  const db = getDb()

  try {
    // Create user table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text PRIMARY KEY NOT NULL,
        "phone_number" text UNIQUE,
        "phone_number_verified" boolean DEFAULT false,
        "email" text UNIQUE,
        "email_verified" boolean DEFAULT false,
        "name" text,
        "image" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('✓ Created user table')

    // Create session table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "expires_at" timestamp NOT NULL,
        "token" text NOT NULL UNIQUE,
        "ip_address" text,
        "user_agent" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('✓ Created session table')

    // Create verification table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" text PRIMARY KEY NOT NULL,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `)
    console.log('✓ Created verification table')

    // Create profiles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
        "first_name" text,
        "last_name" text,
        "date_of_birth" date,
        "sms_marketing_opt_in" boolean DEFAULT false,
        "email_marketing_opt_in" boolean DEFAULT false,
        "preferred_location_id" uuid REFERENCES "business_locations"("id"),
        "preferred_team_member_id" uuid REFERENCES "team_members"("id"),
        "lash_type" text,
        "lash_curl" text,
        "lash_length" text,
        "allergies" text,
        "notes" text,
        "loyalty_points" integer DEFAULT 0,
        "tier" text DEFAULT 'standard',
        "profile_completion_percentage" integer DEFAULT 0,
        "onboarding_completed" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('✓ Created profiles table')

    // Create friend_booking_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "friend_booking_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "requester_user_id" text NOT NULL REFERENCES "user"("id"),
        "requester_phone" text NOT NULL,
        "friend_phone" text NOT NULL,
        "friend_user_id" text REFERENCES "user"("id"),
        "friend_name" text,
        "service_id" uuid REFERENCES "services"("id"),
        "team_member_id" uuid REFERENCES "team_members"("id"),
        "requested_date_time" timestamp,
        "status" text DEFAULT 'pending',
        "consent_token" text NOT NULL UNIQUE,
        "consent_token_expires_at" timestamp NOT NULL,
        "consented_at" timestamp,
        "declined_at" timestamp,
        "declined_reason" text,
        "appointment_id" uuid REFERENCES "appointments"("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('✓ Created friend_booking_requests table')

    // Create vagaro_sync_mappings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "vagaro_sync_mappings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text REFERENCES "user"("id") ON DELETE CASCADE,
        "profile_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
        "vagaro_customer_id" text NOT NULL UNIQUE,
        "vagaro_business_ids" text[] DEFAULT '{}',
        "sync_status" text DEFAULT 'active',
        "last_synced_at" timestamp,
        "sync_direction" text DEFAULT 'bidirectional',
        "conflict_resolution_strategy" text DEFAULT 'vagaro_wins',
        "last_conflict_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('✓ Created vagaro_sync_mappings table')

    // Add new columns to appointments table
    await db.execute(sql`
      ALTER TABLE "appointments"
      ADD COLUMN IF NOT EXISTS "user_id" text,
      ADD COLUMN IF NOT EXISTS "booked_by_user_id" text,
      ADD COLUMN IF NOT EXISTS "is_friend_booking" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "friend_booking_request_id" uuid;
    `)
    console.log('✓ Added new columns to appointments table')

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

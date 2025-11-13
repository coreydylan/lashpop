CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean DEFAULT false,
	"email" text,
	"email_verified" boolean DEFAULT false,
	"name" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friend_booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_user_id" text NOT NULL,
	"requester_phone" text NOT NULL,
	"friend_phone" text NOT NULL,
	"friend_user_id" text,
	"friend_name" text,
	"service_id" uuid,
	"team_member_id" uuid,
	"requested_date_time" timestamp,
	"status" text DEFAULT 'pending',
	"consent_token" text NOT NULL,
	"consent_token_expires_at" timestamp NOT NULL,
	"consented_at" timestamp,
	"declined_at" timestamp,
	"declined_reason" text,
	"appointment_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "friend_booking_requests_consent_token_unique" UNIQUE("consent_token")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"date_of_birth" date,
	"sms_marketing_opt_in" boolean DEFAULT false,
	"email_marketing_opt_in" boolean DEFAULT false,
	"preferred_location_id" uuid,
	"preferred_team_member_id" uuid,
	"lash_type" text,
	"lash_curl" text,
	"lash_length" text,
	"allergies" text,
	"notes" text,
	"loyalty_points" integer DEFAULT 0,
	"tier" text DEFAULT 'standard',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"onboarding_completed" boolean DEFAULT false,
	"profile_completion_percentage" integer DEFAULT 0,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vagaro_sync_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"profile_id" uuid,
	"vagaro_customer_id" text NOT NULL,
	"vagaro_business_ids" text[] DEFAULT '{}',
	"sync_status" text DEFAULT 'active',
	"last_synced_at" timestamp,
	"sync_direction" text DEFAULT 'bidirectional',
	"conflict_resolution_strategy" text DEFAULT 'vagaro_wins',
	"last_conflict_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vagaro_sync_mappings_vagaro_customer_id_unique" UNIQUE("vagaro_customer_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "booked_by_user_id" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "is_friend_booking" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "friend_booking_request_id" uuid;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_booking_requests" ADD CONSTRAINT "friend_booking_requests_requester_user_id_user_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_booking_requests" ADD CONSTRAINT "friend_booking_requests_friend_user_id_user_id_fk" FOREIGN KEY ("friend_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_booking_requests" ADD CONSTRAINT "friend_booking_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_booking_requests" ADD CONSTRAINT "friend_booking_requests_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_booking_requests" ADD CONSTRAINT "friend_booking_requests_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_preferred_location_id_business_locations_id_fk" FOREIGN KEY ("preferred_location_id") REFERENCES "public"."business_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_preferred_team_member_id_team_members_id_fk" FOREIGN KEY ("preferred_team_member_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vagaro_sync_mappings" ADD CONSTRAINT "vagaro_sync_mappings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vagaro_sync_mappings" ADD CONSTRAINT "vagaro_sync_mappings_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
CREATE TABLE "dam_user_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action_type" text NOT NULL,
	"action_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dam_user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dam_user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "dam_user_actions" ADD CONSTRAINT "dam_user_actions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dam_user_settings" ADD CONSTRAINT "dam_user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dam_user_actions_user_id_idx" ON "dam_user_actions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dam_user_actions_action_type_idx" ON "dam_user_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "dam_user_actions_created_at_idx" ON "dam_user_actions" USING btree ("created_at");
CREATE TABLE "team_member_categories" (
	"team_member_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "team_member_categories_team_member_id_category_id_pk" PRIMARY KEY("team_member_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "uses_lashpop_booking" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "team_member_categories" ADD CONSTRAINT "team_member_categories_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_categories" ADD CONSTRAINT "team_member_categories_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;
CREATE TYPE "public"."activity_target" AS ENUM('product', 'room', 'milestone', 'couple');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('product.added', 'product.purchased', 'product.received', 'product.cancelled', 'product.wishlisted', 'room.created', 'milestone.unlocked', 'partner.joined');--> statement-breakpoint
CREATE TYPE "public"."milestone_type" AS ENUM('items_10', 'items_25', 'items_50', 'items_100', 'first_purchased', 'first_received', 'room_50_percent', 'room_100_percent', 'partner_joined');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('product.added', 'product.purchased', 'product.received', 'milestone.unlocked', 'partner.joined');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" uuid NOT NULL,
	"actor_user_id" text NOT NULL,
	"type" "activity_type" NOT NULL,
	"target_type" "activity_target" NOT NULL,
	"target_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couple_preferences" (
	"user_id" text NOT NULL,
	"couple_id" uuid NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"notify_on_partner_add" boolean DEFAULT true NOT NULL,
	"notify_on_status_change" boolean DEFAULT true NOT NULL,
	"notify_on_milestone" boolean DEFAULT true NOT NULL,
	"detect_links_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "couple_preferences_user_id_couple_id_pk" PRIMARY KEY("user_id","couple_id")
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" uuid NOT NULL,
	"type" "milestone_type" NOT NULL,
	"scope_id" text DEFAULT '' NOT NULL,
	"metadata" jsonb,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"couple_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_preferences" ADD CONSTRAINT "couple_preferences_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_couple_created_idx" ON "activity_events" USING btree ("couple_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "milestones_couple_type_scope_idx" ON "milestones" USING btree ("couple_id","type","scope_id");--> statement-breakpoint
CREATE INDEX "milestones_couple_unlocked_idx" ON "milestones" USING btree ("couple_id","unlocked_at");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at");
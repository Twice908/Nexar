CREATE TYPE "public"."trip_member_role" AS ENUM('driver', 'rider');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('REQUESTED', 'MATCHED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "trip_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "trip_member_role" NOT NULL,
	"pickup_order" integer,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_date" date NOT NULL,
	"residential_cluster_id" uuid NOT NULL,
	"workspace_cluster_id" uuid NOT NULL,
	"office_building" text NOT NULL,
	"driver_id" uuid NOT NULL,
	"entry_bucket" text NOT NULL,
	"pickup_point_label" text,
	"drop_point_label" text,
	"status" "trip_status" DEFAULT 'MATCHED' NOT NULL,
	"cost_per_head" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_residential_cluster_id_clusters_id_fk" FOREIGN KEY ("residential_cluster_id") REFERENCES "public"."clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_workspace_cluster_id_clusters_id_fk" FOREIGN KEY ("workspace_cluster_id") REFERENCES "public"."clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
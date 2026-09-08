CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'non_binary', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."role_preference" AS ENUM('car_owner', 'both');--> statement-breakpoint
CREATE TABLE "cluster_pairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"residential_cluster_id" uuid NOT NULL,
	"workspace_cluster_id" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commute_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"residential_cluster_id" uuid NOT NULL,
	"workspace_cluster_id" uuid NOT NULL,
	"commute_days" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commute_requests_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text NOT NULL,
	"gender" "gender" NOT NULL,
	"home_zone_label" text NOT NULL,
	"home_zone_latitude" numeric(9, 6) NOT NULL,
	"home_zone_longitude" numeric(9, 6) NOT NULL,
	"office_building" text NOT NULL,
	"office_entry_window" text NOT NULL,
	"role_preference" "role_preference" DEFAULT 'car_owner' NOT NULL,
	"profile_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"model" text NOT NULL,
	"plate_number" text NOT NULL,
	"seats_available" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "cluster_pairs" ADD CONSTRAINT "cluster_pairs_residential_cluster_id_clusters_id_fk" FOREIGN KEY ("residential_cluster_id") REFERENCES "public"."clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cluster_pairs" ADD CONSTRAINT "cluster_pairs_workspace_cluster_id_clusters_id_fk" FOREIGN KEY ("workspace_cluster_id") REFERENCES "public"."clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commute_requests" ADD CONSTRAINT "commute_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
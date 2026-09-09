ALTER TYPE "public"."role_preference" ADD VALUE 'driver' BEFORE 'car_owner';--> statement-breakpoint
ALTER TYPE "public"."role_preference" ADD VALUE 'passenger' BEFORE 'car_owner';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role_preference" SET DEFAULT 'both';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image_url" text;
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(63) NOT NULL,
  "display_name" varchar(120) NOT NULL,
  "timezone" varchar(64) DEFAULT 'America/Sao_Paulo' NOT NULL,
  "primary_color" varchar(7) DEFAULT '#2563eb' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);

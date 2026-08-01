-- Enable required extensions (btree_gist may not be available on managed PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Enum types
CREATE TYPE user_role AS ENUM ('owner', 'staff', 'superadmin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_mode AS ENUM ('none', 'deposit', 'full');
CREATE TYPE payment_type AS ENUM ('deposit', 'balance', 'refund', 'no_show_fee');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE domain_status AS ENUM ('pending', 'verified', 'failed');
CREATE TYPE notification_channel AS ENUM ('email', 'sms');

-- Users table
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" citext UNIQUE NOT NULL,
  "name" varchar(255) NOT NULL,
  "image" text,
  "email_verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_users_created_at" ON "users" ("created_at");

-- Sessions table
CREATE TABLE "sessions" (
  "id" text PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id");
CREATE INDEX "idx_sessions_expires_at" ON "sessions" ("expires_at");

-- Tenants table
CREATE TABLE "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(63) UNIQUE NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "timezone" varchar(63) DEFAULT 'America/New_York' NOT NULL,
  "currency" varchar(3) DEFAULT 'USD' NOT NULL,
  "address" text,
  "geo" jsonb,
  "phone" varchar(20),
  "categories" jsonb,
  "logo_url" text,
  "brand_color" varchar(7) DEFAULT '#000000',
  "stripe_account_id" varchar(255),
  "stripe_customer_id" varchar(255),
  "plan" varchar(63) DEFAULT 'FREE' NOT NULL,
  "trial_ends_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "idx_tenants_slug" ON "tenants" ("slug");
CREATE INDEX "idx_tenants_stripe_account_id" ON "tenants" ("stripe_account_id");
CREATE INDEX "idx_tenants_plan" ON "tenants" ("plan");

-- Memberships table
CREATE TABLE "memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "role" user_role NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "idx_memberships_user_tenant" ON "memberships" ("user_id", "tenant_id");
CREATE INDEX "idx_memberships_tenant_id" ON "memberships" ("tenant_id");

-- Sites table
CREATE TABLE "sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid UNIQUE NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "theme" varchar(63) DEFAULT 'modern' NOT NULL,
  "sections" jsonb,
  "seo" jsonb,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "idx_sites_tenant_id" ON "sites" ("tenant_id");
CREATE INDEX "idx_sites_published_at" ON "sites" ("published_at");

-- Domains table
CREATE TABLE "domains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "hostname" varchar(255) UNIQUE NOT NULL,
  "verification_token" varchar(255),
  "status" domain_status DEFAULT 'pending' NOT NULL,
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_domains_tenant_id" ON "domains" ("tenant_id");
CREATE INDEX "idx_domains_hostname" ON "domains" ("hostname");

-- Services table
CREATE TABLE "services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "duration_min" integer NOT NULL,
  "price_cents" integer NOT NULL,
  "payment_mode" payment_mode DEFAULT 'deposit' NOT NULL,
  "deposit_cents" integer,
  "buffer_before_min" integer DEFAULT 0 NOT NULL,
  "buffer_after_min" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_services_tenant_id" ON "services" ("tenant_id");
CREATE INDEX "idx_services_active" ON "services" ("active");

-- Staff table
CREATE TABLE "staff" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users" ("id") ON DELETE SET NULL,
  "display_name" varchar(255) NOT NULL,
  "avatar_url" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_staff_tenant_id" ON "staff" ("tenant_id");
CREATE INDEX "idx_staff_user_id" ON "staff" ("user_id");

-- Staff services junction table
CREATE TABLE "staff_services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "staff_id" uuid NOT NULL REFERENCES "staff" ("id") ON DELETE CASCADE,
  "service_id" uuid NOT NULL REFERENCES "services" ("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "idx_staff_services_unique" ON "staff_services" ("staff_id", "service_id");
CREATE INDEX "idx_staff_services_service_id" ON "staff_services" ("service_id");

-- Availability rules
CREATE TABLE "availability_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "staff_id" uuid NOT NULL REFERENCES "staff" ("id") ON DELETE CASCADE,
  "weekday" integer NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_availability_rules_tenant_id" ON "availability_rules" ("tenant_id");
CREATE INDEX "idx_availability_rules_staff_id" ON "availability_rules" ("staff_id");

-- Availability overrides
CREATE TABLE "availability_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "staff_id" uuid NOT NULL REFERENCES "staff" ("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "closed" boolean DEFAULT false NOT NULL,
  "start_time" time,
  "end_time" time,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_availability_overrides_tenant_id" ON "availability_overrides" ("tenant_id");
CREATE UNIQUE INDEX "idx_availability_overrides_unique" ON "availability_overrides" ("staff_id", "date");

-- Customers table
CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "email" citext NOT NULL,
  "name" varchar(255) NOT NULL,
  "phone" varchar(20),
  "notes" text,
  "marketing_opt_in" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_customers_tenant_id" ON "customers" ("tenant_id");
CREATE UNIQUE INDEX "idx_customers_tenant_email" ON "customers" ("tenant_id", "email");

-- Bookings table
CREATE TABLE "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "service_id" uuid NOT NULL REFERENCES "services" ("id") ON DELETE RESTRICT,
  "staff_id" uuid REFERENCES "staff" ("id") ON DELETE RESTRICT,
  "customer_id" uuid NOT NULL REFERENCES "customers" ("id") ON DELETE RESTRICT,
  "status" booking_status DEFAULT 'pending' NOT NULL,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone NOT NULL,
  "price_cents" integer NOT NULL,
  "deposit_cents" integer DEFAULT 0 NOT NULL,
  "no_show_fee_cents" integer DEFAULT 0 NOT NULL,
  "stripe_payment_intent_id" varchar(255),
  "stripe_setup_intent_id" varchar(255),
  "source" varchar(63) DEFAULT 'web' NOT NULL,
  "cancel_token" varchar(255),
  "cancelled_at" timestamp with time zone,
  "cancel_reason" text,
  "refunded_cents" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_bookings_tenant_id" ON "bookings" ("tenant_id");
CREATE INDEX "idx_bookings_customer_id" ON "bookings" ("customer_id");
CREATE INDEX "idx_bookings_service_id" ON "bookings" ("service_id");
CREATE INDEX "idx_bookings_staff_id" ON "bookings" ("staff_id");
CREATE INDEX "idx_bookings_status" ON "bookings" ("status");
CREATE INDEX "idx_bookings_created_at" ON "bookings" ("created_at");
CREATE INDEX "idx_bookings_staff_time" ON "bookings" ("staff_id", "start_time", "end_time");

-- Payments table
CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "booking_id" uuid REFERENCES "bookings" ("id") ON DELETE SET NULL,
  "type" payment_type NOT NULL,
  "amount_cents" integer NOT NULL,
  "status" payment_status DEFAULT 'pending' NOT NULL,
  "stripe_payment_intent_id" varchar(255),
  "stripe_charge_id" varchar(255),
  "stripe_refund_id" varchar(255),
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_payments_tenant_id" ON "payments" ("tenant_id");
CREATE INDEX "idx_payments_booking_id" ON "payments" ("booking_id");
CREATE INDEX "idx_payments_status" ON "payments" ("status");

-- Webhook events
CREATE TABLE "webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" varchar(63) NOT NULL,
  "event_id" varchar(255) NOT NULL,
  "payload" jsonb NOT NULL,
  "processed_at" timestamp with time zone,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "idx_webhook_events_unique" ON "webhook_events" ("provider", "event_id");
CREATE INDEX "idx_webhook_events_processed_at" ON "webhook_events" ("processed_at");

-- Audit log
CREATE TABLE "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "actor_id" uuid REFERENCES "users" ("id") ON DELETE SET NULL,
  "action" varchar(255) NOT NULL,
  "target" varchar(255) NOT NULL,
  "changes" jsonb,
  "ip_address" varchar(45),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_audit_log_tenant_id" ON "audit_log" ("tenant_id");
CREATE INDEX "idx_audit_log_actor_id" ON "audit_log" ("actor_id");
CREATE INDEX "idx_audit_log_created_at" ON "audit_log" ("created_at");

-- Notifications log
CREATE TABLE "notifications_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "customer_id" uuid REFERENCES "customers" ("id") ON DELETE SET NULL,
  "booking_id" uuid REFERENCES "bookings" ("id") ON DELETE SET NULL,
  "channel" notification_channel NOT NULL,
  "template" varchar(255) NOT NULL,
  "recipient" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "status" varchar(63) DEFAULT 'sent' NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now(),
  "bounced_at" timestamp with time zone,
  "complained_at" timestamp with time zone,
  "clicked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_notifications_log_tenant_id" ON "notifications_log" ("tenant_id");
CREATE INDEX "idx_notifications_log_customer_id" ON "notifications_log" ("customer_id");
CREATE INDEX "idx_notifications_log_booking_id" ON "notifications_log" ("booking_id");

-- Review requests
CREATE TABLE "review_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "booking_id" uuid NOT NULL REFERENCES "bookings" ("id") ON DELETE CASCADE,
  "customer_id" uuid NOT NULL REFERENCES "customers" ("id") ON DELETE CASCADE,
  "channel" notification_channel NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now(),
  "clicked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_review_requests_tenant_id" ON "review_requests" ("tenant_id");
CREATE UNIQUE INDEX "idx_review_requests_unique" ON "review_requests" ("booking_id", "channel");

-- Subscriptions
CREATE TABLE "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid UNIQUE NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "stripe_customer_id" varchar(255) NOT NULL,
  "stripe_subscription_id" varchar(255) NOT NULL,
  "plan" varchar(63) NOT NULL,
  "status" varchar(63) NOT NULL,
  "current_period_end" timestamp with time zone NOT NULL,
  "cancel_at_period_end" boolean DEFAULT false NOT NULL,
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "idx_subscriptions_tenant_id" ON "subscriptions" ("tenant_id");
CREATE INDEX "idx_subscriptions_stripe_customer_id" ON "subscriptions" ("stripe_customer_id");

-- Feature flags
CREATE TABLE "feature_flags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) UNIQUE NOT NULL,
  "description" text,
  "enabled" boolean DEFAULT false NOT NULL,
  "rollout_percentage" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_feature_flags_enabled" ON "feature_flags" ("enabled");

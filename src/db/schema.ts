import {
  text,
  varchar,
  timestamp,
  uuid,
  uniqueIndex,
  index,
  jsonb,
  boolean,
  integer,
  pgTable,
  pgEnum,
  date,
  time,
  customType,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// ============================================================================
// Custom Types
// ============================================================================

const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
  toDriver(value) {
    return value;
  },
});

// ============================================================================
// Enums
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['owner', 'staff', 'superadmin']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]);
export const paymentModeEnum = pgEnum('payment_mode', ['none', 'deposit', 'full']);
export const paymentTypeEnum = pgEnum('payment_type', [
  'deposit',
  'balance',
  'refund',
  'no_show_fee',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed']);
export const domainStatusEnum = pgEnum('domain_status', ['pending', 'verified', 'failed']);
export const notificationChannelEnum = pgEnum('notification_channel', ['email', 'sms']);

// ============================================================================
// Core Tables
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: citext('email').notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    image: text('image'),
    emailVerified: boolean('email_verified').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_users_email').on(table.email),
    index('idx_users_created_at').on(table.createdAt),
  ]
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ]
);

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 63 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    timezone: varchar('timezone', { length: 63 }).default('America/New_York').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    address: text('address'),
    geo: jsonb('geo'), // { lat, lng }
    phone: varchar('phone', { length: 20 }),
    categories: jsonb('categories'), // array of category strings
    logoUrl: text('logo_url'),
    brandColor: varchar('brand_color', { length: 7 }).default('#000000'),
    stripeAccountId: varchar('stripe_account_id', { length: 255 }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    plan: varchar('plan', { length: 63 }).default('FREE').notNull(),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_tenants_slug').on(table.slug),
    index('idx_tenants_stripe_account_id').on(table.stripeAccountId),
    index('idx_tenants_plan').on(table.plan),
  ]
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_memberships_user_tenant').on(table.userId, table.tenantId),
    index('idx_memberships_tenant_id').on(table.tenantId),
  ]
);

// ============================================================================
// Site & Domain
// ============================================================================

export const sites = pgTable(
  'sites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    theme: varchar('theme', { length: 63 }).default('modern').notNull(),
    sections: jsonb('sections'), // Array of site sections (hero, services, about, etc.)
    seo: jsonb('seo'), // { title, description, keywords, ogImage }
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_sites_tenant_id').on(table.tenantId),
    index('idx_sites_published_at').on(table.publishedAt),
  ]
);

export const domains = pgTable(
  'domains',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    hostname: varchar('hostname', { length: 255 }).notNull().unique(),
    verificationToken: varchar('verification_token', { length: 255 }),
    status: domainStatusEnum('status').default('pending').notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_domains_tenant_id').on(table.tenantId),
    index('idx_domains_hostname').on(table.hostname),
  ]
);

// ============================================================================
// Services & Staff
// ============================================================================

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    durationMin: integer('duration_min').notNull(), // in minutes
    priceCents: integer('price_cents').notNull(), // in cents
    paymentMode: paymentModeEnum('payment_mode').default('deposit').notNull(),
    depositCents: integer('deposit_cents'), // only used if paymentMode is deposit
    bufferBeforeMin: integer('buffer_before_min').default(0).notNull(),
    bufferAfterMin: integer('buffer_after_min').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_services_tenant_id').on(table.tenantId),
    index('idx_services_active').on(table.active),
  ]
);

export const staff = pgTable(
  'staff',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_staff_tenant_id').on(table.tenantId),
    index('idx_staff_user_id').on(table.userId),
  ]
);

export const staffServices = pgTable(
  'staff_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_staff_services_unique').on(table.staffId, table.serviceId),
    index('idx_staff_services_service_id').on(table.serviceId),
  ]
);

// ============================================================================
// Availability
// ============================================================================

export const availabilityRules = pgTable(
  'availability_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    weekday: integer('weekday').notNull(), // 0=Sunday, 6=Saturday
    startTime: time('start_time').notNull(), // HH:MM in tenant's timezone
    endTime: time('end_time').notNull(), // HH:MM in tenant's timezone
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_availability_rules_tenant_id').on(table.tenantId),
    index('idx_availability_rules_staff_id').on(table.staffId),
  ]
);

export const availabilityOverrides = pgTable(
  'availability_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    closed: boolean('closed').default(false).notNull(),
    startTime: time('start_time'),
    endTime: time('end_time'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_availability_overrides_tenant_id').on(table.tenantId),
    uniqueIndex('idx_availability_overrides_unique').on(table.staffId, table.date),
  ]
);

// ============================================================================
// Customers & Bookings
// ============================================================================

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: citext('email').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    notes: text('notes'),
    marketingOptIn: boolean('marketing_opt_in').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_customers_tenant_id').on(table.tenantId),
    uniqueIndex('idx_customers_tenant_email').on(table.tenantId, table.email),
  ]
);

// Bookings table
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    status: bookingStatusEnum('status').default('pending').notNull(),
    // Store start and end times in UTC; slot math happens server-side with timezone conversion
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    priceCents: integer('price_cents').notNull(),
    depositCents: integer('deposit_cents').default(0).notNull(),
    noShowFeeCents: integer('no_show_fee_cents').default(0).notNull(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeSetupIntentId: varchar('stripe_setup_intent_id', { length: 255 }),
    source: varchar('source', { length: 63 }).default('web').notNull(),
    cancelToken: varchar('cancel_token', { length: 255 }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelReason: text('cancel_reason'),
    refundedCents: integer('refunded_cents').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_bookings_tenant_id').on(table.tenantId),
    index('idx_bookings_customer_id').on(table.customerId),
    index('idx_bookings_service_id').on(table.serviceId),
    index('idx_bookings_staff_id').on(table.staffId),
    index('idx_bookings_status').on(table.status),
    index('idx_bookings_created_at').on(table.createdAt),
  ]
);

// ============================================================================
// Payments
// ============================================================================

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    type: paymentTypeEnum('type').notNull(),
    amountCents: integer('amount_cents').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
    stripeRefundId: varchar('stripe_refund_id', { length: 255 }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_payments_tenant_id').on(table.tenantId),
    index('idx_payments_booking_id').on(table.bookingId),
    index('idx_payments_status').on(table.status),
  ]
);

// ============================================================================
// Webhooks & Audit
// ============================================================================

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: varchar('provider', { length: 63 }).notNull(), // stripe, inngest, etc.
    eventId: varchar('event_id', { length: 255 }).notNull(), // Stripe event_id, Inngest run_id, etc.
    payload: jsonb('payload').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_webhook_events_unique').on(table.provider, table.eventId),
    index('idx_webhook_events_processed_at').on(table.processedAt),
  ]
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 255 }).notNull(),
    target: varchar('target', { length: 255 }).notNull(), // e.g., "bookings:uuid"
    changes: jsonb('changes'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_log_tenant_id').on(table.tenantId),
    index('idx_audit_log_actor_id').on(table.actorId),
    index('idx_audit_log_created_at').on(table.createdAt),
  ]
);

// ============================================================================
// Notifications
// ============================================================================

export const notificationsLog = pgTable(
  'notifications_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    channel: notificationChannelEnum('channel').notNull(),
    template: varchar('template', { length: 255 }).notNull(),
    recipient: varchar('recipient', { length: 255 }).notNull(),
    body: text('body').notNull(),
    status: varchar('status', { length: 63 }).default('sent').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
    bouncedAt: timestamp('bounced_at', { withTimezone: true }),
    complainedAt: timestamp('complained_at', { withTimezone: true }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_notifications_log_tenant_id').on(table.tenantId),
    index('idx_notifications_log_customer_id').on(table.customerId),
    index('idx_notifications_log_booking_id').on(table.bookingId),
  ]
);

// ============================================================================
// Reviews
// ============================================================================

export const reviewRequests = pgTable(
  'review_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    channel: notificationChannelEnum('channel').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
    clickedAt: timestamp('clicked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_review_requests_tenant_id').on(table.tenantId),
    uniqueIndex('idx_review_requests_unique').on(table.bookingId, table.channel),
  ]
);

// ============================================================================
// Subscriptions (SaaS billing)
// ============================================================================

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull(),
    plan: varchar('plan', { length: 63 }).notNull(),
    status: varchar('status', { length: 63 }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_subscriptions_tenant_id').on(table.tenantId),
    index('idx_subscriptions_stripe_customer_id').on(table.stripeCustomerId),
  ]
);

// ============================================================================
// Feature Flags
// ============================================================================

export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
    enabled: boolean('enabled').default(false).notNull(),
    rolloutPercentage: integer('rollout_percentage').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_feature_flags_enabled').on(table.enabled)]
);

// ============================================================================
// Zod Schemas (auto-generated + custom)
// ============================================================================

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertTenantSchema = createInsertSchema(tenants);
export const selectTenantSchema = createSelectSchema(tenants);

export const insertServiceSchema = createInsertSchema(services);
export const selectServiceSchema = createSelectSchema(services);

export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);

export const insertCustomerSchema = createInsertSchema(customers);
export const selectCustomerSchema = createSelectSchema(customers);

export const insertStaffSchema = createInsertSchema(staff);
export const selectStaffSchema = createSelectSchema(staff);

export const insertAvailabilityRuleSchema = createInsertSchema(availabilityRules);
export const selectAvailabilityRuleSchema = createSelectSchema(availabilityRules);

export const insertAvailabilityOverrideSchema = createInsertSchema(availabilityOverrides);
export const selectAvailabilityOverrideSchema = createSelectSchema(availabilityOverrides);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

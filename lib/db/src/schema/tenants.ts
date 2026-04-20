import { pgTable, text, timestamp, pgEnum, integer, boolean, primaryKey, unique, varchar } from "drizzle-orm/pg-core";

export const planTypeEnum = pgEnum("plan_type", ["starter", "professional", "enterprise"]);
export const tenantStatusEnum = pgEnum("tenant_status", ["trial", "active", "suspended", "cancelled"]);

export const tenantsTable = pgTable("tenants", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull().default("متجر جديد"),
  nameEn: text("name_en").notNull().default("New Store"),
  slug: text("slug").notNull(),
  plan: planTypeEnum("plan").notNull().default("starter"),
  status: tenantStatusEnum("status").notNull().default("trial"),
  ownerClerkId: text("owner_clerk_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  needsOnboarding: boolean("needs_onboarding").notNull().default(true),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tenantMembersTable = pgTable("tenant_members", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  role: text("role").notNull().default("cashier"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("uniq_member").on(t.tenantId, t.clerkUserId),
]);

export const tenantSettingsTable = pgTable("tenant_settings", {
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.tenantId, t.key] }),
]);

export type Tenant = typeof tenantsTable.$inferSelect;
export type TenantMember = typeof tenantMembersTable.$inferSelect;

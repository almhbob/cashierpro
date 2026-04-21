import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const licenseTypeEnum = pgEnum("license_type", ["trial", "annual", "lifetime"]);

export const desktopLicensesTable = pgTable("desktop_licenses", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  machineId: text("machine_id"),
  storeName: text("store_name").notNull(),
  storePhone: text("store_phone"),
  type: licenseTypeEnum("type").notNull().default("trial"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  notes: text("notes"),
  isRevoked: boolean("is_revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by"),
});

export type DesktopLicense = typeof desktopLicensesTable.$inferSelect;

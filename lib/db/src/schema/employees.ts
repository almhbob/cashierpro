import { pgTable, text, timestamp, doublePrecision, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const employeeRoleEnum = pgEnum("employee_role", ["owner", "manager", "cashier", "accountant", "warehouse"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive", "suspended"]);

export const employeesTable = pgTable("employees", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull().default(""),
  role: employeeRoleEnum("role").notNull().default("cashier"),
  pin: text("pin"),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  salary: doublePrecision("salary"),
  salaryType: text("salary_type").notNull().default("monthly"),
  startDate: text("start_date"),
  nationalId: text("national_id").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: employeeStatusEnum("status").notNull().default("active"),
  canManageProducts: boolean("can_manage_products").notNull().default(false),
  canManageSales: boolean("can_manage_sales").notNull().default(true),
  canViewReports: boolean("can_view_reports").notNull().default(false),
  canManageEmployees: boolean("can_manage_employees").notNull().default(false),
  canManageSettings: boolean("can_manage_settings").notNull().default(false),
  canApplyDiscount: boolean("can_apply_discount").notNull().default(false),
  maxDiscountPercent: integer("max_discount_percent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Employee = typeof employeesTable.$inferSelect;
export type InsertEmployee = typeof employeesTable.$inferInsert;

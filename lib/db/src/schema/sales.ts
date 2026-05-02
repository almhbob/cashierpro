import { pgTable, text, serial, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id"),
  total: doublePrecision("total").notNull(),
  amountPaid: doublePrecision("amount_paid").notNull(),
  change: doublePrecision("change").notNull(),
  cashierName: text("cashier_name").notNull(),

  // ZATCA fields
  invoiceNumber: text("invoice_number"),
  vatAmount: doublePrecision("vat_amount"),
  zatcaQr: text("zatca_qr"),
  zatcaStatus: text("zatca_status").default("disabled"),
  invoiceHash: text("invoice_hash"),
  previousInvoiceHash: text("previous_invoice_hash"),
  icv: integer("icv"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const saleItemsTable = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => salesTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  productName: text("product_name").notNull(),
  productNameAr: text("product_name_ar").notNull(),
  barcode: text("barcode").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
export type SaleItem = typeof saleItemsTable.$inferSelect;

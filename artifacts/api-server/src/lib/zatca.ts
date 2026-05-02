import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, tenantSettingsTable } from "@workspace/db";

export type ZatcaPhase = "phase1" | "phase2";
export type ZatcaInvoiceStatus = "disabled" | "generated" | "pending_reporting" | "reported" | "cleared" | "failed";

export interface ZatcaConfig {
  enabled: boolean;
  phase: ZatcaPhase;
  sellerName: string;
  vatRegistrationNumber: string;
  branchAddress?: string;
  taxInclusive: boolean;
  vatRate: number;
  environment: "sandbox" | "simulation" | "production";
}

const DEFAULT_CONFIG: ZatcaConfig = {
  enabled: false,
  phase: "phase1",
  sellerName: "",
  vatRegistrationNumber: "",
  taxInclusive: true,
  vatRate: 0.15,
  environment: "sandbox",
};

const SETTINGS_KEY = "zatca.config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeZatcaConfig(input: unknown): ZatcaConfig {
  if (!isRecord(input)) return DEFAULT_CONFIG;

  const phase = input.phase === "phase2" ? "phase2" : "phase1";
  const environment =
    input.environment === "production" || input.environment === "simulation" || input.environment === "sandbox"
      ? input.environment
      : "sandbox";

  const rawVatRate = typeof input.vatRate === "number" ? input.vatRate : DEFAULT_CONFIG.vatRate;

  return {
    enabled: input.enabled === true,
    phase,
    sellerName: typeof input.sellerName === "string" ? input.sellerName.trim() : "",
    vatRegistrationNumber:
      typeof input.vatRegistrationNumber === "string" ? input.vatRegistrationNumber.trim() : "",
    branchAddress: typeof input.branchAddress === "string" ? input.branchAddress.trim() : undefined,
    taxInclusive: input.taxInclusive !== false,
    vatRate: rawVatRate > 0 && rawVatRate < 1 ? rawVatRate : DEFAULT_CONFIG.vatRate,
    environment,
  };
}

export function validateZatcaConfig(config: ZatcaConfig): string[] {
  const errors: string[] = [];

  if (config.enabled) {
    if (!config.sellerName) errors.push("اسم البائع مطلوب لتفعيل الفوترة الإلكترونية.");
    if (!/^3\d{13}3$/.test(config.vatRegistrationNumber)) {
      errors.push("الرقم الضريبي السعودي يجب أن يتكون من 15 رقمًا ويبدأ بـ 3 وينتهي بـ 3.");
    }
  }

  return errors;
}

export async function getZatcaConfig(tenantId: string): Promise<ZatcaConfig> {
  const [row] = await db
    .select({ value: tenantSettingsTable.value })
    .from(tenantSettingsTable)
    .where(and(eq(tenantSettingsTable.tenantId, tenantId), eq(tenantSettingsTable.key, SETTINGS_KEY)));

  if (!row) return DEFAULT_CONFIG;

  try {
    return normalizeZatcaConfig(JSON.parse(row.value));
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveZatcaConfig(tenantId: string, config: ZatcaConfig): Promise<void> {
  await db
    .insert(tenantSettingsTable)
    .values({ tenantId, key: SETTINGS_KEY, value: JSON.stringify(config) })
    .onConflictDoUpdate({
      target: [tenantSettingsTable.tenantId, tenantSettingsTable.key],
      set: { value: JSON.stringify(config), updatedAt: new Date() },
    });
}

export function calculateVatFromTotal(total: number, vatRate = 0.15, taxInclusive = true): number {
  if (total <= 0) return 0;
  const vat = taxInclusive ? total - total / (1 + vatRate) : total * vatRate;
  return Number(vat.toFixed(2));
}

function tlv(tag: number, value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length > 255) {
    throw new Error(`ZATCA TLV value for tag ${tag} exceeds 255 bytes.`);
  }
  return Buffer.concat([Buffer.from([tag, bytes.length]), bytes]);
}

export function createPhase1QrCode(params: {
  sellerName: string;
  vatRegistrationNumber: string;
  timestamp: Date;
  invoiceTotal: number;
  vatAmount: number;
}): string {
  return Buffer.concat([
    tlv(1, params.sellerName),
    tlv(2, params.vatRegistrationNumber),
    tlv(3, params.timestamp.toISOString()),
    tlv(4, params.invoiceTotal.toFixed(2)),
    tlv(5, params.vatAmount.toFixed(2)),
  ]).toString("base64");
}

export function createInvoiceHash(input: {
  tenantId: string;
  saleId: number;
  invoiceNumber: string;
  total: number;
  vatAmount: number;
  previousInvoiceHash?: string | null;
  createdAt: Date;
}): string {
  return createHash("sha256")
    .update(JSON.stringify({ ...input, uuid: randomUUID() }))
    .digest("base64");
}

export function nextInvoiceCounter(lastIcv: number | null | undefined): number {
  return Number.isFinite(lastIcv) && Number(lastIcv) > 0 ? Number(lastIcv) + 1 : 1;
}

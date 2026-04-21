import { Router } from "express";
import { db } from "@workspace/db";
import { tenantsTable, tenantMembersTable, tenantSettingsTable, desktopLicensesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { PLAN_LIMITS } from "../middleware/tenant";

const router = Router();

const DEFAULT_SETTINGS: Record<string, string> = {
  storeName: "متجري",
  storeNameEn: "My Store",
  address: "",
  phone: "",
  vatNumber: "",
  receiptHeader: "أهلاً وسهلاً بكم",
  receiptFooter: "شكراً لزيارتكم",
  currency: "SAR",
  vatRate: "15",
};

/* ── License key validation helper ───────────── */
async function validateLicenseKey(key: string): Promise<{ valid: boolean; reason?: string; license?: any }> {
  if (!key?.trim()) return { valid: false, reason: "no_key" };

  const [license] = await db
    .select()
    .from(desktopLicensesTable)
    .where(eq(desktopLicensesTable.key, key.trim().toUpperCase()))
    .limit(1);

  if (!license) return { valid: false, reason: "not_found" };
  if (license.isRevoked) return { valid: false, reason: "revoked" };
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) return { valid: false, reason: "expired" };

  // Check not already used for a cloud tenant
  if (license.machineId?.startsWith("CLOUD:")) return { valid: false, reason: "already_used" };

  return { valid: true, license };
}

/* GET /api/tenants/me */
router.get("/me", async (req, res) => {
  const tenantId = (req as any).tenantId;
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

  const members = await db.select().from(tenantMembersTable).where(eq(tenantMembersTable.tenantId, tenantId));
  const limits = PLAN_LIMITS[tenant.plan];
  const trialDaysLeft = tenant.trialEndsAt
    ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - Date.now()) / 86400000))
    : null;

  res.json({ ...tenant, memberCount: members.length, limits, trialDaysLeft });
});

/* PUT /api/tenants/me — update store info */
router.put("/me", async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { name, nameEn } = req.body ?? {};
  await db.update(tenantsTable)
    .set({ name, nameEn, needsOnboarding: false })
    .where(eq(tenantsTable.id, tenantId));
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  res.json(tenant);
});

/* POST /api/tenants/me/check-license — validate key before onboarding */
router.post("/me/check-license", async (req, res) => {
  const { licenseKey } = req.body ?? {};
  const result = await validateLicenseKey(licenseKey);

  if (!result.valid) {
    const messages: Record<string, string> = {
      no_key:       "يرجى إدخال مفتاح الترخيص",
      not_found:    "مفتاح الترخيص غير صحيح",
      revoked:      "تم إلغاء هذا الترخيص",
      expired:      "انتهت صلاحية هذا الترخيص",
      already_used: "هذا المفتاح مستخدم بالفعل لمتجر آخر",
    };
    res.status(400).json({ valid: false, reason: result.reason, message: messages[result.reason!] ?? "مفتاح غير صالح" });
    return;
  }

  res.json({ valid: true, storeName: result.license?.storeName, type: result.license?.type });
});

/* POST /api/tenants/me/complete-onboarding */
router.post("/me/complete-onboarding", async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { name, nameEn, phone, address, vatNumber, licenseKey } = req.body ?? {};

  // Validate license key before completing
  const licenseCheck = await validateLicenseKey(licenseKey);
  if (!licenseCheck.valid) {
    const messages: Record<string, string> = {
      no_key:       "يرجى إدخال مفتاح الترخيص",
      not_found:    "مفتاح الترخيص غير صحيح",
      revoked:      "تم إلغاء هذا الترخيص",
      expired:      "انتهت صلاحية هذا الترخيص",
      already_used: "هذا المفتاح مستخدم بالفعل لمتجر آخر",
    };
    res.status(400).json({
      error: messages[licenseCheck.reason!] ?? "مفتاح الترخيص غير صالح",
      reason: licenseCheck.reason,
    });
    return;
  }

  // Mark license as used by this cloud tenant
  await db.update(desktopLicensesTable)
    .set({ machineId: `CLOUD:${tenantId}`, activatedAt: new Date() })
    .where(eq(desktopLicensesTable.id, licenseCheck.license!.id));

  // Determine plan from license type
  const planMap: Record<string, string> = { trial: "starter", annual: "professional", lifetime: "enterprise" };
  const plan = planMap[licenseCheck.license!.type] ?? "starter";

  await db.update(tenantsTable)
    .set({ name, nameEn, needsOnboarding: false, plan: plan as any, status: "active" })
    .where(eq(tenantsTable.id, tenantId));

  const settingsToSave = [
    { key: "storeName",      value: name || "متجري" },
    { key: "storeNameEn",    value: nameEn || "My Store" },
    { key: "phone",          value: phone || "" },
    { key: "address",        value: address || "" },
    { key: "vatNumber",      value: vatNumber || "" },
    { key: "receiptHeader",  value: "أهلاً وسهلاً بكم" },
    { key: "receiptFooter",  value: "شكراً لزيارتكم" },
    { key: "currency",       value: "SAR" },
    { key: "vatRate",        value: "15" },
  ];

  for (const s of settingsToSave) {
    await db.insert(tenantSettingsTable).values({ tenantId, key: s.key, value: s.value })
      .onConflictDoUpdate({
        target: [tenantSettingsTable.tenantId, tenantSettingsTable.key],
        set: { value: s.value, updatedAt: new Date() },
      });
  }

  res.json({ success: true, plan });
});

/* GET /api/tenants/me/settings */
router.get("/me/settings", async (req, res) => {
  const tenantId = (req as any).tenantId;
  const rows = await db.select().from(tenantSettingsTable).where(eq(tenantSettingsTable.tenantId, tenantId));
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  res.json(map);
});

/* PUT /api/tenants/me/settings */
router.put("/me/settings", async (req, res) => {
  const tenantId = (req as any).tenantId;
  const data: Record<string, string> = req.body ?? {};
  for (const [key, value] of Object.entries(data)) {
    await db.insert(tenantSettingsTable).values({ tenantId, key, value })
      .onConflictDoUpdate({ target: [tenantSettingsTable.tenantId, tenantSettingsTable.key], set: { value, updatedAt: new Date() } });
  }
  res.json({ success: true });
});

/* GET /api/tenants/me/members */
router.get("/me/members", async (req, res) => {
  const tenantId = (req as any).tenantId;
  const members = await db.select().from(tenantMembersTable).where(eq(tenantMembersTable.tenantId, tenantId));
  res.json(members);
});

/* POST /api/tenants/me/upgrade — change plan */
router.post("/me/upgrade", async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { plan } = req.body ?? {};
  if (!["starter", "professional", "enterprise"].includes(plan)) {
    res.status(400).json({ error: "Invalid plan" }); return;
  }
  await db.update(tenantsTable).set({ plan, status: "active" }).where(eq(tenantsTable.id, tenantId));
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  res.json(tenant);
});

export default router;

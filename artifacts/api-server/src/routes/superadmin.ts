import { Router } from "express";
import { db } from "@workspace/db";
import {
  tenantsTable, tenantMembersTable, productsTable, salesTable, desktopLicensesTable,
} from "@workspace/db/schema";
import { eq, sql, desc, count } from "drizzle-orm";
import { generateLicenseKey, generateMachineToken, verifyMachineToken, isExpired, addDays } from "../lib/license";

const router = Router();

/* ─── Overview ──────────────────────────────────────────────── */
router.get("/overview", async (_req, res) => {
  try {
    const [totals] = await db.select({
      total:     count(),
      trial:     sql<number>`count(*) filter (where status = 'trial')`,
      active:    sql<number>`count(*) filter (where status = 'active')`,
      suspended: sql<number>`count(*) filter (where status = 'suspended')`,
      starter:      sql<number>`count(*) filter (where plan = 'starter')`,
      professional: sql<number>`count(*) filter (where plan = 'professional')`,
      enterprise:   sql<number>`count(*) filter (where plan = 'enterprise')`,
    }).from(tenantsTable);

    const [mrrRow] = await db.select({
      mrr: sql<number>`
        coalesce(sum(
          case plan
            when 'professional' then 99
            when 'enterprise'   then 299
            else 0
          end
        ) filter (where status = 'active'), 0)
      `,
    }).from(tenantsTable);

    const stores = await db.select({
      id:           tenantsTable.id,
      name:         tenantsTable.name,
      nameEn:       tenantsTable.nameEn,
      slug:         tenantsTable.slug,
      plan:         tenantsTable.plan,
      status:       tenantsTable.status,
      ownerClerkId: tenantsTable.ownerClerkId,
      needsOnboarding: tenantsTable.needsOnboarding,
      trialEndsAt:  tenantsTable.trialEndsAt,
      createdAt:    tenantsTable.createdAt,
      memberCount:  sql<number>`(select count(*) from tenant_members where tenant_id = tenants.id)`,
      productCount: sql<number>`(select count(*) from products where tenant_id = tenants.id)`,
      saleCount:    sql<number>`(select count(*) from sales    where tenant_id = tenants.id)`,
    })
    .from(tenantsTable)
    .orderBy(desc(tenantsTable.createdAt));

    res.json({ summary: { ...totals, mrr: Number(mrrRow?.mrr ?? 0) }, stores });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ─── Update plan / status ──────────────────────────────────── */
router.put("/stores/:id/plan", async (req, res) => {
  const { id } = req.params;
  const { plan, status } = req.body ?? {};
  await db.update(tenantsTable)
    .set({ ...(plan && { plan }), ...(status && { status }) })
    .where(eq(tenantsTable.id, id));
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id)).limit(1);
  res.json(tenant);
});

/* ─── Extend trial ──────────────────────────────────────────── */
router.post("/stores/:id/extend-trial", async (req, res) => {
  const { id } = req.params;
  const days = Number(req.body?.days ?? 14);
  const trialEndsAt = addDays(days);
  await db.update(tenantsTable).set({ status: "trial", trialEndsAt }).where(eq(tenantsTable.id, id));
  res.json({ ok: true, trialEndsAt });
});

/* ─── Delete store ──────────────────────────────────────────── */
router.delete("/stores/:id", async (req, res) => {
  const { id } = req.params;
  await db.delete(tenantsTable).where(eq(tenantsTable.id, id));
  res.json({ ok: true });
});

/* ─── Data isolation check ──────────────────────────────────── */
router.get("/isolation-check", async (_req, res) => {
  try {
    const stores = await db.select({ id: tenantsTable.id, name: tenantsTable.name }).from(tenantsTable);

    const report = await Promise.all(stores.map(async (store) => {
      const [{ products }] = await db.select({ products: count() }).from(productsTable).where(eq(productsTable.tenantId, store.id));
      const [{ sales }] = await db.select({ sales: count() }).from(salesTable).where(eq(salesTable.tenantId, store.id));
      return { storeId: store.id, storeName: store.name, products, sales, status: "ok" };
    }));

    const [{ orphanProducts }] = await db.select({ orphanProducts: sql<number>`count(*)` }).from(productsTable).where(sql`tenant_id IS NULL`);
    const [{ orphanSales }]    = await db.select({ orphanSales:    sql<number>`count(*)` }).from(salesTable).where(sql`tenant_id IS NULL`);

    res.json({
      stores: report,
      orphanProducts: Number(orphanProducts),
      orphanSales: Number(orphanSales),
      allIsolated: Number(orphanProducts) === 0 && Number(orphanSales) === 0,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ─── Desktop Licenses ──────────────────────────────────────── */
router.get("/licenses", async (_req, res) => {
  const licenses = await db.select().from(desktopLicensesTable).orderBy(desc(desktopLicensesTable.createdAt));
  res.json(licenses);
});

router.post("/licenses/generate", async (req, res) => {
  const { storeName, storePhone, type, days, notes, createdBy } = req.body ?? {};
  if (!storeName || !type) { res.status(400).json({ error: "storeName and type required" }); return; }

  const key = generateLicenseKey();
  let expiresAt: Date | null = null;
  if (type === "trial") expiresAt = addDays(days ?? 30);
  else if (type === "annual") expiresAt = addDays(365);

  const [license] = await db.insert(desktopLicensesTable).values({
    key, storeName, storePhone: storePhone ?? null, type, expiresAt,
    notes: notes ?? null, createdBy: createdBy ?? null,
  }).returning();

  res.json(license);
});

/* Used by Electron app on first run */
router.post("/licenses/activate", async (req, res) => {
  const { key, machineId } = req.body ?? {};
  if (!key || !machineId) { res.status(400).json({ error: "key and machineId required" }); return; }

  const [license] = await db.select().from(desktopLicensesTable)
    .where(eq(desktopLicensesTable.key, key.trim().toUpperCase())).limit(1);

  if (!license) { res.status(404).json({ valid: false, reason: "not_found" }); return; }
  if (license.isRevoked) { res.status(403).json({ valid: false, reason: "revoked" }); return; }
  if (license.machineId && license.machineId !== machineId) {
    res.status(403).json({ valid: false, reason: "wrong_machine" }); return;
  }
  if (isExpired(license.expiresAt)) { res.status(403).json({ valid: false, reason: "expired" }); return; }

  if (!license.machineId) {
    await db.update(desktopLicensesTable)
      .set({ machineId, activatedAt: new Date() })
      .where(eq(desktopLicensesTable.id, license.id));
  }

  const machineToken = generateMachineToken(machineId, license.id);
  res.json({
    valid: true, machineToken,
    license: { id: license.id, storeName: license.storeName, type: license.type, expiresAt: license.expiresAt },
  });
});

/* Offline verify after first activation */
router.post("/licenses/verify-token", async (req, res) => {
  const { licenseId, machineId, machineToken } = req.body ?? {};
  const [license] = await db.select().from(desktopLicensesTable)
    .where(eq(desktopLicensesTable.id, licenseId)).limit(1);

  if (!license || license.isRevoked) { res.status(403).json({ valid: false }); return; }
  if (isExpired(license.expiresAt)) { res.status(403).json({ valid: false, reason: "expired" }); return; }
  const ok = verifyMachineToken(machineId, licenseId, machineToken);
  res.json({ valid: ok });
});

router.patch("/licenses/:id/revoke", async (req, res) => {
  await db.update(desktopLicensesTable).set({ isRevoked: true }).where(eq(desktopLicensesTable.id, req.params.id));
  res.json({ ok: true });
});

router.patch("/licenses/:id/restore", async (req, res) => {
  await db.update(desktopLicensesTable).set({ isRevoked: false }).where(eq(desktopLicensesTable.id, req.params.id));
  res.json({ ok: true });
});

router.delete("/licenses/:id", async (req, res) => {
  await db.delete(desktopLicensesTable).where(eq(desktopLicensesTable.id, req.params.id));
  res.json({ ok: true });
});

export default router;

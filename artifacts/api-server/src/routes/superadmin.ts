import { Router } from "express";
import { db } from "@workspace/db";
import { tenantsTable, tenantMembersTable, productsTable, salesTable } from "@workspace/db/schema";
import { eq, sql, desc, count } from "drizzle-orm";
import { PLAN_LIMITS } from "../middleware/tenant";

const router = Router();

/* GET /api/superadmin/overview — platform-wide stats */
router.get("/overview", async (req, res) => {
  const [totals] = await db.select({
    total: count(),
    trial: sql<number>`count(*) filter (where status = 'trial')`,
    active: sql<number>`count(*) filter (where status = 'active')`,
    starter: sql<number>`count(*) filter (where plan = 'starter')`,
    professional: sql<number>`count(*) filter (where plan = 'professional')`,
    enterprise: sql<number>`count(*) filter (where plan = 'enterprise')`,
  }).from(tenantsTable);

  const mrrRow = await db.select({
    mrr: sql<number>`
      sum(
        case plan
          when 'professional' then 99
          when 'enterprise'   then 299
          else 0
        end
      ) filter (where status = 'active')
    `,
  }).from(tenantsTable);

  const stores = await db
    .select({
      id: tenantsTable.id,
      name: tenantsTable.name,
      nameEn: tenantsTable.nameEn,
      slug: tenantsTable.slug,
      plan: tenantsTable.plan,
      status: tenantsTable.status,
      ownerClerkId: tenantsTable.ownerClerkId,
      needsOnboarding: tenantsTable.needsOnboarding,
      trialEndsAt: tenantsTable.trialEndsAt,
      createdAt: tenantsTable.createdAt,
      memberCount: sql<number>`(
        select count(*) from tenant_members where tenant_id = tenants.id
      )`,
      productCount: sql<number>`(
        select count(*) from products where tenant_id = tenants.id
      )`,
      saleCount: sql<number>`(
        select count(*) from sales where tenant_id = tenants.id
      )`,
    })
    .from(tenantsTable)
    .orderBy(desc(tenantsTable.createdAt));

  res.json({
    summary: {
      ...totals,
      mrr: Number(mrrRow[0]?.mrr ?? 0),
    },
    stores,
  });
});

/* PUT /api/superadmin/stores/:id/plan */
router.put("/stores/:id/plan", async (req, res) => {
  const { id } = req.params;
  const { plan, status } = req.body ?? {};
  await db.update(tenantsTable)
    .set({ ...(plan && { plan }), ...(status && { status }) })
    .where(eq(tenantsTable.id, id));
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id)).limit(1);
  res.json(tenant);
});

export default router;

import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { tenantsTable, tenantMembersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export const PLAN_LIMITS = {
  starter:      { cashiers: 1,        products: 500,      price: 0   },
  professional: { cashiers: 5,        products: Infinity, price: 99  },
  enterprise:   { cashiers: Infinity, products: Infinity, price: 299 },
};

export async function getOrCreateTenant(clerkUserId: string) {
  const existing = await db
    .select({ tenantId: tenantMembersTable.tenantId })
    .from(tenantMembersTable)
    .where(eq(tenantMembersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0) {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, existing[0].tenantId))
      .limit(1);
    return tenant;
  }

  const slug = `store-${clerkUserId.slice(-8)}`;
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const [tenant] = await db
    .insert(tenantsTable)
    .values({
      name: "متجري",
      nameEn: "My Store",
      slug,
      ownerClerkId: clerkUserId,
      needsOnboarding: true,
      trialEndsAt,
    })
    .returning();

  await db.insert(tenantMembersTable).values({
    tenantId: tenant.id,
    clerkUserId,
    role: "owner",
  });

  return tenant;
}

export async function attachTenant(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  try {
    const tenant = await getOrCreateTenant(userId);
    (req as any).tenantId = tenant.id;
    (req as any).tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
}

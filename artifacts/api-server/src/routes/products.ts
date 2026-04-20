import { Router, type IRouter } from "express";
import { eq, ilike, or, and, count } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { tenantsTable } from "@workspace/db/schema";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductByBarcodeParams,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";
import { PLAN_LIMITS } from "../middleware/tenant";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  let results;
  if (query.data.search) {
    const term = `%${query.data.search}%`;
    results = await db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.tenantId, tenantId),
          or(
            ilike(productsTable.name, term),
            ilike(productsTable.nameAr, term),
            ilike(productsTable.barcode, term),
            ilike(productsTable.category, term)
          )
        )
      )
      .orderBy(productsTable.nameAr);
  } else {
    results = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.tenantId, tenantId))
      .orderBy(productsTable.nameAr);
  }

  res.json(results);
});

router.post("/products", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const tenant = (req as any).tenant as typeof tenantsTable.$inferSelect;

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const limits = PLAN_LIMITS[tenant.plan];
  if (limits.products !== Infinity) {
    const [{ count: cnt }] = await db
      .select({ count: count() })
      .from(productsTable)
      .where(eq(productsTable.tenantId, tenantId));
    if (Number(cnt) >= limits.products) {
      res.status(403).json({
        error: `الخطة الحالية تسمح بحد أقصى ${limits.products} منتج. يرجى الترقية إلى خطة أعلى.`,
        code: "PLAN_LIMIT_PRODUCTS",
      });
      return;
    }
  }

  const [product] = await db.insert(productsTable).values({ ...parsed.data, tenantId }).returning();
  res.status(201).json(product);
});

router.get("/products/barcode/:barcode", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const params = GetProductByBarcodeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.tenantId, tenantId), eq(productsTable.barcode, params.data.barcode)));

  if (!product) { res.status(404).json({ error: "المنتج غير موجود" }); return; }
  res.json(product);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.tenantId, tenantId), eq(productsTable.id, params.data.id)));

  if (!product) { res.status(404).json({ error: "المنتج غير موجود" }); return; }
  res.json(product);
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [product] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(and(eq(productsTable.tenantId, tenantId), eq(productsTable.id, params.data.id)))
    .returning();

  if (!product) { res.status(404).json({ error: "المنتج غير موجود" }); return; }
  res.json(product);
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [product] = await db
    .delete(productsTable)
    .where(and(eq(productsTable.tenantId, tenantId), eq(productsTable.id, params.data.id)))
    .returning();

  if (!product) { res.status(404).json({ error: "المنتج غير موجود" }); return; }
  res.sendStatus(204);
});

export default router;

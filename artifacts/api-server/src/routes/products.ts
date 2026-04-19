import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductByBarcodeParams,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let results;
  if (query.data.search) {
    const term = `%${query.data.search}%`;
    results = await db
      .select()
      .from(productsTable)
      .where(
        or(
          ilike(productsTable.name, term),
          ilike(productsTable.nameAr, term),
          ilike(productsTable.barcode, term),
          ilike(productsTable.category, term)
        )
      )
      .orderBy(productsTable.nameAr);
  } else {
    results = await db
      .select()
      .from(productsTable)
      .orderBy(productsTable.nameAr);
  }

  res.json(results);
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values(parsed.data).returning();
  res.status(201).json(product);
});

router.get("/products/barcode/:barcode", async (req, res): Promise<void> => {
  const params = GetProductByBarcodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.barcode, params.data.barcode));

  if (!product) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  res.json(product);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  res.json(product);
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  res.json(product);
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  res.sendStatus(204);
});

export default router;

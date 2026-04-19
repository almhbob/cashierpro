import { Router, type IRouter } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import { db, productsTable, saleItemsTable, salesTable } from "@workspace/db";
import {
  AdjustProductStockParams,
  AdjustProductStockBody,
  ReceiveProductStockParams,
  ReceiveProductStockBody,
  ReceiveBatchStockBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const LOW_STOCK_THRESHOLD = 20;
const DEAD_STOCK_DAYS = 30;
const FAST_MOVER_VELOCITY = 2; // units/day
const SLOW_MOVER_VELOCITY = 0.1; // units/day

async function buildProductInsights(productRows: typeof productsTable.$inferSelect[]) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get sales data for last 30 days per product
  const salesData = await db
    .select({
      productId: saleItemsTable.productId,
      totalSold: sql<number>`coalesce(sum(${saleItemsTable.quantity}), 0)::int`,
      totalRevenue: sql<number>`coalesce(sum(${saleItemsTable.subtotal}), 0)::float`,
      lastSoldAt: sql<string | null>`max(${salesTable.createdAt})::text`,
    })
    .from(saleItemsTable)
    .leftJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
    .where(sql`${salesTable.createdAt} >= ${thirtyDaysAgo}`)
    .groupBy(saleItemsTable.productId);

  const salesMap = new Map(salesData.map((s) => [s.productId, s]));

  return productRows.map((p) => {
    const sales = salesMap.get(p.id);
    const totalSoldLast30Days = sales?.totalSold ?? 0;
    const totalRevenueLast30Days = sales?.totalRevenue ?? 0;
    const lastSoldAt = sales?.lastSoldAt ?? null;
    const salesVelocityPerDay = totalSoldLast30Days / 30;
    const daysOfStockLeft =
      salesVelocityPerDay > 0 ? Math.floor(p.stock / salesVelocityPerDay) : null;
    const stockValue = p.stock * p.price;

    let status: "fast" | "normal" | "slow" | "dead" | "new";
    let recommendation: string;

    const daysSinceAdded =
      (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceAdded < 7) {
      status = "new";
      recommendation = "منتج جديد، انتظر أسبوعاً لتقييم حركته";
    } else if (salesVelocityPerDay >= FAST_MOVER_VELOCITY) {
      status = "fast";
      if (p.stock < LOW_STOCK_THRESHOLD) {
        recommendation = "يبيع بسرعة عالية والمخزون منخفض — اطلب كميات عاجلاً";
      } else {
        recommendation = "منتج رائج، حافظ على مخزون وفير";
      }
    } else if (salesVelocityPerDay >= SLOW_MOVER_VELOCITY) {
      status = "normal";
      recommendation = "حركة طبيعية، استمر بنفس الكمية";
    } else if (totalSoldLast30Days === 0) {
      status = "dead";
      if (daysSinceAdded > DEAD_STOCK_DAYS) {
        recommendation = "لا مبيعات خلال 30 يوماً — قلل الكمية أو راجع السعر";
      } else {
        recommendation = "لا مبيعات بعد — راقب الأسبوع القادم";
      }
    } else {
      status = "slow";
      recommendation = "حركة بطيئة — قلل الطلبات القادمة وراجع العرض";
    }

    return {
      id: p.id,
      barcode: p.barcode,
      name: p.name,
      nameAr: p.nameAr,
      price: p.price,
      stock: p.stock,
      category: p.category,
      unit: p.unit,
      totalSoldLast30Days,
      totalRevenueLast30Days,
      salesVelocityPerDay,
      daysOfStockLeft,
      status,
      stockValue,
      lastSoldAt,
      recommendation,
    };
  });
}

router.get("/inventory/insights", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.nameAr);
  const insights = await buildProductInsights(products);
  // Sort by salesVelocityPerDay descending
  insights.sort((a, b) => b.salesVelocityPerDay - a.salesVelocityPerDay);
  res.json(insights);
});

router.get("/inventory/low-stock", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.stock} <= ${LOW_STOCK_THRESHOLD}`)
    .orderBy(productsTable.stock);

  const insights = await buildProductInsights(products);
  res.json(insights);
});

router.get("/inventory/report", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.nameAr);
  const insights = await buildProductInsights(products);

  const totalStockValue = insights.reduce((sum, p) => sum + p.stockValue, 0);
  const outOfStock = insights.filter((p) => p.stock === 0).length;
  const lowStock = insights.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const fastMovers = insights.filter((p) => p.status === "fast").length;
  const slowMovers = insights.filter((p) => p.status === "slow").length;
  const deadStock = insights.filter((p) => p.status === "dead").length;

  res.json({
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalStockValue,
    outOfStock,
    lowStock,
    fastMovers,
    slowMovers,
    deadStock,
    products: insights,
  });
});

router.post("/products/:id/receive-stock", async (req, res): Promise<void> => {
  const params = ReceiveProductStockParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ReceiveProductStockBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({ stock: sql`${productsTable.stock} + ${body.data.quantity}` })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  res.json(product);
});

router.post("/inventory/receive-batch", async (req, res): Promise<void> => {
  const body = ReceiveBatchStockBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { items, supplierName, notes } = body.data;

  if (!items || items.length === 0) {
    res.status(400).json({ error: "لا توجد منتجات في قائمة الاستلام" });
    return;
  }

  const productIds = items.map((i) => i.productId);
  const products = await db
    .select()
    .from(productsTable)
    .where(inArray(productsTable.id, productIds));

  const productMap = new Map(products.map((p) => [p.id, p]));

  const resultItems = [];
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      res.status(404).json({ error: `المنتج برقم ${item.productId} غير موجود` });
      return;
    }

    const [updated] = await db
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} + ${item.quantity}` })
      .where(eq(productsTable.id, item.productId))
      .returning();

    resultItems.push({
      productId: product.id,
      productNameAr: product.nameAr,
      barcode: product.barcode,
      previousStock: product.stock,
      addedQuantity: item.quantity,
      newStock: updated.stock,
    });
  }

  res.json({
    receivedAt: new Date().toISOString(),
    supplierName: supplierName ?? null,
    notes: notes ?? null,
    totalItemsReceived: items.reduce((sum, i) => sum + i.quantity, 0),
    items: resultItems,
  });
});

router.post("/products/:id/adjust-stock", async (req, res): Promise<void> => {
  const params = AdjustProductStockParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AdjustProductStockBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({ stock: body.data.newStock })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  res.json(product);
});

export default router;

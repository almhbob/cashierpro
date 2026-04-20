import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, productsTable, salesTable, saleItemsTable } from "@workspace/db";
import {
  CreateSaleBody,
  GetSaleParams,
  ListSalesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sales", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const query = ListSalesQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? query.data.limit : 50;

  const results = await db
    .select()
    .from(salesTable)
    .where(eq(salesTable.tenantId, tenantId))
    .orderBy(desc(salesTable.createdAt))
    .limit(limit);

  res.json(results);
});

router.post("/sales", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { items, amountPaid, cashierName } = parsed.data;
  if (items.length === 0) { res.status(400).json({ error: "لا توجد منتجات في السلة" }); return; }

  const productIds = items.map((i) => i.productId);
  const products = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.tenantId, tenantId), sql`${productsTable.id} = ANY(${productIds})`));

  const productMap = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  const saleItemsData = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) { res.status(404).json({ error: `المنتج برقم ${item.productId} غير موجود` }); return; }
    const subtotal = product.price * item.quantity;
    total += subtotal;
    saleItemsData.push({
      productId: product.id,
      productName: product.name,
      productNameAr: product.nameAr,
      barcode: product.barcode,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal,
    });
  }

  const change = amountPaid - total;
  if (change < 0) { res.status(400).json({ error: "المبلغ المدفوع غير كافٍ" }); return; }

  const [sale] = await db
    .insert(salesTable)
    .values({ tenantId, total, amountPaid, change, cashierName })
    .returning();

  await db.insert(saleItemsTable).values(saleItemsData.map((item) => ({ saleId: sale.id, ...item })));

  for (const item of items) {
    await db
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
      .where(and(eq(productsTable.tenantId, tenantId), eq(productsTable.id, item.productId)));
  }

  res.status(201).json(sale);
});

router.get("/sales/stats/daily", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [stats] = await db
    .select({
      totalSales: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`coalesce(sum(${salesTable.total}), 0)::float`,
    })
    .from(salesTable)
    .where(and(eq(salesTable.tenantId, tenantId), sql`${salesTable.createdAt} >= ${today}`));

  const [itemStats] = await db
    .select({ totalItems: sql<number>`coalesce(sum(${saleItemsTable.quantity}), 0)::int` })
    .from(saleItemsTable)
    .leftJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
    .where(and(eq(salesTable.tenantId, tenantId), sql`${salesTable.createdAt} >= ${today}`));

  const totalSales = stats?.totalSales ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalItems = itemStats?.totalItems ?? 0;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  res.json({ totalSales, totalRevenue, totalItems, averageOrderValue });
});

router.get("/sales/trends", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const trends = await db
    .select({
      date: sql<string>`date(${salesTable.createdAt} AT TIME ZONE 'UTC')::text`,
      totalSales: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`coalesce(sum(${salesTable.total}), 0)::float`,
    })
    .from(salesTable)
    .where(and(eq(salesTable.tenantId, tenantId), sql`${salesTable.createdAt} >= ${thirtyDaysAgo}`))
    .groupBy(sql`date(${salesTable.createdAt} AT TIME ZONE 'UTC')`)
    .orderBy(sql`date(${salesTable.createdAt} AT TIME ZONE 'UTC')`);

  res.json(trends);
});

router.get("/sales/:id", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const params = GetSaleParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [sale] = await db
    .select()
    .from(salesTable)
    .where(and(eq(salesTable.tenantId, tenantId), eq(salesTable.id, params.data.id)));

  if (!sale) { res.status(404).json({ error: "الفاتورة غير موجودة" }); return; }

  const saleItems = await db.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, params.data.id));
  res.json({ ...sale, items: saleItems });
});

export default router;

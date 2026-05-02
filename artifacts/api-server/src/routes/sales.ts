import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, productsTable, salesTable, saleItemsTable } from "@workspace/db";
import {
  CreateSaleBody,
  GetSaleParams,
  ListSalesQueryParams,
} from "@workspace/api-zod";
import {
  getZatcaConfig,
  calculateVatFromTotal,
  createPhase1QrCode,
  createInvoiceHash,
  nextInvoiceCounter,
} from "../lib/zatca";

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

  // ZATCA logic
  const config = await getZatcaConfig(tenantId);

  if (config.enabled) {
    const vatAmount = calculateVatFromTotal(total, config.vatRate, config.taxInclusive);

    const [lastSale] = await db
      .select({ icv: salesTable.icv, invoiceHash: salesTable.invoiceHash })
      .from(salesTable)
      .where(eq(salesTable.tenantId, tenantId))
      .orderBy(desc(salesTable.createdAt))
      .limit(1);

    const icv = nextInvoiceCounter(lastSale?.icv);
    const invoiceNumber = `${tenantId}-${icv}`;

    const invoiceHash = createInvoiceHash({
      tenantId,
      saleId: sale.id,
      invoiceNumber,
      total,
      vatAmount,
      previousInvoiceHash: lastSale?.invoiceHash ?? null,
      createdAt: sale.createdAt,
    });

    const qr = createPhase1QrCode({
      sellerName: config.sellerName,
      vatRegistrationNumber: config.vatRegistrationNumber,
      timestamp: sale.createdAt,
      invoiceTotal: total,
      vatAmount,
    });

    await db
      .update(salesTable)
      .set({
        vatAmount,
        invoiceNumber,
        icv,
        invoiceHash,
        previousInvoiceHash: lastSale?.invoiceHash ?? null,
        zatcaQr: qr,
        zatcaStatus: config.phase === "phase2" ? "pending_reporting" : "generated",
      })
      .where(eq(salesTable.id, sale.id));
  }

  res.status(201).json(sale);
});

export default router;

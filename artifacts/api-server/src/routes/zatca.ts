import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import { db, salesTable, saleItemsTable } from "@workspace/db";
import {
  getZatcaConfig,
  normalizeZatcaConfig,
  saveZatcaConfig,
  validateZatcaConfig,
  calculateVatFromTotal,
} from "../lib/zatca";
import {
  loadPhase2Credentials,
  reportInvoiceToZatca,
  type Phase2InvoiceParams,
} from "../lib/zatca-phase2";

const router: IRouter = Router();

const ZatcaSettingsBody = z.object({
  enabled: z.boolean().optional(),
  phase: z.enum(["phase1", "phase2"]).optional(),
  sellerName: z.string().optional(),
  vatRegistrationNumber: z.string().optional(),
  branchAddress: z.string().optional(),
  taxInclusive: z.boolean().optional(),
  vatRate: z.number().optional(),
  environment: z.enum(["sandbox", "simulation", "production"]).optional(),
});

router.get("/zatca/settings", async (req, res): Promise<void> => {
  const tenantId = req.tenantId as string;
  const config = await getZatcaConfig(tenantId);
  const creds = loadPhase2Credentials();

  res.json({
    ...config,
    readiness: {
      phase1Ready: config.enabled && validateZatcaConfig(config).length === 0,
      phase2Ready: config.enabled && config.phase === "phase2" && creds !== null,
      phase2Reason: creds
        ? "Phase 2 جاهز — شهادة CSID موجودة في البيئة."
        : "Phase 2 يحتاج ZATCA_CSID و ZATCA_CSID_SECRET و ZATCA_PRIVATE_KEY و ZATCA_CERTIFICATE في متغيرات البيئة.",
    },
  });
});

router.put("/zatca/settings", async (req, res): Promise<void> => {
  const tenantId = req.tenantId as string;
  const parsed = ZatcaSettingsBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const current = await getZatcaConfig(tenantId);
  const config = normalizeZatcaConfig({ ...current, ...parsed.data });
  const errors = validateZatcaConfig(config);

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  await saveZatcaConfig(tenantId, config);

  res.json({
    ...config,
    message: config.enabled
      ? "تم تفعيل إعدادات الفوترة الإلكترونية للمتجر."
      : "تم إيقاف الفوترة الإلكترونية للمتجر.",
  });
});

router.post("/zatca/report/:saleId", async (req, res): Promise<void> => {
  const tenantId = req.tenantId as string;
  const saleId = Number(req.params.saleId);

  if (!Number.isFinite(saleId) || saleId <= 0) {
    res.status(400).json({ error: "معرّف الفاتورة غير صالح" });
    return;
  }

  // Load ZATCA config for this tenant
  const config = await getZatcaConfig(tenantId);
  if (!config.enabled) {
    res.status(400).json({ error: "الفوترة الإلكترونية غير مفعّلة لهذا المتجر" });
    return;
  }
  if (config.phase !== "phase2") {
    res.status(400).json({ error: "المتجر مضبوط على Phase 1 فقط — لا يوجد إبلاغ ZATCA" });
    return;
  }

  // Load Phase 2 credentials
  const credentials = loadPhase2Credentials();
  if (!credentials) {
    res.status(503).json({
      error: "Phase 2 غير مضبوط على الخادم",
      nextSteps: [
        "أضف ZATCA_CSID في متغيرات البيئة",
        "أضف ZATCA_CSID_SECRET في متغيرات البيئة",
        "أضف ZATCA_PRIVATE_KEY (PEM مع \\n مُعوَّضة)",
        "أضف ZATCA_CERTIFICATE (Base64 بدون ترويسات PEM)",
        "اضبط ZATCA_ENVIRONMENT على sandbox أو simulation أو production",
      ],
    });
    return;
  }

  // Fetch the sale and its items
  const [sale] = await db
    .select()
    .from(salesTable)
    .where(and(eq(salesTable.id, saleId), eq(salesTable.tenantId, tenantId)));

  if (!sale) {
    res.status(404).json({ error: "الفاتورة غير موجودة" });
    return;
  }

  if (sale.zatcaStatus === "reported" || sale.zatcaStatus === "cleared") {
    res.json({
      message: "تم الإبلاغ عن هذه الفاتورة مسبقاً",
      zatcaStatus: sale.zatcaStatus,
      invoiceNumber: sale.invoiceNumber,
    });
    return;
  }

  if (!sale.invoiceNumber || !sale.icv) {
    res.status(400).json({ error: "الفاتورة لا تحتوي على بيانات ZATCA — يجب إنشاؤها بعد تفعيل Phase 2" });
    return;
  }

  const saleItems = await db
    .select()
    .from(saleItemsTable)
    .where(eq(saleItemsTable.saleId, saleId));

  if (saleItems.length === 0) {
    res.status(400).json({ error: "لا توجد بنود في الفاتورة" });
    return;
  }

  // Get previous invoice hash for chaining
  const [prevSale] = await db
    .select({ invoiceHash: salesTable.invoiceHash })
    .from(salesTable)
    .where(
      and(
        eq(salesTable.tenantId, tenantId),
        isNotNull(salesTable.invoiceHash),
      ),
    )
    .orderBy(desc(salesTable.icv))
    .limit(1);

  const vatAmount = sale.vatAmount ?? calculateVatFromTotal(sale.total, config.vatRate, config.taxInclusive);
  const taxableAmount = sale.total - vatAmount;

  const issueDateTime = new Date(sale.createdAt);
  const issueDate = issueDateTime.toISOString().slice(0, 10);
  const issueTime = issueDateTime.toISOString().slice(11, 19);

  const params: Phase2InvoiceParams = {
    invoiceNumber: sale.invoiceNumber,
    uuid: `${tenantId.slice(0, 8)}-${String(sale.icv).padStart(6, "0")}-${sale.id}`,
    issueDate,
    issueTime,
    sellerName: config.sellerName,
    vatRegistrationNumber: config.vatRegistrationNumber,
    branchAddress: config.branchAddress,
    lineItems: saleItems.map((item) => ({
      name: item.productNameAr || item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      vatRate: config.vatRate,
      vatAmount: calculateVatFromTotal(item.subtotal, config.vatRate, config.taxInclusive),
    })),
    taxableAmount,
    vatAmount,
    vatRate: config.vatRate,
    total: sale.total,
    icv: sale.icv,
    previousInvoiceHash: prevSale?.invoiceHash ?? null,
  };

  // Override credentials environment with tenant config
  const activeCredentials = { ...credentials, environment: config.environment };

  const result = await reportInvoiceToZatca(params, activeCredentials);

  // Update sale status in DB
  const newStatus = result.success ? "reported" : "failed";
  await db
    .update(salesTable)
    .set({ zatcaStatus: newStatus })
    .where(eq(salesTable.id, saleId));

  if (result.success) {
    res.json({
      success: true,
      message: "تم الإبلاغ عن الفاتورة لهيئة الزكاة والضريبة والجمارك بنجاح",
      invoiceNumber: sale.invoiceNumber,
      invoiceHash: result.invoiceHash,
      zatcaStatus: "reported",
      warnings: result.warnings,
    });
  } else {
    res.status(422).json({
      success: false,
      error: "فشل الإبلاغ عن الفاتورة",
      errors: result.errors,
      warnings: result.warnings,
      httpStatus: result.httpStatus,
    });
  }
});

export default router;

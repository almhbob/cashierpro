import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  getZatcaConfig,
  normalizeZatcaConfig,
  saveZatcaConfig,
  validateZatcaConfig,
} from "../lib/zatca";

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
  const tenantId = (req as any).tenantId as string;
  const config = await getZatcaConfig(tenantId);

  res.json({
    ...config,
    readiness: {
      phase1Ready: config.enabled && validateZatcaConfig(config).length === 0,
      phase2Ready: false,
      phase2Reason:
        "Phase 2 يحتاج Production CSID وشهادة توقيع وربط FATOORA API. لا يتم حفظ الأسرار داخل قاعدة البيانات أو GitHub.",
    },
  });
});

router.put("/zatca/settings", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
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

router.post("/zatca/report/:saleId", async (_req, res): Promise<void> => {
  res.status(501).json({
    error: "ZATCA Phase 2 reporting is not connected yet.",
    nextSteps: [
      "استخرج CSR و CSID من بوابة فاتورة.",
      "ضع ZATCA_CERTIFICATE و ZATCA_PRIVATE_KEY و ZATCA_API_BASE_URL في متغيرات البيئة فقط.",
      "فعّل مزود التوقيع XML UBL 2.1 قبل الإرسال الرسمي.",
    ],
  });
});

export default router;

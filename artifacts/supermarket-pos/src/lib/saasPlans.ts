export type SaaSPlanId = "starter" | "professional" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type CompanyStatus = "trial" | "active" | "past_due" | "suspended" | "cancelled";

export interface SaaSPlanFeature {
  key: string;
  ar: string;
  en: string;
  included: boolean;
}

export interface SaaSPlanLimits {
  companies: number;
  branches: number;
  users: number;
  products: number;
  invoicesPerMonth: number;
  storageGb: number;
  apiAccess: boolean;
  zatcaPhase1: boolean;
  zatcaPhase2: boolean;
}

export interface SaaSPlan {
  id: SaaSPlanId;
  arName: string;
  enName: string;
  descriptionAr: string;
  monthlyPriceSar: number;
  yearlyPriceSar: number;
  recommended?: boolean;
  limits: SaaSPlanLimits;
  features: SaaSPlanFeature[];
}

const commonFeatures: SaaSPlanFeature[] = [
  { key: "pos", ar: "نقطة بيع وفواتير", en: "POS and invoices", included: true },
  { key: "products", ar: "إدارة المنتجات والمخزون", en: "Products and inventory", included: true },
  { key: "reports", ar: "تقارير المبيعات", en: "Sales reports", included: true },
  { key: "pdf", ar: "طباعة وحفظ PDF", en: "Print and PDF", included: true },
  { key: "multi_country", ar: "دعم السعودية والوضع العالمي", en: "Saudi and global mode", included: true },
];

export const SAAS_PLANS: SaaSPlan[] = [
  {
    id: "starter",
    arName: "الأساسية",
    enName: "Starter",
    descriptionAr: "مناسبة للمتاجر الصغيرة والشركات التي تبدأ لأول مرة.",
    monthlyPriceSar: 49,
    yearlyPriceSar: 490,
    limits: {
      companies: 1,
      branches: 1,
      users: 3,
      products: 500,
      invoicesPerMonth: 1000,
      storageGb: 1,
      apiAccess: false,
      zatcaPhase1: true,
      zatcaPhase2: false,
    },
    features: [
      ...commonFeatures,
      { key: "support", ar: "دعم عادي", en: "Standard support", included: true },
      { key: "advanced_roles", ar: "صلاحيات متقدمة", en: "Advanced roles", included: false },
      { key: "api", ar: "API خارجي", en: "External API", included: false },
    ],
  },
  {
    id: "professional",
    arName: "الاحترافية",
    enName: "Professional",
    descriptionAr: "للشركات النامية التي تحتاج فروعًا ومستخدمين أكثر.",
    monthlyPriceSar: 149,
    yearlyPriceSar: 1490,
    recommended: true,
    limits: {
      companies: 1,
      branches: 5,
      users: 20,
      products: 10000,
      invoicesPerMonth: 20000,
      storageGb: 10,
      apiAccess: true,
      zatcaPhase1: true,
      zatcaPhase2: false,
    },
    features: [
      ...commonFeatures,
      { key: "branches", ar: "إدارة الفروع", en: "Branch management", included: true },
      { key: "advanced_roles", ar: "صلاحيات متقدمة", en: "Advanced roles", included: true },
      { key: "api", ar: "API خارجي", en: "External API", included: true },
      { key: "priority_support", ar: "دعم أولوية", en: "Priority support", included: true },
    ],
  },
  {
    id: "enterprise",
    arName: "الشركات",
    enName: "Enterprise",
    descriptionAr: "للشركات الكبيرة، الفروع المتعددة، والربط الحكومي المتقدم.",
    monthlyPriceSar: 399,
    yearlyPriceSar: 3990,
    limits: {
      companies: 1,
      branches: 50,
      users: 200,
      products: 100000,
      invoicesPerMonth: 250000,
      storageGb: 100,
      apiAccess: true,
      zatcaPhase1: true,
      zatcaPhase2: true,
    },
    features: [
      ...commonFeatures,
      { key: "enterprise_roles", ar: "صلاحيات مؤسسية", en: "Enterprise roles", included: true },
      { key: "zatca_phase2", ar: "جاهزية ZATCA Phase 2", en: "ZATCA Phase 2 readiness", included: true },
      { key: "sla", ar: "اتفاقية مستوى خدمة", en: "SLA", included: true },
      { key: "custom_domain", ar: "دومين مخصص", en: "Custom domain", included: true },
    ],
  },
];

export function getPlan(planId: SaaSPlanId) {
  return SAAS_PLANS.find((plan) => plan.id === planId) ?? SAAS_PLANS[0];
}

export function getPlanPrice(planId: SaaSPlanId, cycle: BillingCycle = "monthly") {
  const plan = getPlan(planId);
  return cycle === "yearly" ? plan.yearlyPriceSar : plan.monthlyPriceSar;
}

export function isUsageAllowed(planId: SaaSPlanId, usage: Partial<SaaSPlanLimits>) {
  const plan = getPlan(planId);
  return {
    branches: usage.branches === undefined || usage.branches <= plan.limits.branches,
    users: usage.users === undefined || usage.users <= plan.limits.users,
    products: usage.products === undefined || usage.products <= plan.limits.products,
    invoicesPerMonth: usage.invoicesPerMonth === undefined || usage.invoicesPerMonth <= plan.limits.invoicesPerMonth,
    storageGb: usage.storageGb === undefined || usage.storageGb <= plan.limits.storageGb,
  };
}

export function getUpgradeReason(planId: SaaSPlanId, usage: Partial<SaaSPlanLimits>) {
  const allowed = isUsageAllowed(planId, usage);
  const failed = Object.entries(allowed).find(([, ok]) => !ok);
  if (!failed) return null;
  const [key] = failed;
  const labels: Record<string, string> = {
    branches: "عدد الفروع تجاوز حد الباقة الحالية",
    users: "عدد المستخدمين تجاوز حد الباقة الحالية",
    products: "عدد المنتجات تجاوز حد الباقة الحالية",
    invoicesPerMonth: "عدد الفواتير الشهرية تجاوز حد الباقة الحالية",
    storageGb: "مساحة التخزين تجاوزت حد الباقة الحالية",
  };
  return labels[key] ?? "تحتاج إلى ترقية الباقة";
}

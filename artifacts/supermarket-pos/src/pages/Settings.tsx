import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { useTenant, PLAN_LABELS } from "@/context/TenantContext";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Settings2, Server, CreditCard, Store, Shield, Database,
  CheckCircle2, Zap, Star, Crown, Cpu, MemoryStick, Activity,
  RefreshCw, TrendingUp, Lock, Key, Clock, Globe, AlertCircle,
  ChevronRight, BarChart3, Package, Users, Headphones, Printer,
  FileText, Wifi, Info,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────
   TYPES
──────────────────────────────────────────────── */
interface ServerStats {
  server: { status: string; uptime: string; uptimeSec: number; nodeVersion: string; platform: string; arch: string };
  memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number; heapPercent: number };
  database: { status: string; latencyMs: number; provider: string };
  timestamp: string;
}
interface StoreSettings {
  storeName: string; storeNameEn: string; address: string; phone: string;
  vatNumber: string; receiptHeader: string; receiptFooter: string; currency: string; vatRate: string;
}

/* ────────────────────────────────────────────────
   PLAN DATA
──────────────────────────────────────────────── */
const SUB_PLANS = [
  {
    id: "starter",
    nameAr: "أساسي",
    nameEn: "Starter",
    price: 0,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: Zap,
    current: true,
    features: ["كاشير واحد", "حتى 500 منتج", "تقارير يومية أساسية", "دعم عبر البريد الإلكتروني"],
    limits: { cashiers: 1, products: 500 },
  },
  {
    id: "professional",
    nameAr: "محترف",
    nameEn: "Professional",
    price: 99,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/30",
    icon: Star,
    current: false,
    badge: "الأكثر شيوعاً",
    features: ["حتى 5 كاشيرين", "منتجات غير محدودة", "تحليلات متقدمة", "تنبيهات المخزون", "دعم ذو أولوية"],
    limits: { cashiers: 5, products: -1 },
  },
  {
    id: "enterprise",
    nameAr: "متميز",
    nameEn: "Enterprise",
    price: 299,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Crown,
    current: false,
    features: ["كاشيرين غير محدودين", "فروع متعددة", "API مخصص", "تكاملات متقدمة", "مدير حساب مخصص", "دعم هاتفي 24/7"],
    limits: { cashiers: -1, products: -1 },
  },
];

const SERVER_PLANS = [
  {
    id: "shared",
    nameAr: "مشترك",
    nameEn: "Shared",
    price: 0,
    current: true,
    icon: Server,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    specs: { cpu: "0.5 vCPU", ram: "512 MB", storage: "10 GB SSD", bandwidth: "100 GB/شهر" },
  },
  {
    id: "vps",
    nameAr: "VPS أساسي",
    nameEn: "Basic VPS",
    price: 79,
    current: false,
    icon: Server,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    specs: { cpu: "2 vCPU", ram: "4 GB", storage: "50 GB NVMe", bandwidth: "500 GB/شهر" },
  },
  {
    id: "vps-plus",
    nameAr: "VPS متقدم",
    nameEn: "Advanced VPS",
    price: 199,
    current: false,
    badge: "موصى به",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/30",
    specs: { cpu: "4 vCPU", ram: "8 GB", storage: "100 GB NVMe", bandwidth: "2 TB/شهر" },
  },
  {
    id: "dedicated",
    nameAr: "خادم مخصص",
    nameEn: "Dedicated",
    price: 699,
    current: false,
    icon: Crown,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    specs: { cpu: "16 Core", ram: "64 GB", storage: "1 TB NVMe", bandwidth: "غير محدود" },
  },
];

/* ────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────── */
function StatusDot({ status }: { status: string }) {
  const color = status === "online" ? "bg-green-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500";
  return <span className={cn("inline-block w-2 h-2 rounded-full animate-pulse", color)} />;
}

function MiniGauge({ value, label, color = "bg-primary" }: { value: number; label: string; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={cn("h-2 rounded-full transition-all", color, value > 80 ? "bg-red-500" : value > 60 ? "bg-amber-500" : "bg-green-500")} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────── */
export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { tenant, refetch: refetchTenant } = useTenant();

  /* ── Server Stats ── */
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isFetching } = useQuery<ServerStats>({
    queryKey: ["admin", "server-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/server-stats");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  /* ── Store Settings ── */
  const { data: settings, isLoading: settingsLoading } = useQuery<StoreSettings>({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [form, setForm] = useState<Partial<StoreSettings>>({});
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<StoreSettings>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast({ title: t("settings.saved") });
    },
    onError: () => toast({ title: t("common.error"), variant: "destructive" }),
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await fetch("/api/tenants/me/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      refetchTenant();
      toast({ title: "تم تفعيل الخطة بنجاح" });
    },
  });

  const currentPlan = tenant?.plan ?? "starter";
  const currentPlanLabel = PLAN_LABELS[currentPlan];

  const isRtl = i18n.language === "ar";

  /* ── PWA Install ── */
  const { isInstallable, isInstalled, install } = usePwaInstall();

  /* ── Printer Settings (localStorage) ── */
  const [printerSize, setPrinterSize] = useState<string>(() => localStorage.getItem("printerSize") || "80mm");
  const [printerType, setPrinterType] = useState<string>(() => localStorage.getItem("printerType") || "thermal");
  const [autoPrint, setAutoPrint] = useState<boolean>(() => localStorage.getItem("autoPrint") === "true");
  const [showLogo, setShowLogo] = useState<boolean>(() => localStorage.getItem("showLogo") !== "false");

  const savePrinterSettings = () => {
    localStorage.setItem("printerSize", printerSize);
    localStorage.setItem("printerType", printerType);
    localStorage.setItem("autoPrint", String(autoPrint));
    localStorage.setItem("showLogo", String(showLogo));
    toast({ title: t("printer.saved") });
  };

  const testPrint = () => {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    const paperWidth = printerSize === "58mm" ? "58mm" : printerSize === "a4" ? "210mm" : "80mm";
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>
      @page { size: ${paperWidth} auto; margin: 4mm; }
      body { font-family: 'Courier New', monospace; font-size: ${printerSize === "a4" ? "12pt" : "10pt"}; width: ${paperWidth}; margin: 0; }
      .center { text-align: center; } .bold { font-weight: bold; } .line { border-top: 1px dashed #000; margin: 4px 0; }
      .row { display: flex; justify-content: space-between; }
    </style></head><body>
      <div class="center bold" style="font-size:1.2em;">فاتورة تجريبية</div>
      <div class="center" style="font-size:0.8em;">TEST RECEIPT</div>
      <div class="line"></div>
      <div class="row"><span>منتج تجريبي</span><span>1x 25.00</span></div>
      <div class="row"><span>منتج آخر</span><span>2x 10.00</span></div>
      <div class="line"></div>
      <div class="row bold"><span>الإجمالي</span><span>45.00 ر.س</span></div>
      <div class="row" style="font-size:0.85em;"><span>الضريبة 15%</span><span>5.87 ر.س</span></div>
      <div class="line"></div>
      <div class="center" style="font-size:0.75em;margin-top:6px;">شكراً لزيارتكم</div>
      <div class="center" style="font-size:0.7em;">حجم الورق: ${printerSize} | ${new Date().toLocaleString("ar-SA")}</div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Settings2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" /> {t("settings.tabSubscription")}
          </TabsTrigger>
          <TabsTrigger value="server" className="gap-2">
            <Server className="h-4 w-4" /> {t("settings.tabServer")}
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" /> {t("settings.tabStore")}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" /> {t("settings.tabSecurity")}
          </TabsTrigger>
          <TabsTrigger value="printer" className="gap-2">
            <Printer className="h-4 w-4" /> {t("settings.tabPrinter")}
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════
            TAB 1 – SUBSCRIPTION
        ══════════════════════════════════════════ */}
        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan Banner */}
          <Card className={cn("border-2", currentPlanLabel.bg)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", currentPlanLabel.bg)}>
                    <Crown className={cn("h-6 w-6", currentPlanLabel.color)} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("settings.currentPlan")}</p>
                    <p className={cn("text-2xl font-bold", currentPlanLabel.color)}>{currentPlanLabel.ar}</p>
                    {tenant?.status === "trial" && tenant.trialDaysLeft !== null && (
                      <p className="text-xs text-amber-600 mt-0.5">تجربة مجانية — {tenant.trialDaysLeft} يوم متبقي</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{tenant?.limits.cashiers === Infinity ? "∞" : (tenant?.limits.cashiers ?? 1)}</p>
                    <p className="text-muted-foreground">{t("settings.cashiers")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{tenant?.limits.products === Infinity ? "∞" : (tenant?.limits.products ?? 500)}</p>
                    <p className="text-muted-foreground">{t("settings.products")}</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-2xl font-bold", currentPlanLabel.color)}>
                      {(tenant?.limits.price ?? 0) === 0 ? "مجاني" : `${tenant?.limits.price} ر.س`}
                    </p>
                    <p className="text-muted-foreground">{t("settings.perMonth")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUB_PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = plan.id === currentPlan;
              return (
                <Card
                  key={plan.id}
                  className={cn("relative transition-shadow hover:shadow-lg", plan.border, isCurrent && "ring-2 ring-primary")}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-white shadow-md px-3 py-1">{plan.badge}</Badge>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="text-primary border-primary/50 text-xs">{t("settings.currentPlan")}</Badge>
                    </div>
                  )}
                  <CardHeader className={cn("rounded-t-lg", plan.bg)}>
                    <div className={cn("p-3 rounded-xl inline-block", plan.bg)}>
                      <Icon className={cn("h-6 w-6", plan.color)} />
                    </div>
                    <CardTitle className={plan.color}>
                      {isRtl ? plan.nameAr : plan.nameEn}
                    </CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-black">
                        {plan.price === 0 ? t("settings.free") : `${plan.price}`}
                      </span>
                      {plan.price > 0 && <span className="text-muted-foreground text-sm">ر.س/{t("settings.month")}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        {t("settings.activePlan")}
                      </Button>
                    ) : (
                      <Button
                        className={cn("w-full gap-2", plan.id === "enterprise" && "bg-amber-600 hover:bg-amber-700")}
                        onClick={() => toast({ title: t("settings.upgradeContact") })}
                      >
                        {t("settings.upgrade")} {isRtl ? plan.nameAr : plan.nameEn}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Feature Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> {t("settings.featureComparison")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ textAlign: "inherit" }}>
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 font-medium text-muted-foreground">{t("settings.feature")}</th>
                      <th className="py-2 text-center text-slate-600">{t("settings.planStarter")}</th>
                      <th className="py-2 text-center text-primary">{t("settings.planProfessional")}</th>
                      <th className="py-2 text-center text-amber-600">{t("settings.planEnterprise")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["عدد الكاشيرين", "1", "5", "∞"],
                      ["المنتجات", "500", "∞", "∞"],
                      ["التحليلات المتقدمة", "✗", "✓", "✓"],
                      ["فروع متعددة", "✗", "✗", "✓"],
                      ["API مخصص", "✗", "✗", "✓"],
                      ["الدعم", "بريد", "أولوية", "24/7 هاتف"],
                    ].map(([feat, s, p, e], i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 font-medium">{feat}</td>
                        <td className="py-2 text-center text-muted-foreground">{s}</td>
                        <td className="py-2 text-center font-medium text-primary">{p}</td>
                        <td className="py-2 text-center font-medium text-amber-600">{e}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════
            TAB 2 – SERVER
        ══════════════════════════════════════════ */}
        <TabsContent value="server" className="space-y-6">
          {/* Real-time stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Server Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" /> {t("settings.serverStatus")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statsLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-6 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                ) : stats ? (
                  <>
                    <div className="flex items-center gap-2">
                      <StatusDot status={stats.server.status} />
                      <span className="text-green-600 font-semibold capitalize">{stats.server.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t("settings.uptime")}: <span className="font-mono font-medium">{stats.server.uptime}</span></div>
                      <div className="flex items-center gap-1"><Globe className="h-3 w-3" /> Node {stats.server.nodeVersion}</div>
                      <div className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {stats.server.platform} / {stats.server.arch}</div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Memory */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <MemoryStick className="h-4 w-4" /> {t("settings.memory")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statsLoading ? <div className="animate-pulse space-y-2"><div className="h-6 bg-muted rounded" /><div className="h-6 bg-muted rounded" /></div> : stats ? (
                  <div className="space-y-3">
                    <MiniGauge value={stats.memory.heapPercent} label={`Heap: ${stats.memory.heapUsedMB}/${stats.memory.heapTotalMB} MB`} />
                    <div className="text-xs text-muted-foreground">
                      RSS (كامل العملية): <span className="font-mono font-medium">{stats.memory.rssMB} MB</span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Database */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Database className="h-4 w-4" /> {t("settings.database")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statsLoading ? <div className="animate-pulse space-y-2"><div className="h-6 bg-muted rounded w-1/2" /></div> : stats ? (
                  <>
                    <div className="flex items-center gap-2">
                      <StatusDot status={stats.database.status} />
                      <span className={cn("font-semibold capitalize", stats.database.status === "online" ? "text-green-600" : "text-amber-600")}>
                        {stats.database.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{stats.database.provider}</div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {t("settings.latency")}: <span className={cn("font-mono font-medium mx-1", stats.database.latencyMs < 50 ? "text-green-600" : "text-amber-600")}>{stats.database.latencyMs}ms</span>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Refresh button */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {t("settings.lastUpdated")}: {stats ? new Date(stats.timestamp).toLocaleTimeString(i18n.language === "ar" ? "ar-SA" : "en-US") : "-"}
            </p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => refetchStats()} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              {t("settings.refresh")}
            </Button>
          </div>

          <Separator />

          {/* Server Upgrade Plans */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" /> {t("settings.serverPlans")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVER_PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={plan.id}
                    className={cn("relative hover:shadow-md transition-shadow", plan.border, plan.current && "ring-2 ring-primary")}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-white text-xs px-2">{plan.badge}</Badge>
                      </div>
                    )}
                    <CardHeader className={cn("pb-2 rounded-t-lg", plan.bg)}>
                      <div className="flex items-center justify-between">
                        <Icon className={cn("h-5 w-5", plan.color)} />
                        {plan.current && <Badge variant="outline" className="text-xs text-primary border-primary/50">حالي</Badge>}
                      </div>
                      <CardTitle className={cn("text-base", plan.color)}>
                        {isRtl ? plan.nameAr : plan.nameEn}
                      </CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black">
                          {plan.price === 0 ? t("settings.free") : plan.price}
                        </span>
                        {plan.price > 0 && <span className="text-muted-foreground text-xs">ر.س/شهر</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-2">
                      {Object.entries(plan.specs).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground capitalize">{key === "cpu" ? "CPU" : key === "ram" ? "RAM" : key === "storage" ? t("settings.storage") : t("settings.bandwidth")}</span>
                          <span className="font-medium font-mono">{val}</span>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter className="pt-0">
                      {plan.current ? (
                        <Button variant="outline" className="w-full h-8 text-xs" disabled>
                          {t("settings.activePlan")}
                        </Button>
                      ) : (
                        <Button
                          className="w-full h-8 text-xs"
                          variant={plan.id === "vps-plus" ? "default" : "outline"}
                          onClick={() => toast({ title: t("settings.upgradeContact") })}
                        >
                          {t("settings.upgrade")}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════
            TAB 3 – STORE SETTINGS
        ══════════════════════════════════════════ */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" /> {t("settings.storeInfo")}
              </CardTitle>
              <CardDescription>{t("settings.storeInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted rounded-md" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t("settings.storeNameAr")}</Label>
                    <Input value={form.storeName ?? ""} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))} placeholder="سوبر ماركت" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.storeNameEn")}</Label>
                    <Input value={form.storeNameEn ?? ""} onChange={e => setForm(f => ({ ...f, storeNameEn: e.target.value }))} placeholder="Super Market" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.phone")}</Label>
                    <Input value={form.phone ?? ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+966 5x xxx xxxx" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.vatNumber")}</Label>
                    <Input value={form.vatNumber ?? ""} onChange={e => setForm(f => ({ ...f, vatNumber: e.target.value }))} placeholder="3xxxxxxxxxxxxxxxxx" dir="ltr" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("settings.address")}</Label>
                    <Input value={form.address ?? ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder={t("settings.addressPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.receiptHeader")}</Label>
                    <Input value={form.receiptHeader ?? ""} onChange={e => setForm(f => ({ ...f, receiptHeader: e.target.value }))} placeholder="أهلاً وسهلاً بكم" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.receiptFooter")}</Label>
                    <Input value={form.receiptFooter ?? ""} onChange={e => setForm(f => ({ ...f, receiptFooter: e.target.value }))} placeholder="شكراً لزيارتكم" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.currency")}</Label>
                    <Input value={form.currency ?? "SAR"} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} placeholder="SAR" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.vatRate")} (%)</Label>
                    <Input type="number" value={form.vatRate ?? "15"} onChange={e => setForm(f => ({ ...f, vatRate: e.target.value }))} min="0" max="100" dir="ltr" />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/30 py-4 flex justify-end">
              <Button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending}
                className="min-w-32 gap-2"
              >
                {saveMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                {saveMutation.isPending ? t("settings.saving") : t("settings.saveChanges")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════
            TAB 4 – SECURITY
        ══════════════════════════════════════════ */}
        <TabsContent value="security" className="space-y-6">
          {/* Active Session */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> {t("settings.activeSession")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{user?.emailAddresses?.[0]?.emailAddress}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.currentSession")} • {t("settings.sessionActive")}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* API Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" /> {t("settings.apiInfo")}
              </CardTitle>
              <CardDescription>{t("settings.apiInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("settings.apiBase")}</span>
                  <code className="bg-muted px-2 py-1 rounded font-mono text-xs">/api</code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("settings.authMethod")}</span>
                  <code className="bg-muted px-2 py-1 rounded font-mono text-xs">Clerk JWT</code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("settings.apiVersion")}</span>
                  <code className="bg-muted px-2 py-1 rounded font-mono text-xs">v1</code>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{t("settings.apiWarning")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Security Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> {t("settings.securityChecklist")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: t("settings.check2FA"), status: "warning" },
                  { label: t("settings.checkSSL"), status: "ok" },
                  { label: t("settings.checkAuth"), status: "ok" },
                  { label: t("settings.checkBackup"), status: "warning" },
                ].map(({ label, status }, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    {status === "ok" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    )}
                    <span className="text-sm flex-1">{label}</span>
                    <Badge variant="outline" className={status === "ok" ? "text-green-600 border-green-300" : "text-amber-600 border-amber-300"}>
                      {status === "ok" ? t("settings.enabled") : t("settings.recommended")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{t("settings.needHelp")}</p>
                  <p className="text-muted-foreground text-sm">{t("settings.supportDesc")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2" onClick={() => toast({ title: t("settings.supportNotify") })}>
                  <Globe className="h-4 w-4" /> {t("settings.docs")}
                </Button>
                <Button className="gap-2" onClick={() => toast({ title: t("settings.supportNotify") })}>
                  <Headphones className="h-4 w-4" /> {t("settings.contactSupport")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════
            TAB 5 – PRINTER SETTINGS
        ══════════════════════════════════════════ */}
        <TabsContent value="printer" className="space-y-6">

          {/* PWA Install Banner */}
          {isInstalled ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="font-semibold">✅ التطبيق مثبّت على هذا الجهاز</p>
                <p className="text-xs text-green-700 mt-0.5">يعمل التطبيق الآن كتطبيق مستقل بدون متصفح</p>
              </div>
            </div>
          ) : (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-50">
              <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/15 rounded-xl text-3xl">💻</div>
                  <div>
                    <p className="font-bold text-lg">تثبيت التطبيق على الكمبيوتر</p>
                    <p className="text-sm text-muted-foreground mt-0.5">يعمل بدون متصفح مثل أي برنامج عادي — أسرع وأكثر احترافية</p>
                    {!isInstallable && (
                      <p className="text-xs text-amber-600 mt-1">🔧 افتح التطبيق في Chrome أو Edge ثم اضغط على أيقونة التثبيت في شريط العنوان</p>
                    )}
                  </div>
                </div>
                {isInstallable && (
                  <Button
                    className="gap-2 bg-primary hover:bg-primary/90 text-white px-6"
                    onClick={async () => {
                      const ok = await install();
                      if (ok) toast({ title: "🎉 تم تثبيت التطبيق بنجاح!" });
                    }}
                  >
                    <Printer className="h-4 w-4" />
                    تثبيت التطبيق الآن
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <Info className="h-5 w-5 mt-0.5 shrink-0 text-blue-500" />
            <p>{t("printer.tip")}</p>
          </div>

          {/* Paper Size */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> {t("printer.paperSize")}
              </CardTitle>
              <CardDescription>{t("printer.paperSizeDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "80mm", label: t("printer.size80mm"), icon: "🧾", desc: "80 × auto mm" },
                  { id: "58mm", label: t("printer.size58mm"), icon: "🗒️", desc: "58 × auto mm" },
                  { id: "a4",   label: t("printer.sizeA4"),   icon: "📄", desc: "210 × 297 mm" },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPrinterSize(opt.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md",
                      printerSize === opt.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <span className="font-semibold text-sm text-center">{opt.label}</span>
                    <span className="text-xs text-muted-foreground font-mono">{opt.desc}</span>
                    {printerSize === opt.id && (
                      <Badge className="bg-primary text-white text-xs mt-1">✓ محدد</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Printer Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" /> {t("printer.printerType")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={printerType} onValueChange={setPrinterType}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">🔥 {t("printer.typeThermal")}</SelectItem>
                  <SelectItem value="laser">🖨️ {t("printer.typeLaser")}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> خيارات الطباعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{t("printer.autoPrint")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("printer.autoPrintDesc")}</p>
                </div>
                <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{t("printer.showLogo")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">يظهر اسم المتجر والشعار في أعلى الفاتورة</p>
                </div>
                <Switch checked={showLogo} onCheckedChange={setShowLogo} />
              </div>
            </CardContent>
          </Card>

          {/* Charset info */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-start gap-3">
              <Wifi className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-800 text-sm">{t("printer.charsetInfo")}</p>
                <p className="text-xs text-green-700 mt-1">{t("printer.charsetDesc")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button onClick={savePrinterSettings} className="gap-2 min-w-44">
              <Printer className="h-4 w-4" /> {t("printer.saveSettings")}
            </Button>
            <Button variant="outline" onClick={testPrint} className="gap-2">
              <FileText className="h-4 w-4" /> {t("printer.testPrint")}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

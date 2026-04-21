import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Store, TrendingUp, Users, Package, ShoppingBag, Crown, Star, Zap, Activity,
  DollarSign, RefreshCw, CheckCircle2, XCircle, Clock, ArrowUpRight, Shield,
  Key, Laptop, AlertTriangle, Trash2, CalendarPlus, Copy, ChevronDown, ChevronUp,
  RotateCcw, Lock, Unlock, PlusCircle, FileKey2, Database, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDevPortal } from "@/context/DevPortalContext";

/* ── Types ───────────────────────────────────────── */
interface StoreSummary {
  id: string; name: string; nameEn: string; slug: string;
  plan: string; status: string; needsOnboarding: boolean;
  trialEndsAt: string | null; createdAt: string;
  memberCount: number; productCount: number; saleCount: number;
}
interface Overview {
  summary: { total: number; trial: number; active: number; suspended: number; starter: number; professional: number; enterprise: number; mrr: number };
  stores: StoreSummary[];
}
interface License {
  id: string; key: string; machineId: string | null; storeName: string; storePhone: string | null;
  type: string; expiresAt: string | null; activatedAt: string | null; notes: string | null;
  isRevoked: boolean; createdAt: string;
}
interface IsolationReport {
  stores: { storeId: string; storeName: string; products: number; sales: number; status: string }[];
  orphanProducts: number; orphanSales: number; allIsolated: boolean;
}

/* ── Config ──────────────────────────────────────── */
const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  starter:      { label: "أساسي",  color: "text-slate-600",  bg: "bg-slate-100",  Icon: Zap },
  professional: { label: "محترف",  color: "text-blue-600",   bg: "bg-blue-100",   Icon: Star },
  enterprise:   { label: "متميز",  color: "text-amber-600",  bg: "bg-amber-100",  Icon: Crown },
};
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  trial:     { label: "تجريبي", color: "text-blue-600",   dot: "bg-blue-500" },
  active:    { label: "نشط",    color: "text-green-600",  dot: "bg-green-500" },
  suspended: { label: "موقوف",  color: "text-red-600",    dot: "bg-red-500" },
  cancelled: { label: "ملغي",   color: "text-slate-500",  dot: "bg-slate-400" },
};
const LICENSE_TYPE: Record<string, { label: string; color: string; bg: string }> = {
  trial:    { label: "تجريبي ٣٠ يوم", color: "text-blue-600",   bg: "bg-blue-50" },
  annual:   { label: "سنوي",           color: "text-green-700",  bg: "bg-green-50" },
  lifetime: { label: "مدى الحياة",     color: "text-amber-700",  bg: "bg-amber-50" },
};

const TABS = [
  { id: "overview",   label: "نظرة عامة",    Icon: BarChart3 },
  { id: "stores",     label: "المتاجر",       Icon: Store },
  { id: "isolation",  label: "عزل البيانات",  Icon: Shield },
  { id: "licenses",   label: "التراخيص",      Icon: FileKey2 },
];

/* ── Helpers ─────────────────────────────────────── */
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}
function daysLeft(d: string | null): number | null {
  if (!d) return null;
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000));
}

/* ════════════════════════════════════════════════════ */
export default function SuperAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const { apiBase, devHeaders } = useDevPortal();

  function apiFetch(path: string, init?: RequestInit) {
    return fetch(`${apiBase}${path}`, {
      ...init,
      headers: { ...devHeaders, ...(init?.headers ?? {}) },
    });
  }

  function invalidate() { qc.invalidateQueries({ queryKey: ["superadmin"] }); }

  /* ── Queries ── */
  const overviewQ = useQuery<Overview>({
    queryKey: ["superadmin", "overview", apiBase],
    queryFn: () => apiFetch("/overview").then(r => r.json()),
  });
  const licensesQ = useQuery<License[]>({
    queryKey: ["superadmin", "licenses", apiBase],
    queryFn: () => apiFetch("/licenses").then(r => r.json()),
    enabled: tab === "licenses",
  });
  const isolationQ = useQuery<IsolationReport>({
    queryKey: ["superadmin", "isolation", apiBase],
    queryFn: () => apiFetch("/isolation-check").then(r => r.json()),
    enabled: tab === "isolation",
  });

  /* ── Mutations ── */
  const planM = useMutation({
    mutationFn: ({ id, plan, status }: { id: string; plan?: string; status?: string }) =>
      apiFetch(`/stores/${id}/plan`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, status }) }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "تم تحديث المتجر" }); },
  });
  const extendM = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      apiFetch(`/stores/${id}/extend-trial`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days }) }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "تم تمديد الفترة التجريبية" }); },
  });
  const deleteStoreM = useMutation({
    mutationFn: (id: string) => apiFetch(`/stores/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "تم حذف المتجر" }); },
  });
  const revokeM = useMutation({
    mutationFn: ({ id, restore }: { id: string; restore: boolean }) =>
      apiFetch(`/licenses/${id}/${restore ? "restore" : "revoke"}`, { method: "PATCH" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin", "licenses"] }); toast({ title: "تم تحديث الترخيص" }); },
  });
  const deleteLicenseM = useMutation({
    mutationFn: (id: string) => apiFetch(`/licenses/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin", "licenses"] }); toast({ title: "تم حذف الترخيص" }); },
  });

  const s = overviewQ.data?.summary;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="px-8 pt-6 pb-0 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-sm">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">لوحة تحكم المطوّر</h1>
              <p className="text-sm text-slate-500">إدارة المنصة والمتاجر والتراخيص</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => overviewQ.refetch()} disabled={overviewQ.isFetching}>
            <RefreshCw className={cn("h-4 w-4", overviewQ.isFetching && "animate-spin")} />
            تحديث
          </Button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all",
                tab === t.id
                  ? "border-amber-500 text-amber-700 bg-amber-50/60"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <t.Icon className="h-4 w-4" />
              {t.label}
              {t.id === "licenses" && licensesQ.data && (
                <span className="ml-1 text-xs bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">{licensesQ.data.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-8 space-y-6">

        {/* ── Overview Tab ─────────────────────────── */}
        {tab === "overview" && (
          <>
            {/* KPI Cards */}
            {overviewQ.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : s && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-slate-700 to-slate-900 text-white border-0 shadow-lg">
                    <CardContent className="p-5">
                      <Store className="h-5 w-5 opacity-70 mb-3" />
                      <p className="text-3xl font-black">{s.total}</p>
                      <p className="text-slate-300 text-sm mt-1">إجمالي المتاجر</p>
                      <p className="text-xs text-slate-400 mt-1">{s.suspended} موقوف · {s.trial} تجريبي</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-500 to-green-700 text-white border-0 shadow-lg">
                    <CardContent className="p-5">
                      <DollarSign className="h-5 w-5 opacity-70 mb-3" />
                      <p className="text-3xl font-black">{s.mrr.toLocaleString()}</p>
                      <p className="text-green-100 text-sm mt-1">إيراد شهري متكرر</p>
                      <p className="text-xs text-green-200 mt-1">ريال سعودي / شهر</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-lg">
                    <CardContent className="p-5">
                      <Activity className="h-5 w-5 opacity-70 mb-3" />
                      <p className="text-3xl font-black">{s.active}</p>
                      <p className="text-blue-100 text-sm mt-1">متاجر نشطة</p>
                      <p className="text-xs text-blue-200 mt-1">{s.trial} في التجربة المجانية</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-400 to-amber-600 text-white border-0 shadow-lg">
                    <CardContent className="p-5">
                      <Crown className="h-5 w-5 opacity-70 mb-3" />
                      <p className="text-3xl font-black">{s.professional + s.enterprise}</p>
                      <p className="text-amber-100 text-sm mt-1">اشتراكات مدفوعة</p>
                      <p className="text-xs text-amber-200 mt-1">{s.professional} محترف · {s.enterprise} متميز</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Plan breakdown */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { plan: "starter", count: s.starter, price: 0 },
                    { plan: "professional", count: s.professional, price: 99 },
                    { plan: "enterprise", count: s.enterprise, price: 299 },
                  ].map(({ plan, count, price }) => {
                    const cfg = PLAN_CONFIG[plan];
                    const Icon = cfg.Icon;
                    const revenue = count * price;
                    return (
                      <Card key={plan} className="text-center hover:shadow-md transition-shadow">
                        <CardContent className="p-6 space-y-2">
                          <div className={cn("inline-flex p-2.5 rounded-xl", cfg.bg)}>
                            <Icon className={cn("h-5 w-5", cfg.color)} />
                          </div>
                          <p className={cn("text-3xl font-black", cfg.color)}>{count}</p>
                          <p className="text-sm font-bold text-slate-700">{cfg.label}</p>
                          <p className="text-xs text-muted-foreground">{price === 0 ? "مجاني" : `${price} ر.س/شهر`}</p>
                          {revenue > 0 && <p className="text-xs font-bold text-green-600">= {revenue.toLocaleString()} ر.س/شهر</p>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Revenue projection */}
                <Card className="bg-gradient-to-l from-slate-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">إجمالي الإيراد السنوي المتوقع</p>
                        <p className="text-4xl font-black text-slate-900">{(s.mrr * 12).toLocaleString()} <span className="text-lg font-medium text-muted-foreground">ر.س</span></p>
                      </div>
                      <div className="text-left space-y-1">
                        <div className="flex justify-between gap-8 text-sm">
                          <span className="text-muted-foreground">محترف ({s.professional} متجر)</span>
                          <span className="font-bold">{(s.professional * 99 * 12).toLocaleString()} ر.س</span>
                        </div>
                        <div className="flex justify-between gap-8 text-sm">
                          <span className="text-muted-foreground">متميز ({s.enterprise} متجر)</span>
                          <span className="font-bold">{(s.enterprise * 299 * 12).toLocaleString()} ر.س</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {/* ── Stores Tab ───────────────────────────── */}
        {tab === "stores" && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5 text-primary" />
                جميع المتاجر ({overviewQ.data?.stores.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overviewQ.isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
              ) : (
                <div className="space-y-2">
                  {overviewQ.data?.stores.map(store => (
                    <StoreRow
                      key={store.id} store={store}
                      onPlan={(plan, status) => planM.mutate({ id: store.id, plan, status })}
                      onExtend={(days) => extendM.mutate({ id: store.id, days })}
                      onDelete={() => {
                        if (confirm(`حذف متجر "${store.name}"؟ لا يمكن التراجع!`)) deleteStoreM.mutate(store.id);
                      }}
                      loading={planM.isPending || extendM.isPending || deleteStoreM.isPending}
                    />
                  ))}
                  {overviewQ.data?.stores.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <Store className="h-14 w-14 mx-auto mb-4 opacity-20" />
                      <p className="font-medium">لا توجد متاجر مسجلة بعد</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Isolation Tab ────────────────────────── */}
        {tab === "isolation" && (
          <IsolationTab data={isolationQ.data} isLoading={isolationQ.isLoading} onRefresh={() => isolationQ.refetch()} />
        )}

        {/* ── Licenses Tab ─────────────────────────── */}
        {tab === "licenses" && (
          <LicensesTab
            licenses={licensesQ.data ?? []}
            isLoading={licensesQ.isLoading}
            onRevoke={(id, restore) => revokeM.mutate({ id, restore })}
            onDelete={(id) => { if (confirm("حذف هذا الترخيص نهائياً؟")) deleteLicenseM.mutate(id); }}
            onRefresh={() => licensesQ.refetch()}
            onCreate={() => qc.invalidateQueries({ queryKey: ["superadmin", "licenses"] })}
          />
        )}

      </div>
    </div>
  );
}

/* ── StoreRow Component ──────────────────────────── */
function StoreRow({ store, onPlan, onExtend, onDelete, loading }: {
  store: StoreSummary;
  onPlan: (plan?: string, status?: string) => void;
  onExtend: (days: number) => void;
  onDelete: () => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const planCfg = PLAN_CONFIG[store.plan] ?? PLAN_CONFIG.starter;
  const statusCfg = STATUS_CONFIG[store.status] ?? STATUS_CONFIG.trial;
  const PlanIcon = planCfg.Icon;
  const days = daysLeft(store.trialEndsAt);
  const trialWarn = store.status === "trial" && days !== null && days <= 7;

  return (
    <div className="border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div
        className="flex items-center justify-between p-4 gap-3 flex-wrap cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={cn("p-2.5 rounded-xl", planCfg.bg)}>
            <PlanIcon className={cn("h-5 w-5", planCfg.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800">{store.name}</span>
              {store.needsOnboarding && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">يحتاج إعداد</Badge>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <span className={cn("w-2 h-2 rounded-full", statusCfg.dot)} />
                <span className={statusCfg.color}>{statusCfg.label}</span>
              </span>
              {trialWarn && (
                <span className="text-amber-600 flex items-center gap-1 font-medium">
                  <Clock className="h-3 w-3" /> {days} يوم متبقي
                </span>
              )}
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{store.memberCount} كاشير</span>
              <span className="flex items-center gap-1"><Package className="h-3 w-3" />{store.productCount} منتج</span>
              <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{store.saleCount} فاتورة</span>
              <span className="text-slate-400">منذ {fmtDate(store.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs border-0", planCfg.bg, planCfg.color)}>{planCfg.label}</Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-slate-50 p-4 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground font-semibold self-center ml-2">تغيير الخطة:</span>
          {["starter", "professional", "enterprise"].filter(p => p !== store.plan).map(plan => (
            <Button key={plan} size="sm" variant="outline" disabled={loading}
              className={cn("h-7 text-xs gap-1", plan === "enterprise" ? "text-amber-600 border-amber-300" : "text-primary border-primary/30")}
              onClick={() => onPlan(plan, "active")}>
              <ArrowUpRight className="h-3 w-3" /> {PLAN_CONFIG[plan].label}
            </Button>
          ))}
          <div className="w-px bg-slate-200 mx-1 h-7 self-center" />
          {store.status === "active"
            ? <Button size="sm" variant="outline" disabled={loading} className="h-7 text-xs text-red-500 border-red-200 gap-1" onClick={() => onPlan(undefined, "suspended")}><XCircle className="h-3 w-3" /> تعليق</Button>
            : <Button size="sm" variant="outline" disabled={loading} className="h-7 text-xs text-green-600 border-green-200 gap-1" onClick={() => onPlan(undefined, "active")}><CheckCircle2 className="h-3 w-3" /> تفعيل</Button>
          }
          <Button size="sm" variant="outline" disabled={loading} className="h-7 text-xs text-blue-600 border-blue-200 gap-1" onClick={() => onExtend(14)}>
            <CalendarPlus className="h-3 w-3" /> تمديد ١٤ يوم
          </Button>
          <Button size="sm" variant="outline" disabled={loading} className="h-7 text-xs text-red-600 border-red-200 gap-1 mr-auto" onClick={onDelete}>
            <Trash2 className="h-3 w-3" /> حذف المتجر
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Isolation Tab ───────────────────────────────── */
function IsolationTab({ data, isLoading, onRefresh }: { data?: IsolationReport; isLoading: boolean; onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="h-5 w-5 text-teal-600" /> فحص عزل البيانات</h2>
          <p className="text-sm text-muted-foreground">يضمن أن بيانات كل متجر منفصلة تماماً عن الآخرين</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2"><RefreshCw className="h-4 w-4" /> فحص الآن</Button>
      </div>

      {isLoading ? (
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className={cn("border-2", data.allIsolated ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
              <CardContent className="p-5 flex items-center gap-4">
                {data.allIsolated
                  ? <CheckCircle2 className="h-10 w-10 text-green-600 shrink-0" />
                  : <AlertTriangle className="h-10 w-10 text-red-500 shrink-0" />
                }
                <div>
                  <p className="text-lg font-black">{data.allIsolated ? "آمن تماماً" : "يحتاج مراجعة"}</p>
                  <p className="text-xs text-muted-foreground">حالة عزل البيانات</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className={cn("text-3xl font-black", data.orphanProducts > 0 ? "text-red-600" : "text-green-600")}>{data.orphanProducts}</p>
                <p className="text-sm text-muted-foreground">منتجات بدون متجر</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className={cn("text-3xl font-black", data.orphanSales > 0 ? "text-red-600" : "text-green-600")}>{data.orphanSales}</p>
                <p className="text-sm text-muted-foreground">مبيعات بدون متجر</p>
              </CardContent>
            </Card>
          </div>

          {/* Per-store table */}
          <Card>
            <CardHeader><CardTitle className="text-base">تفاصيل عزل كل متجر</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.stores.map(store => (
                  <div key={store.storeId} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="font-medium text-sm">{store.storeName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span><Package className="h-3 w-3 inline ml-1" />{store.products} منتج</span>
                      <span><ShoppingBag className="h-3 w-3 inline ml-1" />{store.sales} مبيعة</span>
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">معزول</Badge>
                    </div>
                  </div>
                ))}
                {data.stores.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">لا توجد متاجر بعد</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card><CardContent className="p-12 text-center text-muted-foreground">انقر "فحص الآن" لبدء الفحص</CardContent></Card>
      )}
    </div>
  );
}

/* ── Licenses Tab ────────────────────────────────── */
function LicensesTab({ licenses, isLoading, onRevoke, onDelete, onRefresh, onCreate }: {
  licenses: License[];
  isLoading: boolean;
  onRevoke: (id: string, restore: boolean) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onCreate: () => void;
}) {
  const { toast } = useToast();
  const { apiBase, devHeaders } = useDevPortal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ storeName: "", storePhone: "", type: "trial", days: 30, notes: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateM = useMutation({
    mutationFn: () => fetch(`${apiBase}/licenses/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...devHeaders },
      body: JSON.stringify(form),
    }).then(r => r.json()),
    onSuccess: (data) => {
      onCreate();
      setShowForm(false);
      setForm({ storeName: "", storePhone: "", type: "trial", days: 30, notes: "" });
      toast({ title: `✅ تم إنشاء الترخيص: ${data.key}`, description: "انقر على المفتاح لنسخه" });
    },
  });

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const active = licenses.filter(l => !l.isRevoked && !isExpiredStr(l.expiresAt)).length;
  const revoked = licenses.filter(l => l.isRevoked).length;
  const expired = licenses.filter(l => !l.isRevoked && isExpiredStr(l.expiresAt)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><FileKey2 className="h-5 w-5 text-amber-600" /> إدارة تراخيص النسخة المكتبية</h2>
          <p className="text-sm text-muted-foreground">أنشئ مفاتيح ترخيص للنسخة EXE وراقب حالتها</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2"><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
            <PlusCircle className="h-4 w-4" /> مفتاح جديد
          </Button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full text-sm font-medium text-green-700"><CheckCircle2 className="h-4 w-4" />{active} نشط</div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full text-sm font-medium text-red-600"><XCircle className="h-4 w-4" />{revoked} ملغى</div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium text-slate-500"><Clock className="h-4 w-4" />{expired} منتهي</div>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-amber-600" /> إنشاء ترخيص جديد</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">اسم المتجر *</label>
                <Input placeholder="سوبر ماركت الأمانة" value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">رقم الهاتف</label>
                <Input placeholder="05xxxxxxxx" value={form.storePhone} onChange={e => setForm(f => ({ ...f, storePhone: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">نوع الترخيص</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="trial">تجريبي (30 يوم)</option>
                  <option value="annual">سنوي (365 يوم)</option>
                  <option value="lifetime">مدى الحياة</option>
                </select>
              </div>
              {form.type === "trial" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">مدة الترخيص (يوم)</label>
                  <Input type="number" min={1} max={365} value={form.days} onChange={e => setForm(f => ({ ...f, days: Number(e.target.value) }))} />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">ملاحظات (اختياري)</label>
              <Input placeholder="اتفاقية مع أبو فهد..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => generateM.mutate()} disabled={!form.storeName || generateM.isPending} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                <Key className="h-4 w-4" /> إنشاء المفتاح
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Licenses list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {licenses.map(lic => {
            const typeCfg = LICENSE_TYPE[lic.type] ?? LICENSE_TYPE.trial;
            const days = daysLeft(lic.expiresAt);
            const expired = isExpiredStr(lic.expiresAt);

            return (
              <Card key={lic.id} className={cn(
                "transition-all",
                lic.isRevoked ? "opacity-60 bg-red-50/30 border-red-200" :
                  expired ? "opacity-70 bg-slate-50 border-slate-200" : ""
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{lic.storeName}</span>
                        {lic.storePhone && <span className="text-xs text-muted-foreground">· {lic.storePhone}</span>}
                        <Badge className={cn("text-xs border-0", typeCfg.bg, typeCfg.color)}>{typeCfg.label}</Badge>
                        {lic.isRevoked && <Badge className="text-xs bg-red-100 text-red-700 border-0">ملغى</Badge>}
                        {expired && !lic.isRevoked && <Badge className="text-xs bg-slate-100 text-slate-600 border-0">منتهي</Badge>}
                        {lic.machineId && <Badge className="text-xs bg-blue-50 text-blue-600 border-0 gap-1"><Laptop className="h-2.5 w-2.5" />مُفعَّل</Badge>}
                      </div>
                      <button
                        className="font-mono text-sm text-teal-700 bg-teal-50 px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-teal-100 transition-colors"
                        onClick={() => copyKey(lic.key, lic.id)}
                      >
                        {copiedId === lic.id ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {lic.key}
                      </button>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>تاريخ الإنشاء: {fmtDate(lic.createdAt)}</span>
                        {lic.expiresAt && (
                          <span className={cn(days !== null && days <= 7 && !expired ? "text-amber-600 font-medium" : "")}>
                            {expired ? "انتهى في" : "ينتهي"}: {fmtDate(lic.expiresAt)}
                            {!expired && days !== null && ` (${days} يوم)`}
                          </span>
                        )}
                        {lic.activatedAt && <span>فُعِّل: {fmtDate(lic.activatedAt)}</span>}
                        {lic.notes && <span>• {lic.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => copyKey(lic.key, lic.id)}>
                        {copiedId === lic.id ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                      </Button>
                      {!lic.isRevoked ? (
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-red-500 hover:bg-red-50 gap-1" onClick={() => onRevoke(lic.id, false)}>
                          <Lock className="h-3.5 w-3.5" /> إلغاء
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-green-600 hover:bg-green-50 gap-1" onClick={() => onRevoke(lic.id, true)}>
                          <Unlock className="h-3.5 w-3.5" /> استعادة
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:bg-red-50" onClick={() => onDelete(lic.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {licenses.length === 0 && !isLoading && (
            <Card><CardContent className="p-16 text-center">
              <FileKey2 className="h-14 w-14 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">لا توجد تراخيص بعد</p>
              <p className="text-sm text-muted-foreground mt-1">انقر "مفتاح جديد" لإنشاء أول ترخيص</p>
            </CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}

function isExpiredStr(d: string | null): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Store, TrendingUp, Users, Package, ShoppingBag,
  Crown, Star, Zap, Activity, DollarSign, RefreshCw,
  CheckCircle2, XCircle, Clock, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreSummary {
  id: string; name: string; nameEn: string; slug: string;
  plan: string; status: string; needsOnboarding: boolean;
  trialEndsAt: string | null; createdAt: string;
  memberCount: number; productCount: number; saleCount: number;
}

interface Overview {
  summary: {
    total: number; trial: number; active: number;
    starter: number; professional: number; enterprise: number; mrr: number;
  };
  stores: StoreSummary[];
}

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  starter:      { label: "أساسي",   color: "text-slate-600",  bg: "bg-slate-100",   Icon: Zap },
  professional: { label: "محترف",   color: "text-blue-600",   bg: "bg-blue-100",    Icon: Star },
  enterprise:   { label: "متميز",   color: "text-amber-600",  bg: "bg-amber-100",   Icon: Crown },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  trial:     { label: "تجريبي", color: "text-blue-600",  dot: "bg-blue-500" },
  active:    { label: "نشط",    color: "text-green-600", dot: "bg-green-500" },
  suspended: { label: "موقوف", color: "text-red-600",   dot: "bg-red-500" },
  cancelled: { label: "ملغي",  color: "text-slate-500", dot: "bg-slate-400" },
};

export default function SuperAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery<Overview>({
    queryKey: ["superadmin", "overview"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/overview");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async ({ id, plan, status }: { id: string; plan?: string; status?: string }) => {
      const res = await fetch(`/api/superadmin/stores/${id}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin"] });
      toast({ title: "تم تحديث الخطة بنجاح" });
    },
  });

  const s = data?.summary;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Crown className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">لوحة إدارة المنصة</h1>
            <p className="text-muted-foreground">مراقبة جميع المتاجر والاشتراكات</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          تحديث
        </Button>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-slate-700 to-slate-900 text-white border-0">
            <CardContent className="p-5">
              <Store className="h-6 w-6 opacity-80 mb-3" />
              <p className="text-3xl font-black">{s.total}</p>
              <p className="text-slate-300 text-sm">إجمالي المتاجر</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0">
            <CardContent className="p-5">
              <DollarSign className="h-6 w-6 opacity-80 mb-3" />
              <p className="text-3xl font-black">{s.mrr.toLocaleString()}</p>
              <p className="text-green-100 text-sm">إيراد شهري (ر.س)</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
            <CardContent className="p-5">
              <Activity className="h-6 w-6 opacity-80 mb-3" />
              <p className="text-3xl font-black">{s.active}</p>
              <p className="text-blue-100 text-sm">نشط / {s.trial} تجريبي</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-700 text-white border-0">
            <CardContent className="p-5">
              <Crown className="h-6 w-6 opacity-80 mb-3" />
              <p className="text-3xl font-black">{s.professional + s.enterprise}</p>
              <p className="text-amber-100 text-sm">اشتراكات مدفوعة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Distribution */}
      {s && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { plan: "starter", count: s.starter, price: 0 },
            { plan: "professional", count: s.professional, price: 99 },
            { plan: "enterprise", count: s.enterprise, price: 299 },
          ].map(({ plan, count, price }) => {
            const cfg = PLAN_CONFIG[plan];
            const Icon = cfg.Icon;
            return (
              <Card key={plan} className="text-center">
                <CardContent className="p-5 space-y-2">
                  <div className={cn("inline-flex p-2 rounded-lg", cfg.bg)}>
                    <Icon className={cn("h-5 w-5", cfg.color)} />
                  </div>
                  <p className={cn("text-2xl font-black", cfg.color)}>{count}</p>
                  <p className="text-sm font-medium">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground">{price === 0 ? "مجاني" : `${price} ر.س/شهر`}</p>
                  {count > 0 && <p className="text-xs text-green-600 font-medium">= {(count * price).toLocaleString()} ر.س/شهر</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            جميع المتاجر ({data?.stores.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.stores.map(store => {
                const planCfg = PLAN_CONFIG[store.plan] ?? PLAN_CONFIG.starter;
                const statusCfg = STATUS_CONFIG[store.status] ?? STATUS_CONFIG.trial;
                const PlanIcon = planCfg.Icon;
                const trialDays = store.trialEndsAt
                  ? Math.max(0, Math.ceil((new Date(store.trialEndsAt).getTime() - Date.now()) / 86400000))
                  : null;

                return (
                  <div key={store.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 transition-colors flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2.5 rounded-xl", planCfg.bg)}>
                        <PlanIcon className={cn("h-5 w-5", planCfg.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{store.name}</span>
                          {store.needsOnboarding && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">يحتاج إعداد</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                            <span className={statusCfg.color}>{statusCfg.label}</span>
                          </span>
                          {trialDays !== null && trialDays <= 7 && (
                            <span className="text-amber-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {trialDays} يوم
                            </span>
                          )}
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{store.memberCount} كاشير</span>
                          <span className="flex items-center gap-1"><Package className="h-3 w-3" />{store.productCount} منتج</span>
                          <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{store.saleCount} فاتورة</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-xs", planCfg.bg, planCfg.color, "border-0")}>
                        {planCfg.label}
                      </Badge>
                      {store.plan !== "professional" && (
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs gap-1 text-primary border-primary/30"
                          onClick={() => upgradeMutation.mutate({ id: store.id, plan: "professional", status: "active" })}
                          disabled={upgradeMutation.isPending}
                        >
                          <ArrowUpRight className="h-3 w-3" /> محترف
                        </Button>
                      )}
                      {store.plan !== "enterprise" && (
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs gap-1 text-amber-600 border-amber-300"
                          onClick={() => upgradeMutation.mutate({ id: store.id, plan: "enterprise", status: "active" })}
                          disabled={upgradeMutation.isPending}
                        >
                          <Crown className="h-3 w-3" /> متميز
                        </Button>
                      )}
                      {store.status === "active" ? (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 text-xs text-red-500"
                          onClick={() => upgradeMutation.mutate({ id: store.id, status: "suspended" })}
                          disabled={upgradeMutation.isPending}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      ) : store.status === "suspended" && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 text-xs text-green-600"
                          onClick={() => upgradeMutation.mutate({ id: store.id, status: "active" })}
                          disabled={upgradeMutation.isPending}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {data?.stores.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد متاجر مسجلة بعد</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

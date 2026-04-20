import { useMemo, useState } from "react";
import { 
  useGetInventoryInsights, 
  getGetInventoryInsightsQueryKey,
  useGetSalesTrends,
  getGetSalesTrendsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, PackageSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DATE_LOCALES } from "@/i18n";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("all");
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.language] ?? "ar-SA";

  const STATUS_CONFIG: Record<string, { labelKey: string; color: string }> = {
    fast:   { labelKey: "analytics.fast",   color: "bg-green-500/10 text-green-700 border-green-200" },
    normal: { labelKey: "analytics.normal", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
    slow:   { labelKey: "analytics.slow",   color: "bg-amber-500/10 text-amber-700 border-amber-200" },
    dead:   { labelKey: "analytics.dead",   color: "bg-red-500/10 text-red-700 border-red-200" },
    new:    { labelKey: "analytics.new",    color: "bg-gray-500/10 text-gray-700 border-gray-200" },
  };

  const { data: insights, isLoading: isInsightsLoading } = useGetInventoryInsights({ query: { queryKey: getGetInventoryInsightsQueryKey() } });
  const { data: trends, isLoading: isTrendsLoading } = useGetSalesTrends({ query: { queryKey: getGetSalesTrendsQueryKey() } });

  const filteredInsights = useMemo(() => {
    if (!insights) return [];
    let sorted = [...insights].sort((a, b) => b.salesVelocityPerDay - a.salesVelocityPerDay);
    if (activeTab !== "all") sorted = sorted.filter(p => p.status === activeTab);
    return sorted;
  }, [insights, activeTab]);

  const summary = useMemo(() => {
    if (!insights) return { fast: 0, slow: 0, dead: 0, lowStock: 0 };
    return {
      fast: insights.filter(p => p.status === "fast").length,
      slow: insights.filter(p => p.status === "slow").length,
      dead: insights.filter(p => p.status === "dead").length,
      lowStock: insights.filter(p => p.stock > 0 && p.stock <= 5).length,
    };
  }, [insights]);

  const trendSummary = useMemo(() => {
    if (!trends || trends.length === 0) return { bestDay: null, avgRevenue: 0 };
    const totalRevenue = trends.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const avgRevenue = totalRevenue / trends.length;
    const bestDay = [...trends].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    return { bestDay, avgRevenue };
  }, [trends]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.analytics")}</h1>
      </div>

      {/* Sales Trends */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t("dashboard.revenue")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              {isTrendsLoading ? (
                <div className="h-[300px] bg-muted/50 animate-pulse rounded-md" />
              ) : trends && trends.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                      <Tooltip formatter={(v: number) => [v, t("dashboard.revenue")]} labelFormatter={(l) => new Date(l).toLocaleDateString(dateLocale)} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                      <Line type="monotone" dataKey="totalRevenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">{t("inventory.noProducts")}</div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.revenue")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isTrendsLoading ? <div className="h-8 bg-muted/50 animate-pulse rounded-md w-1/2" /> : trendSummary.bestDay ? (
                  <>
                    <div className="text-2xl font-bold">{new Intl.NumberFormat(dateLocale, { style: 'currency', currency: 'SAR' }).format(trendSummary.bestDay.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(trendSummary.bestDay.date).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </>
                ) : <div className="text-muted-foreground">-</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.avgOrder")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isTrendsLoading ? <div className="h-8 bg-muted/50 animate-pulse rounded-md w-1/2" /> : (
                  <div className="text-2xl font-bold">{new Intl.NumberFormat(dateLocale, { style: 'currency', currency: 'SAR' }).format(trendSummary.avgRevenue)}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Product Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PackageSearch className="h-5 w-5" />
          {t("dashboard.productsSold")}
        </h2>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { labelKey: "analytics.fast", value: summary.fast, icon: TrendingUp, bg: "bg-green-500/10", ic: "text-green-600" },
            { labelKey: "analytics.slow", value: summary.slow, icon: TrendingDown, bg: "bg-amber-500/10", ic: "text-amber-600" },
            { labelKey: "analytics.dead", value: summary.dead, icon: Clock, bg: "bg-red-500/10", ic: "text-red-600" },
            { labelKey: "inventory.lowStock", value: summary.lowStock, icon: AlertTriangle, bg: "bg-amber-500/10", ic: "text-amber-600" },
          ].map(({ labelKey, value, icon: Icon, bg, ic }) => (
            <Card key={labelKey}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t(labelKey)}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                  <div className={`p-3 ${bg} rounded-full`}>
                    <Icon className={`h-5 w-5 ${ic}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <div className="p-4 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">{t("inventory.tabAll")}</TabsTrigger>
                <TabsTrigger value="fast">{t("analytics.fast")}</TabsTrigger>
                <TabsTrigger value="normal">{t("analytics.normal")}</TabsTrigger>
                <TabsTrigger value="slow">{t("analytics.slow")}</TabsTrigger>
                <TabsTrigger value="dead">{t("analytics.dead")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isInsightsLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.colProduct")}</TableHead>
                  <TableHead>{t("inventory.colCategory")}</TableHead>
                  <TableHead>{t("inventory.colCurrentStock")}</TableHead>
                  <TableHead>{t("inventory.tabAll")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsights.map((product) => {
                  const statusConf = STATUS_CONFIG[product.status] || STATUS_CONFIG.normal;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.nameAr}</div>
                        <div className="text-xs text-muted-foreground font-mono">{product.barcode}</div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.stock} {product.unit}</TableCell>
                      <TableCell className="font-medium">{product.totalSoldLast30Days} {product.unit}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConf.color}>
                          {t(statusConf.labelKey)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInsights.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("inventory.noProducts")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

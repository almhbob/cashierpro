import { useGetDailyStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Banknote, ShoppingBag, Receipt, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDailyStats();
  const { t } = useTranslation();

  if (isLoading || !stats) {
    return <div className="p-8">{t("common.loading")}</div>;
  }

  const statCards = [
    { title: t("dashboard.revenue"), value: formatCurrency(stats.totalRevenue), icon: Banknote, color: "text-green-600", bg: "bg-green-100" },
    { title: t("dashboard.transactions"), value: stats.totalSales.toString(), icon: Receipt, color: "text-blue-600", bg: "bg-blue-100" },
    { title: t("dashboard.productsSold"), value: stats.totalItems.toString(), icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-100" },
    { title: t("dashboard.avgOrder"), value: formatCurrency(stats.averageOrderValue), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">{t("dashboard.title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-full`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

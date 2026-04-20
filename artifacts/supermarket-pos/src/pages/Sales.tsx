import { useListSales } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DATE_LOCALES } from "@/i18n";

export default function Sales() {
  const { data: sales, isLoading } = useListSales();
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.language] ?? "ar-SA";

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">{t("sales.title")}</h1>

      <Card>
        <table className="w-full border-collapse" style={{ textAlign: "inherit" }}>
          <thead className="bg-muted text-muted-foreground border-b">
            <tr>
              <th className="p-4 font-medium">{t("sales.colTransaction")}</th>
              <th className="p-4 font-medium">{t("sales.colDateTime")}</th>
              <th className="p-4 font-medium">{t("sales.colCashier")}</th>
              <th className="p-4 font-medium">{t("sales.colTotal")}</th>
              <th className="p-4 font-medium w-24">{t("sales.colDetails")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center">{t("common.loading")}</td></tr>
            ) : sales?.map(sale => (
              <tr key={sale.id} className="border-b hover:bg-muted/30">
                <td className="p-4 font-mono">#{sale.id}</td>
                <td className="p-4">{new Date(sale.createdAt).toLocaleString(dateLocale)}</td>
                <td className="p-4">{sale.cashierName}</td>
                <td className="p-4 font-bold text-primary">{formatCurrency(sale.total)}</td>
                <td className="p-4">
                  <Link href={`/sales/${sale.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" /> {t("sales.view")}
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {sales?.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("sales.noSales")}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

import { useParams, Link } from "wouter";
import { useGetSale } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { ArrowRight, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DATE_LOCALES } from "@/i18n";

export default function SaleDetail() {
  const { id } = useParams();
  const { data: sale, isLoading } = useGetSale(Number(id), { query: { enabled: !!id } });
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.language] ?? "ar-SA";

  if (isLoading) return <div className="p-8">{t("common.loading")}</div>;
  if (!sale) return <div className="p-8">{t("common.error")}</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/sales">
          <Button variant="ghost" className="gap-2">
            <ArrowRight className="h-4 w-4" /> {t("sales.back")}
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> {t("pos.printReceipt")}
        </Button>
      </div>

      <Card className="shadow-lg" id="receipt-print">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-2xl">{t("pos.ourStore")}</CardTitle>
          <div className="text-sm text-muted-foreground mt-2">
            {t("pos.invoiceNo")}: #{sale.id}<br/>
            {t("pos.dateLabel")}: {new Date(sale.createdAt).toLocaleString(dateLocale)}<br/>
            {t("pos.cashierLabel")} {sale.cashierName}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <table className="w-full mb-6" style={{ textAlign: "inherit" }}>
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="pb-2 font-medium">{t("pos.colProduct")}</th>
                <th className="pb-2 font-medium">{t("pos.colQty")}</th>
                <th className="pb-2 font-medium">{t("pos.colPrice")}</th>
                <th className="pb-2 font-medium">{t("pos.colTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0 border-dashed">
                  <td className="py-3 font-medium">{item.productNameAr}</td>
                  <td className="py-3">{item.quantity}</td>
                  <td className="py-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 font-bold">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold text-primary">
              <span>{t("pos.totalLabel")}</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{t("pos.paidLabel")}</span>
              <span>{formatCurrency(sale.amountPaid)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{t("pos.changeLabel")}</span>
              <span>{formatCurrency(sale.change)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

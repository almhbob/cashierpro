import { useParams, Link } from "wouter";
import { useGetSale } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { ArrowRight, Printer } from "lucide-react";

export default function SaleDetail() {
  const { id } = useParams();
  const { data: sale, isLoading } = useGetSale(Number(id), { query: { enabled: !!id } });

  if (isLoading) return <div className="p-8">جاري التحميل...</div>;
  if (!sale) return <div className="p-8">لم يتم العثور على العملية</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/sales">
          <Button variant="ghost" className="gap-2">
            <ArrowRight className="h-4 w-4" /> عودة للمبيعات
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> طباعة
        </Button>
      </div>

      <Card className="shadow-lg" id="receipt-print">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-2xl">متجرنا</CardTitle>
          <div className="text-sm text-muted-foreground mt-2">
            رقم الفاتورة: #{sale.id}<br/>
            التاريخ: {new Date(sale.createdAt).toLocaleString("ar-SA")}<br/>
            الكاشير: {sale.cashierName}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <table className="w-full text-right mb-6">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="pb-2 font-medium">المنتج</th>
                <th className="pb-2 font-medium">الكمية</th>
                <th className="pb-2 font-medium">السعر</th>
                <th className="pb-2 font-medium">المجموع</th>
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
              <span>الإجمالي</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>المبلغ المدفوع</span>
              <span>{formatCurrency(sale.amountPaid)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>الباقي</span>
              <span>{formatCurrency(sale.change)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

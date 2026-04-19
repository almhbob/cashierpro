import { useListSales } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default function Sales() {
  const { data: sales, isLoading } = useListSales();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">سجل المبيعات</h1>

      <Card>
        <table className="w-full text-right border-collapse">
          <thead className="bg-muted text-muted-foreground border-b">
            <tr>
              <th className="p-4 font-medium">رقم العملية</th>
              <th className="p-4 font-medium">التاريخ والوقت</th>
              <th className="p-4 font-medium">الكاشير</th>
              <th className="p-4 font-medium">الإجمالي</th>
              <th className="p-4 font-medium w-24">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center">جاري التحميل...</td></tr>
            ) : sales?.map(sale => (
              <tr key={sale.id} className="border-b hover:bg-muted/30">
                <td className="p-4 font-mono">#{sale.id}</td>
                <td className="p-4">{new Date(sale.createdAt).toLocaleString("ar-SA")}</td>
                <td className="p-4">{sale.cashierName}</td>
                <td className="p-4 font-bold text-primary">{formatCurrency(sale.total)}</td>
                <td className="p-4">
                  <Link href={`/sales/${sale.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" /> عرض
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {sales?.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا يوجد مبيعات بعد</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

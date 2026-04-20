import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  useGetInventoryReport, 
  getGetInventoryReportQueryKey,
  useAdjustProductStock,
  getGetInventoryInsightsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Printer, Search, AlertCircle, PackageX, Package, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DATE_LOCALES } from "@/i18n";

export default function Inventory() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(() => location === "/inventory/low-stock" ? "low-stock" : "all");
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.language] ?? "ar-SA";

  const { data: report, isLoading } = useGetInventoryReport({ query: { queryKey: getGetInventoryReportQueryKey() } });
  const queryClient = useQueryClient();
  const adjustStock = useAdjustProductStock();

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === "low-stock") setLocation("/inventory/low-stock", { replace: true });
    else if (location === "/inventory/low-stock") setLocation("/inventory", { replace: true });
  };

  const filteredProducts = useMemo(() => {
    if (!report?.products) return [];
    let filtered = report.products;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => p.nameAr.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.barcode.includes(q));
    }
    if (activeTab === "out-of-stock") filtered = filtered.filter(p => p.stock === 0);
    else if (activeTab === "low-stock") filtered = filtered.filter(p => p.stock > 0 && p.stock <= 5);
    return filtered;
  }, [report, search, activeTab]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:m-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("inventory.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("inventory.subtitle")}</p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" /> {t("inventory.printReport")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1,2,3,4].map(i => <Card key={i} className="animate-pulse"><CardHeader className="h-24 bg-muted/50 rounded-t-lg" /></Card>)}
          </div>
          <Card className="animate-pulse h-[400px]" />
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-4 print:hidden">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("inventory.totalProducts")}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{report.totalProducts}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("inventory.stockValue")}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat(dateLocale, { style: 'currency', currency: 'SAR' }).format(report.totalStockValue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("inventory.outOfStock")}</CardTitle>
                <PackageX className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-destructive">{report.outOfStock}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("inventory.lowStock")}</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-amber-500">{report.lowStock}</div></CardContent>
            </Card>
          </div>

          <Card className="print:shadow-none print:border-none">
            <div className="p-4 border-b space-y-4 print:hidden">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="all">{t("inventory.tabAll")}</TabsTrigger>
                  <TabsTrigger value="out-of-stock">{t("inventory.tabOutOfStock")}</TabsTrigger>
                  <TabsTrigger value="low-stock">{t("inventory.tabLowStock")}</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("inventory.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
              </div>
            </div>

            <div className="print:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("inventory.colProduct")}</TableHead>
                    <TableHead>{t("inventory.colBarcode")}</TableHead>
                    <TableHead>{t("inventory.colCategory")}</TableHead>
                    <TableHead>{t("inventory.colCurrentStock")}</TableHead>
                    <TableHead>{t("inventory.colStockValue")}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.nameAr}</TableCell>
                      <TableCell className="text-muted-foreground font-mono">{product.barcode}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <span className={product.stock === 0 ? "text-destructive font-bold" : product.stock <= 5 ? "text-amber-500 font-bold" : ""}>
                          {product.stock} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat(dateLocale, { style: 'currency', currency: 'SAR' }).format(product.stockValue)}
                      </TableCell>
                      <TableCell>
                        <AdjustStockDialog product={product} t={t} onAdjust={async (newStock, reason) => {
                          await adjustStock.mutateAsync({ id: product.id, data: { newStock, reason } });
                          queryClient.invalidateQueries({ queryKey: getGetInventoryReportQueryKey() });
                          queryClient.invalidateQueries({ queryKey: getGetInventoryInsightsQueryKey() });
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("inventory.noProducts")}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="hidden print:block" id="receipt-print">
              <h2 className="text-xl font-bold mb-4 text-center">{t("inventory.reportTitle")} ({new Date().toLocaleDateString(dateLocale)})</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2 text-right">{t("inventory.colBarcode")}</th>
                    <th className="py-2 text-right">{t("inventory.colProduct")}</th>
                    <th className="py-2 text-right">{t("inventory.colRecordedQty")}</th>
                    <th className="py-2 text-right">{t("inventory.colActualQty")}</th>
                    <th className="py-2 text-right">{t("inventory.colNotes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-300">
                      <td className="py-2 font-mono">{product.barcode}</td>
                      <td className="py-2">{product.nameAr}</td>
                      <td className="py-2">{product.stock}</td>
                      <td className="py-2 border-2 border-gray-400 w-24"></td>
                      <td className="py-2 border-2 border-gray-400 w-48"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function AdjustStockDialog({ product, onAdjust, t }: { product: any; onAdjust: (stock: number, reason: string) => Promise<void>; t: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  const [newStock, setNewStock] = useState(product.stock.toString());
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAdjust(Number(newStock), reason);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{t("inventory.adjustStock")}</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("inventory.adjustTitle")} {product.nameAr}</DialogTitle>
            <DialogDescription>{t("inventory.currentStock")} {product.stock} {product.unit}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stock">{t("inventory.newQty")}</Label>
              <Input id="stock" type="number" min="0" step="0.01" required value={newStock} onChange={(e) => setNewStock(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{t("inventory.reason")}</Label>
              <Input id="reason" required placeholder={t("inventory.reasonPlaceholder")} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("inventory.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t("inventory.saving") : t("inventory.saveAdjust")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

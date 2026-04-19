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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Printer, Search, AlertCircle, PackageX, Package, DollarSign } from "lucide-react";

export default function Inventory() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    return location === "/inventory/low-stock" ? "low-stock" : "all";
  });
  
  const { data: report, isLoading } = useGetInventoryReport({
    query: {
      queryKey: getGetInventoryReportQueryKey()
    }
  });

  const queryClient = useQueryClient();
  const adjustStock = useAdjustProductStock();

  const handlePrint = () => {
    window.print();
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === "low-stock") {
      setLocation("/inventory/low-stock", { replace: true });
    } else if (location === "/inventory/low-stock") {
      setLocation("/inventory", { replace: true });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!report?.products) return [];
    
    let filtered = report.products;
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.nameAr.toLowerCase().includes(q) || 
        p.name.toLowerCase().includes(q) || 
        p.barcode.includes(q)
      );
    }

    if (activeTab === "out-of-stock") {
      filtered = filtered.filter(p => p.stock === 0);
    } else if (activeTab === "low-stock") {
      filtered = filtered.filter(p => p.stock > 0 && p.stock <= 5); // Arbitrary low stock threshold
    }
    
    return filtered;
  }, [report, search, activeTab]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:m-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المخزون والجرد</h1>
          <p className="text-muted-foreground mt-2">إدارة الكميات وتتبع المنتجات في المستودع</p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          طباعة تقرير الجرد
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted/50 rounded-t-lg" />
              </Card>
            ))}
          </div>
          <Card className="animate-pulse h-[400px]" />
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-4 print:hidden">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(report.totalStockValue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">نفاد المخزون</CardTitle>
                <PackageX className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{report.outOfStock}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">{report.lowStock}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="print:shadow-none print:border-none">
            <div className="p-4 border-b space-y-4 print:hidden">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList>
                  <TabsTrigger value="all">الكل</TabsTrigger>
                  <TabsTrigger value="out-of-stock">نفاد المخزون</TabsTrigger>
                  <TabsTrigger value="low-stock">مخزون منخفض</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالاسم أو الباركود..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            <div className="print:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الباركود</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>المخزون الحالي</TableHead>
                    <TableHead>قيمة المخزون</TableHead>
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
                        <div className="flex items-center gap-2">
                          <span className={
                            product.stock === 0 ? "text-destructive font-bold" :
                            product.stock <= 5 ? "text-amber-500 font-bold" : ""
                          }>
                            {product.stock} {product.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(product.stockValue)}
                      </TableCell>
                      <TableCell>
                        <AdjustStockDialog 
                          product={product} 
                          onAdjust={async (newStock, reason) => {
                            await adjustStock.mutateAsync({
                              id: product.id,
                              data: { newStock, reason }
                            });
                            queryClient.invalidateQueries({ queryKey: getGetInventoryReportQueryKey() });
                            queryClient.invalidateQueries({ queryKey: getGetInventoryInsightsQueryKey() });
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لم يتم العثور على منتجات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Print View */}
            <div className="hidden print:block" id="receipt-print">
              <h2 className="text-xl font-bold mb-4 text-center">تقرير الجرد ({new Date().toLocaleDateString('ar-SA')})</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2 text-right">الباركود</th>
                    <th className="py-2 text-right">المنتج</th>
                    <th className="py-2 text-right">الكمية المسجلة</th>
                    <th className="py-2 text-right">الكمية الفعلية</th>
                    <th className="py-2 text-right">ملاحظات</th>
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

function AdjustStockDialog({ product, onAdjust }: { 
  product: any, 
  onAdjust: (stock: number, reason: string) => Promise<void> 
}) {
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
        <Button variant="outline" size="sm">تعديل المخزون</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>تعديل مخزون {product.nameAr}</DialogTitle>
            <DialogDescription>
              المخزون الحالي: {product.stock} {product.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stock">الكمية الجديدة</Label>
              <Input 
                id="stock"
                type="number"
                min="0"
                step="0.01"
                required
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">سبب التعديل</Label>
              <Input 
                id="reason"
                required
                placeholder="مثال: جرد يدوي، بضاعة تالفة، الخ..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ التعديل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
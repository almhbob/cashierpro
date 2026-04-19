import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetProductByBarcode, 
  useReceiveBatchStock, 
  getGetProductByBarcodeQueryKey,
  getGetInventoryReportQueryKey,
  getGetInventoryInsightsQueryKey,
  getListProductsQueryKey,
  Product,
  ReceiveBatchResult
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Minus, ScanBarcode, PackagePlus, AlertCircle, Printer, RotateCcw, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

interface ReceiveItem {
  product: Product;
  quantity: number;
}

export default function Receive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [items, setItems] = useState<ReceiveItem[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  
  const [barcodeInput, setBarcodeInput] = useState("");
  const [activeBarcode, setActiveBarcode] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  
  const [receipt, setReceipt] = useState<ReceiveBatchResult | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Keep focus on input
  const focusInput = () => {
    if (barcodeInputRef.current && !receipt) {
      barcodeInputRef.current.focus();
    }
  };

  useEffect(() => {
    focusInput();
  }, [receipt]);

  const { data: productResult, isFetching: isProductLoading, error: productError } = useGetProductByBarcode(
    activeBarcode,
    { 
      query: { 
        enabled: !!activeBarcode,
        queryKey: getGetProductByBarcodeQueryKey(activeBarcode),
        retry: false
      } 
    }
  );

  const receiveBatchMutation = useReceiveBatchStock({
    mutation: {
      onSuccess: (data) => {
        setReceipt(data);
        queryClient.invalidateQueries({ queryKey: getGetInventoryReportQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInventoryInsightsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({
          title: "تم الاستلام بنجاح",
          description: "تم تحديث المخزون في النظام",
        });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "خطأ في الاستلام",
          description: err.message || "حدث خطأ غير متوقع",
        });
      }
    }
  });

  // Handle product scan result
  useEffect(() => {
    if (activeBarcode && productResult) {
      handleProductFound(productResult);
      setActiveBarcode("");
    } else if (activeBarcode && productError) {
      setScanError("باركود غير موجود في النظام");
      setTimeout(() => setScanError(null), 3000);
      setActiveBarcode("");
    }
  }, [productResult, productError, activeBarcode]);

  const handleProductFound = (product: Product) => {
    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        const newItems = [...currentItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1
        };
        return newItems;
      } else {
        return [{ product, quantity: 1 }, ...currentItems];
      }
    });

    setScanError(null);
    toast({
      title: `تم إضافة: ${product.nameAr || product.name}`,
      duration: 2000,
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const trimmed = barcodeInput.trim();
    
    // Check if it's already in the list to avoid API call if we just want to increment
    const existingItem = items.find(item => item.product.barcode === trimmed);
    if (existingItem) {
      handleProductFound(existingItem.product);
      setBarcodeInput("");
      return;
    }
    
    setActiveBarcode(trimmed);
    setBarcodeInput("");
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1 || isNaN(newQuantity)) return;
    
    setItems((currentItems) => 
      currentItems.map(item => 
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setItems((currentItems) => currentItems.filter(item => item.product.id !== productId));
    focusInput();
  };

  const handleConfirmAll = () => {
    if (items.length === 0) return;
    
    const payload = {
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };
    
    if (supplierName.trim()) Object.assign(payload, { supplierName: supplierName.trim() });
    if (notes.trim()) Object.assign(payload, { notes: notes.trim() });
    
    receiveBatchMutation.mutate({ data: payload });
  };

  const handleReset = () => {
    setItems([]);
    setSupplierName("");
    setNotes("");
    setReceipt(null);
    setTimeout(focusInput, 100);
  };

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (receipt) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-green-200 shadow-sm">
          <CardHeader className="text-center bg-green-50/50 border-b border-green-100 pb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <PackagePlus className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl text-green-800">تم استلام البضاعة بنجاح</CardTitle>
            <CardDescription className="text-green-600/80 text-lg mt-2">
              تم تحديث المخزون لـ {receipt.totalItemsReceived} منتجات
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div id="receipt-print" className="bg-white p-6 border rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    وثيقة استلام بضاعة
                  </h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    التاريخ: {new Date(receipt.receivedAt).toLocaleString("ar-SA")}
                  </div>
                </div>
                <div className="text-left text-sm text-muted-foreground">
                  {receipt.supplierName && <div>المورد: {receipt.supplierName}</div>}
                  {receipt.notes && <div>ملاحظات: {receipt.notes}</div>}
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-center">الكمية المستلمة</TableHead>
                    <TableHead className="text-center">المخزون السابق</TableHead>
                    <TableHead className="text-center">المخزون الجديد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium text-right">
                        <div>{item.productNameAr}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.barcode}</div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-green-600">+{item.addedQuantity}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{item.previousStock}</TableCell>
                      <TableCell className="text-center font-bold">{item.newStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 py-6 bg-slate-50 border-t">
            <Button onClick={() => window.print()} variant="outline" className="gap-2" size="lg">
              <Printer className="w-5 h-5" />
              طباعة وثيقة الاستلام
            </Button>
            <Button onClick={handleReset} className="gap-2" size="lg">
              <RotateCcw className="w-5 h-5" />
              استلام دفعة جديدة
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50/50" onClick={focusInput}>
      <header className="bg-white border-b px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Truck className="w-6 h-6 text-primary" />
            استلام البضاعة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">مسح أو إدخال الباركود لتسجيل البضاعة الواردة</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input 
            placeholder="اسم المورد (اختياري)" 
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="w-48 bg-slate-50"
            onClick={(e) => e.stopPropagation()}
          />
          <Input 
            placeholder="ملاحظات (اختياري)" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-48 bg-slate-50"
            onClick={(e) => e.stopPropagation()}
          />
          <Button 
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              handleConfirmAll();
            }}
            disabled={items.length === 0 || receiveBatchMutation.isPending}
            className="min-w-[140px] shadow-sm"
          >
            {receiveBatchMutation.isPending ? "جاري التأكيد..." : "تأكيد استلام الكل"}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 overflow-hidden max-w-6xl mx-auto w-full gap-6">
        
        {/* Scanner Area */}
        <Card className="shadow-sm border-slate-200 shrink-0">
          <CardContent className="p-6">
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <div className="flex items-center">
                <div className="absolute right-4 text-slate-400">
                  <ScanBarcode className="w-8 h-8" />
                </div>
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="امسح الباركود أو اكتبه يدوياً..."
                  className="pl-4 pr-16 py-8 text-2xl font-mono text-center bg-slate-100 border-2 focus-visible:border-primary focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  autoFocus
                  disabled={isProductLoading}
                />
              </div>
              {scanError && (
                <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
                  <div className="bg-destructive/10 text-destructive text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {scanError}
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Receiving List */}
        <Card className="flex-1 shadow-sm border-slate-200 overflow-hidden flex flex-col min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <ScanBarcode className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-medium text-slate-600">ابدأ بمسح الباركود لإضافة المنتجات</h3>
              <p className="mt-2 text-slate-400">المنتجات الممسوحة ستظهر هنا في القائمة</p>
            </div>
          ) : (
            <>
              <div className="overflow-auto flex-1 p-0">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="text-right w-[40%]">المنتج</TableHead>
                      <TableHead className="text-right">الفئة / الوحدة</TableHead>
                      <TableHead className="text-center">المخزون الحالي</TableHead>
                      <TableHead className="text-center">الكمية المستلمة</TableHead>
                      <TableHead className="text-center">النتيجة</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.product.id} className="group hover:bg-slate-50/50">
                        <TableCell className="font-medium text-right">
                          <div className="text-base text-slate-900">{item.product.nameAr || item.product.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{item.product.barcode}</div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium">
                            {item.product.category}
                          </span>
                          <span className="mr-2 text-xs">{item.product.unit}</span>
                        </TableCell>
                        <TableCell className="text-center text-slate-500 font-medium">
                          {item.product.stock}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 bg-slate-50 p-1 rounded-lg border w-fit mx-auto" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 rounded-md"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input 
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                              className="w-16 h-8 text-center font-bold text-lg p-0 border-0 bg-transparent focus-visible:ring-0"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 rounded-md"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex flex-col items-center justify-center">
                            <span className="text-xs text-green-600/70 font-medium mb-0.5">سيصبح</span>
                            <span className="font-bold text-lg text-green-600 bg-green-50 px-3 py-0.5 rounded-full border border-green-100">
                              {item.product.stock + item.quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.product.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="bg-slate-50 border-t p-4 px-6 flex items-center justify-between mt-auto">
                <div className="text-sm font-medium text-slate-500">
                  <span>إجمالي الأصناف: <strong className="text-slate-800 text-lg mr-1">{totalItems}</strong></span>
                  <span className="mx-4 text-slate-300">|</span>
                  <span>إجمالي الوحدات المستلمة: <strong className="text-slate-800 text-lg mr-1">{totalQuantity}</strong></span>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
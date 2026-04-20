import { useState, useRef, useEffect, useMemo } from "react";
import { useUser } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { 
  useGetProductByBarcode,
  useCreateSale,
  getGetProductByBarcodeQueryKey 
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Trash2, Plus, Minus, Search, ShoppingCart, UserRound, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { DATE_LOCALES } from "@/i18n";

interface CartItem {
  productId: number;
  barcode: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function Home() {
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.language] ?? "ar-SA";

  const cashierName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.emailAddresses?.[0]?.emailAddress || t("nav.cashier")
    : t("nav.cashier");

  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountPaidStr, setAmountPaidStr] = useState("");
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Keep barcode input focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" && document.activeElement !== barcodeInputRef.current) {
        return;
      }
      barcodeInputRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const amountPaid = parseFloat(amountPaidStr) || 0;
  const change = amountPaid >= total ? amountPaid - total : 0;

  const createSale = useCreateSale();

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const product = await queryClient.fetchQuery({
        queryKey: getGetProductByBarcodeQueryKey(barcode),
        queryFn: async () => {
          const res = await fetch(`/api/products/barcode/${barcode}`);
          if (!res.ok) throw new Error("Product not found");
          return res.json();
        },
        retry: false,
        staleTime: 30_000,
      });

      setCart(prev => {
        const existing = prev.find(item => item.productId === product.id);
        if (existing) {
          return prev.map(item => 
            item.productId === product.id 
              ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
              : item
          );
        }
        return [...prev, {
          productId: product.id,
          barcode: product.barcode,
          nameAr: product.nameAr,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price
        }];
      });
      setBarcode("");
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("pos.productNotFound"),
        variant: "destructive",
      });
      setBarcode("");
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (amountPaid < total) {
      toast({ title: t("common.error"), description: t("pos.change"), variant: "destructive" });
      return;
    }

    createSale.mutate({
      data: {
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
        amountPaid,
        cashierName
      }
    }, {
      onSuccess: (sale) => {
        toast({ title: t("common.success"), description: t("pos.saleSuccess") });
        setLastReceipt({ sale, cart });
        setCart([]);
        setAmountPaidStr("");
      },
      onError: () => {
        toast({ title: t("common.error"), description: t("pos.saleError"), variant: "destructive" });
      }
    });
  };

  if (lastReceipt) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center border-b pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Printer className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">{t("pos.operationSuccess")}</CardTitle>
            <p className="text-muted-foreground mt-2">{t("pos.changeLabel")} {formatCurrency(lastReceipt.sale.change)}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div id="receipt-print" className="bg-white text-black p-4 text-sm font-mono border rounded-md shadow-sm">
              <div className="text-center font-bold text-lg mb-2">{t("pos.ourStore")}</div>
              <div className="text-center mb-4 text-xs text-gray-500">
                {new Date(lastReceipt.sale.createdAt).toLocaleString(dateLocale)}
                <br/>
                {t("pos.cashierLabel")} {lastReceipt.sale.cashierName}
              </div>
              <div className="border-t border-b border-dashed border-gray-300 py-2 mb-2">
                {lastReceipt.cart.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between mb-1">
                    <span className="truncate pr-2">{item.nameAr}</span>
                    <span className="shrink-0">{item.quantity}x {item.unitPrice}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold mb-1">
                <span>{t("pos.totalLabel")}</span>
                <span>{formatCurrency(lastReceipt.sale.total)}</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span>{t("pos.paidLabel")}</span>
                <span>{formatCurrency(lastReceipt.sale.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{t("pos.changeLabel")}</span>
                <span>{formatCurrency(lastReceipt.sale.change)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" className="w-full" onClick={() => window.print()}>
              <Printer className="ml-2 h-4 w-4" /> {t("pos.printReceipt")}
            </Button>
            <Button className="w-full" onClick={() => setLastReceipt(null)}>
              {t("pos.newOrder")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-muted/30">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          {t("pos.title")}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{cashierName}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-card border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={barcodeInputRef}
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder={t("pos.barcodePlaceholder")}
                className="h-12 pl-4 pr-10 text-lg bg-background"
                autoFocus
              />
            </form>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <ShoppingCart className="h-16 w-16 opacity-20" />
                <p className="text-lg">{t("pos.cartEmpty")}</p>
              </div>
            ) : (
              <table className="w-full" style={{ textAlign: "inherit" }}>
                <thead className="text-muted-foreground text-sm border-b">
                  <tr>
                    <th className="pb-3 font-medium">{t("pos.colProduct")}</th>
                    <th className="pb-3 font-medium w-32 text-center">{t("pos.colQty")}</th>
                    <th className="pb-3 font-medium w-24">{t("pos.colPrice")}</th>
                    <th className="pb-3 font-medium w-24">{t("pos.colTotal")}</th>
                    <th className="pb-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0 group hover:bg-muted/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold">{item.nameAr}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{item.barcode}</div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(idx, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(idx, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-4 font-medium">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-4 font-bold text-primary">{formatCurrency(item.subtotal)}</td>
                      <td className="py-4 text-left">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="w-96 shrink-0 flex flex-col gap-4">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-lg">{t("pos.orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-muted-foreground text-lg">{t("pos.subtotal")}</span>
                <span className="text-4xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
              
              <div className="space-y-3 pt-6 border-t">
                <label className="text-sm font-medium">{t("pos.amountPaid")}</label>
                <Input 
                  type="number" 
                  className="h-14 text-2xl text-left bg-muted/50 font-bold" 
                  value={amountPaidStr}
                  onChange={e => setAmountPaidStr(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">{t("pos.change")}</span>
                <span className={`text-xl font-bold ${change > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {formatCurrency(change)}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/20 border-t">
              <Button 
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
                disabled={cart.length === 0 || amountPaid < total || createSale.isPending}
                onClick={handleCheckout}
              >
                {createSale.isPending ? t("pos.processing") : t("pos.completeSale")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

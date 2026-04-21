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
import { Trash2, Plus, Minus, Search, ShoppingCart, UserRound, Printer, MessageCircle, Tag, User, Phone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { DATE_LOCALES } from "@/i18n";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  productId: number;
  barcode: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/* ── helpers ── */
function getPrinterCSS(): string {
  const size = localStorage.getItem("printerSize") || "80mm";
  const paperWidth = size === "58mm" ? "58mm" : size === "a4" ? "210mm" : "80mm";
  const fontSize = size === "a4" ? "12pt" : "10pt";
  const bodyWidth = size === "a4" ? "190mm" : paperWidth;
  return `
    @page { size: ${paperWidth} auto; margin: ${size === "a4" ? "15mm" : "3mm"}; }
    body { font-family: 'Courier New', monospace; font-size: ${fontSize}; width: ${bodyWidth}; margin: 0; direction: rtl; }
    .receipt-center { text-align: center; }
    .receipt-bold { font-weight: bold; }
    .receipt-line { border-top: 1px dashed #555; margin: 4px 0; }
    .receipt-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .receipt-small { font-size: 0.82em; color: #444; }
    .receipt-title { font-size: 1.25em; font-weight: bold; text-align: center; margin-bottom: 4px; }
    .receipt-footer { font-size: 0.78em; text-align: center; margin-top: 8px; color: #333; }
    .receipt-vat { font-size: 0.85em; }
  `;
}

function buildReceiptHTML(
  storeName: string,
  storePhone: string,
  storeAddress: string,
  receiptHeader: string,
  receiptFooter: string,
  vatNumber: string,
  vatRate: number,
  cart: CartItem[],
  saleData: any,
  cashierName: string,
  customerName: string,
  customerPhone: string,
  discount: number,
  dateLocale: string,
  invoiceNo: string | number
): string {
  const subtotalBeforeDiscount = cart.reduce((s, i) => s + i.subtotal, 0);
  const afterDiscount = subtotalBeforeDiscount - discount;
  const vatBase = afterDiscount / (1 + vatRate / 100);
  const vatAmount = afterDiscount - vatBase;

  const itemsHtml = cart.map(item =>
    `<div class="receipt-row"><span>${item.nameAr}</span><span>${item.quantity}x ${item.unitPrice.toFixed(2)}</span></div>
     <div class="receipt-row receipt-small"><span></span><span>${item.subtotal.toFixed(2)}</span></div>`
  ).join("");

  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
  <style>${getPrinterCSS()}</style></head><body>
    <div class="receipt-title">${storeName || "متجرنا"}</div>
    ${storeAddress ? `<div class="receipt-center receipt-small">${storeAddress}</div>` : ""}
    ${storePhone ? `<div class="receipt-center receipt-small">${storePhone}</div>` : ""}
    ${receiptHeader ? `<div class="receipt-center receipt-small" style="margin-top:3px;">${receiptHeader}</div>` : ""}
    <div class="receipt-line"></div>
    <div class="receipt-row receipt-small"><span>فاتورة رقم</span><span>#${invoiceNo}</span></div>
    <div class="receipt-row receipt-small"><span>التاريخ</span><span>${new Date(saleData.createdAt).toLocaleString(dateLocale)}</span></div>
    <div class="receipt-row receipt-small"><span>الكاشير</span><span>${cashierName}</span></div>
    ${customerName ? `<div class="receipt-row receipt-small"><span>العميل</span><span>${customerName}</span></div>` : ""}
    ${customerPhone ? `<div class="receipt-row receipt-small"><span>الهاتف</span><span>${customerPhone}</span></div>` : ""}
    <div class="receipt-line"></div>
    ${itemsHtml}
    <div class="receipt-line"></div>
    ${discount > 0 ? `<div class="receipt-row receipt-vat"><span>المجموع</span><span>${subtotalBeforeDiscount.toFixed(2)}</span></div>
    <div class="receipt-row receipt-vat"><span>الخصم</span><span>-${discount.toFixed(2)}</span></div>` : ""}
    <div class="receipt-row receipt-vat"><span>قبل الضريبة</span><span>${vatBase.toFixed(2)}</span></div>
    <div class="receipt-row receipt-vat"><span>ضريبة القيمة المضافة ${vatRate}%</span><span>${vatAmount.toFixed(2)}</span></div>
    <div class="receipt-line"></div>
    <div class="receipt-row receipt-bold" style="font-size:1.1em;"><span>الإجمالي</span><span>${saleData.total.toFixed(2)}</span></div>
    <div class="receipt-row receipt-small"><span>المدفوع</span><span>${saleData.amountPaid.toFixed(2)}</span></div>
    <div class="receipt-row receipt-small"><span>الباقي</span><span>${saleData.change.toFixed(2)}</span></div>
    ${vatNumber ? `<div class="receipt-line"></div><div class="receipt-center receipt-small">الرقم الضريبي: ${vatNumber}</div>` : ""}
    <div class="receipt-footer">${receiptFooter || "شكراً لزيارتكم"}</div>
  </body></html>`;
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
  const [discountStr, setDiscountStr] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /* ── store settings from API (for receipt) ── */
  const [storeSettings, setStoreSettings] = useState<any>({});
  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.ok ? r.json() : null).then(d => { if (d) setStoreSettings(d); }).catch(() => {});
  }, []);

  /* ── Focus barcode input on keydown (when not in another field) ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" && document.activeElement !== barcodeInputRef.current) return;
      barcodeInputRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const discount = parseFloat(discountStr) || 0;
  const subtotalRaw = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const total = Math.max(0, subtotalRaw - discount);
  const vatRate = parseFloat(storeSettings.vatRate || "15");
  const vatBase = total / (1 + vatRate / 100);
  const vatAmount = total - vatBase;
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
    } catch {
      toast({ title: t("common.error"), description: t("pos.productNotFound"), variant: "destructive" });
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

  /* ── Print receipt in a new window with correct paper CSS ── */
  const printReceipt = (saleData: any) => {
    const html = buildReceiptHTML(
      storeSettings.storeName || storeSettings.storeNameEn || "",
      storeSettings.phone || "",
      storeSettings.address || "",
      storeSettings.receiptHeader || "",
      storeSettings.receiptFooter || "",
      storeSettings.vatNumber || "",
      vatRate,
      cart,
      saleData,
      cashierName,
      customerName,
      customerPhone,
      discount,
      dateLocale,
      saleData.id || Math.floor(Math.random() * 900000 + 100000)
    );
    const w = window.open("", "_blank", "width=500,height=700");
    if (!w) { window.print(); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 600);
  };

  /* ── Send receipt via WhatsApp ── */
  const sendWhatsApp = (saleData: any) => {
    const phone = customerPhone.replace(/\D/g, "");
    if (!phone) {
      toast({ title: t("common.error"), description: "أدخل رقم هاتف العميل أولاً", variant: "destructive" });
      return;
    }
    const storeName = storeSettings.storeName || storeSettings.storeNameEn || "متجرنا";
    const invoiceNo = saleData.id || "—";
    const dateStr = new Date(saleData.createdAt).toLocaleString(dateLocale);

    let itemLines = cart.map(i => `• ${i.nameAr} — ${i.quantity}×${i.unitPrice} = ${i.subtotal.toFixed(2)}`).join("\n");
    if (discount > 0) itemLines += `\n🏷️ خصم: -${discount.toFixed(2)}`;

    const msg = [
      `🧾 *فاتورة من ${storeName}*`,
      `رقم الفاتورة: #${invoiceNo}`,
      `التاريخ: ${dateStr}`,
      `─────────────────`,
      itemLines,
      `─────────────────`,
      `💰 *الإجمالي: ${saleData.total.toFixed(2)} ${storeSettings.currency || "ر.س"}*`,
      `📋 ضريبة القيمة المضافة (${vatRate}%): ${vatAmount.toFixed(2)}`,
      `💵 المدفوع: ${saleData.amountPaid.toFixed(2)}`,
      `🔄 الباقي: ${saleData.change.toFixed(2)}`,
      `─────────────────`,
      storeSettings.receiptFooter || "شكراً لزيارتكم! 🙏",
    ].join("\n");

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    toast({ title: t("pos.whatsappSent") });
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
        const receipt = { sale, cart: [...cart], customerName, customerPhone, discount };
        setLastReceipt(receipt);
        /* auto-print if enabled */
        if (localStorage.getItem("autoPrint") === "true") {
          setTimeout(() => printReceipt(sale), 300);
        }
        setCart([]);
        setAmountPaidStr("");
        setDiscountStr("");
        setCustomerName("");
        setCustomerPhone("");
      },
      onError: () => {
        toast({ title: t("common.error"), description: t("pos.saleError"), variant: "destructive" });
      }
    });
  };

  /* ─────────────────────── RECEIPT VIEW ─────────────────────── */
  if (lastReceipt) {
    const { sale, cart: rCart, customerName: rCName, customerPhone: rCPhone, discount: rDiscount } = lastReceipt;
    const rSubtotal = rCart.reduce((s: number, i: CartItem) => s + i.subtotal, 0);
    const rAfterDisc = rSubtotal - (rDiscount || 0);
    const rVatBase = rAfterDisc / (1 + vatRate / 100);
    const rVatAmt = rAfterDisc - rVatBase;
    const storeName = storeSettings.storeName || storeSettings.storeNameEn || t("pos.ourStore");
    const invoiceNo = sale.id || Math.floor(Math.random() * 900000 + 100000);

    const doPrint = () => printReceipt(sale);
    const doWhatsApp = () => sendWhatsApp(sale);

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Printer className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">{t("pos.operationSuccess")}</h2>
            <p className="text-green-100 text-sm mt-1">الفاتورة #{ invoiceNo }</p>
          </div>

          <CardContent className="p-5">
            {/* Receipt preview */}
            <div className="bg-gray-50 border rounded-xl p-4 font-mono text-sm space-y-1 text-gray-800">
              <div className="text-center font-bold text-base mb-1">{storeName}</div>
              {storeSettings.address && <div className="text-center text-xs text-gray-500">{storeSettings.address}</div>}
              {storeSettings.phone && <div className="text-center text-xs text-gray-500">{storeSettings.phone}</div>}
              {storeSettings.receiptHeader && <div className="text-center text-xs text-gray-500 italic">{storeSettings.receiptHeader}</div>}
              <div className="border-t border-dashed border-gray-300 my-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{new Date(sale.createdAt).toLocaleString(dateLocale)}</span>
                <span>{cashierName}</span>
              </div>
              {rCName && <div className="flex justify-between text-xs"><span>{t("pos.customerLabel")}</span><span>{rCName}</span></div>}
              {rCPhone && <div className="flex justify-between text-xs"><span>{t("pos.customerPhone")}:</span><span dir="ltr">{rCPhone}</span></div>}
              <div className="border-t border-dashed border-gray-300 my-2" />
              {rCart.map((item: CartItem, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate pr-2">{item.nameAr}</span>
                  <span className="shrink-0 text-gray-600">{item.quantity}x {item.unitPrice.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-gray-300 my-2" />
              {rDiscount > 0 && (
                <>
                  <div className="flex justify-between text-xs"><span>المجموع</span><span>{rSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs text-red-600"><span>{t("pos.discountLabel")}</span><span>-{rDiscount.toFixed(2)}</span></div>
                </>
              )}
              <div className="flex justify-between text-xs text-gray-500"><span>قبل الضريبة</span><span>{rVatBase.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-gray-500"><span>ضريبة {vatRate}%</span><span>{rVatAmt.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1">
                <span>{t("pos.totalLabel")}</span>
                <span className="text-green-700">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-xs"><span>{t("pos.paidLabel")}</span><span>{formatCurrency(sale.amountPaid)}</span></div>
              <div className="flex justify-between text-xs font-medium text-blue-600"><span>{t("pos.changeLabel")}</span><span>{formatCurrency(sale.change)}</span></div>
              {storeSettings.vatNumber && (
                <div className="text-center text-xs text-gray-400 mt-1">الرقم الضريبي: {storeSettings.vatNumber}</div>
              )}
              <div className="text-center text-xs text-gray-500 mt-2">{storeSettings.receiptFooter || "شكراً لزيارتكم"}</div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-3 p-4 bg-gray-50 border-t flex-wrap">
            <Button
              variant="outline"
              className="flex-1 gap-2 min-w-[120px]"
              onClick={doPrint}
            >
              <Printer className="h-4 w-4" /> {t("pos.printReceipt")}
            </Button>
            <Button
              className="flex-1 gap-2 min-w-[120px] bg-green-600 hover:bg-green-700 text-white"
              onClick={doWhatsApp}
              disabled={!rCPhone}
              title={!rCPhone ? "أدخل رقم هاتف العميل أولاً" : ""}
            >
              <MessageCircle className="h-4 w-4" /> {t("pos.sendWhatsApp")}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setLastReceipt(null)}
            >
              {t("pos.newOrder")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  /* ─────────────────────── POS VIEW ─────────────────────── */
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
        {/* Cart Area */}
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
                        <Button
                          size="icon" variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeItem(idx)}
                        >
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

        {/* Order Summary Panel */}
        <div className="w-96 shrink-0 flex flex-col gap-4 overflow-y-auto">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-lg">{t("pos.orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Customer fields */}
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={t("pos.customerName")}
                    className="pr-9"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder={t("pos.customerPhonePlaceholder")}
                    className="pr-9"
                    dir="ltr"
                    type="tel"
                  />
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>المجموع الجزئي</span>
                  <span>{formatCurrency(subtotalRaw)}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="number"
                    value={discountStr}
                    onChange={e => setDiscountStr(e.target.value)}
                    placeholder={t("pos.discountPlaceholder")}
                    className="h-9 text-sm"
                    dir="ltr"
                    min="0"
                  />
                  {discount > 0 && <span className="text-red-500 text-sm font-medium shrink-0">-{formatCurrency(discount)}</span>}
                </div>

                {/* VAT breakdown */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>قبل الضريبة</span>
                  <span>{formatCurrency(vatBase)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>ضريبة القيمة المضافة {vatRate}%</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-2 border-t">
                <span className="text-muted-foreground text-lg">{t("pos.subtotal")}</span>
                <span className="text-4xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
              
              <div className="space-y-2 pt-2">
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

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("pos.change")}</span>
                <span className={`text-xl font-bold ${change > 0 ? "text-green-600" : "text-muted-foreground"}`}>
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

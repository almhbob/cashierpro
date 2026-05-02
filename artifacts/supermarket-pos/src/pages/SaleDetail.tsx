import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { useGetSale, getGetSaleQueryKey } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Copy,
  FileDown,
  Printer,
  QrCode,
  ReceiptText,
  Store,
  User,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DATE_LOCALES } from "@/i18n";

function InvoiceMetaCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4 print:border-black/20 print:bg-white">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground print:text-black/60">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="break-words text-sm font-bold text-foreground print:text-black">{value}</p>
    </div>
  );
}

function makeVerificationCode(parts: Array<string | number | null | undefined>) {
  const input = parts.filter(Boolean).join("|");
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(8, "0").slice(-8);
}

function VerificationPattern({ code }: { code: string }) {
  const bits = Array.from({ length: 49 }, (_, index) => {
    const char = code.charCodeAt(index % code.length);
    return (char + index * 7) % 3 !== 0;
  });

  return (
    <div className="grid h-32 w-32 shrink-0 grid-cols-7 gap-1 rounded-2xl border bg-white p-3 print:h-28 print:w-28 print:border-black/20">
      {bits.map((active, index) => (
        <span key={index} className={active ? "rounded-sm bg-slate-900" : "rounded-sm bg-slate-100 print:bg-white"} />
      ))}
    </div>
  );
}

export default function SaleDetail() {
  const { id } = useParams();
  const saleId = Number(id);
  const { data: sale, isLoading } = useGetSale(saleId, {
    query: { enabled: Number.isFinite(saleId), queryKey: getGetSaleQueryKey(saleId) },
  });
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.language] ?? "ar-SA";

  const invoiceDate = useMemo(() => {
    if (!sale?.createdAt) return "";
    return new Date(sale.createdAt).toLocaleString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [dateLocale, sale?.createdAt]);

  const customerName = "عميل نقدي";
  const itemCount = sale?.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0;
  const invoiceUrl = typeof window !== "undefined" ? window.location.href : "";
  const verificationCode = sale
    ? makeVerificationCode([sale.id, sale.createdAt, sale.total, sale.amountPaid, sale.cashierName])
    : "--------";

  const shareText = sale
    ? [
        `🧾 فاتورة من ${t("pos.ourStore")}`,
        `رقم الفاتورة: #${sale.id}`,
        `رمز التحقق: ${verificationCode}`,
        `التاريخ: ${invoiceDate}`,
        `العميل: ${customerName}`,
        `الإجمالي: ${formatCurrency(sale.total)}`,
        invoiceUrl ? `رابط الفاتورة: ${invoiceUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const printInvoice = (pdfMode = false) => {
    const previousTitle = document.title;
    if (pdfMode && sale) {
      document.title = `CashierPro-Invoice-${sale.id}`;
    }
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  };

  const shareOrCopyInvoice = async () => {
    if (!shareText) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: `فاتورة #${sale?.id}`, text: shareText, url: invoiceUrl || undefined });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      window.alert("تم نسخ نص الفاتورة. يمكنك لصقه في واتساب أو أي تطبيق آخر.");
    } catch {
      window.alert("لم يتم النسخ تلقائياً. انسخ بيانات الفاتورة يدوياً من الصفحة.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-8">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <ReceiptText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-black">تعذر عرض الفاتورة</h1>
          <p className="mb-6 text-muted-foreground">{t("common.error")}</p>
          <Link href="/sales">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="h-4 w-4" /> {t("sales.back")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-teal-50/60 p-4 sm:p-8 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-5xl">
        <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">فاتورة بيع</p>
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">#{sale.id}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sales">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="h-4 w-4" /> {t("sales.back")}
              </Button>
            </Link>
            <Button onClick={() => printInvoice(false)} className="gap-2 shadow-lg shadow-primary/20">
              <Printer className="h-4 w-4" /> {t("pos.printReceipt")}
            </Button>
            <Button onClick={() => printInvoice(true)} variant="secondary" className="gap-2">
              <FileDown className="h-4 w-4" /> حفظ PDF
            </Button>
            <Button onClick={shareOrCopyInvoice} variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Copy className="h-4 w-4" /> مشاركة/نسخ
            </Button>
          </div>
        </div>

        <Card id="receipt-print" className="overflow-hidden border-0 shadow-2xl print:w-full print:border-0 print:shadow-none">
          <div className="relative overflow-hidden bg-gradient-to-l from-teal-700 via-teal-600 to-emerald-600 p-6 text-white print:bg-white print:p-5 print:text-black">
            <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-white/10 print:hidden" />
            <div className="absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-black/10 print:hidden" />

            <CardHeader className="relative z-10 grid gap-6 p-0 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-3xl backdrop-blur print:border print:border-black/20 print:bg-white print:text-black">
                  🏪
                </div>
                <div>
                  <CardTitle className="text-3xl font-black tracking-tight print:text-black">{t("pos.ourStore")}</CardTitle>
                  <p className="mt-1 text-sm text-teal-50 print:text-black/70">CashierPro • نظام إدارة المبيعات والمخزون</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur print:border print:border-black/20 print:bg-white">
                <div className="mb-1 flex items-center justify-center gap-2 text-sm text-teal-50 print:text-black/70">
                  <BadgeCheck className="h-4 w-4" />
                  <span>مدفوعة</span>
                </div>
                <p className="text-2xl font-black print:text-black">{formatCurrency(sale.total)}</p>
              </div>
            </CardHeader>
          </div>

          <CardContent className="space-y-6 p-6 print:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InvoiceMetaCard icon={ReceiptText} label={t("pos.invoiceNo")} value={`#${sale.id}`} />
              <InvoiceMetaCard icon={CalendarClock} label={t("pos.dateLabel")} value={invoiceDate} />
              <InvoiceMetaCard icon={User} label="العميل" value={customerName} />
              <InvoiceMetaCard icon={User} label={t("pos.cashierLabel")} value={sale.cashierName || "—"} />
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white print:rounded-none print:border-black/20">
              <table className="w-full border-collapse text-sm" style={{ textAlign: "inherit" }}>
                <thead className="bg-slate-100 text-slate-600 print:bg-white print:text-black">
                  <tr>
                    <th className="p-4 font-black">#</th>
                    <th className="p-4 font-black">{t("pos.colProduct")}</th>
                    <th className="p-4 font-black">{t("pos.colQty")}</th>
                    <th className="p-4 font-black">{t("pos.colPrice")}</th>
                    <th className="p-4 font-black">{t("pos.colTotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, i) => (
                    <tr key={i} className="border-t border-slate-100 print:border-black/20">
                      <td className="p-4 text-muted-foreground print:text-black/60">{i + 1}</td>
                      <td className="p-4 font-bold text-foreground print:text-black">{item.productNameAr}</td>
                      <td className="p-4 font-medium">{item.quantity}</td>
                      <td className="p-4 whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-4 whitespace-nowrap font-black text-primary print:text-black">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <div className="rounded-2xl border bg-muted/30 p-5 print:border-black/20 print:bg-white">
                <div className="mb-3 flex items-center gap-2 font-black">
                  <Store className="h-5 w-5 text-primary print:text-black" />
                  <span>ملاحظات الفاتورة</span>
                </div>
                <p className="text-sm leading-7 text-muted-foreground print:text-black/70">
                  شكراً لتعاملكم معنا. يرجى الاحتفاظ بالفاتورة للمراجعة أو الاستبدال حسب سياسة المتجر.
                </p>
                <p className="mt-3 text-xs text-muted-foreground print:text-black/60">
                  عدد الأصناف/الكميات: <span className="font-bold text-foreground print:text-black">{itemCount}</span>
                </p>

                <div className="mt-5 flex flex-col gap-4 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center print:border-black/20">
                  <VerificationPattern code={verificationCode} />
                  <div>
                    <div className="mb-2 flex items-center gap-2 font-black">
                      <QrCode className="h-5 w-5 text-primary print:text-black" />
                      <span>رمز تحقق داخلي</span>
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground print:text-black/70">
                      استخدم الرمز لمطابقة بيانات الفاتورة عند المراجعة أو خدمة العملاء.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 print:border print:border-black/20 print:bg-white print:text-black">
                      <CheckCircle2 className="h-4 w-4" />
                      {verificationCode}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm print:border-black/20 print:shadow-none">
                <div className="mb-4 text-lg font-black">ملخص الدفع</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground print:text-black/70">{t("pos.totalLabel")}</span>
                    <span className="font-bold">{formatCurrency(sale.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground print:text-black/70">{t("pos.paidLabel")}</span>
                    <span className="font-bold">{formatCurrency(sale.amountPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground print:text-black/70">{t("pos.changeLabel")}</span>
                    <span className="font-bold">{formatCurrency(sale.change)}</span>
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground print:border print:border-black print:bg-white print:text-black">
                      <span className="font-black">الإجمالي النهائي</span>
                      <span className="text-xl font-black">{formatCurrency(sale.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-5 text-center text-xs leading-6 text-muted-foreground print:text-black/70">
              <p className="font-bold text-foreground print:text-black">كاشير برو — إدارة متجر أسرع، فواتير أوضح، تقارير أدق</p>
              <p>تم إنشاء هذه الفاتورة إلكترونياً ولا تحتاج إلى توقيع.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

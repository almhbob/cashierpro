import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTenant } from "@/context/TenantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, CheckCircle2, ChevronLeft, ChevronRight, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STORE_TYPES = [
  { id: "supermarket", label: "سوبر ماركت", icon: "🛒" },
  { id: "grocery",     label: "بقالة",       icon: "🏪" },
  { id: "minimart",    label: "مينيمارت",    icon: "🏬" },
  { id: "pharmacy",    label: "صيدلية",      icon: "💊" },
  { id: "bakery",      label: "مخبز",        icon: "🥖" },
  { id: "other",       label: "أخرى",        icon: "🏢" },
];

const LICENSE_ERRORS: Record<string, string> = {
  no_key:       "يرجى إدخال مفتاح الترخيص",
  not_found:    "مفتاح الترخيص غير صحيح، تحقق من المفتاح وأعد المحاولة",
  revoked:      "تم إلغاء هذا الترخيص، تواصل مع الدعم",
  expired:      "انتهت صلاحية هذا الترخيص",
  already_used: "هذا المفتاح مستخدم بالفعل لمتجر آخر",
};

export default function Onboarding() {
  const { refetch } = useTenant();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [licenseValid, setLicenseValid] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const [form, setForm] = useState({
    licenseKey: "",
    name: "",
    nameEn: "",
    storeType: "",
    phone: "",
    address: "",
    vatNumber: "",
  });

  /* ── License check mutation ─────────────────── */
  const checkLicense = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tenants/me/check-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: form.licenseKey }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    onSuccess: () => {
      setLicenseValid(true);
      setLicenseError("");
      setStep(1);
    },
    onError: (err: any) => {
      setLicenseValid(false);
      setLicenseError(LICENSE_ERRORS[err?.reason] ?? "مفتاح الترخيص غير صالح");
    },
  });

  /* ── Final submit mutation ──────────────────── */
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tenants/me/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    onSuccess: () => {
      toast({ title: "تم إنشاء متجرك بنجاح!" });
      refetch();
    },
    onError: (err: any) => {
      const msg = err?.error ?? "حدث خطأ، يرجى المحاولة مجدداً";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const steps = [
    { label: "الترخيص",  num: 0 },
    { label: "اسم المتجر", num: 1 },
    { label: "نوع النشاط", num: 2 },
    { label: "معلومات التواصل", num: 3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Store className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">أهلاً بك في نظام الكاشير</h1>
          <p className="text-slate-500">أنشئ متجرك خلال دقيقة واحدة</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                step === s.num ? "bg-primary text-white shadow-md" :
                step > s.num ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
              )}>
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : <span>{s.num + 1}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-px w-5 transition-colors", step > s.num ? "bg-green-300" : "bg-slate-200")} />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-8">

            {/* ── Step 0: License Key ─────────────────── */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-amber-50 rounded-xl">
                      <KeyRound className="h-8 w-8 text-amber-500" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold">أدخل مفتاح الترخيص</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    احصل على مفتاحك من المطور — كل متجر يحتاج مفتاحاً خاصاً
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>مفتاح الترخيص *</Label>
                  <Input
                    placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
                    value={form.licenseKey}
                    onChange={e => {
                      setLicenseError("");
                      setForm(f => ({ ...f, licenseKey: e.target.value.toUpperCase() }));
                    }}
                    className={cn(
                      "h-12 text-center font-mono text-lg tracking-widest",
                      licenseError ? "border-red-400 focus-visible:ring-red-400" : ""
                    )}
                    dir="ltr"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === "Enter" && form.licenseKey.trim()) checkLicense.mutate();
                    }}
                  />
                  {licenseError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {licenseError}
                    </p>
                  )}
                  {licenseValid && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> الترخيص صالح
                    </p>
                  )}
                </div>

                <Button
                  className="w-full h-12 text-base gap-2"
                  onClick={() => checkLicense.mutate()}
                  disabled={!form.licenseKey.trim() || checkLicense.isPending}
                >
                  {checkLicense.isPending
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> جاري التحقق...</>
                    : <>التحقق من الترخيص <ChevronLeft className="h-5 w-5" /></>
                  }
                </Button>

                <div className="text-center pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    للحصول على ترخيص تواصل مع:{" "}
                    <a href="mailto:Almhbob.iii@gmail.com" className="text-primary underline">
                      Almhbob.iii@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 1: Store Name ──────────────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold">ما اسم متجرك؟</h2>
                  <p className="text-muted-foreground text-sm mt-1">سيظهر هذا الاسم على الفواتير والإيصالات</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>اسم المتجر بالعربية *</Label>
                    <Input
                      placeholder="مثال: سوبر ماركت الرحمة"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="text-lg h-12"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المتجر بالإنجليزية</Label>
                    <Input
                      placeholder="Al Rahma Supermarket"
                      value={form.nameEn}
                      onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                      className="h-12"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 px-4" onClick={() => setStep(0)}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    className="flex-1 h-12 text-base gap-2"
                    onClick={() => setStep(2)}
                    disabled={!form.name.trim()}
                  >
                    التالي <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: Store Type ──────────────────── */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold">ما نوع نشاطك التجاري؟</h2>
                  <p className="text-muted-foreground text-sm mt-1">يساعدنا هذا في تخصيص النظام لك</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {STORE_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setForm(f => ({ ...f, storeType: type.id }))}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all hover:border-primary",
                        form.storeType === type.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-slate-200"
                      )}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                    <ChevronRight className="h-5 w-5" /> رجوع
                  </Button>
                  <Button
                    className="flex-1 h-12 gap-2"
                    onClick={() => setStep(3)}
                    disabled={!form.storeType}
                  >
                    التالي <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Contact Info ────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold">معلومات التواصل</h2>
                  <p className="text-muted-foreground text-sm mt-1">تظهر على الفواتير (يمكن تغييرها لاحقاً)</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input
                      placeholder="+966 5x xxx xxxx"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      dir="ltr"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      placeholder="المدينة، الحي، الشارع"
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الرقم الضريبي (اختياري)</Label>
                    <Input
                      placeholder="3xxxxxxxxxxxxxxxxx"
                      value={form.vatNumber}
                      onChange={e => setForm(f => ({ ...f, vatNumber: e.target.value }))}
                      dir="ltr"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>
                    <ChevronRight className="h-5 w-5" /> رجوع
                  </Button>
                  <Button
                    className="flex-1 h-12 gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending
                      ? <><Loader2 className="h-5 w-5 animate-spin" /> جاري الإنشاء...</>
                      : <>إنشاء المتجر <CheckCircle2 className="h-5 w-5" /></>
                    }
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          كاشير برو — نظام إدارة المتاجر الاحترافي
        </p>
      </div>
    </div>
  );
}

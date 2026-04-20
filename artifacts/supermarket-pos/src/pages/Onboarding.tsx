import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTenant } from "@/context/TenantContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, CheckCircle2, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STORE_TYPES = [
  { id: "supermarket", label: "سوبر ماركت", icon: "🛒" },
  { id: "grocery",     label: "بقالة",       icon: "🏪" },
  { id: "minimart",    label: "مينيمارت",    icon: "🏬" },
  { id: "pharmacy",    label: "صيدلية",      icon: "💊" },
  { id: "bakery",      label: "مخبز",        icon: "🥖" },
  { id: "other",       label: "أخرى",        icon: "🏢" },
];

export default function Onboarding() {
  const { refetch } = useTenant();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    storeType: "",
    phone: "",
    address: "",
    vatNumber: "",
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tenants/me/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("فشل إنشاء المتجر");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم إنشاء متجرك بنجاح!" });
      refetch();
    },
    onError: () => toast({ title: "حدث خطأ، يرجى المحاولة مجدداً", variant: "destructive" }),
  });

  const steps = [
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
        <div className="flex items-center justify-center gap-3">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                step === s.num ? "bg-primary text-white shadow-md" :
                step > s.num ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
              )}>
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : <span>{s.num}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={cn("h-px w-8 transition-colors", step > s.num ? "bg-green-300" : "bg-slate-200")} />}
            </div>
          ))}
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {/* Step 1: Store Name */}
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
                <Button
                  className="w-full h-12 text-base gap-2"
                  onClick={() => setStep(2)}
                  disabled={!form.name.trim()}
                >
                  التالي <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Step 2: Store Type */}
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

            {/* Step 3: Contact Info */}
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
                    {completeMutation.isPending ? "جاري الإنشاء..." : <>إنشاء المتجر <CheckCircle2 className="h-5 w-5" /></>}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          بدء تجربة مجانية لمدة 14 يوماً · لا يلزم بطاقة ائتمانية
        </p>
      </div>
    </div>
  );
}

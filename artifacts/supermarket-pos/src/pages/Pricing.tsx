import { SAAS_PLANS } from "@/lib/saasPlans";
import { Card, CardContent } from "@/components/ui/card";

export default function Pricing() {
  return (
    <div className="min-h-full bg-slate-50 p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900">باقات فوترة للشركات</h1>
          <p className="mt-3 text-slate-600">نظام قابل للتأجير الشهري لعدة شركات مع حدود استخدام واضحة.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {SAAS_PLANS.map((plan) => (
            <Card key={plan.id} className={plan.recommended ? "border-2 border-teal-500" : "border"}>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="text-2xl font-black">{plan.arName}</h2>
                  <p className="text-sm text-slate-500">{plan.enName}</p>
                </div>
                <p className="text-sm leading-7 text-slate-600">{plan.descriptionAr}</p>
                <div className="text-3xl font-black text-teal-700">{plan.monthlyPriceSar} ر.س</div>
                <div className="rounded-xl bg-slate-100 p-4 text-sm leading-7">
                  <p>الفروع: {plan.limits.branches}</p>
                  <p>المستخدمون: {plan.limits.users}</p>
                  <p>المنتجات: {plan.limits.products}</p>
                  <p>الفواتير شهريًا: {plan.limits.invoicesPerMonth}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

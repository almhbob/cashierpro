import { useMemo, useState } from "react";

const plans = [
  { name: "الأساسية", price: "49", users: "3 مستخدمين", branches: "فرع واحد", invoices: "1,000 فاتورة / شهر" },
  { name: "الاحترافية", price: "149", users: "20 مستخدم", branches: "5 فروع", invoices: "20,000 فاتورة / شهر", featured: true },
  { name: "الشركات", price: "399", users: "200 مستخدم", branches: "50 فرع", invoices: "250,000 فاتورة / شهر" },
];

const stats = [
  ["الشركات", "12"],
  ["الفواتير", "8,420"],
  ["الإيراد الشهري", "14,900 ر.س"],
  ["حالة النظام", "نشط"],
];

function App() {
  const [active, setActive] = useState("dashboard");
  const today = useMemo(() => new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }), []);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-5 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500 text-2xl font-black">ف</div>
            <div>
              <h1 className="text-2xl font-black">فوترة | Fotr</h1>
              <p className="text-sm text-slate-300">منصة SaaS لتأجير نظام الفواتير للشركات</p>
            </div>
          </div>
          <div className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-300">GitHub Pages Demo — {today}</div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
            {[
              ["dashboard", "لوحة التحكم"],
              ["plans", "باقات التأجير"],
              ["companies", "إدارة الشركات"],
              ["zatca", "السعودية / ZATCA"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`mb-2 w-full rounded-2xl px-4 py-3 text-right font-bold transition ${active === id ? "bg-teal-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
              >
                {label}
              </button>
            ))}
          </aside>

          <section className="space-y-6">
            {active === "dashboard" && (
              <>
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-teal-600 to-emerald-700 p-8 shadow-2xl">
                  <p className="mb-3 text-sm font-bold text-teal-100">جاهز للعرض والبيع</p>
                  <h2 className="mb-4 text-4xl font-black leading-tight">نظام فوترة متعدد الشركات يعمل الآن بدون Backend</h2>
                  <p className="max-w-3xl text-lg leading-9 text-teal-50">هذه نسخة معاينة مستقرة على GitHub Pages. تم تعطيل شرط Clerk والاعتماد على الخادم حتى لا تظهر الشاشة البيضاء. الخطوة التالية هي ربط Firestore/Auth لتصبح منصة SaaS كاملة.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  {stats.map(([label, value]) => (
                    <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-black">{value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {active === "plans" && (
              <div className="grid gap-4 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div key={plan.name} className={`rounded-3xl border p-6 ${plan.featured ? "border-teal-400 bg-teal-500/10" : "border-white/10 bg-white/5"}`}>
                    {plan.featured && <div className="mb-4 inline-block rounded-full bg-teal-400 px-3 py-1 text-xs font-black text-slate-950">الأكثر طلبًا</div>}
                    <h3 className="text-2xl font-black">{plan.name}</h3>
                    <div className="my-5 text-5xl font-black text-teal-300">{plan.price}<span className="text-base text-slate-300"> ر.س / شهر</span></div>
                    <p className="leading-8 text-slate-300">{plan.users}<br />{plan.branches}<br />{plan.invoices}</p>
                  </div>
                ))}
              </div>
            )}

            {active === "companies" && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 text-2xl font-black">إدارة الشركات</h3>
                <div className="space-y-3">
                  {["شركة النور للتجارة", "سوبرماركت الرحمة", "مؤسسة الرفاعي"].map((name, index) => (
                    <div key={name} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 p-4">
                      <div>
                        <p className="font-black">{name}</p>
                        <p className="text-sm text-slate-400">Tenant #{index + 1} — بيانات معزولة</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-300">نشط</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === "zatca" && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 leading-9 text-slate-200">
                <h3 className="mb-4 text-2xl font-black text-white">جاهزية السعودية والوضع العالمي</h3>
                <p>يدعم النظام وضع السعودية بضريبة 15% و QR TLV لمرحلة ZATCA Phase 1، مع وضع عالمي يمكن تشغيله بدون ضريبة أو بضريبة اختيارية للدول الأخرى.</p>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

export default App;

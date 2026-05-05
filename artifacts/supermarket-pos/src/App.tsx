import { useMemo, useState } from "react";

const navItems = [
  ["overview", "الرئيسية", "🏠"],
  ["pos", "نقطة البيع", "🧾"],
  ["companies", "الشركات", "🏢"],
  ["plans", "الاشتراكات", "💳"],
  ["reports", "التقارير", "📊"],
  ["settings", "الإعدادات", "⚙️"],
];

const kpis = [
  ["الشركات النشطة", "12", "+3 هذا الشهر"],
  ["فواتير اليوم", "284", "إجمالي 8,420"],
  ["الإيراد الشهري", "14,900 ر.س", "MRR"],
  ["جاهزية النظام", "99.9%", "GitHub Pages"],
];

const plans = [
  { name: "الأساسية", price: "49", description: "للمتاجر الصغيرة", users: "3 مستخدمين", branches: "فرع واحد", invoices: "1,000 فاتورة / شهر" },
  { name: "الاحترافية", price: "149", description: "للشركات النامية", users: "20 مستخدم", branches: "5 فروع", invoices: "20,000 فاتورة / شهر", featured: true },
  { name: "الشركات", price: "399", description: "للمؤسسات والفروع", users: "200 مستخدم", branches: "50 فرع", invoices: "250,000 فاتورة / شهر" },
];

const companies = [
  { name: "شركة النور للتجارة", plan: "الاحترافية", status: "نشط", invoices: 2240 },
  { name: "سوبرماركت الرحمة", plan: "الأساسية", status: "نشط", invoices: 680 },
  { name: "مؤسسة الرفاعي", plan: "الشركات", status: "تجريبي", invoices: 9180 },
  { name: "متجر الجزيرة", plan: "الاحترافية", status: "نشط", invoices: 1440 },
];

function App() {
  const [active, setActive] = useState("overview");
  const today = useMemo(() => new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), []);

  return (
    <main dir="rtl" className="min-h-screen bg-[#0b1220] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-5 p-4 lg:grid-cols-[280px_1fr] lg:p-6">
        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 text-3xl font-black text-slate-950">ف</div>
            <div>
              <h1 className="text-2xl font-black">فوترة</h1>
              <p className="text-xs text-slate-400">Fotr SaaS Platform</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right font-bold transition ${active === id ? "bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20" : "text-slate-300 hover:bg-white/10"}`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-teal-400/20 bg-teal-400/10 p-4">
            <p className="text-sm font-black text-teal-200">نسخة معاينة جاهزة</p>
            <p className="mt-2 text-xs leading-6 text-slate-300">منظمة للعرض على العملاء، ويمكن تطويرها لاحقًا إلى Firebase Auth + Firestore.</p>
          </div>
        </aside>

        <section className="space-y-5">
          <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-bold text-teal-300">{today}</p>
                <h2 className="text-3xl font-black lg:text-5xl">لوحة تشغيل فوترة للشركات</h2>
                <p className="mt-3 max-w-3xl leading-8 text-slate-300">تنظيم احترافي لمنصة تأجير نظام الفواتير: شركات، اشتراكات، تقارير، جاهزية السعودية، ونقطة بيع قابلة للتوسعة.</p>
              </div>
              <div className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-300">Online</div>
            </div>
          </header>

          {active === "overview" && <Overview />}
          {active === "pos" && <POSPreview />}
          {active === "companies" && <Companies />}
          {active === "plans" && <Plans />}
          {active === "reports" && <Reports />}
          {active === "settings" && <Settings />}
        </section>
      </div>
    </main>
  );
}

function Overview() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, sub]) => (
          <div key={label} className="rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black">{value}</p>
            <p className="mt-2 text-xs font-bold text-teal-300">{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-teal-600 to-emerald-700 p-7">
          <p className="mb-2 text-sm font-black text-teal-100">جاهز للبيع</p>
          <h3 className="text-3xl font-black">منصة واحدة لتأجير نظام الفواتير لعدة شركات</h3>
          <p className="mt-4 leading-9 text-teal-50">كل شركة لها مساحة مستقلة، باقة، حدود استخدام، وفواتير منفصلة. هذه الواجهة منظمة للعرض التجاري الآن.</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <h3 className="mb-4 text-xl font-black">خطة التطوير التالية</h3>
          {['Firebase Auth', 'Firestore Multi-tenant', 'Stripe / PayTabs', 'APK لاحقًا'].map((item) => (
            <div key={item} className="mb-3 rounded-2xl bg-white/5 p-3 text-sm font-bold text-slate-200">✅ {item}</div>
          ))}
        </div>
      </div>
    </>
  );
}

function POSPreview() {
  const products = [["قهوة عربية", "18.00"], ["تمر فاخر", "32.00"], ["مياه", "2.00"]];
  return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"><h3 className="mb-5 text-2xl font-black">نقطة بيع تجريبية</h3>{products.map(([name, price]) => <div key={name} className="mb-3 flex justify-between rounded-2xl bg-white/5 p-4"><span>{name}</span><b>{price} ر.س</b></div>)}</div><div className="rounded-[2rem] border border-teal-400/30 bg-teal-400/10 p-6"><h3 className="text-2xl font-black">الفاتورة</h3><p className="mt-6 text-slate-300">الإجمالي قبل الضريبة: 52.00 ر.س</p><p className="text-slate-300">ضريبة 15%: 7.80 ر.س</p><p className="mt-4 text-3xl font-black text-teal-300">59.80 ر.س</p></div></div>;
}

function Companies() {
  return <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"><h3 className="mb-5 text-2xl font-black">إدارة الشركات المستأجرة</h3>{companies.map((company) => <div key={company.name} className="mb-3 grid gap-3 rounded-2xl bg-white/5 p-4 md:grid-cols-4"><b>{company.name}</b><span className="text-slate-300">{company.plan}</span><span className="text-emerald-300">{company.status}</span><span>{company.invoices.toLocaleString('ar-SA')} فاتورة</span></div>)}</div>;
}

function Plans() {
  return <div className="grid gap-4 xl:grid-cols-3">{plans.map((plan) => <div key={plan.name} className={`rounded-[2rem] border p-6 ${plan.featured ? 'border-teal-300 bg-teal-400/10' : 'border-white/10 bg-white/[0.06]'}`}><p className="text-sm text-slate-400">{plan.description}</p><h3 className="mt-2 text-2xl font-black">{plan.name}</h3><p className="my-5 text-5xl font-black text-teal-300">{plan.price}<span className="text-base text-slate-300"> ر.س</span></p><p className="leading-8 text-slate-300">{plan.users}<br />{plan.branches}<br />{plan.invoices}</p></div>)}</div>;
}

function Reports() {
  return <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"><h3 className="mb-5 text-2xl font-black">تقارير مختصرة</h3><div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-white/5 p-5"><p>مبيعات اليوم</p><b className="text-3xl text-teal-300">3,420 ر.س</b></div><div className="rounded-2xl bg-white/5 p-5"><p>الشركات الجديدة</p><b className="text-3xl text-teal-300">3</b></div><div className="rounded-2xl bg-white/5 p-5"><p>الفواتير المدفوعة</p><b className="text-3xl text-teal-300">94%</b></div></div></div>;
}

function Settings() {
  return <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 leading-9 text-slate-200"><h3 className="mb-4 text-2xl font-black text-white">إعدادات التشغيل</h3><p>الوضع الحالي: Demo ثابت على GitHub Pages. جاهز للعرض، ثم يتم ربطه لاحقًا بخدمات Firebase للمصادقة وقاعدة البيانات.</p><p>دعم السعودية: ضريبة 15%، QR TLV، ووضع عالمي بدون إلزام ZATCA للدول الأخرى.</p></div>;
}

export default App;

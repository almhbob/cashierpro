import { useEffect, useRef, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "./i18n";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import SuperAdmin from "@/pages/SuperAdmin";
import { Sidebar } from "@/components/layout/Sidebar";
import { TenantProvider, useTenant } from "@/context/TenantContext";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Sales from "@/pages/Sales";
import SaleDetail from "@/pages/SaleDetail";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Analytics from "@/pages/Analytics";
import Receive from "@/pages/Receive";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#0d9488",
    colorBackground: "#f8fafc",
    colorInputBackground: "#ffffff",
    colorText: "#0f172a",
    colorTextSecondary: "#64748b",
    colorInputText: "#0f172a",
    colorNeutral: "#94a3b8",
    borderRadius: "0.75rem",
    fontFamily: "'Tajawal', 'Cairo', sans-serif",
    fontFamilyButtons: "'Tajawal', 'Cairo', sans-serif",
    fontSize: "1rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-xl border border-slate-200 rounded-2xl w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "#0f172a", fontWeight: "700", fontSize: "1.5rem" },
    headerSubtitle: { color: "#64748b" },
    socialButtonsBlockButtonText: { color: "#0f172a" },
    formFieldLabel: { color: "#0f172a" },
    footerActionLink: { color: "#0d9488" },
    footerActionText: { color: "#64748b" },
    dividerText: { color: "#94a3b8" },
    identityPreviewEditButton: { color: "#0d9488" },
    formFieldSuccessText: { color: "#059669" },
    alertText: { color: "#dc2626" },
    logoBox: "flex justify-center mb-2",
    logoImage: "h-14 w-14",
    socialButtonsBlockButton: "border border-slate-200 hover:bg-slate-50",
    formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white",
    formFieldInput: "border-slate-300 focus:border-teal-500",
    dividerLine: "bg-slate-200",
    formFieldRow: "mb-2",
    main: "p-6",
  },
};

const AUTH_FEATURES = [
  { icon: "🛒", title: "نقطة بيع سريعة", desc: "مسح الباركود وإتمام البيع في ثوانٍ" },
  { icon: "📦", title: "إدارة المخزون", desc: "تتبع المخزون والتنبيه عند النقص" },
  { icon: "📊", title: "تقارير وتحليلات", desc: "إحصائيات يومية وشهرية مفصّلة" },
  { icon: "☁️", title: "نظام سحابي", desc: "بياناتك محفوظة وآمنة دائماً" },
];

function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen w-full" dir="rtl">
      {/* Right panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 p-14 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full" />
        </div>

        {/* Logo & Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <span className="text-3xl">🏪</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">كاشير برو</h1>
              <p className="text-teal-200 text-sm">CashierPro</p>
            </div>
          </div>

          <h2 className="text-4xl font-black leading-tight mb-4">
            نظام إدارة المتاجر<br />
            <span className="text-teal-200">السحابي الأول</span>
          </h2>
          <p className="text-teal-100 text-lg leading-relaxed max-w-md">
            منصة متكاملة لإدارة نقاط البيع والمخزون والتقارير — تناسب المتاجر الصغيرة والكبيرة
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-2 gap-4 my-10">
          {AUTH_FEATURES.map((f) => (
            <div key={f.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <p className="font-bold text-sm mb-1">{f.title}</p>
              <p className="text-teal-200 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/10 rounded-2xl p-6 border border-white/10">
          <p className="text-sm leading-relaxed text-teal-50 mb-3">
            "كاشير برو غيّر طريقة إدارة متجرنا كلياً — التقارير اليومية والمخزون أصبحا سهلَين جداً"
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">أح</div>
            <div>
              <p className="font-bold text-sm">أحمد الشهري</p>
              <p className="text-teal-300 text-xs">صاحب سوبر ماركت الرحمة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Left panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 p-8 lg:p-14">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl">
              <span className="text-xl">🏪</span>
              <span className="font-bold">كاشير برو</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-800 mb-2">{title}</h2>
            <p className="text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthLayout title="مرحباً بعودتك 👋" subtitle="سجّل دخولك للوصول إلى لوحة التحكم">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={{
          ...clerkAppearance,
          elements: {
            ...clerkAppearance.elements,
            cardBox: "w-full shadow-none border-0",
            card: "!shadow-none !border-0 !bg-transparent !p-0",
            footer: "!shadow-none !border-0 !bg-transparent",
            main: "!p-0",
          },
        }}
      />
    </AuthLayout>
  );
}

function SignUpPage() {
  return (
    <AuthLayout title="ابدأ تجربتك المجانية 🚀" subtitle="أنشئ حسابك وجهّز متجرك في دقيقة واحدة">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={{
          ...clerkAppearance,
          elements: {
            ...clerkAppearance.elements,
            cardBox: "w-full shadow-none border-0",
            card: "!shadow-none !border-0 !bg-transparent !p-0",
            footer: "!shadow-none !border-0 !bg-transparent",
            main: "!p-0",
          },
        }}
      />
    </AuthLayout>
  );
}

function DirectionSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const lang = LANGUAGES.find((l) => l.code === i18n.language);
    document.documentElement.dir = lang?.dir ?? "rtl";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AuthenticatedApp() {
  const { i18n } = useTranslation();
  const lang = LANGUAGES.find((l) => l.code === i18n.language);
  const dir = lang?.dir ?? "rtl";
  const { tenant, isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (tenant?.needsOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="flex min-h-[100dvh] w-full" dir={dir}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/products" component={Products} />
          <Route path="/sales" component={Sales} />
          <Route path="/sales/:id" component={SaleDetail} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/inventory/low-stock" component={Inventory} />
          <Route path="/receive" component={Receive} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
          <Route path="/superadmin" component={SuperAdmin} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
      <Show when="signed-in">
        <TenantProvider>
          <AuthenticatedApp />
        </TenantProvider>
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <DirectionSync />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route component={AppRoutes} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

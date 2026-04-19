import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/Sidebar";

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
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
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

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-teal-700">سوبر ماركت</h1>
          <p className="text-slate-500 mt-1">نظام إدارة نقاط البيع</p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          appearance={clerkAppearance}
          localization={{
            signIn: {
              start: {
                title: "تسجيل الدخول",
                subtitle: "أدخل بيانات حسابك للوصول إلى النظام",
                actionText: "ليس لديك حساب؟",
                actionLink: "إنشاء حساب",
              },
            },
          } as any}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-teal-700">سوبر ماركت</h1>
          <p className="text-slate-500 mt-1">نظام إدارة نقاط البيع</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          appearance={clerkAppearance}
          localization={{
            signUp: {
              start: {
                title: "إنشاء حساب جديد",
                subtitle: "أنشئ حسابك للوصول إلى النظام",
                actionText: "لديك حساب بالفعل؟",
                actionLink: "تسجيل الدخول",
              },
            },
          } as any}
        />
      </div>
    </div>
  );
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

function AppRoutes() {
  return (
    <>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
      <Show when="signed-in">
        <div className="flex min-h-[100dvh] w-full" dir="rtl">
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
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
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

import { Suspense, lazy } from "react";
import { ClerkProvider, SignIn, useAuth, useUser, useClerk } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { DemoProvider, useDemo } from "./demo/DemoContext";
import { DemoBanner } from "./demo/DemoBanner";
import { TenantProvider, useTenant } from "./context/TenantContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Toaster } from "./components/ui/toaster";
import { Loader2 } from "lucide-react";

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const Home       = lazy(() => import("./pages/Home"));
const Products   = lazy(() => import("./pages/Products"));
const Sales      = lazy(() => import("./pages/Sales"));
const SaleDetail = lazy(() => import("./pages/SaleDetail"));
const Inventory  = lazy(() => import("./pages/Inventory"));
const Receive    = lazy(() => import("./pages/Receive"));
const Dashboard  = lazy(() => import("./pages/Dashboard"));
const Analytics  = lazy(() => import("./pages/Analytics"));
const Employees  = lazy(() => import("./pages/Employees"));
const Settings   = lazy(() => import("./pages/Settings"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const DevPortal  = lazy(() => import("./pages/DevPortal"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Pricing    = lazy(() => import("./pages/Pricing"));
const NotFound   = lazy(() => import("./pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );
}

// ─── Main app shell — always inside ClerkProvider ────────────────────────────
function AppShell() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isDemoMode } = useDemo();

  // Still loading Clerk session
  if (!isLoaded && !isDemoMode) return <PageLoader />;

  // Not authenticated and not demo → show sign-in
  if (!isSignedIn && !isDemoMode) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 p-4"
        dir="rtl"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl font-black">ك</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800">كاشير برو</h1>
            <p className="text-slate-500 mt-2 text-sm">نظام نقاط البيع الاحترافي</p>
          </div>
          <SignIn
            routing="hash"
            appearance={{
              elements: { formButtonPrimary: "bg-teal-600 hover:bg-teal-700" },
            }}
          />
        </div>
      </div>
    );
  }

  // Authenticated or demo → load tenant then show app
  return (
    <TenantProvider>
      <MainLayout />
    </TenantProvider>
  );
}

// ─── Layout after auth ────────────────────────────────────────────────────────
function MainLayout() {
  const { tenant, isLoading } = useTenant();
  const { isDemoMode } = useDemo();

  if (isLoading) return <PageLoader />;

  // New cloud user: complete onboarding before entering the app
  if (!isDemoMode && tenant?.needsOnboarding) {
    return (
      <div className="min-h-screen bg-slate-50" dir="rtl">
        <Suspense fallback={<PageLoader />}>
          <Onboarding />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 ${isDemoMode ? "pt-11" : ""}`} dir="rtl">
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <DemoBanner />
        </div>
      )}

      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/"           component={Home} />
            <Route path="/products"   component={Products} />
            <Route path="/sales"      component={Sales} />
            <Route path="/sales/:id"  component={SaleDetail} />
            <Route path="/inventory"  component={Inventory} />
            <Route path="/receive"    component={Receive} />
            <Route path="/dashboard"  component={Dashboard} />
            <Route path="/analytics"  component={Analytics} />
            <Route path="/employees"  component={Employees} />
            <Route path="/settings"   component={Settings} />
            <Route path="/superadmin" component={SuperAdmin} />
            <Route path="/dev"        component={DevPortal} />
            <Route path="/pricing"    component={Pricing} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>

      <Toaster />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

  // ClerkProvider must always wrap the entire tree because Sidebar uses
  // useUser/useClerk regardless of demo mode.
  if (!clerkKey) {
    // No Clerk key — DemoContext will force demo mode automatically.
    // Provide a stub ClerkProvider to satisfy hooks inside Sidebar.
    return (
      <QueryClientProvider client={queryClient}>
        <DemoProvider>
          <Router>
            <TenantProvider>
              <MainLayout />
            </TenantProvider>
          </Router>
        </DemoProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={clerkKey}>
        <DemoProvider>
          <Router>
            <AppShell />
          </Router>
        </DemoProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

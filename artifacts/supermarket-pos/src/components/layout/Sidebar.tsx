import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { 
  Calculator, 
  PackageSearch, 
  History, 
  LayoutDashboard,
  ClipboardList,
  LineChart,
  Truck,
  LogOut,
  UserCircle2,
  Settings2,
  Crown,
  Store,
  Clock,
  ChevronLeft,
  FlaskConical,
  Users,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTenant, PLAN_LABELS } from "@/context/TenantContext";
import { useDemo } from "@/demo/DemoContext";

const NAV_GROUPS = [
  {
    label: "العمليات",
    items: [
      { href: "/", label: "نقطة البيع", icon: Calculator },
      { href: "/sales", label: "المبيعات", icon: History },
    ],
  },
  {
    label: "المخزون",
    items: [
      { href: "/products", label: "المنتجات", icon: PackageSearch },
      { href: "/inventory", label: "المخزون", icon: ClipboardList },
      { href: "/receive", label: "استلام بضاعة", icon: Truck },
    ],
  },
  {
    label: "التقارير",
    items: [
      { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/analytics", label: "التحليلات", icon: LineChart },
    ],
  },
];

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-slate-100 text-slate-600 border-slate-200",
  professional: "bg-blue-50 text-blue-700 border-blue-200",
  enterprise: "bg-amber-50 text-amber-700 border-amber-200",
};

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { tenant } = useTenant();
  const { isDemoMode, exitDemo } = useDemo();

  const displayName = isDemoMode
    ? "محمد المندوب"
    : (user
        ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.emailAddresses?.[0]?.emailAddress || "كاشير"
        : "...");

  const plan = tenant?.plan ?? "starter";
  const planLabel = PLAN_LABELS[plan];
  const trialDaysLeft = tenant?.trialDaysLeft ?? null;
  const isTrialWarning = !isDemoMode && tenant?.status === "trial" && trialDaysLeft !== null && trialDaysLeft <= 7;

  return (
    <aside className="w-72 border-l border-slate-200 bg-white flex flex-col h-full sticky top-0 shadow-sm" dir="rtl">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-slate-800 text-base truncate leading-tight">
              {tenant?.name ?? "جاري التحميل..."}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {isDemoMode ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full border font-semibold bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                  <FlaskConical className="h-2.5 w-2.5" />
                  وضع تجريبي
                </span>
              ) : (
                <span className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full border font-semibold",
                  PLAN_COLORS[plan]
                )}>
                  {planLabel.ar}
                </span>
              )}
              {isTrialWarning && (
                <span className="text-[11px] text-amber-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {trialDaysLeft} يوم
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
                      isActive
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}>
                      <item.icon className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-teal-600"
                      )} />
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && <ChevronLeft className="h-3.5 w-3.5 mr-auto opacity-60" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Admin section — hide in demo mode */}
        {!isDemoMode && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              الإدارة
            </p>
            <div className="space-y-0.5">
              {/* Employees - Supervisor Only */}
              <Link href="/employees">
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
                  location === "/employees"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}>
                  <Users className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    location === "/employees" ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                  )} />
                  <span className="text-sm font-medium">الموظفون</span>
                  <Shield className={cn(
                    "h-3 w-3 mr-auto opacity-70",
                    location === "/employees" ? "text-white/80" : "text-slate-400"
                  )} />
                </div>
              </Link>

              <Link href="/settings">
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
                  location === "/settings"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}>
                  <Settings2 className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    location === "/settings" ? "text-white" : "text-slate-400 group-hover:text-teal-600"
                  )} />
                  <span className="text-sm font-medium">الإعدادات</span>
                  {location === "/settings" && <ChevronLeft className="h-3.5 w-3.5 mr-auto opacity-60" />}
                </div>
              </Link>

              <Link href="/superadmin">
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
                  location === "/superadmin"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-amber-600 hover:bg-amber-50"
                )}>
                  <Crown className="h-[18px] w-[18px] shrink-0" />
                  <span className="text-sm font-medium">إدارة المنصة</span>
                  {location === "/superadmin" && <ChevronLeft className="h-3.5 w-3.5 mr-auto opacity-60" />}
                </div>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-4 border-t border-slate-100 space-y-3">
        <div className={cn(
          "flex items-center gap-3 px-2 py-2 rounded-xl",
          isDemoMode ? "bg-amber-50" : "bg-slate-50"
        )}>
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm",
            isDemoMode ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"
          )}>
            {isDemoMode
              ? <FlaskConical className="h-5 w-5 text-amber-600" />
              : (displayName !== "..." ? displayName.split(" ").slice(0, 2).map((w: string) => w[0]).join("") : <UserCircle2 className="h-5 w-5 text-teal-600" />)
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-700 truncate">{displayName}</p>
            <p className={cn("text-xs", isDemoMode ? "text-amber-500" : "text-slate-400")}>
              {isDemoMode ? "وضع تجريبي" : (tenant?.name ?? "المتجر")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isDemoMode && (
            <div className="flex-1">
              <LanguageSwitcher />
            </div>
          )}
          {isDemoMode ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-9 text-amber-600 hover:bg-amber-50 text-xs font-semibold gap-1.5"
              onClick={exitDemo}
            >
              <LogOut className="h-4 w-4" />
              إنهاء التجربة
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
              title="تسجيل الخروج"
              onClick={() => signOut({ redirectUrl: window.location.origin + (import.meta.env.BASE_URL || "/") })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

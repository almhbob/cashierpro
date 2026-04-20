import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { useTranslation } from "react-i18next";
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
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTenant, PLAN_LABELS } from "@/context/TenantContext";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { t } = useTranslation();
  const { tenant } = useTenant();

  const NAV_ITEMS = [
    { href: "/", label: t("nav.pos"), icon: Calculator },
    { href: "/products", label: t("nav.products"), icon: PackageSearch },
    { href: "/inventory", label: t("nav.inventory"), icon: ClipboardList },
    { href: "/receive", label: t("nav.receive"), icon: Truck },
    { href: "/sales", label: t("nav.sales"), icon: History },
    { href: "/analytics", label: t("nav.analytics"), icon: LineChart },
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/settings", label: t("nav.settings"), icon: Settings2 },
  ];

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.emailAddresses?.[0]?.emailAddress || t("nav.cashier")
    : "...";

  const plan = tenant?.plan ?? "starter";
  const planLabel = PLAN_LABELS[plan];
  const trialDaysLeft = tenant?.trialDaysLeft ?? null;

  return (
    <div className="w-64 border-l bg-card flex flex-col h-[100dvh]">
      {/* Store Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-foreground truncate">{tenant?.name ?? "جاري التحميل..."}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0 border-0 font-medium", planLabel.bg, planLabel.color)}
              >
                {planLabel.ar}
              </Badge>
              {tenant?.status === "trial" && trialDaysLeft !== null && trialDaysLeft <= 7 && (
                <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" /> {trialDaysLeft} يوم
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* SuperAdmin Link */}
        <div className="pt-2 mt-2 border-t">
          <Link href="/superadmin">
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors cursor-pointer",
                location === "/superadmin"
                  ? "bg-amber-500 text-white font-medium shadow-sm"
                  : "hover:bg-amber-50 text-amber-600 hover:text-amber-700"
              )}
            >
              <Crown className="h-4 w-4 shrink-0" />
              <span className="text-sm">إدارة المنصة</span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-2 px-2 mb-1">
          <UserCircle2 className="h-7 w-7 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">{t("nav.cashier")}</p>
          </div>
        </div>
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 gap-2"
          onClick={() => signOut({ redirectUrl: window.location.origin + (import.meta.env.BASE_URL || "/") })}
        >
          <LogOut className="h-4 w-4" />
          <span>{t("nav.signOut")}</span>
        </Button>
      </div>
    </div>
  );
}

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
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { t } = useTranslation();

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

  return (
    <div className="w-64 border-l bg-card flex flex-col h-[100dvh]">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          <span>{t("brand")}</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-2 px-2 mb-1">
          <UserCircle2 className="h-8 w-8 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">{t("nav.cashier")}</p>
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
        <p className="text-xs text-center text-muted-foreground">{t("nav.footer")} © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

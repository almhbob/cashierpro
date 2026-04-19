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
  UserCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "نقاط البيع", icon: Calculator },
  { href: "/products", label: "المنتجات", icon: PackageSearch },
  { href: "/inventory", label: "المخزون", icon: ClipboardList },
  { href: "/receive", label: "استلام البضاعة", icon: Truck },
  { href: "/sales", label: "المبيعات", icon: History },
  { href: "/analytics", label: "التحليلات", icon: LineChart },
  { href: "/dashboard", label: "لوحة القيادة", icon: LayoutDashboard },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.emailAddresses?.[0]?.emailAddress || "مستخدم"
    : "...";

  return (
    <div className="w-64 border-l bg-card flex flex-col h-[100dvh]">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          <span>سوبر ماركت</span>
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
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2 px-2">
          <UserCircle2 className="h-8 w-8 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">كاشير</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 gap-2"
          onClick={() => signOut({ redirectUrl: window.location.origin + (import.meta.env.BASE_URL || "/") })}
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </Button>
        <p className="text-xs text-center text-muted-foreground">نظام الكاشير © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { 
  Calculator, 
  PackageSearch, 
  History, 
  LayoutDashboard,
  ClipboardList,
  LineChart
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "نقاط البيع", icon: Calculator },
  { href: "/products", label: "المنتجات", icon: PackageSearch },
  { href: "/inventory", label: "المخزون", icon: ClipboardList },
  { href: "/sales", label: "المبيعات", icon: History },
  { href: "/analytics", label: "التحليلات", icon: LineChart },
  { href: "/dashboard", label: "لوحة القيادة", icon: LayoutDashboard },
];

export function Sidebar() {
  const [location] = useLocation();

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
      <div className="p-4 border-t text-sm text-center text-muted-foreground">
        نظام الكاشير © {new Date().getFullYear()}
      </div>
    </div>
  );
}

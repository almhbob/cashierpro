import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

export type Plan = "starter" | "professional" | "enterprise";
export type TenantStatus = "trial" | "active" | "suspended" | "cancelled";

export interface TenantLimits {
  cashiers: number;
  products: number;
  price: number;
}

export interface TenantInfo {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  plan: Plan;
  status: TenantStatus;
  needsOnboarding: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  memberCount: number;
  limits: TenantLimits;
  createdAt: string;
}

interface TenantContextValue {
  tenant: TenantInfo | null;
  isLoading: boolean;
  refetch: () => void;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  isLoading: true,
  refetch: () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useQuery<TenantInfo>({
    queryKey: ["tenants", "me"],
    queryFn: async () => {
      const res = await fetch("/api/tenants/me");
      if (!res.ok) throw new Error("Failed to load tenant");
      return res.json();
    },
    staleTime: 60_000,
    retry: 2,
  });

  return (
    <TenantContext.Provider value={{ tenant: data ?? null, isLoading, refetch }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

export const PLAN_LABELS: Record<Plan, { ar: string; en: string; color: string; bg: string }> = {
  starter:      { ar: "أساسي",  en: "Starter",      color: "text-slate-600",  bg: "bg-slate-100" },
  professional: { ar: "محترف",  en: "Professional",  color: "text-primary",   bg: "bg-primary/10" },
  enterprise:   { ar: "متميز",  en: "Enterprise",    color: "text-amber-700", bg: "bg-amber-100" },
};

export const STATUS_LABELS: Record<TenantStatus, { ar: string; color: string }> = {
  trial:     { ar: "تجريبي",    color: "text-blue-600" },
  active:    { ar: "نشط",       color: "text-green-600" },
  suspended: { ar: "موقوف",     color: "text-red-600" },
  cancelled: { ar: "ملغي",      color: "text-slate-500" },
};

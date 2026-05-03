import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEMO_TENANT, DEMO_PRODUCTS, DEMO_SALES, DEMO_DASHBOARD_STATS, DEMO_ANALYTICS, DEMO_LOW_STOCK,
} from "./demoData";

const DEMO_KEY = "cashierpro_demo_mode";
export const DEMO_ACTIVATION_CODE = "DEMO2025";

function shouldForceDemoMode() {
  return import.meta.env.VITE_FORCE_DEMO === "true" || !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
}

interface DemoContextValue {
  isDemoMode: boolean;
  activateDemo: () => void;
  exitDemo: () => void;
  tryActivateCode: (code: string) => boolean;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoMode: false,
  activateDemo: () => {},
  exitDemo: () => {},
  tryActivateCode: () => false,
});

let originalFetch: typeof window.fetch | null = null;

function buildMockResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
  const parsed = new URL(url, window.location.href);
  const path = parsed.pathname;
  const method = (init?.method ?? "GET").toUpperCase();

  if (/\/api\/tenants\/me/.test(path)) return Promise.resolve(buildMockResponse(DEMO_TENANT));

  if (/\/api\/products$/.test(path) && method === "GET") {
    const q = parsed.searchParams.get("q")?.toLowerCase() ?? "";
    const barcode = parsed.searchParams.get("barcode")?.toLowerCase() ?? "";
    let products = [...DEMO_PRODUCTS];
    if (barcode) products = products.filter(p => p.barcode.includes(barcode));
    if (q) products = products.filter(p => p.nameAr.includes(q) || p.name.toLowerCase().includes(q) || p.barcode.includes(q));
    return Promise.resolve(buildMockResponse(products));
  }

  if (/\/api\/products$/.test(path) && method === "POST") {
    const body = JSON.parse((init?.body as string) ?? "{}");
    const newProduct = { id: Math.floor(Math.random() * 9000) + 1000, tenantId: "demo", ...body };
    return Promise.resolve(buildMockResponse(newProduct, 201));
  }

  const productMatch = /\/api\/products\/(\d+)$/.exec(path);
  if (productMatch) {
    const id = parseInt(productMatch[1]);
    if (method === "DELETE") return Promise.resolve(buildMockResponse({ ok: true }));
    if (method === "PATCH" || method === "PUT") return Promise.resolve(buildMockResponse({ ok: true }));
    const product = DEMO_PRODUCTS.find(p => p.id === id);
    return Promise.resolve(product ? buildMockResponse(product) : buildMockResponse({ error: "not found" }, 404));
  }

  if (/\/api\/sales$/.test(path) && method === "GET") {
    const limit = parseInt(parsed.searchParams.get("limit") ?? "50");
    const offset = parseInt(parsed.searchParams.get("offset") ?? "0");
    const slice = DEMO_SALES.slice(offset, offset + limit);
    return Promise.resolve(buildMockResponse({ sales: slice, total: DEMO_SALES.length }));
  }

  if (/\/api\/sales$/.test(path) && method === "POST") {
    const body = JSON.parse((init?.body as string) ?? "{}");
    const newSale = { id: 9000 + Math.floor(Math.random() * 999), tenantId: "demo", ...body, createdAt: new Date().toISOString() };
    return Promise.resolve(buildMockResponse(newSale, 201));
  }

  const saleMatch = /\/api\/sales\/(\d+)$/.exec(path);
  if (saleMatch) {
    const saleId = parseInt(saleMatch[1]);
    const sale = DEMO_SALES.find(s => s.id === saleId);
    if (sale) return Promise.resolve(buildMockResponse({ ...sale }));
    return Promise.resolve(buildMockResponse({ error: "not found" }, 404));
  }

  if (/\/api\/inventory\/low-stock/.test(path)) return Promise.resolve(buildMockResponse(DEMO_LOW_STOCK));

  if (/\/api\/inventory/.test(path)) {
    if (method === "POST") return Promise.resolve(buildMockResponse({ ok: true }));
    return Promise.resolve(buildMockResponse(DEMO_PRODUCTS));
  }

  if (/\/api\/analytics/.test(path)) return Promise.resolve(buildMockResponse({ ...DEMO_ANALYTICS, stats: DEMO_DASHBOARD_STATS }));
  if (/\/api\/dashboard/.test(path)) return Promise.resolve(buildMockResponse(DEMO_DASHBOARD_STATS));

  if (/\/api\/settings/.test(path)) {
    if (method === "POST" || method === "PATCH") return Promise.resolve(buildMockResponse({ ok: true }));
    return Promise.resolve(buildMockResponse([
      { key: "storeName", value: "فوترة" },
      { key: "storePhone", value: "0512345678" },
      { key: "storeAddress", value: "المملكة العربية السعودية" },
      { key: "vatNumber", value: "310123456700003" },
      { key: "vatRate", value: "15" },
      { key: "currency", value: "SAR" },
      { key: "invoicePrefix", value: "INV" },
    ]));
  }

  if (/\/api\/receive/.test(path) && method === "POST") return Promise.resolve(buildMockResponse({ ok: true }));
  if (/\/api\//.test(path)) return Promise.resolve(buildMockResponse({ ok: true }));

  return originalFetch!(input, init);
}

function installMockFetch() {
  if (!originalFetch) {
    originalFetch = window.fetch.bind(window);
    window.fetch = mockFetch as typeof window.fetch;
  }
}

function uninstallMockFetch() {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => shouldForceDemoMode() || localStorage.getItem(DEMO_KEY) === "1");

  useEffect(() => {
    if (isDemoMode) installMockFetch();
    return () => {};
  }, [isDemoMode]);

  const activateDemo = () => {
    localStorage.setItem(DEMO_KEY, "1");
    setIsDemoMode(true);
    installMockFetch();
  };

  const exitDemo = () => {
    if (shouldForceDemoMode()) return;
    localStorage.removeItem(DEMO_KEY);
    setIsDemoMode(false);
    uninstallMockFetch();
    window.location.href = window.location.origin + (import.meta.env.BASE_URL || "/");
  };

  const tryActivateCode = (code: string): boolean => {
    if (code.trim().toUpperCase() === DEMO_ACTIVATION_CODE) {
      activateDemo();
      return true;
    }
    return false;
  };

  return <DemoContext.Provider value={{ isDemoMode, activateDemo, exitDemo, tryActivateCode }}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  return useContext(DemoContext);
}

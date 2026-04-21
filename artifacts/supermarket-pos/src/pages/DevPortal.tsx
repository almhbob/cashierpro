import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DevPortalCtx } from "@/context/DevPortalContext";
import SuperAdmin from "@/pages/SuperAdmin";

const DEV_TOKEN_KEY = "cashierpro_dev_token";
const devQueryClient = new QueryClient();
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getStoredToken(): string {
  return localStorage.getItem(DEV_TOKEN_KEY) ?? "";
}

export default function DevPortal() {
  const [token, setToken] = useState<string>(getStoredToken);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  /* Verify stored token on mount */
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/api/dev/overview`, {
      headers: { "X-Dev-Token": token },
    }).then(r => {
      if (r.ok) setVerified(true);
      else { localStorage.removeItem(DEV_TOKEN_KEY); setToken(""); }
    }).catch(() => { localStorage.removeItem(DEV_TOKEN_KEY); setToken(""); });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${BASE}/api/dev/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "خطأ غير معروف"); return; }
      localStorage.setItem(DEV_TOKEN_KEY, data.token);
      setToken(data.token);
      setVerified(true);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(DEV_TOKEN_KEY);
    setToken("");
    setVerified(false);
    setPassword("");
  }

  /* ── Loading state ── */
  if (token && !verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900" dir="rtl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  /* ── Authenticated ── */
  if (verified && token) {
    return (
      <QueryClientProvider client={devQueryClient}>
        <DevPortalCtx.Provider value={{ apiBase: `${BASE}/api/dev`, devHeaders: { "X-Dev-Token": token } }}>
          <div className="flex flex-col min-h-screen bg-slate-50" dir="rtl">
            {/* Dev portal top bar */}
            <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold text-base">🛠️ بوابة المطور</span>
                <span className="text-slate-500 text-xs">CashierPro DevPortal — وصول آمن بدون Clerk</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition-colors text-xs"
              >
                تسجيل الخروج
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <SuperAdmin />
            </div>
          </div>
          <Toaster />
        </DevPortalCtx.Provider>
      </QueryClientProvider>
    );
  }

  /* ── Login screen ── */
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="w-full max-w-sm px-6">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">🛠️</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">بوابة المطور</h1>
          <p className="text-slate-400 text-sm">CashierPro DevPortal — للمطوّر فقط</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">كلمة سر المطور</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="أدخل كلمة السر"
              autoFocus
              className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-sm"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "جاري الدخول..." : "دخول البوابة"}
          </button>
        </form>

        {/* Hint */}
        <p className="text-center text-slate-600 text-xs mt-8">
          هذه البوابة مخصصة لمالك النظام فقط.<br />
          كلمة السر تُضبط في متغيرات البيئة: <span className="font-mono text-slate-500">DEV_PORTAL_PASSWORD</span>
        </p>
      </div>
    </div>
  );
}

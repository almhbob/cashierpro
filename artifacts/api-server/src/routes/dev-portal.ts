import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import superadminRouter from "./superadmin";

const router = Router();

// ── In-memory rate limiter for login endpoint ─────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;

  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Purge expired entries periodically to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now > entry.resetAt) loginAttempts.delete(ip);
  }
}, 10 * 60 * 1000);

// ── system_config helpers ─────────────────────────────────────────────────────

async function getConfig(key: string): Promise<string | null> {
  const rows = await db.execute(
    sql`SELECT value FROM system_config WHERE key = ${key}`,
  );
  return (rows.rows[0] as { value?: string } | undefined)?.value ?? null;
}

async function setConfig(key: string, value: string): Promise<void> {
  await db.execute(
    sql`INSERT INTO system_config(key, value, updated_at) VALUES(${key}, ${value}, NOW())
        ON CONFLICT(key) DO UPDATE SET value=${value}, updated_at=NOW()`,
  );
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getSecret(): string {
  const pw = process.env.DEV_PORTAL_PASSWORD ?? "";
  return crypto.createHash("sha256").update("cashierpro-dev:" + pw).digest("hex");
}
function makeToken(): string {
  return crypto.createHmac("sha256", getSecret()).update("dev-session-v1").digest("hex");
}

// ── POST /api/dev/login — public, rate-limited ────────────────────────────────

router.post("/login", (req: Request, res: Response) => {
  const ip = getRateLimitKey(req);
  const limit = checkRateLimit(ip);

  if (!limit.allowed) {
    res.status(429).json({
      error: "محاولات كثيرة جداً — حاول بعد قليل",
      retryAfterMs: limit.retryAfterMs,
    });
    return;
  }

  const pw = process.env.DEV_PORTAL_PASSWORD;
  if (!pw) {
    res.status(500).json({ error: "DEV_PORTAL_PASSWORD غير مضبوطة في الخادم." });
    return;
  }
  if (req.body?.password !== pw) {
    res.status(401).json({ error: "كلمة السر غير صحيحة" });
    return;
  }

  // Reset attempts on successful login
  loginAttempts.delete(ip);
  res.json({ token: makeToken() });
});

// ── Middleware ────────────────────────────────────────────────────────────────

function verifyDevToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-dev-token"] as string | undefined;
  if (!token || token !== makeToken()) {
    res.status(401).json({ error: "جلسة منتهية — سجّل دخولك مجدداً" });
    return;
  }
  next();
}

// ── Protected routes ──────────────────────────────────────────────────────────

router.use(verifyDevToken);

/* GET /api/dev/system-config */
router.get("/system-config", async (_req: Request, res: Response) => {
  try {
    const rows = await db.execute(sql`SELECT key, value FROM system_config`);
    const config: Record<string, string> = {};
    (rows.rows as { key: string; value: string }[]).forEach((r) => {
      config[r.key] = r.value;
    });
    res.json(config);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* PUT /api/dev/system-config */
router.put("/system-config", async (req: Request, res: Response) => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await setConfig(key, String(value));
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* Mount all superadmin routes under /api/dev */
router.use(superadminRouter);

export default router;

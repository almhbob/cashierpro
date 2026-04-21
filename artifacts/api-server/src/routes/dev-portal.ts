import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import superadminRouter from "./superadmin";

const router = Router();

/* ── system_config helpers (table created via direct SQL) ── */
async function getConfig(key: string): Promise<string | null> {
  const rows = await db.execute(
    sql`SELECT value FROM system_config WHERE key = ${key}`,
  );
  return (rows.rows[0] as any)?.value ?? null;
}

async function setConfig(key: string, value: string): Promise<void> {
  await db.execute(
    sql`INSERT INTO system_config(key, value, updated_at) VALUES(${key}, ${value}, NOW())
        ON CONFLICT(key) DO UPDATE SET value=${value}, updated_at=NOW()`,
  );
}

/* ── Auth helpers ───────────────────────────────── */
function getSecret(): string {
  const pw = process.env.DEV_PORTAL_PASSWORD || "";
  return crypto.createHash("sha256").update("cashierpro-dev:" + pw).digest("hex");
}
function makeToken(): string {
  return crypto.createHmac("sha256", getSecret()).update("dev-session-v1").digest("hex");
}

/* ── POST /api/dev/login — public ───────────────── */
router.post("/login", (req: Request, res: Response) => {
  const pw = process.env.DEV_PORTAL_PASSWORD;
  if (!pw) {
    res.status(500).json({ error: "DEV_PORTAL_PASSWORD غير مضبوطة في الخادم." });
    return;
  }
  if (req.body?.password !== pw) {
    res.status(401).json({ error: "كلمة السر غير صحيحة" });
    return;
  }
  res.json({ token: makeToken() });
});

/* ── Middleware ─────────────────────────────────── */
function verifyDevToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-dev-token"] as string | undefined;
  if (!token || token !== makeToken()) {
    res.status(401).json({ error: "جلسة منتهية — سجّل دخولك مجدداً" });
    return;
  }
  next();
}

/* ── All protected routes ───────────────────────── */
router.use(verifyDevToken);

/* GET /api/dev/system-config */
router.get("/system-config", async (_req: Request, res: Response) => {
  try {
    const rows = await db.execute(sql`SELECT key, value FROM system_config`);
    const config: Record<string, string> = {};
    (rows.rows as { key: string; value: string }[]).forEach(r => { config[r.key] = r.value; });
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

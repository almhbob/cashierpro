import { Router, Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { storeSettings } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

const router = Router();
router.use(requireAuth);

/* ─── Server Stats ─── */
router.get("/server-stats", async (_req, res) => {
  const mem = process.memoryUsage();
  const uptimeSec = process.uptime();

  let dbStatus: "online" | "degraded" | "offline" = "offline";
  let dbLatencyMs = 0;
  try {
    const t0 = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - t0;
    dbStatus = dbLatencyMs < 150 ? "online" : "degraded";
  } catch {
    dbStatus = "offline";
  }

  const uptimeDays = Math.floor(uptimeSec / 86400);
  const uptimeHours = Math.floor((uptimeSec % 86400) / 3600);
  const uptimeMins = Math.floor((uptimeSec % 3600) / 60);

  res.json({
    server: {
      status: "online" as const,
      uptime: `${uptimeDays}d ${uptimeHours}h ${uptimeMins}m`,
      uptimeSec: Math.floor(uptimeSec),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      provider: "PostgreSQL",
    },
    timestamp: new Date().toISOString(),
  });
});

/* ─── Store Settings ─── */
const DEFAULT_SETTINGS: Record<string, string> = {
  storeName: "سوبر ماركت",
  storeNameEn: "Super Market",
  address: "",
  phone: "",
  vatNumber: "",
  receiptHeader: "أهلاً وسهلاً بكم",
  receiptFooter: "شكراً لزيارتكم",
  currency: "SAR",
  vatRate: "15",
};

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(storeSettings);
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  res.json(map);
});

router.put("/settings", async (req, res) => {
  const data: Record<string, string> = req.body ?? {};
  for (const [key, value] of Object.entries(data)) {
    await db
      .insert(storeSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: storeSettings.key, set: { value, updatedAt: new Date() } });
  }
  res.json({ success: true });
});

export default router;

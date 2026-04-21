import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import superadminRouter from "./superadmin";

const router = Router();

function getSecret(): string {
  const pw = process.env.DEV_PORTAL_PASSWORD || "";
  return crypto.createHash("sha256").update("cashierpro-dev:" + pw).digest("hex");
}

function makeToken(): string {
  return crypto.createHmac("sha256", getSecret()).update("dev-session-v1").digest("hex");
}

/* POST /api/dev/login — no auth */
router.post("/login", (req: Request, res: Response) => {
  const pw = process.env.DEV_PORTAL_PASSWORD;
  if (!pw) {
    res.status(500).json({ error: "DEV_PORTAL_PASSWORD غير مضبوطة في الخادم. أضفها كمتغير بيئة." });
    return;
  }
  if (req.body?.password !== pw) {
    res.status(401).json({ error: "كلمة السر غير صحيحة" });
    return;
  }
  res.json({ token: makeToken() });
});

/* Middleware: verify X-Dev-Token header */
function verifyDevToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-dev-token"] as string | undefined;
  if (!token || token !== makeToken()) {
    res.status(401).json({ error: "جلسة منتهية — سجّل دخولك مجدداً" });
    return;
  }
  next();
}

/* All superadmin routes under /api/dev (token-protected) */
router.use(verifyDevToken, superadminRouter);

export default router;

/**
 * CashierPro Desktop — Activation System
 * نظام كودات التفعيل — يعمل offline بدون اتصال بالإنترنت
 *
 * الآلية:
 *  1. كل كود = HMAC-SHA256 مشفر من (prefix + secret)
 *  2. التحقق يتم محليًا — لا يحتاج خادم أو إنترنت
 *  3. بعد التفعيل يُحفظ ملف license في مجلد التطبيق
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * يحمّل المفتاح السري من ملف hmac-config.js المُدمَج في التطبيق.
 *
 * Loads the HMAC secret from the bundled hmac-config.js file.
 *
 * ملاحظة أمنية: يتعمّد هذا الملف عدم قراءة متغيرات البيئة —
 * لأن المستخدم النهائي قد يتلاعب بها لتوليد كودات مزيفة.
 *
 * Security note: This file intentionally does NOT read environment variables.
 * The verifier must use only the secret bundled at build time (asar'd into the EXE).
 * Environment variable support belongs only in build/generation tooling (generate-codes.js).
 *
 * لإعداد المفتاح (مطلوب مرة واحدة بعد الاستنساخ):
 * To set up the secret (required once after cloning):
 *   node scripts/rotate-secret.js
 */
function loadHmacSecret() {
  try {
    return require("./hmac-config").HMAC_SECRET;
  } catch {
    throw new Error(
      "[CashierPro] HMAC secret is not configured.\n" +
      "Run:  node scripts/rotate-secret.js\n" +
      "This generates src/hmac-config.js which must be present before starting or building."
    );
  }
}

const HMAC_SECRET = loadHmacSecret();

/**
 * يتحقق من صحة الكود
 * @param {string} code الكود المُدخل من المستخدم
 * @returns {{ valid: boolean, type: string, message: string }}
 */
function verifyCode(code) {
  if (!code || typeof code !== "string") {
    return { valid: false, type: "invalid", message: "الكود فارغ" };
  }

  const normalized = code.trim().toUpperCase().replace(/\s/g, "");

  // التحقق من الكودات المولّدة (HMAC فقط — لا توجد كودات تجاوز مشفرة)
  if (isValidHmacCode(normalized)) {
    return { valid: true, type: "full", message: "كود صحيح" };
  }

  return { valid: false, type: "invalid", message: "كود التفعيل غير صحيح" };
}

/**
 * يتحقق من HMAC للكود
 * @param {string} normalized الكود بعد التطبيع
 */
function isValidHmacCode(normalized) {
  // تنسيق الكود المتوقع: XXXX-XXXX-XXXX-XXXX (16 حرف + 3 شُرَط)
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) {
    return false;
  }

  // الجزء الأول هو البادئة، والباقي هو checksum
  const parts = normalized.split("-");
  const prefix = parts[0]; // مثلاً CP25
  const checksum = parts.slice(1).join(""); // مثلاً A8KLM3NP7QRT

  // نُعيد حساب الـ HMAC ونقارنه
  const expected = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(prefix)
    .digest("hex")
    .toUpperCase()
    .slice(0, 12); // نأخذ أول 12 حرف

  return checksum === expected;
}

/* ─── إدارة ملف الترخيص المحلي ─────── */

function getLicenseFilePath() {
  // نحفظ الملف في مجلد بيانات التطبيق
  try {
    const { app } = require("electron");
    return path.join(app.getPath("userData"), ".cashierpro-license");
  } catch {
    // fallback إذا استُدعي خارج Electron
    return path.join(__dirname, "../.cashierpro-license");
  }
}

/**
 * يحفظ بيانات التفعيل بعد التحقق الناجح
 */
function saveLicense(code, type) {
  const data = {
    code: code.trim().toUpperCase(),
    type,
    activatedAt: new Date().toISOString(),
    version: "1.0.0",
  };
  try {
    fs.writeFileSync(getLicenseFilePath(), JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("[activation] failed to save license:", e.message);
    return false;
  }
}

/**
 * يقرأ بيانات الترخيص المحفوظة
 * @returns {{ activated: boolean, code?: string, type?: string, activatedAt?: string } | null}
 */
function readLicense() {
  try {
    const content = fs.readFileSync(getLicenseFilePath(), "utf-8");
    const data = JSON.parse(content);
    if (data && data.code && data.activatedAt) {
      return { activated: true, ...data };
    }
    return { activated: false };
  } catch {
    return { activated: false };
  }
}

/**
 * يحذف ملف الترخيص (إعادة التفعيل)
 */
function revokeLicense() {
  try {
    fs.unlinkSync(getLicenseFilePath());
    return true;
  } catch {
    return false;
  }
}

/**
 * التحقق الكامل: هل التطبيق مفعّل؟
 * @returns {{ activated: boolean, type?: string }}
 */
function checkActivation() {
  const license = readLicense();
  return license;
}

/**
 * تفعيل بكود جديد
 * @param {string} code
 * @returns {{ success: boolean, message: string }}
 */
function activate(code) {
  const result = verifyCode(code);
  if (!result.valid) {
    return { success: false, message: result.message };
  }
  const saved = saveLicense(code, result.type);
  if (!saved) {
    return { success: false, message: "فشل حفظ ملف الترخيص" };
  }
  return { success: true, message: "تم التفعيل بنجاح!" };
}

module.exports = { checkActivation, activate, revokeLicense, verifyCode };

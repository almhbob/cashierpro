#!/usr/bin/env node
/**
 * CashierPro — HMAC Secret Rotation Tool
 * أداة تدوير المفتاح السري لنظام التفعيل
 *
 * الاستخدام / Usage:
 *   node scripts/rotate-secret.js
 *
 * يولّد مفتاحًا سريًا قويًا جديدًا، يحدّث src/hmac-config.js،
 * ويطبع عدة كودات تجريبية تعمل مع المفتاح الجديد.
 *
 * Generates a new strong secret, updates src/hmac-config.js,
 * and prints sample codes that work with the new secret.
 *
 * ⚠️  بعد التدوير يجب توزيع كودات التفعيل الجديدة فقط للعملاء.
 * ⚠️  After rotation, distribute only freshly generated codes to customers.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../src/hmac-config.js");
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const newSecret = crypto.randomBytes(32).toString("hex");

/* ─── كتابة hmac-config.js ─────────── */

const configContent = `/**
 * HMAC Secret Configuration — Auto-generated / محلي فقط
 *
 * ⚠️  هذا الملف يُولَّد تلقائيًا ولا يُرفع على git.
 * ⚠️  This file is generated locally and must NOT be committed to git.
 *
 * لتغيير المفتاح: شغّل \`node scripts/rotate-secret.js\`
 * To rotate the secret: run \`node scripts/rotate-secret.js\`
 *
 * Generated: ${new Date().toISOString()}
 *
 * ملاحظة أمنية: المفتاح مُضمَّن مباشرةً — لا يُقرأ من متغيرات البيئة عمدًا
 * Security note: secret is baked in directly — NOT read from env vars by design
 * (env var support belongs only in generate-codes.js / build tooling)
 */

const HMAC_SECRET = "${newSecret}";

module.exports = { HMAC_SECRET };
`;

fs.writeFileSync(configPath, configContent, "utf-8");

/* ─── توليد كودات تجريبية بالمفتاح الجديد ── */

function generateCode(prefix) {
  const pfix = prefix.toUpperCase().slice(0, 4).padEnd(4, "X");
  const hash = crypto
    .createHmac("sha256", newSecret)
    .update(pfix)
    .digest("hex")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12)
    .padEnd(12, "0");
  return `${pfix}-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

const samplePrefixes = ["DEV1", "DEV2", "TEST"];
const sampleCodes = samplePrefixes.map(generateCode);

/* ─── الطباعة ─────────────────────── */

console.log("\n🔑 تم تدوير المفتاح السري بنجاح / Secret rotated successfully");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📄 تم تحديث: src/hmac-config.js`);
console.log(`🔐 المفتاح الجديد (32 بايت): ${newSecret.slice(0, 8)}...${newSecret.slice(-8)}`);

console.log("\n📋 كودات تجريبية للتطوير (صالحة مع المفتاح الجديد):");
console.log("   Development sample codes (valid with new secret):");
sampleCodes.forEach(c => console.log(`   ${c}`));

console.log("\n⚠️  الخطوات التالية / Next steps:");
console.log("   1. احتفظ بالمفتاح في مكان آمن (مدير كلمات المرور)");
console.log("      Save the secret in a password manager");
console.log("   2. ولّد الكودات الكاملة:  node src/generate-codes.js 20");
console.log("      Generate full codes:    node src/generate-codes.js 20");
console.log("   3. ابنِ ملف EXE:  npm run build:win");
console.log("      Build the EXE:  npm run build:win");
console.log("   4. لا ترفع src/hmac-config.js على git أبدًا");
console.log("      Never commit src/hmac-config.js to git\n");

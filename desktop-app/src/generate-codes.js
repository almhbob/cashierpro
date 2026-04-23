#!/usr/bin/env node
/**
 * CashierPro — Code Generator Tool
 * أداة توليد كودات التفعيل
 *
 * الاستخدام:
 *   node src/generate-codes.js [count] [prefix]
 *
 * أمثلة:
 *   node src/generate-codes.js 10           → 10 كودات ببادئة عشوائية
 *   node src/generate-codes.js 5 CP25       → 5 كودات ببادئة CP25
 *   node src/generate-codes.js 1 PRMO       → كود واحد لترقية
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// يجب أن يطابق HMAC_SECRET في activation.js تمامًا
const HMAC_SECRET = "CashierPro-Secret-2025-AlMhbob";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون أحرف مشابهة (0/O, 1/I)

/**
 * يولّد بادئة عشوائية من 4 أحرف
 */
function randomPrefix() {
  let p = "";
  for (let i = 0; i < 4; i++) {
    p += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return p;
}

/**
 * يولّد كود تفعيل صحيح
 * @param {string} prefix بادئة مختارة (4 أحرف)
 * @returns {string} الكود بتنسيق XXXX-XXXX-XXXX-XXXX
 */
function generateCode(prefix) {
  const pfix = (prefix || randomPrefix()).toUpperCase().slice(0, 4).padEnd(4, "X");

  // نحسب HMAC ونأخذ أول 12 حرف (3 مجموعات × 4 أحرف)
  const hash = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(pfix)
    .digest("hex")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12)
    .padEnd(12, "0");

  // تنسيق: XXXX-XXXX-XXXX-XXXX
  return `${pfix}-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

/* ─── الأمر الرئيسي ─────────────────── */

const count = parseInt(process.argv[2]) || 10;
const prefix = process.argv[3] || null;

console.log(`\n🔑 كاشير برو — مولّد كودات التفعيل`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`📦 يتم توليد ${count} كود${prefix ? ` ببادئة "${prefix}"` : " بادئات عشوائية"}...\n`);

const codes = [];
const usedPrefixes = new Set();

for (let i = 0; i < count; i++) {
  let p = prefix;

  // إذا لا يوجد prefix محدد، نولّد بادئة فريدة
  if (!p) {
    do {
      p = randomPrefix();
    } while (usedPrefixes.has(p));
    usedPrefixes.add(p);
  }

  const code = generateCode(p);
  codes.push(code);
  console.log(`  ${String(i + 1).padStart(3, "0")}. ${code}`);
}

// حفظ في ملف
const outputFile = path.join(__dirname, "../codes-generated.txt");
const existingCodes = fs.existsSync(outputFile)
  ? fs.readFileSync(outputFile, "utf-8").split("\n").filter(Boolean)
  : [];

const allCodes = [...existingCodes, ...codes];
const header =
  `# CashierPro — Generated Activation Codes\n` +
  `# Generated: ${new Date().toISOString()}\n` +
  `# Total: ${allCodes.filter(l => !l.startsWith("#")).length} codes\n` +
  `# Format: XXXX-XXXX-XXXX-XXXX\n` +
  `# ⚠️  Keep this file SECURE — never commit to git!\n\n`;

const codeLines = allCodes
  .filter(l => !l.startsWith("#") && l.trim())
  .join("\n");

fs.writeFileSync(outputFile, header + codeLines + "\n", "utf-8");

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ تم حفظ ${count} كود جديد في: codes-generated.txt`);
console.log(`📄 إجمالي الكودات المحفوظة: ${allCodes.filter(l => !l.startsWith("#")).length}`);
console.log(`\n⚠️  تأكد من عدم رفع هذا الملف على GitHub!\n`);

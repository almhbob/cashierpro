#!/usr/bin/env node
/**
 * CashierPro — Code Generator Tool
 * أداة توليد كودات التفعيل
 *
 * الاستخدام:
 *   node src/generate-codes.js [count] [prefix] [--plain] [--encrypt <pass>] [--decrypt <pass>]
 *
 * أمثلة:
 *   node src/generate-codes.js 10                           → 10 كودات، محفوظة كـ HMAC-SHA256 hash
 *   node src/generate-codes.js 5 CP25                      → 5 كودات ببادئة CP25، محفوظة كـ hash
 *   node src/generate-codes.js 10 --plain                   → حفظ الكودات كنص عادي (غير موصى به)
 *   node src/generate-codes.js 10 --encrypt MyPassphrase    → تشفير الملف بالكامل بـ AES-256-CBC
 *   node src/generate-codes.js --decrypt MyPassphrase       → فك تشفير الملف وطباعة الكودات
 *
 * Storage modes:
 *   default  : each code stored as HMAC-SHA256(secret, code) — one-way hash
 *   --plain  : plain-text codes stored (backward-compat, not recommended)
 *   --encrypt: AES-256-CBC encrypted blob; use --decrypt to read back
 *   --decrypt: prints decrypted plain-text codes to stdout (no new codes generated)
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/* ─── Parse CLI arguments ────────────────────────────────────────────── */

const rawArgs = process.argv.slice(2);

const plainFlag   = rawArgs.includes("--plain");
const encryptIdx  = rawArgs.indexOf("--encrypt");
const decryptIdx  = rawArgs.indexOf("--decrypt");
const encryptFlag = encryptIdx !== -1;
const decryptFlag = decryptIdx !== -1;
const passphrase  = encryptFlag ? rawArgs[encryptIdx + 1]
                  : decryptFlag ? rawArgs[decryptIdx + 1]
                  : null;

if (encryptFlag && !passphrase) {
  console.error("❌ --encrypt تتطلب كلمة مرور / --encrypt requires a passphrase");
  console.error("   مثال: node src/generate-codes.js 10 --encrypt MyPassphrase");
  process.exit(1);
}

if (decryptFlag && !passphrase) {
  console.error("❌ --decrypt تتطلب كلمة مرور / --decrypt requires a passphrase");
  console.error("   مثال: node src/generate-codes.js --decrypt MyPassphrase");
  process.exit(1);
}

// Collect positional args (strip all known flags and their arguments)
const flagsToSkip = new Set();
if (encryptFlag) { flagsToSkip.add(encryptIdx); flagsToSkip.add(encryptIdx + 1); }
if (decryptFlag) { flagsToSkip.add(decryptIdx); flagsToSkip.add(decryptIdx + 1); }

const positional = rawArgs.filter((a, i) => {
  if (a === "--plain") return false;
  if (flagsToSkip.has(i)) return false;
  return true;
});

const count  = parseInt(positional[0]) || 10;
const prefix = positional[1] || null;

/* ─── Load HMAC secret ───────────────────────────────────────────────── */

/**
 * يحمّل المفتاح السري بالترتيب:
 *  1. متغير البيئة HMAC_SECRET
 *  2. ملف src/hmac-config.js المحلي (غير مرفوع على git)
 *  3. خطأ واضح يطلب تشغيل rotate-secret.js
 */
function loadHmacSecret() {
  if (process.env.HMAC_SECRET) {
    return process.env.HMAC_SECRET;
  }
  try {
    return require("./hmac-config").HMAC_SECRET;
  } catch {
    throw new Error(
      "[CashierPro] HMAC secret is not configured.\n" +
      "Run:  node scripts/rotate-secret.js\n" +
      "Or set the HMAC_SECRET environment variable."
    );
  }
}

const HMAC_SECRET = loadHmacSecret();

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون أحرف مشابهة (0/O, 1/I)

/* ─── Code generation ────────────────────────────────────────────────── */

function randomPrefix() {
  let p = "";
  for (let i = 0; i < 4; i++) {
    p += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return p;
}

function generateCode(prefix) {
  const pfix = (prefix || randomPrefix()).toUpperCase().slice(0, 4).padEnd(4, "X");
  const hash = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(pfix)
    .digest("hex")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12)
    .padEnd(12, "0");
  return `${pfix}-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

/* ─── Storage helpers ────────────────────────────────────────────────── */

/**
 * Hash a single code for safe storage.
 * HMAC-SHA256(secret, code) — secret-bound so cannot be brute-forced
 * without HMAC_SECRET.
 */
function hashCodeForStorage(code) {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(code)
    .digest("hex");
}

/**
 * AES-256-CBC encrypt.  Returns "iv_hex:ciphertext_hex".
 */
function aesEncrypt(plaintext, pass) {
  const key = crypto.createHash("sha256").update(pass).digest();
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * AES-256-CBC decrypt.  Accepts "iv_hex:ciphertext_hex".
 */
function aesDecrypt(blob, pass) {
  const [ivHex, cipherHex] = blob.split(":");
  if (!ivHex || !cipherHex) throw new Error("Invalid AES blob format");
  const key = crypto.createHash("sha256").update(pass).digest();
  const iv  = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([
    decipher.update(Buffer.from(cipherHex, "hex")),
    decipher.final(),
  ]).toString("utf-8");
}

/* ─── File format detection ──────────────────────────────────────────── */

const FORMAT = { UNKNOWN: "unknown", AES: "aes", HASH: "hash", PLAIN: "plain" };

/**
 * Detect the storage format of an existing codes file.
 * Returns one of the FORMAT constants.
 */
function detectFileFormat(filePath) {
  if (!fs.existsSync(filePath)) return FORMAT.UNKNOWN;
  const content = fs.readFileSync(filePath, "utf-8");
  if (content.includes("Storage: AES-256-CBC")) return FORMAT.AES;
  if (content.includes("Storage: HMAC-SHA256"))  return FORMAT.HASH;
  if (content.includes("Storage: PLAIN TEXT"))   return FORMAT.PLAIN;
  // Legacy file with no storage tag — treat as plain
  const hasPlainCodes = content
    .split("\n")
    .filter(l => !l.startsWith("#") && l.trim())
    .some(l => /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(l));
  return hasPlainCodes ? FORMAT.PLAIN : FORMAT.HASH;
}

/**
 * Extract non-comment, non-empty lines from a file.
 * For AES files, decrypts with passphrase and splits on newlines.
 * For HASH/PLAIN files, returns lines directly.
 * Returns { lines, format }.
 */
function readExistingLines(filePath, pass) {
  if (!fs.existsSync(filePath)) return { lines: [], format: FORMAT.UNKNOWN };
  const format = detectFileFormat(filePath);
  const raw = fs.readFileSync(filePath, "utf-8");

  if (format === FORMAT.AES) {
    const blobLine = raw.split("\n").find(l => !l.startsWith("#") && l.trim());
    if (!blobLine) return { lines: [], format };
    try {
      const decrypted = aesDecrypt(blobLine.trim(), pass);
      return { lines: decrypted.split("\n").filter(Boolean), format };
    } catch {
      throw new Error(
        "❌ فشل فك تشفير الملف — تأكد من صحة كلمة المرور.\n" +
        "   Decryption failed — check your passphrase."
      );
    }
  }

  // HASH or PLAIN — return lines verbatim
  const lines = raw.split("\n").filter(l => !l.startsWith("#") && l.trim());
  return { lines, format };
}

/* ─── Decrypt-only mode ──────────────────────────────────────────────── */

const outputFile = path.join(__dirname, "../codes-generated.txt");

if (decryptFlag) {
  console.log(`\n🔓 كاشير برو — فك تشفير كودات التفعيل`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const existingFormat = detectFileFormat(outputFile);
  if (existingFormat !== FORMAT.AES) {
    console.error(`❌ الملف لا يحتوي على محتوى AES مشفَّر.`);
    console.error(`   الوضع الحالي: ${existingFormat}`);
    process.exit(1);
  }

  let decryptedLines;
  try {
    ({ lines: decryptedLines } = readExistingLines(outputFile, passphrase));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  console.log(`📄 إجمالي الكودات المخزَّنة: ${decryptedLines.length}\n`);
  decryptedLines.forEach((code, i) => {
    console.log(`  ${String(i + 1).padStart(3, "0")}. ${code}`);
  });
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`⚠️  هذه الكودات سرية — لا تشاركها!\n`);
  process.exit(0);
}

/* ─── Generate codes ─────────────────────────────────────────────────── */

const modeLabel = plainFlag   ? "نص عادي (⚠️ غير موصى به)" :
                  encryptFlag ? "AES-256-CBC (--encrypt)" :
                                "HMAC-SHA256 hash (افتراضي)";

console.log(`\n🔑 كاشير برو — مولّد كودات التفعيل`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`📦 يتم توليد ${count} كود${prefix ? ` ببادئة "${prefix}"` : " بادئات عشوائية"}...`);
console.log(`🔒 وضع الحفظ: ${modeLabel}\n`);

const codes = [];
const usedPrefixes = new Set();

for (let i = 0; i < count; i++) {
  let p = prefix;
  if (!p) {
    do { p = randomPrefix(); } while (usedPrefixes.has(p));
    usedPrefixes.add(p);
  }
  const code = generateCode(p);
  codes.push(code);
  console.log(`  ${String(i + 1).padStart(3, "0")}. ${code}`);
}

/* ─── Persist to file ────────────────────────────────────────────────── */

if (encryptFlag) {
  // ── AES mode ──────────────────────────────────────────────────────────
  // Read any existing codes — regardless of their previous storage format.
  let existingPlain = [];
  const existingFormat = detectFileFormat(outputFile);
  if (existingFormat === FORMAT.AES) {
    try {
      ({ lines: existingPlain } = readExistingLines(outputFile, passphrase));
    } catch (e) {
      console.warn("⚠️  تعذّر فك تشفير الملف الحالي — سيتم الكتابة فوقه.");
      existingPlain = [];
    }
  } else if (existingFormat === FORMAT.PLAIN) {
    // Carry over existing plain-text codes
    existingPlain = readExistingLines(outputFile, passphrase).lines;
  } else if (existingFormat === FORMAT.HASH) {
    // Cannot recover plain codes from hashes — start fresh but warn
    console.warn(
      "⚠️  الملف الحالي يحتوي على hashes فقط (لا يمكن استرجاع الكودات الأصلية).\n" +
      "   Only new codes will be added to the encrypted file."
    );
  }

  const allPlain = [...existingPlain, ...codes];
  const blob = aesEncrypt(allPlain.join("\n"), passphrase);

  const header =
    `# CashierPro — Generated Activation Codes (AES-256-CBC Encrypted)\n` +
    `# Updated: ${new Date().toISOString()}\n` +
    `# Total codes: ${allPlain.length}\n` +
    `# Storage: AES-256-CBC\n` +
    `# To view codes: node src/generate-codes.js --decrypt <passphrase>\n` +
    `# ⚠️  Keep this file and your passphrase SECURE!\n\n`;

  fs.writeFileSync(outputFile, header + blob + "\n", "utf-8");

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ تم حفظ ${codes.length} كود جديد في: codes-generated.txt (مشفَّر AES-256)`);
  console.log(`📄 إجمالي الكودات المشفَّرة: ${allPlain.length}`);
  console.log(`\n⚠️  احتفظ بكلمة المرور بشكل آمن — لا يمكن فك التشفير بدونها!\n`);

} else if (plainFlag) {
  // ── Plain mode ────────────────────────────────────────────────────────
  const { lines: existingLines } = readExistingLines(outputFile, null);

  const allCodes = [...existingLines, ...codes];
  const header =
    `# CashierPro — Generated Activation Codes\n` +
    `# Generated: ${new Date().toISOString()}\n` +
    `# Total: ${allCodes.filter(l => !l.startsWith("#")).length} codes\n` +
    `# Storage: PLAIN TEXT ⚠️  (use without --plain for hashed storage)\n` +
    `# Format: XXXX-XXXX-XXXX-XXXX\n` +
    `# ⚠️  Keep this file SECURE — never commit to git!\n\n`;

  const codeLines = allCodes.filter(l => !l.startsWith("#") && l.trim()).join("\n");
  fs.writeFileSync(outputFile, header + codeLines + "\n", "utf-8");

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ تم حفظ ${codes.length} كود جديد في: codes-generated.txt (نص عادي)`);
  console.log(`📄 إجمالي الكودات المحفوظة: ${allCodes.filter(l => !l.startsWith("#") && l.trim()).length}`);
  console.log(`\n⚠️  تأكد من عدم رفع هذا الملف على GitHub!\n`);

} else {
  // ── Default hash mode ─────────────────────────────────────────────────
  const existingFormat = detectFileFormat(outputFile);
  let existingHashes = [];

  if (existingFormat === FORMAT.HASH) {
    existingHashes = readExistingLines(outputFile, null).lines;
  } else if (existingFormat !== FORMAT.UNKNOWN) {
    // The file is in a different format (plain or AES). Do not mix formats.
    console.warn(
      `⚠️  الملف الحالي بصيغة "${existingFormat}" — سيتم إنشاء ملف hash جديد.\n` +
      `   Existing file format is "${existingFormat}"; a fresh hash file will be written.`
    );
  }

  const newHashes = codes.map(hashCodeForStorage);
  const allHashes = [...existingHashes, ...newHashes];

  const header =
    `# CashierPro — Generated Activation Codes (Hashed)\n` +
    `# Updated: ${new Date().toISOString()}\n` +
    `# Total codes: ${allHashes.length}\n` +
    `# Storage: HMAC-SHA256 hashes — plain codes are NOT stored here\n` +
    `# The actual codes were printed to the console at generation time.\n` +
    `# ⚠️  Keep this file SECURE — never commit to git!\n\n`;

  fs.writeFileSync(outputFile, header + allHashes.join("\n") + "\n", "utf-8");

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ تم حفظ ${codes.length} كود جديد في: codes-generated.txt (HMAC-SHA256 hash)`);
  console.log(`📄 إجمالي الكودات المحفوظة: ${allHashes.length}`);
  console.log(`\n💡 الكودات الفعلية طُبعت أعلاه — احفظها في مكان آمن!`);
  console.log(`⚠️  تأكد من عدم رفع هذا الملف على GitHub!\n`);
}

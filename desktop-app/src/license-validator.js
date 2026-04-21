/**
 * License Validator — CashierPro Desktop
 * Works offline after first activation.
 * Machine-bound: one license = one machine.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { machineIdSync } = require("node-machine-id");

// Set at build time via electron-builder env or hardcode your deployed URL here:
const ACTIVATION_SERVER = (process.env.APP_LICENSE_URL || "https://cashierpro.replit.app") + "/api/superadmin/licenses";
const LICENSE_FILE = path.join(require("electron").app.getPath("userData"), "license.json");

function getMachineId() {
  try {
    return machineIdSync({ original: true });
  } catch {
    return crypto.createHash("sha256").update(require("os").hostname() + require("os").platform()).digest("hex");
  }
}

async function activateLicense(key) {
  const machineId = getMachineId();
  const res = await fetch(`${ACTIVATION_SERVER}/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: key.trim().toUpperCase(), machineId }),
  });
  const data = await res.json();

  if (data.valid) {
    const licenseData = {
      licenseId: data.license.id,
      storeName: data.license.storeName,
      type: data.license.type,
      expiresAt: data.license.expiresAt,
      machineToken: data.machineToken,
      machineId,
      activatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData, null, 2), "utf8");
    return { valid: true, license: licenseData };
  }

  return { valid: false, reason: data.reason };
}

async function verifyLicense() {
  if (!fs.existsSync(LICENSE_FILE)) {
    return { valid: false, reason: "not_activated" };
  }

  let licenseData;
  try {
    licenseData = JSON.parse(fs.readFileSync(LICENSE_FILE, "utf8"));
  } catch {
    return { valid: false, reason: "corrupt_file" };
  }

  const { expiresAt, machineId, machineToken, licenseId } = licenseData;

  if (expiresAt && new Date(expiresAt) < new Date()) {
    return { valid: false, reason: "expired", license: licenseData };
  }

  const currentMachineId = getMachineId();
  if (machineId !== currentMachineId) {
    return { valid: false, reason: "wrong_machine" };
  }

  try {
    const res = await fetch(`${ACTIVATION_SERVER}/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseId, machineId, machineToken }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (!data.valid) return { valid: false, reason: data.reason ?? "invalid_token" };
  } catch {
    // Offline mode: trust local file if machine ID matches and not expired
    console.log("[License] Offline mode: skipping server verification");
  }

  return { valid: true, license: licenseData };
}

function getLicenseInfo() {
  try {
    return JSON.parse(fs.readFileSync(LICENSE_FILE, "utf8"));
  } catch {
    return null;
  }
}

module.exports = { activateLicense, verifyLicense, getMachineId, getLicenseInfo };

import crypto from "crypto";

const SECRET = process.env.LICENSE_SECRET ?? "cashierpro-license-secret-2025-change-in-prod";

export function generateLicenseKey(): string {
  const raw = crypto.randomBytes(12).toString("hex").toUpperCase();
  return [raw.slice(0, 6), raw.slice(6, 12), raw.slice(12, 18), raw.slice(18, 24)].join("-");
}

export function generateMachineToken(machineId: string, licenseId: string): string {
  return crypto.createHmac("sha256", SECRET).update(`${machineId}:${licenseId}`).digest("hex");
}

export function verifyMachineToken(machineId: string, licenseId: string, token: string): boolean {
  const expected = generateMachineToken(machineId, licenseId);
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
}

export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

export function addDays(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

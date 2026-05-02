export type ComplianceCountry = "SA" | "GLOBAL";

export interface InvoiceComplianceProfile {
  country: ComplianceCountry;
  vatEnabled: boolean;
  vatRate: number;
  sellerName: string;
  vatNumber: string;
  currency: string;
  modeLabel: string;
}

export const DEFAULT_COMPLIANCE_PROFILE: InvoiceComplianceProfile = {
  country: "GLOBAL",
  vatEnabled: false,
  vatRate: 0,
  sellerName: "CashierPro Store",
  vatNumber: "",
  currency: "SAR",
  modeLabel: "Global Standard",
};

export const SAUDI_COMPLIANCE_PROFILE: InvoiceComplianceProfile = {
  country: "SA",
  vatEnabled: true,
  vatRate: 15,
  sellerName: "CashierPro Store",
  vatNumber: "300000000000003",
  currency: "SAR",
  modeLabel: "Saudi ZATCA Phase 1",
};

export function getStoredComplianceProfile(): InvoiceComplianceProfile {
  if (typeof window === "undefined") return DEFAULT_COMPLIANCE_PROFILE;

  const country = (window.localStorage.getItem("cashierpro.compliance.country") || "GLOBAL") as ComplianceCountry;
  const base = country === "SA" ? SAUDI_COMPLIANCE_PROFILE : DEFAULT_COMPLIANCE_PROFILE;
  const storedVatEnabled = window.localStorage.getItem("cashierpro.compliance.vatEnabled");
  const storedVatRate = Number(window.localStorage.getItem("cashierpro.compliance.vatRate") || base.vatRate);
  const sellerName = window.localStorage.getItem("cashierpro.compliance.sellerName") || base.sellerName;
  const vatNumber = window.localStorage.getItem("cashierpro.compliance.vatNumber") || base.vatNumber;
  const currency = window.localStorage.getItem("cashierpro.compliance.currency") || base.currency;

  return {
    ...base,
    vatEnabled: storedVatEnabled === null ? base.vatEnabled : storedVatEnabled === "true",
    vatRate: Number.isFinite(storedVatRate) ? storedVatRate : base.vatRate,
    sellerName,
    vatNumber,
    currency,
  };
}

export function saveComplianceCountry(country: ComplianceCountry) {
  if (typeof window === "undefined") return;
  const profile = country === "SA" ? SAUDI_COMPLIANCE_PROFILE : DEFAULT_COMPLIANCE_PROFILE;
  window.localStorage.setItem("cashierpro.compliance.country", country);
  window.localStorage.setItem("cashierpro.compliance.vatEnabled", String(profile.vatEnabled));
  window.localStorage.setItem("cashierpro.compliance.vatRate", String(profile.vatRate));
  window.localStorage.setItem("cashierpro.compliance.sellerName", profile.sellerName);
  window.localStorage.setItem("cashierpro.compliance.vatNumber", profile.vatNumber);
  window.localStorage.setItem("cashierpro.compliance.currency", profile.currency);
}

export function calculateVatFromInclusiveTotal(total: number, vatRate: number) {
  if (!vatRate || vatRate <= 0) return { taxableAmount: total, vatAmount: 0, totalWithVat: total };
  const vatAmount = total - total / (1 + vatRate / 100);
  return {
    taxableAmount: total - vatAmount,
    vatAmount,
    totalWithVat: total,
  };
}

function tlv(tag: number, value: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(value));
  return [tag, bytes.length, ...bytes];
}

function bytesToBase64(bytes: number[]) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function generateZatcaPhaseOneTlvBase64(args: {
  sellerName: string;
  vatNumber: string;
  timestampIso: string;
  totalWithVat: number;
  vatAmount: number;
}) {
  const total = args.totalWithVat.toFixed(2);
  const vat = args.vatAmount.toFixed(2);
  const bytes = [
    ...tlv(1, args.sellerName),
    ...tlv(2, args.vatNumber),
    ...tlv(3, args.timestampIso),
    ...tlv(4, total),
    ...tlv(5, vat),
  ];
  return bytesToBase64(bytes);
}

export function makeVerificationCode(parts: Array<string | number | null | undefined>) {
  const input = parts.filter(Boolean).join("|");
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(8, "0").slice(-8);
}

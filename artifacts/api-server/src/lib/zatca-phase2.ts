/**
 * ZATCA Phase 2 — e-Invoicing (Fatoorah) Integration
 *
 * Implements UBL 2.1 invoice generation, ECDSA-SHA256 XAdES signing,
 * and reporting/clearing via the ZATCA Fatoorah API.
 *
 * Required environment variables:
 *   ZATCA_CSID            — Compliance or Production CSID from Fatoorah portal
 *   ZATCA_CSID_SECRET     — CSID secret (issued alongside CSID)
 *   ZATCA_PRIVATE_KEY     — PEM-encoded ECDSA P-256 private key (\\n escaped)
 *   ZATCA_CERTIFICATE     — Base64-encoded X.509 certificate (no PEM headers)
 *   ZATCA_ENVIRONMENT     — "sandbox" | "simulation" | "production"  (default: sandbox)
 */

import crypto from "node:crypto";

// ─── API Endpoints ────────────────────────────────────────────────────────────

const ZATCA_BASE: Record<string, string> = {
  sandbox:    "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
  simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
  production: "https://gw-fatoora.zatca.gov.sa/e-invoicing",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Phase2Credentials {
  csid: string;
  csidSecret: string;
  privateKeyPem: string;
  certificateBase64: string;
  environment: "sandbox" | "simulation" | "production";
}

export interface Phase2InvoiceParams {
  invoiceNumber: string;
  uuid: string;
  issueDate: string;         // YYYY-MM-DD
  issueTime: string;         // HH:MM:SS
  sellerName: string;
  vatRegistrationNumber: string;
  branchAddress?: string;
  lineItems: Phase2LineItem[];
  taxableAmount: number;
  vatAmount: number;
  vatRate: number;           // e.g. 0.15
  total: number;
  icv: number;
  previousInvoiceHash: string | null;
}

export interface Phase2LineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
}

export interface Phase2ReportResult {
  success: boolean;
  status: "reported" | "cleared" | "failed" | "not_configured";
  httpStatus?: number;
  warnings?: string[];
  errors?: string[];
  clearedInvoice?: string;
  invoiceHash?: string;
}

interface ZatcaApiResponse {
  validationResults?: {
    status?: string;
    infoMessages?: ZatcaMessage[];
    warningMessages?: ZatcaMessage[];
    errorMessages?: ZatcaMessage[];
  };
  reportingStatus?: string;
  clearanceStatus?: string;
  clearedInvoice?: string;
}

interface ZatcaMessage {
  type?: string;
  code?: string;
  message?: string;
  status?: string;
}

// ─── Credential Loader ────────────────────────────────────────────────────────

export function loadPhase2Credentials(): Phase2Credentials | null {
  const csid        = process.env.ZATCA_CSID;
  const csidSecret  = process.env.ZATCA_CSID_SECRET;
  const privateKey  = process.env.ZATCA_PRIVATE_KEY;
  const certificate = process.env.ZATCA_CERTIFICATE;
  const env         = (process.env.ZATCA_ENVIRONMENT ?? "sandbox") as Phase2Credentials["environment"];

  if (!csid || !csidSecret || !privateKey || !certificate) return null;

  return {
    csid,
    csidSecret,
    privateKeyPem: privateKey.replace(/\\n/g, "\n"),
    certificateBase64: certificate.replace(/\s/g, ""),
    environment: env,
  };
}

// ─── Crypto Helpers ───────────────────────────────────────────────────────────

function sha256b64(content: string | Buffer): string {
  return crypto.createHash("sha256")
    .update(typeof content === "string" ? Buffer.from(content, "utf8") : content)
    .digest("base64");
}

function signEcdsaIeeeP1363(content: string, privateKeyPem: string): string {
  const signer = crypto.createSign("SHA256");
  signer.update(content, "utf8");
  return signer.sign({ key: privateKeyPem, dsaEncoding: "ieee-p1363" }, "base64");
}

// ─── XML Helpers ──────────────────────────────────────────────────────────────

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Simplified canonical XML: collapses inter-element whitespace.
 * Sufficient for our generated XML where we control the structure.
 */
function canonicalize(xml: string): string {
  return xml
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/>\s+</g, "><")
    .trim();
}

/** Strip UBLExtensions and cac:Signature blocks to get the signable invoice content. */
function extractSignableBody(xml: string): string {
  let s = xml;
  s = s.replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>\s*/g, "");
  s = s.replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>\s*/g, "");
  return canonicalize(s);
}

// ─── XML Builders ─────────────────────────────────────────────────────────────

function buildLineItemsXml(items: Phase2LineItem[]): string {
  return items.map((item, idx) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="SAR">${item.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${item.vatAmount.toFixed(2)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="SAR">${(item.subtotal + item.vatAmount).toFixed(2)}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${esc(item.name)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${(item.vatRate * 100).toFixed(2)}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="SAR">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`).join("");
}

function buildSignedInfoXml(invoiceDigest: string, propsDigest: string): string {
  return `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
    <ds:Reference Id="invoiceSignedData" URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
          <ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>
        </ds:Transform>
        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
          <ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath>
        </ds:Transform>
        <ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>${invoiceDigest}</ds:DigestValue>
    </ds:Reference>
    <ds:Reference Type="http://uri.etsi.org/01903/v1.3.2#SignedProperties" URI="#xadesSignedProperties">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>${propsDigest}</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>`;
}

function buildQualifyingPropsXml(signingTime: string, certBase64: string): string {
  const certDer  = Buffer.from(certBase64, "base64");
  const certHash = sha256b64(certDer);

  return `<xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="signature">
    <xades:SignedProperties Id="xadesSignedProperties">
      <xades:SignedSignatureProperties>
        <xades:SigningTime>${esc(signingTime)}</xades:SigningTime>
        <xades:SigningCertificate>
          <xades:Cert>
            <xades:CertDigest>
              <ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certHash}</ds:DigestValue>
            </xades:CertDigest>
            <xades:IssuerSerial>
              <ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">CN=ZATCA-Code-Signing CA-1, DC=zatca, DC=gov, DC=sa</ds:X509IssuerName>
              <ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">1</ds:X509SerialNumber>
            </xades:IssuerSerial>
          </xades:Cert>
        </xades:SigningCertificate>
      </xades:SignedSignatureProperties>
    </xades:SignedProperties>
  </xades:QualifyingProperties>`;
}

// ─── Main Invoice Builder ─────────────────────────────────────────────────────

/**
 * Build a signed UBL 2.1 invoice XML ready for ZATCA Phase 2 reporting.
 */
export function buildSignedInvoiceXml(
  params: Phase2InvoiceParams,
  credentials: Phase2Credentials,
): string {
  const {
    invoiceNumber, uuid, issueDate, issueTime,
    sellerName, vatRegistrationNumber, branchAddress,
    lineItems, taxableAmount, vatAmount, vatRate, total,
    icv, previousInvoiceHash,
  } = params;

  const signingTime = `${issueDate}T${issueTime}`;
  const prevHash = previousInvoiceHash
    ?? "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjOTljMmVkYzE4NTliODMyNTQwMzkwOTg0ZGU1NmM1NA==";

  // 1. Build body XML without extension block (for signing)
  const bodyXml = buildInvoiceBodyXml(
    invoiceNumber, uuid, issueDate, issueTime,
    sellerName, vatRegistrationNumber, branchAddress ?? "الرياض",
    lineItems, taxableAmount, vatAmount, vatRate, total,
    icv, prevHash,
  );

  // 2. Compute invoice content digest
  const signableBody = extractSignableBody(bodyXml);
  const invoiceDigest = sha256b64(signableBody);

  // 3. Build qualifying props and compute their digest
  const qualifyingPropsXml = buildQualifyingPropsXml(signingTime, credentials.certificateBase64);
  const propsDigest = sha256b64(canonicalize(qualifyingPropsXml));

  // 4. Build SignedInfo, canonicalize, sign with ECDSA-SHA256
  const signedInfoXml = buildSignedInfoXml(invoiceDigest, propsDigest);
  const canonSignedInfo = canonicalize(signedInfoXml);
  const signatureValue = signEcdsaIeeeP1363(canonSignedInfo, credentials.privateKeyPem);

  // 5. Assemble the full signed invoice
  const signatureBlock = `
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent>
        <sig:UBLDocumentSignatures xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2"
                                   xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2">
          <sac:SignatureInformation>
            <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
            <sac:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sac:ReferencedSignatureID>
            <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="signature">
              ${signedInfoXml}
              <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
              <ds:KeyInfo>
                <ds:X509Data>
                  <ds:X509Certificate>${credentials.certificateBase64}</ds:X509Certificate>
                </ds:X509Data>
              </ds:KeyInfo>
              <ds:Object>${qualifyingPropsXml}</ds:Object>
            </ds:Signature>
          </sac:SignatureInformation>
        </sig:UBLDocumentSignatures>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>`;

  return bodyXml.replace("</Invoice>", `${signatureBlock}\n</Invoice>`);
}

function buildInvoiceBodyXml(
  invoiceNumber: string,
  uuid: string,
  issueDate: string,
  issueTime: string,
  sellerName: string,
  vatRegistrationNumber: string,
  branchAddress: string,
  lineItems: Phase2LineItem[],
  taxableAmount: number,
  vatAmount: number,
  vatRate: number,
  total: number,
  icv: number,
  previousInvoiceHash: string,
): string {
  const vatPct = (vatRate * 100).toFixed(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${esc(invoiceNumber)}</cbc:ID>
  <cbc:UUID>${esc(uuid)}</cbc:UUID>
  <cbc:IssueDate>${esc(issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${esc(issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${icv}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cbc:UUID>${esc(previousInvoiceHash)}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(branchAddress)}</cbc:StreetName>
        <cbc:BuildingNumber>1000</cbc:BuildingNumber>
        <cbc:CityName>الرياض</cbc:CityName>
        <cbc:PostalZone>12345</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(vatRegistrationNumber)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(sellerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PostalAddress>
        <cbc:StreetName>غير محدد</cbc:StreetName>
        <cbc:CityName>الرياض</cbc:CityName>
        <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity><cbc:RegistrationName>عميل نقدي</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${vatAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${taxableAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${vatAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${vatPct}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${taxableAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">0.00</cbc:AllowanceTotalAmount>
    <cbc:PrepaidAmount currencyID="SAR">0.00</cbc:PrepaidAmount>
    <cbc:PayableAmount currencyID="SAR">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${buildLineItemsXml(lineItems)}
</Invoice>`;
}

// ─── ZATCA API Client ─────────────────────────────────────────────────────────

/**
 * Report a simplified tax invoice to ZATCA Phase 2.
 * Returns immediately with not_configured if credentials are missing.
 */
export async function reportInvoiceToZatca(
  params: Phase2InvoiceParams,
  credentials: Phase2Credentials,
): Promise<Phase2ReportResult> {
  let signedXml: string;

  try {
    signedXml = buildSignedInvoiceXml(params, credentials);
  } catch (err) {
    return {
      success: false,
      status: "failed",
      errors: [`Invoice signing failed: ${String(err)}`],
    };
  }

  const invoiceBase64 = Buffer.from(signedXml, "utf8").toString("base64");
  const invoiceHash   = sha256b64(signedXml);
  const authToken     = Buffer.from(`${credentials.csid}:${credentials.csidSecret}`).toString("base64");
  const baseUrl       = ZATCA_BASE[credentials.environment] ?? ZATCA_BASE.sandbox;
  const endpoint      = `${baseUrl}/invoices/reporting/single`;

  let httpStatus = 0;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": "en",
        "Authorization": `Basic ${authToken}`,
        "Clearance-Status": "0",
        "Accept-Version": "V2",
      },
      body: JSON.stringify({
        invoiceHash,
        uuid: params.uuid,
        invoice: invoiceBase64,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    httpStatus = response.status;
    const data: ZatcaApiResponse = await response.json() as ZatcaApiResponse;

    const warnings = (data.validationResults?.warningMessages ?? []).map(
      (m) => `[${m.code}] ${m.message}`,
    );
    const errors = (data.validationResults?.errorMessages ?? []).map(
      (m) => `[${m.code}] ${m.message}`,
    );

    if (response.ok && (httpStatus === 200 || httpStatus === 202)) {
      return {
        success: true,
        status: "reported",
        httpStatus,
        invoiceHash,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    return {
      success: false,
      status: "failed",
      httpStatus,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : [`HTTP ${httpStatus}`],
    };
  } catch (err) {
    return {
      success: false,
      status: "failed",
      httpStatus,
      errors: [`Network error: ${String(err)}`],
    };
  }
}

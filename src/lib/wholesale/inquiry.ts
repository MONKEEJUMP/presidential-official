import { isWholesaleStateCode, type WholesaleStateCode } from "./market-ordering";

export const WHOLESALE_REQUEST_TYPES = [
  { value: "retail-partner", label: "Become a retail partner" },
  { value: "distribution-partner", label: "Become a distributor or market partner" },
  { value: "ordering-access", label: "Get access to an existing wholesale account" },
] as const;

export const WHOLESALE_BUSINESS_TYPES = [
  { value: "retailer", label: "Licensed retailer" },
  { value: "distributor", label: "Licensed distributor" },
  { value: "manufacturer-operator", label: "Licensed manufacturer or operator" },
  { value: "market-partner", label: "Other licensed market partner" },
] as const;

export const WHOLESALE_PRODUCT_INTERESTS = [
  "Moon Rocks",
  "Pre-Rolls",
  "Blunts",
  "Mini Pre-Rolls",
  "Mini Blunts",
  "Single Mini Blunts",
  "Vapes",
  "General assortment",
] as const;

export type WholesaleRequestType = (typeof WHOLESALE_REQUEST_TYPES)[number]["value"];
export type WholesaleBusinessType = (typeof WHOLESALE_BUSINESS_TYPES)[number]["value"];
export type WholesaleProductInterest = (typeof WHOLESALE_PRODUCT_INTERESTS)[number];

export type WholesaleInquiry = Readonly<{
  requestType: WholesaleRequestType;
  legalBusinessName: string;
  dba: string | null;
  contactName: string;
  jobTitle: string;
  email: string;
  phone: string;
  state: WholesaleStateCode;
  businessType: WholesaleBusinessType;
  licenseNumber: string;
  locationCount: number;
  productInterests: readonly WholesaleProductInterest[];
  message: string;
  licensedBusiness: true;
  dataConsent: true;
}>;

export type WholesaleInquiryField =
  | "requestType"
  | "legalBusinessName"
  | "dba"
  | "contactName"
  | "jobTitle"
  | "email"
  | "phone"
  | "state"
  | "businessType"
  | "licenseNumber"
  | "locationCount"
  | "productInterests"
  | "message"
  | "licensedBusiness"
  | "dataConsent";

export type WholesaleInquiryFieldErrors = Partial<Record<WholesaleInquiryField, string>>;

const REQUEST_TYPE_VALUES = new Set(WHOLESALE_REQUEST_TYPES.map((item) => item.value));
const BUSINESS_TYPE_VALUES = new Set(WHOLESALE_BUSINESS_TYPES.map((item) => item.value));
const PRODUCT_INTEREST_VALUES = new Set<string>(WHOLESALE_PRODUCT_INTERESTS);

export const WHOLESALE_INQUIRY_FIELDS = new Set([
  "requestType",
  "legalBusinessName",
  "dba",
  "contactName",
  "jobTitle",
  "email",
  "phone",
  "state",
  "businessType",
  "licenseNumber",
  "locationCount",
  "productInterests",
  "message",
  "licensedBusiness",
  "dataConsent",
  "website",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maximum: number, required = true): string | null {
  if (value === undefined || value === null || value === "") return required ? null : "";
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return required ? null : "";
  return cleaned.length <= maximum ? cleaned : null;
}

function requestType(value: unknown): WholesaleRequestType | null {
  return typeof value === "string" && REQUEST_TYPE_VALUES.has(value as WholesaleRequestType)
    ? value as WholesaleRequestType
    : null;
}

function businessType(value: unknown): WholesaleBusinessType | null {
  return typeof value === "string" && BUSINESS_TYPE_VALUES.has(value as WholesaleBusinessType)
    ? value as WholesaleBusinessType
    : null;
}

function productInterests(value: unknown): WholesaleProductInterest[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > WHOLESALE_PRODUCT_INTERESTS.length) return null;
  if (!value.every((item) => typeof item === "string" && PRODUCT_INTEREST_VALUES.has(item))) return null;
  return [...new Set(value)] as WholesaleProductInterest[];
}

export function hasUnexpectedWholesaleFields(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).some((key) => !WHOLESALE_INQUIRY_FIELDS.has(key));
}

export function hasWholesaleHoneypot(value: unknown): boolean {
  return isRecord(value) && typeof value.website === "string" && value.website.trim().length > 0;
}

export function parseWholesaleInquiry(value: unknown):
  | { success: true; inquiry: WholesaleInquiry }
  | { success: false; fieldErrors: WholesaleInquiryFieldErrors } {
  const fieldErrors: WholesaleInquiryFieldErrors = {};
  if (!isRecord(value)) return { success: false, fieldErrors: { requestType: "Enter the required application information." } };

  const parsedRequestType = requestType(value.requestType);
  const legalBusinessName = text(value.legalBusinessName, 160);
  const dba = text(value.dba, 160, false);
  const contactName = text(value.contactName, 120);
  const jobTitle = text(value.jobTitle, 120);
  const email = text(value.email, 254)?.toLowerCase() ?? null;
  const phone = text(value.phone, 32);
  const state = isWholesaleStateCode(value.state) ? value.state : null;
  const parsedBusinessType = businessType(value.businessType);
  const licenseNumber = text(value.licenseNumber, 80);
  const locationCountText = text(value.locationCount, 4);
  const parsedProductInterests = productInterests(value.productInterests);
  const message = text(value.message, 1500);

  if (!parsedRequestType) fieldErrors.requestType = "Choose what you need from Presidential Sales.";
  if (!legalBusinessName) fieldErrors.legalBusinessName = "Enter the legal business name.";
  if (dba === null) fieldErrors.dba = "Keep the DBA or storefront name under 160 characters.";
  if (!contactName) fieldErrors.contactName = "Enter the primary contact name.";
  if (!jobTitle) fieldErrors.jobTitle = "Enter the contact's job title or role.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Enter a valid work email.";
  const phoneDigits = phone?.replace(/\D/g, "") ?? "";
  if (!phone || !/^[0-9+().\s-]{7,32}$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    fieldErrors.phone = "Enter a valid phone number with 7 to 15 digits.";
  }
  if (!state) fieldErrors.state = "Choose one of Presidential's seven markets.";
  if (!parsedBusinessType) fieldErrors.businessType = "Choose the licensed business type.";
  if (!licenseNumber) fieldErrors.licenseNumber = "Enter the cannabis license number.";
  const parsedLocationCount = locationCountText && /^\d{1,4}$/.test(locationCountText) ? Number(locationCountText) : NaN;
  if (!Number.isSafeInteger(parsedLocationCount) || parsedLocationCount < 1 || parsedLocationCount > 9999) {
    fieldErrors.locationCount = "Enter the number of licensed locations.";
  }
  if (!parsedProductInterests) fieldErrors.productInterests = "Choose at least one product interest.";
  if (!message) fieldErrors.message = "Tell Sales about the order, market, or opportunity.";
  if (value.licensedBusiness !== true) fieldErrors.licensedBusiness = "Confirm that you represent a licensed cannabis business.";
  if (value.dataConsent !== true) fieldErrors.dataConsent = "Confirm that Presidential may use this information to respond.";

  if (Object.keys(fieldErrors).length > 0 || !parsedRequestType || !legalBusinessName || dba === null || !contactName || !jobTitle || !email || !phone || !state || !parsedBusinessType || !licenseNumber || !parsedProductInterests || !message || !Number.isSafeInteger(parsedLocationCount)) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    inquiry: {
      requestType: parsedRequestType,
      legalBusinessName,
      dba: dba || null,
      contactName,
      jobTitle,
      email,
      phone,
      state,
      businessType: parsedBusinessType,
      licenseNumber,
      locationCount: parsedLocationCount,
      productInterests: parsedProductInterests,
      message,
      licensedBusiness: true,
      dataConsent: true,
    },
  };
}

export function wholesaleRequestLabel(value: WholesaleRequestType): string {
  return WHOLESALE_REQUEST_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function wholesaleBusinessLabel(value: WholesaleBusinessType): string {
  return WHOLESALE_BUSINESS_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function buildWholesaleEmailSubject(inquiry: WholesaleInquiry): string {
  return `Presidential partner inquiry - ${inquiry.state} - ${wholesaleRequestLabel(inquiry.requestType)}`;
}

export function buildWholesaleEmailText(inquiry: WholesaleInquiry): string {
  return [
    "A new licensed-business inquiry was submitted through presidentialmoonrocks.com.",
    "",
    `Request: ${wholesaleRequestLabel(inquiry.requestType)}`,
    `Legal business: ${inquiry.legalBusinessName}`,
    `DBA / storefront: ${inquiry.dba ?? "Not provided"}`,
    `Contact: ${inquiry.contactName}`,
    `Role: ${inquiry.jobTitle}`,
    `Work email: ${inquiry.email}`,
    `Phone: ${inquiry.phone}`,
    `State: ${inquiry.state}`,
    `Business type: ${wholesaleBusinessLabel(inquiry.businessType)}`,
    `License number: ${inquiry.licenseNumber}`,
    `Locations: ${inquiry.locationCount}`,
    `Product interests: ${inquiry.productInterests.join(", ")}`,
    "",
    "Message:",
    inquiry.message,
    "",
    "Licensed-business attestation: confirmed",
    "Data-use consent: confirmed",
  ].join("\n");
}

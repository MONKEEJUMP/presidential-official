const ANALYTICS_ENABLE_ENV = "PRESIDENTIAL_ANALYTICS_ENABLED";
const GA_MEASUREMENT_ID_ENV = "NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID";
const GSC_VERIFICATION_ENABLE_ENV = "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION_ENABLED";
const GSC_VERIFICATION_TOKEN_ENV = "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION";

const gaMeasurementIdPattern = /^G-[A-Z0-9]{6,}$/;
const googleSiteVerificationPattern = /^[A-Za-z0-9_-]{16,256}$/;

export const PRESIDENTIAL_GOOGLE_ENV_NAMES = {
  analyticsEnabled: ANALYTICS_ENABLE_ENV,
  gaMeasurementId: GA_MEASUREMENT_ID_ENV,
  googleSiteVerificationEnabled: GSC_VERIFICATION_ENABLE_ENV,
  googleSiteVerification: GSC_VERIFICATION_TOKEN_ENV,
} as const;

function enabled(name: string): boolean {
  return process.env[name] === "true";
}

export function getGoogleAnalyticsMeasurementId(): string | null {
  if (!enabled(ANALYTICS_ENABLE_ENV)) return null;

  const measurementId = process.env[GA_MEASUREMENT_ID_ENV]?.trim() ?? "";
  return gaMeasurementIdPattern.test(measurementId) ? measurementId : null;
}

export function isGoogleAnalyticsEnabled(): boolean {
  return getGoogleAnalyticsMeasurementId() !== null;
}

export function getGoogleSiteVerification(): string | null {
  if (!enabled(GSC_VERIFICATION_ENABLE_ENV)) return null;

  const token = process.env[GSC_VERIFICATION_TOKEN_ENV]?.trim() ?? "";
  return googleSiteVerificationPattern.test(token) ? token : null;
}

export const SCHEMA_CONTEXT = "https://schema.org" as const;

export const PRODUCTION_ORIGIN = "https://presidentialmoonrocks.com" as const;
export const ORGANIZATION_ID = `${PRODUCTION_ORIGIN}/#organization` as const;
export const WEBSITE_ID = `${PRODUCTION_ORIGIN}/#website` as const;

export const PRESIDENTIAL_NAME = "Presidential" as const;
export const PRESIDENTIAL_DESCRIPTION =
  "Official home of Presidential cannabis products for adults 21+ where legal." as const;

// sameAs is whitelist-only. Official client-approved profiles.
export const APPROVED_SAME_AS = [
  "https://www.instagram.com/presidentialofficial_/",
  "https://www.instagram.com/presidential_medss/",
  "https://www.facebook.com/p/Presidential-RX-100069511874496/",
  "https://www.linkedin.com/in/everett-smith-presidential/",
] as const satisfies readonly string[];

export function canonicalUrl(path = "/"): string {
  if (path.includes("\\") || path.startsWith("//")) {
    throw new Error(`Unsafe canonical path is not allowed in public schema: ${path}`);
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    const parsed = new URL(path);
    if (parsed.origin !== PRODUCTION_ORIGIN) {
      throw new Error(`Non-canonical URL is not allowed in public schema: ${path}`);
    }
    return parsed.toString();
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `${PRODUCTION_ORIGIN}/`;
  }

  const parsed = new URL(normalized, PRODUCTION_ORIGIN);
  if (parsed.origin !== PRODUCTION_ORIGIN) {
    throw new Error(`Non-canonical URL is not allowed in public schema: ${path}`);
  }

  return parsed.toString();
}

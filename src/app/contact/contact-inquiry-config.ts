import "server-only";

const CONTACT_FORM_ENABLED_ENV = "PRESIDENTIAL_CONTACT_FORM_ENABLED";
const CONTACT_INBOX_ENV = "PRESIDENTIAL_CONTACT_INBOX_EMAIL";

function normalizeInbox(value: string | undefined): string | null {
  const inbox = value?.trim();

  if (!inbox || inbox.length > 254) {
    return null;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inbox) ? inbox : null;
}

export function getApprovedContactInbox(): string | null {
  if (process.env[CONTACT_FORM_ENABLED_ENV] !== "true") {
    return null;
  }

  return normalizeInbox(process.env[CONTACT_INBOX_ENV]);
}

export function isContactInquiryConfigured(): boolean {
  return Boolean(getApprovedContactInbox());
}

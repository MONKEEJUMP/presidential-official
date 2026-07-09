export type ContactInquiryStatus =
  | "idle"
  | "not_configured"
  | "invalid"
  | "blocked"
  | "prepared";

export type ContactInquiryField = "contactName" | "contactEmail" | "contactMessage";

export type ContactInquiryState = {
  readonly status: ContactInquiryStatus;
  readonly message: string;
  readonly fieldErrors?: Partial<Record<ContactInquiryField, string>>;
  readonly mailtoHref?: string;
};

export const INITIAL_CONTACT_INQUIRY_STATE: ContactInquiryState = {
  status: "idle",
  message:
    "Use the official inquiry path below. Nothing is stored by this website.",
};

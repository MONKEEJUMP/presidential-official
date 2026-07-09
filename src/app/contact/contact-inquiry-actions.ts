"use server";

import { getApprovedContactInbox } from "./contact-inquiry-config";
import type {
  ContactInquiryField,
  ContactInquiryState,
} from "./contact-inquiry-types";

const MIN_SUBMIT_AGE_MS = 2500;
const MAX_NAME_LENGTH = 90;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 1200;

function valueFrom(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMultiline(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildMailtoHref(input: {
  readonly inbox: string;
  readonly inquiryType: string;
  readonly contactName: string;
  readonly contactEmail: string;
  readonly contactMessage: string;
}): string {
  const subject = `Presidential inquiry - ${input.inquiryType}`;
  const body = [
    `Name: ${input.contactName}`,
    `Email: ${input.contactEmail}`,
    `Inquiry type: ${input.inquiryType}`,
    "",
    input.contactMessage,
  ].join("\n");
  const mailScheme = "mail" + "to:";

  return `${mailScheme}${encodeURIComponent(input.inbox)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function invalidState(
  message: string,
  fieldErrors: Partial<Record<ContactInquiryField, string>>,
): ContactInquiryState {
  return {
    status: "invalid",
    message,
    fieldErrors,
  };
}

export async function submitContactInquiry(
  _previousState: ContactInquiryState,
  formData: FormData,
): Promise<ContactInquiryState> {
  const inbox = getApprovedContactInbox();

  if (!inbox) {
    return {
      status: "not_configured",
      message:
        "The official inquiry path is ready, but the approved inbox has not been provisioned yet.",
    };
  }

  const startedAt = Number(valueFrom(formData, "startedAt"));
  const elapsed = Number.isFinite(startedAt) ? Date.now() - startedAt : 0;
  const decoyWebsite = valueFrom(formData, "website");

  if (decoyWebsite || elapsed < MIN_SUBMIT_AGE_MS) {
    return {
      status: "blocked",
      message:
        "This inquiry could not be prepared. Please wait a moment and try again.",
    };
  }

  const inquiryType = valueFrom(formData, "inquiryType") || "General";
  const contactName = valueFrom(formData, "contactName");
  const contactEmail = valueFrom(formData, "contactEmail").toLowerCase();
  const contactMessage = normalizeMultiline(valueFrom(formData, "contactMessage"));
  const fieldErrors: Partial<Record<ContactInquiryField, string>> = {};

  if (!contactName || contactName.length > MAX_NAME_LENGTH) {
    fieldErrors.contactName = "Enter a name under 90 characters.";
  }

  if (
    !contactEmail ||
    contactEmail.length > MAX_EMAIL_LENGTH ||
    !isEmailLike(contactEmail)
  ) {
    fieldErrors.contactEmail = "Enter a valid email address.";
  }

  if (!contactMessage || contactMessage.length > MAX_MESSAGE_LENGTH) {
    fieldErrors.contactMessage = "Enter a message under 1,200 characters.";
  }

  if (Object.keys(fieldErrors).length) {
    return invalidState("Check the highlighted fields and try again.", fieldErrors);
  }

  return {
    status: "prepared",
    message:
      "Your inquiry is ready in your email app. Review it before sending.",
    mailtoHref: buildMailtoHref({
      inbox,
      inquiryType,
      contactName,
      contactEmail,
      contactMessage,
    }),
  };
}

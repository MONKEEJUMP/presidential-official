"use client";

import { useActionState, useCallback, useState } from "react";

import { submitContactInquiry } from "./contact-inquiry-actions";
import {
  INITIAL_CONTACT_INQUIRY_STATE,
  type ContactInquiryState,
} from "./contact-inquiry-types";

type ContactInquiryFormProps = {
  readonly configured: boolean;
};

function fieldError(
  state: ContactInquiryState,
  field: keyof NonNullable<ContactInquiryState["fieldErrors"]>,
): string | undefined {
  return state.fieldErrors?.[field];
}

export function ContactInquiryForm({ configured }: ContactInquiryFormProps) {
  const [state, formAction, pending] = useActionState(
    submitContactInquiry,
    INITIAL_CONTACT_INQUIRY_STATE,
  );
  const [startedAt, setStartedAt] = useState("");
  const markStarted = useCallback(() => {
    setStartedAt((current) => current || String(Date.now()));
  }, []);

  const nameError = fieldError(state, "contactName");
  const emailError = fieldError(state, "contactEmail");
  const messageError = fieldError(state, "contactMessage");
  const nameErrorId = "contactName-error";
  const emailErrorId = "contactEmail-error";
  const messageErrorId = "contactMessage-error";
  const disabled = pending || !configured;
  const submitDisabled = disabled || !startedAt;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(320px,0.5fr)] lg:items-start">
      <form
        action={formAction}
        aria-describedby="presidential-contact-form-status"
        className="grid gap-5 border border-po-line bg-po-canvas p-5"
        onFocusCapture={markStarted}
      >
        <input autoComplete="off" className="hidden" name="website" tabIndex={-1} />
        <input name="startedAt" type="hidden" value={startedAt} />

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-po-ink" htmlFor="inquiryType">
            Inquiry type
          </label>
          <select
            className="border border-po-line bg-po-canvas px-3 py-3 text-sm text-po-ink"
            disabled={disabled}
            id="inquiryType"
            name="inquiryType"
          >
            <option>General</option>
            <option>Retailer</option>
            <option>Wholesale</option>
            <option>Press</option>
            <option>Product question</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-po-ink" htmlFor="contactName">
            Name
          </label>
          <input
            aria-describedby={nameError ? nameErrorId : undefined}
            aria-invalid={Boolean(nameError)}
            autoComplete="name"
            className="border border-po-line bg-po-canvas px-3 py-3 text-sm text-po-ink"
            disabled={disabled}
            id="contactName"
            maxLength={90}
            name="contactName"
            required
            type="text"
          />
          {nameError ? (
            <p className="text-sm text-po-gold-ink" id={nameErrorId}>
              {nameError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-po-ink" htmlFor="contactEmail">
            Email
          </label>
          <input
            aria-describedby={emailError ? emailErrorId : undefined}
            aria-invalid={Boolean(emailError)}
            autoComplete="email"
            className="border border-po-line bg-po-canvas px-3 py-3 text-sm text-po-ink"
            disabled={disabled}
            id="contactEmail"
            maxLength={254}
            name="contactEmail"
            required
            type="email"
          />
          {emailError ? (
            <p className="text-sm text-po-gold-ink" id={emailErrorId}>
              {emailError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-po-ink" htmlFor="contactMessage">
            Message
          </label>
          <textarea
            aria-describedby={messageError ? messageErrorId : undefined}
            aria-invalid={Boolean(messageError)}
            className="min-h-36 border border-po-line bg-po-canvas px-3 py-3 text-sm text-po-ink"
            disabled={disabled}
            id="contactMessage"
            maxLength={1200}
            name="contactMessage"
            required
          />
          {messageError ? (
            <p className="text-sm text-po-gold-ink" id={messageErrorId}>
              {messageError}
            </p>
          ) : null}
        </div>

        <button
          className="border border-po-brand bg-po-brand px-4 py-3 text-sm font-semibold text-po-on-dark transition-colors hover:bg-po-brand-hover disabled:cursor-not-allowed disabled:border-po-subtle disabled:bg-po-subtle disabled:text-po-muted"
          disabled={submitDisabled}
          type="submit"
        >
          {pending ? "Preparing inquiry" : "Prepare inquiry"}
        </button>
      </form>

      <aside className="border border-po-brand-line bg-po-brand-soft p-5">
        <p className="text-sm font-semibold uppercase tracking-normal text-po-brand">
          Contact status
        </p>
        <p
          aria-live="polite"
          className="mt-3 text-base leading-7 text-po-body"
          id="presidential-contact-form-status"
        >
          {configured ? state.message : "The approved inbox is not provisioned yet."}
        </p>
        {state.mailtoHref && configured ? (
          <a
            className="mt-5 inline-flex border border-po-brand bg-po-brand px-4 py-3 text-sm font-semibold text-po-on-dark hover:bg-po-brand-hover"
            href={state.mailtoHref}
            rel="nofollow"
          >
            Open email app
          </a>
        ) : null}
        <p className="mt-5 text-sm leading-6 text-po-muted">
          This path uses first-party validation and does not store inquiry
          details in this website.
        </p>
      </aside>
    </div>
  );
}

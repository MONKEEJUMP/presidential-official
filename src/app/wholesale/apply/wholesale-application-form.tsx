"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import {
  parseWholesaleInquiry,
  WHOLESALE_BUSINESS_TYPES,
  WHOLESALE_PRODUCT_INTERESTS,
  WHOLESALE_REQUEST_TYPES,
  type WholesaleInquiryField,
  type WholesaleInquiryFieldErrors,
  type WholesaleRequestType,
} from "@/lib/wholesale/inquiry";
import { WHOLESALE_MARKETS, type WholesaleStateCode } from "@/lib/wholesale/market-ordering";

import styles from "../wholesale.module.css";

type WholesaleApplicationFormProps = Readonly<{
  initialRequestType?: WholesaleRequestType;
  initialState?: WholesaleStateCode;
}>;

type ApiResponse = Readonly<{
  success?: boolean;
  message?: string;
  fieldErrors?: WholesaleInquiryFieldErrors;
}>;

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function WholesaleApplicationForm({ initialRequestType, initialState }: WholesaleApplicationFormProps) {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = useState<WholesaleInquiryFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function errorFor(field: WholesaleInquiryField) {
    const error = fieldErrors[field];
    return error ? <p className={styles.fieldError} id={`${field}-error`}>{error}</p> : null;
  }

  function invalid(field: WholesaleInquiryField) {
    return fieldErrors[field] ? true : undefined;
  }

  function describedBy(field: WholesaleInquiryField) {
    return fieldErrors[field] ? `${field}-error` : undefined;
  }

  function showErrors(message: string, errors: WholesaleInquiryFieldErrors) {
    setFormError(message);
    setFieldErrors(errors);
    requestAnimationFrame(() => errorSummaryRef.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      requestType: data.get("requestType"),
      legalBusinessName: data.get("legalBusinessName"),
      dba: data.get("dba"),
      contactName: data.get("contactName"),
      jobTitle: data.get("jobTitle"),
      email: data.get("email"),
      phone: data.get("phone"),
      state: data.get("state"),
      businessType: data.get("businessType"),
      licenseNumber: data.get("licenseNumber"),
      locationCount: data.get("locationCount"),
      productInterests: data.getAll("productInterests"),
      message: data.get("message"),
      licensedBusiness: data.get("licensedBusiness") === "true",
      dataConsent: data.get("dataConsent") === "true",
      website: data.get("website"),
    };

    setFormError("");
    setFieldErrors({});
    const clientValidation = parseWholesaleInquiry(payload);
    if (!clientValidation.success) {
      showErrors("Review the highlighted fields and try again.", clientValidation.fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/wholesale-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok || !result?.success) {
        showErrors(
          result?.message ?? "Sales email is temporarily unavailable. Please retry or email sales@presidentialmoonrocks.com.",
          result?.fieldErrors ?? {},
        );
        return;
      }
      router.push("/wholesale/thank-you");
    } catch {
      showErrors("Sales email is temporarily unavailable. Please retry or email sales@presidentialmoonrocks.com.", {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} noValidate onSubmit={submit}>
      <div className={styles.formGrid}>
        {formError ? <div aria-live="assertive" className={styles.errorSummary} ref={errorSummaryRef} role="alert" tabIndex={-1}>{formError}</div> : null}

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span>Request type</span>
          <select aria-describedby={describedBy("requestType")} aria-invalid={invalid("requestType")} className={styles.select} defaultValue={initialRequestType ?? ""} name="requestType">
            <option value="">Choose a request</option>
            {WHOLESALE_REQUEST_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          {errorFor("requestType")}
        </label>

        <label className={styles.field}>
          <span>Legal business name</span>
          <input aria-describedby={describedBy("legalBusinessName")} aria-invalid={invalid("legalBusinessName")} className={styles.input} maxLength={160} name="legalBusinessName" type="text" />
          {errorFor("legalBusinessName")}
        </label>
        <label className={styles.field}>
          <span>DBA or storefront name <span className={styles.optional}>Optional</span></span>
          <input aria-describedby={describedBy("dba")} aria-invalid={invalid("dba")} className={styles.input} maxLength={160} name="dba" type="text" />
          {errorFor("dba")}
        </label>
        <label className={styles.field}>
          <span>Contact name</span>
          <input aria-describedby={describedBy("contactName")} aria-invalid={invalid("contactName")} autoComplete="name" className={styles.input} maxLength={120} name="contactName" type="text" />
          {errorFor("contactName")}
        </label>
        <label className={styles.field}>
          <span>Job title or role</span>
          <input aria-describedby={describedBy("jobTitle")} aria-invalid={invalid("jobTitle")} className={styles.input} maxLength={120} name="jobTitle" type="text" />
          {errorFor("jobTitle")}
        </label>
        <label className={styles.field}>
          <span>Work email</span>
          <input aria-describedby={describedBy("email")} aria-invalid={invalid("email")} autoComplete="email" className={styles.input} maxLength={254} name="email" type="email" />
          {errorFor("email")}
        </label>
        <label className={styles.field}>
          <span>Phone</span>
          <input aria-describedby={describedBy("phone")} aria-invalid={invalid("phone")} autoComplete="tel" className={styles.input} maxLength={32} name="phone" type="tel" />
          {errorFor("phone")}
        </label>
        <label className={styles.field}>
          <span>State or market</span>
          <select aria-describedby={describedBy("state")} aria-invalid={invalid("state")} className={styles.select} defaultValue={initialState ?? ""} name="state">
            <option value="">Choose a state</option>
            {WHOLESALE_MARKETS.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}
          </select>
          {errorFor("state")}
        </label>
        <label className={styles.field}>
          <span>Business type</span>
          <select aria-describedby={describedBy("businessType")} aria-invalid={invalid("businessType")} className={styles.select} defaultValue="" name="businessType">
            <option value="">Choose a business type</option>
            {WHOLESALE_BUSINESS_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          {errorFor("businessType")}
        </label>
        <label className={styles.field}>
          <span>Cannabis license number</span>
          <input aria-describedby={describedBy("licenseNumber")} aria-invalid={invalid("licenseNumber")} className={styles.input} maxLength={80} name="licenseNumber" type="text" />
          {errorFor("licenseNumber")}
        </label>
        <label className={styles.field}>
          <span>Number of locations</span>
          <input aria-describedby={describedBy("locationCount")} aria-invalid={invalid("locationCount")} className={styles.input} max={9999} min={1} name="locationCount" type="number" />
          {errorFor("locationCount")}
        </label>

        <fieldset className={styles.fieldset}>
          <legend>Product interests</legend>
          <div className={styles.choiceGrid}>
            {WHOLESALE_PRODUCT_INTERESTS.map((interest) => <label className={styles.choice} key={interest}><input name="productInterests" type="checkbox" value={interest} /><span>{interest}</span></label>)}
          </div>
          {errorFor("productInterests")}
        </fieldset>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span>Message or opportunity details</span>
          <textarea aria-describedby={describedBy("message")} aria-invalid={invalid("message")} className={styles.textarea} maxLength={1500} name="message" />
          {errorFor("message")}
        </label>

        <div className={styles.consents}>
          <label className={styles.consent}><input name="licensedBusiness" type="checkbox" value="true" /><span>I confirm that I represent a licensed cannabis business.</span></label>
          {errorFor("licensedBusiness")}
          <label className={styles.consent}><input name="dataConsent" type="checkbox" value="true" /><span>Presidential may use this information to evaluate and respond to this inquiry.</span></label>
          {errorFor("dataConsent")}
        </div>

        <label aria-hidden="true" className={styles.hiddenField}>
          Website
          <input autoComplete="off" name="website" tabIndex={-1} type="text" />
        </label>

        <div className={styles.submitRow}>
          <button className={styles.submit} disabled={submitting} type="submit">{submitting ? "Sending application…" : "Send to Presidential Sales"}<ArrowIcon /></button>
          <p className={styles.dataNote}>Business inquiries only. Your information is used to evaluate and respond to this request.</p>
        </div>
      </div>
    </form>
  );
}

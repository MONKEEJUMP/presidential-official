import "server-only";

import { NextResponse } from "next/server";

import {
  buildWholesaleEmailSubject,
  buildWholesaleEmailText,
  hasUnexpectedWholesaleFields,
  hasWholesaleHoneypot,
  parseWholesaleInquiry,
} from "@/lib/wholesale/inquiry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BODY_BYTES = 12_288;
const UPSTREAM_TIMEOUT_MS = 8_000;
const SALES_RECIPIENT = "sales@presidentialmoonrocks.com";
const SALES_SENDER = "Presidential Sales <sales@presidentialmoonrocks.com>";

function json(payload: unknown, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function isJsonContentType(value: string | null): boolean {
  return value?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function hasAllowedContentLength(value: string | null): boolean {
  if (value === null) return true;
  return /^\d+$/.test(value) && Number(value) <= MAX_REQUEST_BODY_BYTES;
}

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let byteLength = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return body;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ success: false, message: "This request could not be accepted." }, 403);
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return json({ success: false, message: "Send this application as JSON." }, 415);
  }

  if (!hasAllowedContentLength(request.headers.get("content-length"))) {
    return json({ success: false, message: "This application is too large." }, 413);
  }

  const body = await readBoundedBody(request);
  if (body === null) return json({ success: false, message: "This application is too large or invalid." }, 413);

  let input: unknown;
  try {
    input = JSON.parse(body) as unknown;
  } catch {
    return json({ success: false, message: "Enter the required application information." }, 400);
  }

  if (!input || typeof input !== "object" || Array.isArray(input) || hasUnexpectedWholesaleFields(input)) {
    return json({ success: false, message: "Enter the required application information." }, 400);
  }

  if (hasWholesaleHoneypot(input)) {
    return json({ success: true }, 201);
  }

  const parsed = parseWholesaleInquiry(input);
  if (!parsed.success) {
    return json({
      success: false,
      message: "Review the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
    }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return json({
      success: false,
      message: "Sales email is temporarily unavailable. Please retry or email sales@presidentialmoonrocks.com.",
    }, 503);
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SALES_SENDER,
        to: [SALES_RECIPIENT],
        reply_to: parsed.inquiry.email,
        subject: buildWholesaleEmailSubject(parsed.inquiry),
        text: buildWholesaleEmailText(parsed.inquiry),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const provider = (await response.json().catch(() => null)) as { id?: unknown } | null;
    if (!response.ok || typeof provider?.id !== "string") {
      console.error("Wholesale inquiry email was not accepted; status", response.status);
      return json({
        success: false,
        message: "Sales email is temporarily unavailable. Please retry or email sales@presidentialmoonrocks.com.",
      }, 502);
    }
    return json({ success: true }, 201);
  } catch {
    console.error("Wholesale inquiry email request failed.");
    return json({
      success: false,
      message: "Sales email is temporarily unavailable. Please retry or email sales@presidentialmoonrocks.com.",
    }, 502);
  }
}

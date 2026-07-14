import { NextResponse } from "next/server";

import type { LocatorApiResponse, LocatorResult } from "@/lib/locator/types";

export const dynamic = "force-dynamic";

const ZIP_PATTERN = /^\d{5}$/;
const ALLOWED_RADII = new Set([10, 25, 50]);
const ALLOWED_REQUEST_FIELDS = new Set([
  "zip",
  "latitude",
  "longitude",
  "radiusMiles",
]);
const MAX_REQUEST_BODY_BYTES = 4_096;
const UPSTREAM_TIMEOUT_MS = 5_000;

type LocatorRequest = {
  readonly zip?: unknown;
  readonly latitude?: unknown;
  readonly longitude?: unknown;
  readonly radiusMiles?: unknown;
};

function finiteCoordinate(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function hasOwn(record: LocatorRequest, key: keyof LocatorRequest) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isJsonContentType(value: string | null) {
  return value?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function hasAllowedContentLength(value: string | null) {
  if (value === null) return true;
  if (!/^\d+$/.test(value)) return false;
  return Number(value) <= MAX_REQUEST_BODY_BYTES;
}

async function readBoundedBody(request: Request) {
  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let byteLength = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function parseLocatorRequest(value: string): LocatorRequest | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  if (Object.keys(parsed).some((key) => !ALLOWED_REQUEST_FIELDS.has(key))) return null;
  return parsed as LocatorRequest;
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const phone = value.trim();
  return /^\+?[0-9().\s-]{7,24}$/.test(phone) ? phone : null;
}

function normalizeResult(value: unknown): LocatorResult | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = record.id;
  const distance = record.distance_miles;
  const required = ["name", "address", "city", "state", "zip"] as const;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) return null;
  if (typeof distance !== "number" || !Number.isFinite(distance) || distance < 0) return null;
  if (required.some((field) => typeof record[field] !== "string" || !record[field])) return null;
  if (!ZIP_PATTERN.test(String(record.zip))) return null;
  if (record.website !== null && typeof record.website !== "string") return null;

  return {
    id,
    name: String(record.name),
    address: String(record.address),
    city: String(record.city),
    state: String(record.state),
    zip: String(record.zip),
    phone: normalizePhone(record.phone),
    website: typeof record.website === "string" && record.website ? record.website : null,
    distance_miles: distance,
  };
}

export async function POST(request: Request) {
  if (
    !isJsonContentType(request.headers.get("content-type")) ||
    !hasAllowedContentLength(request.headers.get("content-length"))
  ) {
    return NextResponse.json({ error: "Invalid search request." }, { status: 400 });
  }

  const rawBody = await readBoundedBody(request);
  const body = rawBody === null ? null : parseLocatorRequest(rawBody);
  if (!body) {
    return NextResponse.json({ error: "Invalid search request." }, { status: 400 });
  }

  const hasZipField = hasOwn(body, "zip");
  const hasLatitudeField = hasOwn(body, "latitude");
  const hasLongitudeField = hasOwn(body, "longitude");
  const zip = hasZipField && typeof body.zip === "string" ? body.zip.trim() : "";
  const hasZip = hasZipField && !hasLatitudeField && !hasLongitudeField && ZIP_PATTERN.test(zip);
  const hasCoordinates =
    !hasZipField &&
    hasLatitudeField &&
    hasLongitudeField &&
    finiteCoordinate(body.latitude, -90, 90) &&
    finiteCoordinate(body.longitude, -180, 180);

  if (!hasZip && !hasCoordinates) {
    return NextResponse.json({ error: "Enter a valid five-digit ZIP code." }, { status: 400 });
  }

  const radius = hasOwn(body, "radiusMiles") ? body.radiusMiles : 10;
  if (typeof radius !== "number" || !ALLOWED_RADII.has(radius)) {
    return NextResponse.json({ error: "Invalid mission range." }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json({ error: "Locator service is not configured." }, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/rpc/search_retailers`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_zip: hasZip ? zip : null,
        search_lat: hasCoordinates ? body.latitude : null,
        search_lng: hasCoordinates ? body.longitude : null,
        radius_miles: radius,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    console.error("Locator RPC request failed.");
    return NextResponse.json({ error: "Locator service is temporarily unavailable." }, { status: 502 });
  }

  if (!response.ok) {
    console.error("Locator RPC failed with status", response.status);
    return NextResponse.json({ error: "Locator service is temporarily unavailable." }, { status: 502 });
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    console.error("Locator RPC returned invalid JSON.");
    return NextResponse.json({ error: "Locator service is temporarily unavailable." }, { status: 502 });
  }
  if (!Array.isArray(payload)) {
    console.error("Locator RPC returned an invalid payload.");
    return NextResponse.json({ error: "Locator service is temporarily unavailable." }, { status: 502 });
  }

  const results = payload
    .map(normalizeResult)
    .filter((result): result is LocatorResult => result !== null)
    .slice(0, 100);
  const apiResponse: LocatorApiResponse = { results };
  return NextResponse.json(apiResponse, {
    headers: { "Cache-Control": "no-store" },
  });
}

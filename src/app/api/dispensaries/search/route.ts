import "server-only";

import { NextResponse } from "next/server";

import { isLocatorStateCode } from "@/lib/locator/types";

export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set([
  "https://presidentialthcoklahoma.com",
  "https://www.presidentialthcoklahoma.com",
  "https://presidentialmoonrocks.com",
  "https://presidential-thc-oklahoma.vercel.app",
]);
const ALLOWED_QUERY_FIELDS = new Set(["state", "zip", "lat", "lng", "limit"]);
const ZIP_PATTERN = /^\d{5}$/;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const UPSTREAM_TIMEOUT_MS = 5_000;

type RateWindow = {
  count: number;
  resetAt: number;
};

type PublicRetailer = Readonly<{
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  distance: number;
}>;

const rateWindows = new Map<string, RateWindow>();

function responseHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "Cache-Control": "no-store",
    Vary: "Origin",
  });

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
  extraHeaders: Record<string, string> = {},
) {
  const headers = responseHeaders(origin);
  for (const [name, value] of Object.entries(extraHeaders)) {
    headers.set(name, value);
  }
  return NextResponse.json(body, { status, headers });
}

function allowedOrigin(request: Request): string | null | false {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return ALLOWED_ORIGINS.has(origin) ? origin : false;
}

function clientIp(request: Request): string {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return forwarded.split(",", 1)[0].trim().slice(0, 128) || "unknown";
}

function consumeRateLimit(ip: string, now: number): RateWindow & { allowed: boolean } {
  if (rateWindows.size > 10_000) {
    for (const [key, window] of rateWindows) {
      if (window.resetAt <= now) rateWindows.delete(key);
    }
  }

  const current = rateWindows.get(ip);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + RATE_WINDOW_MS };
    rateWindows.set(ip, next);
    return { ...next, allowed: true };
  }

  current.count += 1;
  return { ...current, allowed: current.count <= RATE_LIMIT };
}

function parseCoordinate(value: string | null, minimum: number, maximum: number) {
  if (value === null || !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim())) {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
    ? coordinate
    : null;
}

function parseLimit(value: string | null): number | null {
  if (value === null) return DEFAULT_LIMIT;
  if (!/^[1-9]\d*$/.test(value)) return null;

  const requested = BigInt(value);
  return requested > BigInt(MAX_LIMIT) ? MAX_LIMIT : Number(requested);
}

function getSupabaseSettings() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

function normalizeRetailer(value: unknown, requestedState: string): PublicRetailer | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const required = ["name", "address", "city", "state", "zip"] as const;
  const latitude = record.latitude;
  const longitude = record.longitude;
  const distance = record.distance_miles;

  if (required.some((field) => typeof record[field] !== "string" || !record[field])) {
    return null;
  }
  if (record.state !== requestedState || !ZIP_PATTERN.test(String(record.zip))) return null;
  if (typeof latitude !== "number" || !Number.isFinite(latitude)) return null;
  if (typeof longitude !== "number" || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  if (typeof distance !== "number" || !Number.isFinite(distance) || distance < 0) return null;

  return {
    name: String(record.name),
    address: String(record.address),
    city: String(record.city),
    state: String(record.state),
    zip: String(record.zip),
    latitude,
    longitude,
    distance,
  };
}

export function OPTIONS(request: Request) {
  const origin = allowedOrigin(request);
  if (origin === false) {
    return jsonResponse({ error: "Origin not allowed." }, 403, null);
  }

  const headers = responseHeaders(origin);
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Accept, Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request: Request) {
  const origin = allowedOrigin(request);
  if (origin === false) {
    return jsonResponse({ error: "Origin not allowed." }, 403, null);
  }

  const rate = consumeRateLimit(clientIp(request), Date.now());
  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1_000));
    return jsonResponse(
      { error: "Rate limit exceeded." },
      429,
      origin,
      { "Retry-After": String(retryAfter) },
    );
  }

  const url = new URL(request.url);
  const keys = [...new Set(url.searchParams.keys())];
  if (
    keys.some((key) => !ALLOWED_QUERY_FIELDS.has(key)) ||
    keys.some((key) => url.searchParams.getAll(key).length !== 1)
  ) {
    return jsonResponse({ error: "Invalid search request." }, 400, origin);
  }

  const state = url.searchParams.get("state")?.trim().toUpperCase() || "";
  const zip = url.searchParams.get("zip")?.trim() ?? null;
  const latText = url.searchParams.get("lat");
  const lngText = url.searchParams.get("lng");
  const hasZip = zip !== null;
  const hasCoordinateField = latText !== null || lngText !== null;
  const latitude = parseCoordinate(latText, -90, 90);
  const longitude = parseCoordinate(lngText, -180, 180);
  const limit = parseLimit(url.searchParams.get("limit"));

  if (!isLocatorStateCode(state)) {
    return jsonResponse({ error: "A valid two-letter state is required." }, 400, origin);
  }
  if (
    hasZip === hasCoordinateField ||
    (hasZip && !ZIP_PATTERN.test(zip)) ||
    (hasCoordinateField && (latText === null || lngText === null || latitude === null || longitude === null))
  ) {
    return jsonResponse(
      { error: "Provide either a five-digit ZIP or valid lat and lng coordinates." },
      400,
      origin,
    );
  }
  if (limit === null) {
    return jsonResponse({ error: "Limit must be a positive integer." }, 400, origin);
  }

  const settings = getSupabaseSettings();
  if (!settings) {
    return jsonResponse({ error: "Locator service is not configured." }, 503, origin);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${settings.url}/rest/v1/rpc/search_retailers`, {
      method: "POST",
      headers: {
        apikey: settings.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_zip: hasZip ? zip : null,
        search_lat: hasZip ? null : latitude,
        search_lng: hasZip ? null : longitude,
        radius_miles: 10,
        state_code: state,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    console.error("Bounded retailer search RPC request failed.");
    return jsonResponse({ error: "Locator service is temporarily unavailable." }, 502, origin);
  }

  if (!upstream.ok) {
    console.error("Bounded retailer search RPC failed with status", upstream.status);
    return jsonResponse({ error: "Locator service is temporarily unavailable." }, 502, origin);
  }

  let payload: unknown;
  try {
    payload = (await upstream.json()) as unknown;
  } catch {
    console.error("Bounded retailer search RPC returned invalid JSON.");
    return jsonResponse({ error: "Locator service is temporarily unavailable." }, 502, origin);
  }

  if (!Array.isArray(payload)) {
    console.error("Bounded retailer search RPC returned an invalid payload.");
    return jsonResponse({ error: "Locator service is temporarily unavailable." }, 502, origin);
  }

  const normalized = payload.map((value) => normalizeRetailer(value, state));
  if (normalized.some((retailer) => retailer === null)) {
    console.error("Bounded retailer search RPC returned an invalid payload row.");
    return jsonResponse({ error: "Locator service is temporarily unavailable." }, 502, origin);
  }

  const results = (normalized as PublicRetailer[])
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name))
    .slice(0, limit);

  return jsonResponse({ results }, 200, origin);
}

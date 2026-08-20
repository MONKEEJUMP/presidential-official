import "server-only";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const UPSTREAM_TIMEOUT_MS = 8_000;

type BookingRow = Readonly<{
  event_date: string;
  slot: "morning" | "afternoon";
}>;

function getSupabaseSettings() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

function nextMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = monthNumber === 12
    ? { year: year + 1, month: 1 }
    : { year, month: monthNumber + 1 };
  return `${next.year}-${String(next.month).padStart(2, "0")}`;
}

function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function isBookingRow(value: unknown): value is BookingRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.event_date === "string" &&
    (row.slot === "morning" || row.slot === "afternoon")
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const keys = [...new Set(requestUrl.searchParams.keys())];
  const month = requestUrl.searchParams.get("month")?.trim() ?? "";

  if (
    keys.length !== 1 ||
    keys[0] !== "month" ||
    requestUrl.searchParams.getAll("month").length !== 1 ||
    !MONTH_PATTERN.test(month)
  ) {
    return NextResponse.json(
      { error: "Use a month in YYYY-MM format." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const settings = getSupabaseSettings();
  if (!settings) {
    return NextResponse.json(
      { error: "Pop-Up availability is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const endpoint = new URL(`${settings.url}/rest/v1/popup_bookings`);
  endpoint.searchParams.set("select", "event_date,slot");
  endpoint.searchParams.set("event_date", `gte.${month}-01`);
  endpoint.searchParams.append("event_date", `lt.${nextMonth(month)}-01`);
  endpoint.searchParams.set("status", "neq.cancelled");
  endpoint.searchParams.set("order", "event_date.asc,slot.asc");

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      headers: { apikey: settings.key },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    console.error("Pop-Up availability database request failed.");
    return NextResponse.json(
      { error: "Pop-Up availability is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!upstream.ok) {
    console.error("Pop-Up availability database returned status", upstream.status);
    return NextResponse.json(
      { error: "Pop-Up availability is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: unknown;
  try {
    payload = (await upstream.json()) as unknown;
  } catch {
    payload = null;
  }
  if (!Array.isArray(payload) || !payload.every(isBookingRow)) {
    console.error("Pop-Up availability database returned an invalid payload.");
    return NextResponse.json(
      { error: "Pop-Up availability is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const booked = new Map<string, { morning: boolean; afternoon: boolean }>();
  for (const row of payload) {
    const state = booked.get(row.event_date) ?? { morning: false, afternoon: false };
    state[row.slot] = true;
    booked.set(row.event_date, state);
  }

  const days = Array.from({ length: daysInMonth(month) }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    const state = booked.get(date) ?? { morning: false, afternoon: false };
    return {
      date,
      morningBooked: state.morning,
      afternoonBooked: state.afternoon,
    };
  });

  return NextResponse.json(
    { month, days },
    { headers: { "Cache-Control": "no-store" } },
  );
}

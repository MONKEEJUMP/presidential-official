import "server-only";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+().\s-]{7,32}$/;
const UPSTREAM_TIMEOUT_MS = 8_000;
const NOTIFICATION_FROM = "Presidential Pop-Up <popup@presidentialmoonrocks.com>";

type Slot = "morning" | "afternoon";

type BookingInput = Readonly<{
  eventDate?: unknown;
  slot?: unknown;
  wholeDay?: unknown;
  dispensaryName?: unknown;
  retailerId?: unknown;
  contactName?: unknown;
  phone?: unknown;
  email?: unknown;
}>;

type ValidBooking = Readonly<{
  eventDate: string;
  slot: Slot;
  wholeDay: boolean;
  dispensaryName: string;
  retailerId: number | null;
  contactName: string;
  phone: string;
  email: string;
}>;

function getSupabaseSettings() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

function chicagoToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isCalendarDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function cleanText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned && cleaned.length <= maximum ? cleaned : null;
}

function parseBooking(value: unknown): ValidBooking | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as BookingInput;
  const eventDate = cleanText(input.eventDate, 10);
  const dispensaryName = cleanText(input.dispensaryName, 160);
  const contactName = cleanText(input.contactName, 120);
  const phone = cleanText(input.phone, 32);
  const email = cleanText(input.email, 254)?.toLowerCase() ?? null;
  const slot = input.slot === "morning" || input.slot === "afternoon"
    ? input.slot
    : null;
  const wholeDay = input.wholeDay === true;
  const retailerId = input.retailerId === null || input.retailerId === undefined
    ? null
    : Number(input.retailerId);

  if (
    !eventDate ||
    !DATE_PATTERN.test(eventDate) ||
    !isCalendarDate(eventDate) ||
    eventDate < chicagoToday() ||
    !slot ||
    !dispensaryName ||
    !contactName ||
    !phone ||
    !PHONE_PATTERN.test(phone) ||
    !email ||
    !EMAIL_PATTERN.test(email) ||
    (retailerId !== null && (!Number.isSafeInteger(retailerId) || retailerId <= 0))
  ) {
    return null;
  }

  const weekday = dayOfWeek(eventDate);
  const freeDay = weekday === 4 || weekday === 5 || weekday === 6;
  if (wholeDay && freeDay) return null;

  return {
    eventDate,
    slot,
    wholeDay,
    dispensaryName,
    retailerId,
    contactName,
    phone,
    email,
  };
}

async function normalizeRetailer(
  booking: ValidBooking,
  settings: { url: string; key: string },
): Promise<ValidBooking | null> {
  if (booking.retailerId === null) return booking;

  const endpoint = new URL(`${settings.url}/rest/v1/retailers`);
  endpoint.searchParams.set("select", "id,name");
  endpoint.searchParams.set("id", `eq.${booking.retailerId}`);
  endpoint.searchParams.set("state", "eq.OK");
  endpoint.searchParams.set("public_locator_status", "eq.approved_public_locator");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: { apikey: settings.key },
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length !== 1) return null;
  const record = payload[0] as Record<string, unknown>;
  if (record.id !== booking.retailerId || typeof record.name !== "string") return null;

  return { ...booking, dispensaryName: record.name.trim() };
}

async function sendNotification(booking: ValidBooking) {
  const key = process.env.RESEND_API_KEY;
  const recipient = process.env.POPUP_NOTIFY_EMAIL;

  if (!key || !recipient) {
    console.info("Pop-Up notification skipped because local email configuration is absent.");
    return { accepted: false, messageId: null as string | null };
  }

  const schedule = booking.wholeDay
    ? "Whole day (morning and afternoon)"
    : booking.slot === "morning" ? "Morning" : "Afternoon";
  const text = [
    "A new Presidential Pop-Up booking request is on the calendar.",
    "",
    `Date: ${booking.eventDate}`,
    `Schedule: ${schedule}`,
    `Dispensary: ${booking.dispensaryName}`,
    `Contact: ${booking.contactName}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFICATION_FROM,
        to: [recipient],
        subject: `Pop-Up request: ${booking.eventDate} ${schedule}`,
        text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: unknown }
      | null;
    if (!response.ok || typeof payload?.id !== "string") {
      console.error("Pop-Up notification was not accepted by Resend; status", response.status);
      return { accepted: false, messageId: null as string | null };
    }

    return { accepted: true, messageId: payload.id };
  } catch {
    console.error("Pop-Up notification request failed after the booking was saved.");
    return { accepted: false, messageId: null as string | null };
  }
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter the required booking information." }, { status: 400 });
  }

  const parsed = parseBooking(input);
  if (!parsed) {
    return NextResponse.json({ error: "Enter the required booking information." }, { status: 400 });
  }

  const settings = getSupabaseSettings();
  if (!settings) {
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 503 });
  }

  let booking: ValidBooking | null;
  try {
    booking = await normalizeRetailer(parsed, settings);
  } catch {
    booking = null;
  }
  if (!booking) {
    return NextResponse.json({ error: "Choose a current Oklahoma retailer or type the store name." }, { status: 400 });
  }

  const slots: readonly Slot[] = booking.wholeDay
    ? ["morning", "afternoon"]
    : [booking.slot];
  const rows = slots.map((slot) => ({
    event_date: booking.eventDate,
    slot,
    whole_day: booking.wholeDay,
    dispensary_name: booking.dispensaryName,
    retailer_id: booking.retailerId,
    contact_name: booking.contactName,
    phone: booking.phone,
    email: booking.email,
    status: "requested",
  }));

  let insert: Response;
  try {
    insert = await fetch(`${settings.url}/rest/v1/popup_bookings`, {
      method: "POST",
      headers: {
        apikey: settings.key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    console.error("Pop-Up booking database request failed.");
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 502 });
  }

  if (!insert.ok) {
    const payload = (await insert.json().catch(() => null)) as
      | { code?: unknown }
      | null;
    if (insert.status === 409 || payload?.code === "23505") {
      return NextResponse.json(
        { error: "that slot was just taken" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("Pop-Up booking database returned status", insert.status);
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 502 });
  }

  const notification = await sendNotification(booking);
  return NextResponse.json(
    {
      success: true,
      notificationAccepted: notification.accepted,
      notificationId: notification.messageId,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

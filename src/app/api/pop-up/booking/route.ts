import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+().\s-]{7,32}$/;
const MANAGE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;
const UPSTREAM_TIMEOUT_MS = 8_000;
const RECOVERY_COOLDOWN_MS = 30 * 60 * 1_000;
const NOTIFICATION_FROM = "Presidential Pop-Up <popup@presidentialmoonrocks.com>";
const PUBLIC_POPUP_URL = "https://presidentialmoonrocks.com/pop-up";

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

type BookingRow = Readonly<{
  booking_group_id: string;
  manage_email_sent_at: string | null;
  event_date: string;
  slot: Slot;
  whole_day: boolean;
  dispensary_name: string;
  contact_name: string;
  phone: string;
  email: string;
}>;

type BookingSummary = Readonly<{
  eventDate: string;
  slots: readonly Slot[];
  wholeDay: boolean;
  dispensaryName: string;
}>;

type SupabaseSettings = Readonly<{ url: string; key: string }>;

function getSupabaseSettings(): SupabaseSettings | null {
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

function parseEmail(value: unknown): string | null {
  const email = cleanText(value, 254)?.toLowerCase() ?? null;
  return email && EMAIL_PATTERN.test(email) ? email : null;
}

function parseManageToken(value: unknown): string | null {
  const token = cleanText(value, 128);
  return token && MANAGE_TOKEN_PATTERN.test(token) ? token : null;
}

function createManageToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashManageToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function manageUrl(token: string): string {
  return `${PUBLIC_POPUP_URL}#manage=${token}`;
}

function parseBooking(value: unknown): ValidBooking | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as BookingInput;
  const eventDate = cleanText(input.eventDate, 10);
  const dispensaryName = cleanText(input.dispensaryName, 160);
  const contactName = cleanText(input.contactName, 120);
  const phone = cleanText(input.phone, 32);
  const email = parseEmail(input.email);
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

function isBookingRow(value: unknown): value is BookingRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.booking_group_id === "string" &&
    (row.manage_email_sent_at === null || typeof row.manage_email_sent_at === "string") &&
    typeof row.event_date === "string" &&
    (row.slot === "morning" || row.slot === "afternoon") &&
    typeof row.whole_day === "boolean" &&
    typeof row.dispensary_name === "string" &&
    typeof row.contact_name === "string" &&
    typeof row.phone === "string" &&
    typeof row.email === "string"
  );
}

function summarizeBooking(rows: readonly BookingRow[]): BookingSummary {
  const first = rows[0];
  const slots = (["morning", "afternoon"] as const).filter((slot) =>
    rows.some((row) => row.slot === slot));
  return {
    eventDate: first.event_date,
    slots,
    wholeDay: rows.some((row) => row.whole_day),
    dispensaryName: first.dispensary_name,
  };
}

function scheduleLabel(summary: BookingSummary): string {
  if (summary.wholeDay || summary.slots.length === 2) return "Whole day (morning and afternoon)";
  return summary.slots[0] === "morning" ? "Morning" : "Afternoon";
}

async function normalizeRetailer(
  booking: ValidBooking,
  settings: SupabaseSettings,
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

async function sendEmail(recipient: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("Pop-Up email skipped because local Resend configuration is absent.");
    return { accepted: false, messageId: null as string | null };
  }

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
        subject,
        text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const payload = (await response.json().catch(() => null)) as { id?: unknown } | null;
    if (!response.ok || typeof payload?.id !== "string") {
      console.error("Pop-Up email was not accepted by Resend; status", response.status);
      return { accepted: false, messageId: null as string | null };
    }
    return { accepted: true, messageId: payload.id };
  } catch {
    console.error("Pop-Up email request failed.");
    return { accepted: false, messageId: null as string | null };
  }
}

async function sendInternalBookingNotification(booking: ValidBooking) {
  const recipient = process.env.POPUP_NOTIFY_EMAIL;
  if (!recipient) return { accepted: false, messageId: null as string | null };
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
  return sendEmail(recipient, `Pop-Up request: ${booking.eventDate} ${schedule}`, text);
}

async function sendCustomerConfirmation(
  booking: ValidBooking,
  summary: BookingSummary,
  token: string,
) {
  const text = [
    `Hi ${booking.contactName},`,
    "",
    "Your Presidential Pop-Up request is on the calendar.",
    "",
    `Date: ${summary.eventDate}`,
    `Schedule: ${scheduleLabel(summary)}`,
    `Dispensary: ${summary.dispensaryName}`,
    "",
    "Use this private link to view or cancel only this booking:",
    manageUrl(token),
    "",
    "Keep this link private. Anyone without it cannot change your booking.",
    "A Presidential client associate will follow up with you.",
  ].join("\n");
  return sendEmail(booking.email, `Your Presidential Pop-Up booking — ${summary.eventDate}`, text);
}

async function readRowsByToken(
  settings: SupabaseSettings,
  token: string,
): Promise<readonly BookingRow[]> {
  const endpoint = new URL(`${settings.url}/rest/v1/popup_bookings`);
  endpoint.searchParams.set(
    "select",
    "booking_group_id,manage_email_sent_at,event_date,slot,whole_day,dispensary_name,contact_name,phone,email",
  );
  endpoint.searchParams.set("manage_token_hash", `eq.${hashManageToken(token)}`);
  endpoint.searchParams.set("status", "neq.cancelled");
  endpoint.searchParams.set("order", "slot.asc");
  const response = await fetch(endpoint, {
    headers: { apikey: settings.key },
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`booking lookup returned ${response.status}`);
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || !payload.every(isBookingRow)) {
    throw new Error("booking lookup returned an invalid payload");
  }
  return payload;
}

async function markManageEmailSent(settings: SupabaseSettings, bookingGroupId: string) {
  const endpoint = new URL(`${settings.url}/rest/v1/popup_bookings`);
  endpoint.searchParams.set("booking_group_id", `eq.${bookingGroupId}`);
  endpoint.searchParams.set("status", "neq.cancelled");
  await fetch(endpoint, {
    method: "PATCH",
    headers: {
      apikey: settings.key,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ manage_email_sent_at: new Date().toISOString() }),
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
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

  const bookingGroupId = randomUUID();
  const manageToken = createManageToken();
  const manageTokenHash = hashManageToken(manageToken);
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
    booking_group_id: bookingGroupId,
    manage_token_hash: manageTokenHash,
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
    const payload = (await insert.json().catch(() => null)) as { code?: unknown } | null;
    if (insert.status === 409 || payload?.code === "23505") {
      return NextResponse.json(
        { error: "that slot was just taken" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("Pop-Up booking database returned status", insert.status);
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 502 });
  }

  const summary: BookingSummary = {
    eventDate: booking.eventDate,
    slots,
    wholeDay: booking.wholeDay,
    dispensaryName: booking.dispensaryName,
  };
  const [internalNotification, customerNotification] = await Promise.all([
    sendInternalBookingNotification(booking),
    sendCustomerConfirmation(booking, summary, manageToken),
  ]);
  if (customerNotification.accepted) {
    try {
      await markManageEmailSent(settings, bookingGroupId);
    } catch {
      console.error("Pop-Up management email timestamp could not be saved.");
    }
  }

  return NextResponse.json(
    {
      success: true,
      manageToken,
      booking: summary,
      notificationAccepted: internalNotification.accepted,
      notificationId: internalNotification.messageId,
      customerNotificationAccepted: customerNotification.accepted,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    input = null;
  }
  const token = input && typeof input === "object"
    ? parseManageToken((input as Record<string, unknown>).manageToken)
    : null;
  if (!token) {
    return NextResponse.json({ error: "This private booking link is invalid or expired." }, { status: 400 });
  }

  const settings = getSupabaseSettings();
  if (!settings) {
    return NextResponse.json({ error: "Booking management is temporarily unavailable." }, { status: 503 });
  }

  try {
    const rows = await readRowsByToken(settings, token);
    if (rows.length === 0) {
      return NextResponse.json({ error: "This private booking link is invalid or expired." }, { status: 404 });
    }
    return NextResponse.json(
      { success: true, booking: summarizeBooking(rows) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("Pop-Up private booking lookup failed.");
    return NextResponse.json({ error: "Booking management is temporarily unavailable." }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    input = null;
  }
  const email = input && typeof input === "object"
    ? parseEmail((input as Record<string, unknown>).email)
    : null;
  const genericResponse = () => NextResponse.json(
    { success: true, message: "If that email matches an active booking, a private link is on its way." },
    { status: 202, headers: { "Cache-Control": "no-store" } },
  );
  if (!email) return genericResponse();

  const settings = getSupabaseSettings();
  if (!settings) {
    return NextResponse.json({ error: "Booking management is temporarily unavailable." }, { status: 503 });
  }

  const endpoint = new URL(`${settings.url}/rest/v1/popup_bookings`);
  endpoint.searchParams.set(
    "select",
    "booking_group_id,manage_email_sent_at,event_date,slot,whole_day,dispensary_name,contact_name,phone,email",
  );
  endpoint.searchParams.set("email", `eq.${email}`);
  endpoint.searchParams.set("status", "neq.cancelled");
  endpoint.searchParams.set("event_date", `gte.${chicagoToday()}`);
  endpoint.searchParams.set("order", "event_date.asc,slot.asc");

  try {
    const response = await fetch(endpoint, {
      headers: { apikey: settings.key },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`recovery lookup returned ${response.status}`);
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload) || !payload.every(isBookingRow)) {
      throw new Error("recovery lookup returned an invalid payload");
    }

    const groups = new Map<string, BookingRow[]>();
    for (const row of payload) {
      const current = groups.get(row.booking_group_id) ?? [];
      current.push(row);
      groups.set(row.booking_group_id, current);
    }

    const eligible = [...groups.entries()].filter(([, rows]) => {
      const sentAt = rows[0].manage_email_sent_at;
      return !sentAt || Date.now() - Date.parse(sentAt) >= RECOVERY_COOLDOWN_MS;
    });
    if (eligible.length === 0) return genericResponse();

    const links: Array<{ groupId: string; token: string; summary: BookingSummary }> = [];
    for (const [groupId, rows] of eligible) {
      const token = createManageToken();
      const update = new URL(`${settings.url}/rest/v1/popup_bookings`);
      update.searchParams.set("booking_group_id", `eq.${groupId}`);
      update.searchParams.set("status", "neq.cancelled");
      const updated = await fetch(update, {
        method: "PATCH",
        headers: {
          apikey: settings.key,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          manage_token_hash: hashManageToken(token),
          manage_email_sent_at: new Date().toISOString(),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
      if (updated.ok) links.push({ groupId, token, summary: summarizeBooking(rows) });
    }
    if (links.length === 0) return genericResponse();

    const linkText = links.flatMap(({ token, summary }) => [
      `${summary.eventDate} — ${scheduleLabel(summary)} — ${summary.dispensaryName}`,
      manageUrl(token),
      "",
    ]);
    const customer = payload[0] as BookingRow;
    const sent = await sendEmail(
      email,
      "Your Presidential Pop-Up private booking links",
      [
        `Hi ${customer.contact_name},`,
        "",
        "Use the private link for the booking you want to view or cancel:",
        "",
        ...linkText,
        "Keep these links private. Anyone without them cannot change your bookings.",
      ].join("\n"),
    );
    if (!sent.accepted) {
      for (const { groupId } of links) {
        const reset = new URL(`${settings.url}/rest/v1/popup_bookings`);
        reset.searchParams.set("booking_group_id", `eq.${groupId}`);
        await fetch(reset, {
          method: "PATCH",
          headers: {
            apikey: settings.key,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ manage_email_sent_at: null }),
          cache: "no-store",
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });
      }
    }
    return genericResponse();
  } catch {
    console.error("Pop-Up management-link recovery failed.");
    return genericResponse();
  }
}

export async function DELETE(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    input = null;
  }
  const token = input && typeof input === "object"
    ? parseManageToken((input as Record<string, unknown>).manageToken)
    : null;
  if (!token) {
    return NextResponse.json({ error: "This private booking link is invalid or expired." }, { status: 400 });
  }

  const settings = getSupabaseSettings();
  if (!settings) {
    return NextResponse.json({ error: "Booking management is temporarily unavailable." }, { status: 503 });
  }

  try {
    const rows = await readRowsByToken(settings, token);
    if (rows.length === 0) {
      return NextResponse.json({ error: "This private booking link is invalid or expired." }, { status: 404 });
    }
    const summary = summarizeBooking(rows);
    const first = rows[0];
    const endpoint = new URL(`${settings.url}/rest/v1/popup_bookings`);
    endpoint.searchParams.set("manage_token_hash", `eq.${hashManageToken(token)}`);
    endpoint.searchParams.set("status", "neq.cancelled");
    const cancelled = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        apikey: settings.key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        manage_token_hash: null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!cancelled.ok) throw new Error(`cancellation update returned ${cancelled.status}`);

    const details = [
      `Date: ${summary.eventDate}`,
      `Schedule: ${scheduleLabel(summary)}`,
      `Dispensary: ${summary.dispensaryName}`,
      `Contact: ${first.contact_name}`,
      `Phone: ${first.phone}`,
      `Email: ${first.email}`,
    ].join("\n");
    const internalRecipient = process.env.POPUP_NOTIFY_EMAIL;
    await Promise.all([
      sendEmail(
        first.email,
        `Your Presidential Pop-Up booking was cancelled — ${summary.eventDate}`,
        [
          `Hi ${first.contact_name},`,
          "",
          "Your Presidential Pop-Up booking has been cancelled and the calendar slot is open again.",
          "",
          details,
        ].join("\n"),
      ),
      internalRecipient
        ? sendEmail(
            internalRecipient,
            `Pop-Up cancellation: ${summary.eventDate} ${scheduleLabel(summary)}`,
            `A Presidential Pop-Up booking was cancelled.\n\n${details}`,
          )
        : Promise.resolve({ accepted: false, messageId: null as string | null }),
    ]);

    return NextResponse.json(
      { success: true, booking: summary },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("Pop-Up cancellation failed.");
    return NextResponse.json({ error: "Booking cancellation is temporarily unavailable." }, { status: 502 });
  }
}

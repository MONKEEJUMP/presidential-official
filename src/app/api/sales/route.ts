import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  callbackDateToUtc,
  defaultCallbackDate,
  isSalesOutcome,
  type DoorStatus,
  type MatchConfidence,
  type SalesCall,
  type SalesDoor,
  type SalesOutcome,
  type SalesSnapshot,
} from "@/lib/sales";
import { createSalesAdminClient, createSalesAuthClient } from "@/lib/supabase/sales-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGE_SIZE = 1000;
const STATE_PATTERN = /^[A-Z]{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type DoorRow = Readonly<{
  id: number;
  state: string;
  door_key: string;
  state_license_id: string | null;
  legal_name: string | null;
  dba_name: string | null;
  street_address: string | null;
  city: string | null;
  state_code: string;
  zip: string | null;
  phone: string | null;
  email: string | null;
  extra_contacts: string | null;
  website: string | null;
  operational_status: string | null;
  status: DoorStatus;
  match_confidence: MatchConfidence;
  next_callback_at: string | null;
  source_list_date: string;
}>;

type CallRow = Readonly<{
  id: number;
  door_id: number;
  rep_id: string;
  rep_name: string;
  called_at: string;
  outcome: SalesOutcome;
  notes: string | null;
  callback_at: string | null;
}>;

type RepProfile = Readonly<{
  user_id: string;
  username: string;
  display_name: string;
}>;

function response(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function repName(user: User, profile?: RepProfile | null): string {
  if (profile?.display_name.trim()) return profile.display_name.trim();
  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) return displayName.trim();
  return user.email?.split("@")[0]?.trim() || "Presidential rep";
}

async function fetchRepProfile(admin: SupabaseClient, userId: string): Promise<RepProfile | null> {
  const { data, error } = await admin
    .from("sales_rep_profiles")
    .select("user_id,username,display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as RepProfile | null;
}

async function authenticatedUser(): Promise<User | null> {
  const client = await createSalesAuthClient();
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

async function fetchStateCodes(admin: SupabaseClient): Promise<string[]> {
  const stateCodes = new Set<string>();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("market_doors")
      .select("state_code")
      .order("state_code")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Array<{ state_code: string }>;
    page.forEach((row) => stateCodes.add(row.state_code));
    if (page.length < PAGE_SIZE) break;
  }
  return [...stateCodes].sort();
}

async function fetchDoors(admin: SupabaseClient, state: string): Promise<DoorRow[]> {
  const rows: DoorRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("market_doors")
      .select(
        "id,state,door_key,state_license_id,legal_name,dba_name,street_address,city,state_code,zip,phone,email,extra_contacts,website,operational_status,status,match_confidence,next_callback_at,source_list_date",
      )
      .eq("state_code", state)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as DoorRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function fetchCalls(admin: SupabaseClient, state: string): Promise<CallRow[]> {
  const rows: CallRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("call_log")
      .select(
        "id,door_id,rep_id,rep_name,called_at,outcome,notes,callback_at,market_doors!inner(state_code)",
      )
      .eq("market_doors.state_code", state)
      .order("called_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as CallRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function mapCall(row: CallRow): SalesCall {
  return {
    id: Number(row.id),
    doorId: Number(row.door_id),
    repId: row.rep_id,
    repName: row.rep_name,
    calledAt: row.called_at,
    outcome: row.outcome,
    notes: row.notes,
    callbackAt: row.callback_at,
  };
}

function mapDoors(doorRows: DoorRow[], callRows: CallRow[]): SalesDoor[] {
  const callsByDoor = new Map<number, SalesCall[]>();
  for (const row of callRows) {
    const call = mapCall(row);
    const calls = callsByDoor.get(call.doorId) ?? [];
    calls.push(call);
    callsByDoor.set(call.doorId, calls);
  }

  return doorRows.map((row) => {
    const callHistory = callsByDoor.get(Number(row.id)) ?? [];
    return {
      id: Number(row.id),
      state: row.state,
      doorKey: row.door_key,
      stateLicenseId: row.state_license_id,
      legalName: row.legal_name,
      dbaName: row.dba_name,
      streetAddress: row.street_address,
      city: row.city,
      stateCode: row.state_code,
      zip: row.zip,
      phone: row.phone,
      email: row.email,
      extraContacts: row.extra_contacts,
      website: row.website,
      operationalStatus: row.operational_status,
      status: row.status,
      matchConfidence: row.match_confidence,
      nextCallbackAt: row.next_callback_at,
      sourceListDate: row.source_list_date,
      callHistory,
      lastCall: callHistory[0] ?? null,
    };
  });
}

export async function GET(request: Request) {
  const user = await authenticatedUser();
  if (!user) return response({ authenticated: false }, 401);

  try {
    const admin = createSalesAdminClient();
    const [states, profile] = await Promise.all([
      fetchStateCodes(admin),
      fetchRepProfile(admin, user.id),
    ]);
    if (states.length === 0) {
      return response({ error: "No sales door data is available." }, 503);
    }
    const requested = new URL(request.url).searchParams.get("state")?.toUpperCase() ?? "";
    const selectedState = STATE_PATTERN.test(requested) && states.includes(requested)
      ? requested
      : states[0];
    const [doorRows, callRows] = await Promise.all([
      fetchDoors(admin, selectedState),
      fetchCalls(admin, selectedState),
    ]);
    const doors = mapDoors(doorRows, callRows);
    const snapshot: SalesSnapshot = {
      authenticated: true,
      user: {
        id: user.id,
        name: repName(user, profile),
        username: profile?.username ?? "",
      },
      states,
      selectedState,
      stockedCount: doors.filter((door) => door.status === "stocked").length,
      licensedDoorCount: doors.filter((door) => door.status !== "closed").length,
      doors,
    };
    return response(snapshot);
  } catch (error) {
    console.error("Sales snapshot failed", error instanceof Error ? error.message : "unknown");
    return response({ error: "Sales data is temporarily unavailable." }, 503);
  }
}

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return response({ error: "Invalid request." }, 400);
  }

  if (input.action === "login") {
    const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!/^[a-z][a-z0-9]{0,31}$/.test(username) || !/^\d{6}$/.test(password)) {
      return response({ error: "Enter your first-name username and 6-digit PIN." }, 400);
    }
    const admin = createSalesAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("sales_rep_profiles")
      .select("user_id,username,display_name")
      .eq("username", username)
      .maybeSingle();
    if (profileError || !profile) {
      return response({ error: "Username or passcode was not recognized." }, 401);
    }
    const { data: owner, error: ownerError } = await admin.auth.admin.getUserById(profile.user_id);
    const email = owner.user?.email;
    if (ownerError || !email) {
      return response({ error: "Username or passcode was not recognized." }, 401);
    }
    const auth = await createSalesAuthClient();
    const { data, error } = await auth.auth.signInWithPassword({ email, password });
    if (error || !data.user) return response({ error: "Username or passcode was not recognized." }, 401);
    return response({ authenticated: true, name: profile.display_name, username: profile.username });
  }

  const user = await authenticatedUser();
  if (!user) return response({ authenticated: false }, 401);
  if (input.action !== "log_call") return response({ error: "Invalid sales action." }, 400);

  const doorId = Number(input.doorId);
  const outcome = input.outcome;
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (!Number.isSafeInteger(doorId) || doorId <= 0 || !isSalesOutcome(outcome)) {
    return response({ error: "A valid door and outcome are required." }, 400);
  }
  if (notes.length > 4000) return response({ error: "Notes must be 4,000 characters or fewer." }, 400);

  const hasCustomCallback = Object.prototype.hasOwnProperty.call(input, "callbackDate");
  let callbackDate: string | null;
  if (hasCustomCallback) {
    callbackDate = input.callbackDate === null ? null : String(input.callbackDate ?? "");
    if (callbackDate && !DATE_PATTERN.test(callbackDate)) {
      return response({ error: "Callback date must use YYYY-MM-DD." }, 400);
    }
  } else {
    callbackDate = defaultCallbackDate(outcome);
  }

  try {
    const admin = createSalesAdminClient();
    const profile = await fetchRepProfile(admin, user.id);
    const { data, error } = await admin.rpc("log_sales_call", {
      p_door_id: doorId,
      p_rep_id: user.id,
      p_rep_name: repName(user, profile),
      p_outcome: outcome,
      p_notes: notes || null,
      p_callback_at: callbackDateToUtc(callbackDate),
      p_called_at: new Date().toISOString(),
    });
    if (error) throw error;
    const callRow = (Array.isArray(data) ? data[0] : data) as CallRow | null;
    if (!callRow) throw new Error("Call insert returned no row.");

    const { data: door, error: doorError } = await admin
      .from("market_doors")
      .select("status,next_callback_at")
      .eq("id", doorId)
      .single();
    if (doorError || !door) throw doorError ?? new Error("Door refresh failed.");
    return response({
      success: true,
      call: mapCall(callRow),
      status: door.status as DoorStatus,
      nextCallbackAt: door.next_callback_at as string | null,
    });
  } catch (error) {
    console.error("Sales call log failed", error instanceof Error ? error.message : "unknown");
    return response({ error: "The call could not be logged. Please try again." }, 503);
  }
}

export async function DELETE() {
  const auth = await createSalesAuthClient();
  await auth.auth.signOut();
  return response({ authenticated: false });
}

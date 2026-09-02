import "server-only";

import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  callbackDateToUtc,
  chicagoDateKey,
  defaultCallbackDate,
  isSalesOutcome,
  type DoorStatus,
  type SalesAdminEvent,
  type SalesCall,
  type SalesDoor,
  type SalesOutcome,
  type SalesPersonalStats,
  type SalesRepActivity,
  type SalesRole,
  type SalesSnapshot,
} from "@/lib/sales";
import { createSalesAdminClient, createSalesAuthClient } from "@/lib/supabase/sales-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGE_SIZE = 1000;
const STATE_PATTERN = /^[A-Z]{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const USERNAME_PATTERN = /^[a-z][a-z0-9]{0,31}$/;
const PIN_PATTERN = /^\d{6}$/;
const TEAM_CODE_PATTERN = /^[A-Z0-9]{4,32}$/;
const VALID_STATUSES = new Set<DoorStatus>(["stocked", "prospect", "review", "closed"]);

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
  next_callback_at: string | null;
  source_list_date: string;
}>;

type CallRow = Readonly<{
  id: number;
  door_id: number | null;
  verified_customer_id: number | null;
  rep_id: string;
  rep_name: string;
  called_at: string;
  outcome: SalesOutcome;
  notes: string | null;
  callback_at: string | null;
}>;

type VerifiedCustomerRow = Readonly<{
  id: number;
  retailer_id: number | null;
  door_id: number | null;
  verification_source: "exact_address_city_state_zip" | "verified_retailer_unlinked" | "super_master_confirmed";
  verification_note: string;
  next_callback_at: string | null;
  active: boolean;
}>;

type RetailerRow = Readonly<{
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  updated_at: string;
}>;

type RepProfile = Readonly<{
  user_id: string;
  username: string;
  display_name: string;
  can_invite: boolean;
  role: SalesRole;
  active: boolean;
  deactivated_at: string | null;
}>;

type TeamSettings = Readonly<{
  setup_code: string;
  onboarding_open: boolean;
}>;

type AdminLogRow = Readonly<{
  id: number;
  actor_name: string;
  actor_role: SalesRole;
  target_username: string | null;
  door_id: number | null;
  action: string;
  reason: string | null;
  created_at: string;
}>;

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function normalizeTeamCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function displayTeamCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

function repName(user: User, profile?: RepProfile | null): string {
  if (profile?.display_name.trim()) return profile.display_name.trim();
  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) return displayName.trim();
  return user.email?.split("@")[0]?.trim() || "Presidential rep";
}

function safeReason(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, 500) || null;
}

function dateKeyOffset(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function startOfWeek(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dateKeyOffset(dateKey, weekday === 0 ? -6 : 1 - weekday);
}

async function authenticatedUser(): Promise<User | null> {
  const client = await createSalesAuthClient();
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

async function fetchRepProfile(admin: SupabaseClient, userId: string): Promise<RepProfile | null> {
  const { data, error } = await admin
    .from("sales_rep_profiles")
    .select("user_id,username,display_name,can_invite,role,active,deactivated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as RepProfile | null;
}

async function fetchProfiles(admin: SupabaseClient): Promise<RepProfile[]> {
  const rows: RepProfile[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("sales_rep_profiles")
      .select("user_id,username,display_name,can_invite,role,active,deactivated_at")
      .order("display_name")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as RepProfile[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function fetchTeamSettings(admin: SupabaseClient): Promise<TeamSettings> {
  const { data, error } = await admin
    .from("sales_team_settings")
    .select("setup_code,onboarding_open")
    .eq("singleton", true)
    .single();
  if (error || !data?.setup_code) throw error ?? new Error("Sales team settings are unavailable.");
  return data as TeamSettings;
}

async function fetchStateCodes(admin: SupabaseClient): Promise<string[]> {
  const stateCodes = new Set<string>();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin.from("market_doors").select("state_code").range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Array<{ state_code: string }>;
    page.forEach((row) => stateCodes.add(row.state_code));
    if (page.length < PAGE_SIZE) return [...stateCodes].sort();
  }
}

async function fetchDoors(admin: SupabaseClient, state: string): Promise<DoorRow[]> {
  const rows: DoorRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("market_doors")
      .select("id,state,door_key,state_license_id,legal_name,dba_name,street_address,city,state_code,zip,phone,email,extra_contacts,website,operational_status,status,next_callback_at,source_list_date")
      .eq("state_code", state)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as DoorRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function fetchAllCalls(admin: SupabaseClient): Promise<CallRow[]> {
  const rows: CallRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("call_log")
      .select("id,door_id,verified_customer_id,rep_id,rep_name,called_at,outcome,notes,callback_at")
      .order("called_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as CallRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function fetchVerifiedCustomers(admin: SupabaseClient): Promise<VerifiedCustomerRow[]> {
  const rows: VerifiedCustomerRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("sales_verified_customer_doors")
      .select("id,retailer_id,door_id,verification_source,verification_note,next_callback_at,active")
      .eq("active", true)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as VerifiedCustomerRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function fetchVerifiedRetailers(admin: SupabaseClient): Promise<RetailerRow[]> {
  const rows: RetailerRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("retailers")
      .select("id,name,address,city,state,zip,phone,website,updated_at")
      .eq("public_locator_status", "approved_public_locator")
      .in("state", ["AZ", "NY", "OK"])
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as RetailerRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function fetchVoidedCallIds(admin: SupabaseClient): Promise<Set<number>> {
  const ids = new Set<number>();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin.from("call_log_voids").select("call_id").range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Array<{ call_id: number }>;
    page.forEach((row) => ids.add(Number(row.call_id)));
    if (page.length < PAGE_SIZE) return ids;
  }
}

async function fetchIdSet(
  admin: SupabaseClient,
  table: "sales_personal_stars" | "sales_company_priorities",
  userId?: string,
): Promise<Set<number>> {
  const ids = new Set<number>();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = admin.from(table).select("door_id,verified_customer_id").range(offset, offset + PAGE_SIZE - 1);
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw error;
    const page = (data ?? []) as Array<{ door_id: number | null; verified_customer_id: number | null }>;
    page.forEach((row) => {
      if (row.door_id !== null) ids.add(Number(row.door_id));
      else if (row.verified_customer_id !== null) ids.add(-Number(row.verified_customer_id));
    });
    if (page.length < PAGE_SIZE) return ids;
  }
}

function salesTargetId(doorId: number | null, verifiedCustomerId: number | null): number {
  if (doorId !== null) return Number(doorId);
  if (verifiedCustomerId !== null) return -Number(verifiedCustomerId);
  throw new Error("Sales call has no target.");
}

function mapCall(row: CallRow): SalesCall {
  return {
    id: Number(row.id),
    doorId: salesTargetId(row.door_id, row.verified_customer_id),
    repId: row.rep_id,
    repName: row.rep_name,
    calledAt: row.called_at,
    outcome: row.outcome,
    notes: row.notes,
    callbackAt: row.callback_at,
  };
}

function isClosedDoorRow(row: DoorRow): boolean {
  const operational = row.operational_status?.toLowerCase() ?? "";
  return (
    row.status === "closed" ||
    operational.includes("non-operational") ||
    operational.includes("non operational") ||
    operational.includes("not operating")
  );
}

function mapSalesTargets(
  doorRows: DoorRow[],
  verifiedCustomers: VerifiedCustomerRow[],
  retailerRows: RetailerRow[],
  calls: CallRow[],
  userId: string,
  personalStars: Set<number>,
  priorities: Set<number>,
): SalesDoor[] {
  const retailerById = new Map(retailerRows.map((row) => [Number(row.id), row]));
  const verifiedByDoor = new Map<number, VerifiedCustomerRow>();
  for (const customer of verifiedCustomers) {
    if (customer.door_id !== null) verifiedByDoor.set(Number(customer.door_id), customer);
  }

  const callsByTarget = new Map<number, SalesCall[]>();
  for (const row of calls) {
    const call = mapCall(row);
    callsByTarget.set(call.doorId, [...(callsByTarget.get(call.doorId) ?? []), call]);
  }

  const licensedTargets = doorRows.filter((row) => !isClosedDoorRow(row)).map((row) => {
    const id = Number(row.id);
    const verified = verifiedByDoor.get(id) ?? null;
    const retailer = verified?.retailer_id === null || verified?.retailer_id === undefined
      ? null
      : retailerById.get(Number(verified.retailer_id)) ?? null;
    const callHistory = callsByTarget.get(id) ?? [];
    return {
      id,
      marketDoorId: id,
      verifiedCustomerId: verified ? Number(verified.id) : null,
      retailerId: retailer ? Number(retailer.id) : null,
      state: row.state,
      doorKey: row.door_key,
      stateLicenseId: row.state_license_id,
      legalName: row.legal_name,
      dbaName: retailer?.name ?? row.dba_name,
      streetAddress: retailer?.address ?? row.street_address,
      city: retailer?.city ?? row.city,
      stateCode: row.state_code,
      zip: retailer?.zip ?? row.zip,
      phone: retailer?.phone ?? row.phone,
      email: row.email,
      extraContacts: row.extra_contacts,
      website: retailer?.website ?? row.website,
      operationalStatus: row.operational_status,
      status: row.status,
      isPurchasing: Boolean(verified),
      nextCallbackAt: row.next_callback_at,
      sourceListDate: row.source_list_date,
      callHistory,
      lastCall: callHistory[0] ?? null,
      personallyStarred: personalStars.has(id),
      companyPriority: priorities.has(id),
      myLastActivityAt: callHistory.find((call) => call.repId === userId)?.calledAt ?? null,
    };
  });

  const unlinkedTargets = verifiedCustomers.flatMap((verified) => {
    if (verified.door_id !== null || verified.retailer_id === null) return [];
    const retailer = retailerById.get(Number(verified.retailer_id));
    if (!retailer) return [];
    const id = -Number(verified.id);
    const callHistory = callsByTarget.get(id) ?? [];
    return [{
      id,
      marketDoorId: null,
      verifiedCustomerId: Number(verified.id),
      retailerId: Number(retailer.id),
      state: retailer.state,
      doorKey: `verified-retailer:${retailer.id}`,
      stateLicenseId: null,
      legalName: null,
      dbaName: retailer.name,
      streetAddress: retailer.address,
      city: retailer.city,
      stateCode: retailer.state,
      zip: retailer.zip,
      phone: retailer.phone,
      email: null,
      extraContacts: null,
      website: retailer.website,
      operationalStatus: "VERIFIED CUSTOMER",
      status: "review" as const,
      isPurchasing: true,
      nextCallbackAt: verified.next_callback_at,
      sourceListDate: retailer.updated_at.slice(0, 10),
      callHistory,
      lastCall: callHistory[0] ?? null,
      personallyStarred: personalStars.has(id),
      companyPriority: priorities.has(id),
      myLastActivityAt: callHistory.find((call) => call.repId === userId)?.calledAt ?? null,
    } satisfies SalesDoor];
  });

  return [...licensedTargets, ...unlinkedTargets];
}

function personalStats(calls: CallRow[], userId: string, today: string): SalesPersonalStats {
  const week = startOfWeek(today);
  const month = `${today.slice(0, 7)}-01`;
  const mine = calls.filter((call) => call.rep_id === userId);
  return {
    callsToday: mine.filter((call) => chicagoDateKey(call.called_at) === today).length,
    callsThisWeek: mine.filter((call) => {
      const key = chicagoDateKey(call.called_at);
      return key >= week && key <= today;
    }).length,
    soldThisMonth: mine.filter((call) => call.outcome === "sold" && chicagoDateKey(call.called_at) >= month).length,
  };
}

function buildActivity(profiles: RepProfile[], calls: CallRow[], today: string): SalesRepActivity[] {
  const week = startOfWeek(today);
  const month = `${today.slice(0, 7)}-01`;
  return profiles.map((profile) => {
    const mine = calls.filter((call) => call.rep_id === profile.user_id);
    return {
      userId: profile.user_id,
      username: profile.username,
      displayName: profile.display_name,
      role: profile.role,
      active: profile.active,
      callsToday: mine.filter((call) => chicagoDateKey(call.called_at) === today).length,
      callsThisWeek: mine.filter((call) => {
        const key = chicagoDateKey(call.called_at);
        return key >= week && key <= today;
      }).length,
      callsThisMonth: mine.filter((call) => chicagoDateKey(call.called_at) >= month).length,
      soldThisMonth: mine.filter((call) => call.outcome === "sold" && chicagoDateKey(call.called_at) >= month).length,
      lastActivityAt: mine[0]?.called_at ?? null,
    };
  }).sort((a, b) => b.callsThisWeek - a.callsThisWeek || a.displayName.localeCompare(b.displayName));
}

async function fetchAdminEvents(admin: SupabaseClient): Promise<SalesAdminEvent[]> {
  const rows: SalesAdminEvent[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("sales_admin_log")
      .select("id,actor_name,actor_role,target_username,door_id,action,reason,created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as AdminLogRow[];
    rows.push(...page.map((row) => ({
      id: Number(row.id),
      actorName: row.actor_name,
      actorRole: row.actor_role,
      targetUsername: row.target_username,
      doorId: row.door_id === null ? null : Number(row.door_id),
      action: row.action,
      reason: row.reason,
      createdAt: row.created_at,
    })));
    if (page.length < PAGE_SIZE) return rows;
  }
}

function isSuper(profile: RepProfile): boolean {
  return profile.active && profile.role === "super_master" && profile.username === "paulie";
}

async function addAudit(
  admin: SupabaseClient,
  actor: RepProfile,
  action: string,
  values: {
    target?: RepProfile | null;
    targetUsername?: string | null;
    doorId?: number | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const { error } = await admin.from("sales_admin_log").insert({
    actor_id: actor.user_id,
    actor_name: actor.display_name,
    actor_role: actor.role,
    target_user_id: values.target?.user_id ?? null,
    target_username: values.targetUsername ?? values.target?.username ?? null,
    door_id: values.doorId ?? null,
    action,
    reason: values.reason ?? null,
    metadata: values.metadata ?? {},
  });
  if (error) throw error;
}

function targetColumns(targetId: number) {
  return targetId > 0
    ? { door_id: targetId, verified_customer_id: null }
    : { door_id: null, verified_customer_id: -targetId };
}

async function validSalesTarget(admin: SupabaseClient, targetId: number): Promise<boolean> {
  const table = targetId > 0 ? "market_doors" : "sales_verified_customer_doors";
  let query = admin.from(table).select("id").eq("id", Math.abs(targetId));
  if (targetId < 0) query = query.eq("active", true).is("door_id", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function GET(request: Request) {
  const user = await authenticatedUser();
  if (!user) return json({ authenticated: false }, 401);

  try {
    const admin = createSalesAdminClient();
    const profile = await fetchRepProfile(admin, user.id);
    if (!profile?.active) return json({ error: "This sales account is inactive." }, 403);

    const url = new URL(request.url);
    const resource = url.searchParams.get("resource");
    if (resource === "activity") {
      if (profile.role === "sales_rep") return json({ error: "Master access is required." }, 403);
      const [profiles, calls, voids] = await Promise.all([fetchProfiles(admin), fetchAllCalls(admin), fetchVoidedCallIds(admin)]);
      return json({ activity: buildActivity(profiles, calls.filter((call) => !voids.has(Number(call.id))), chicagoDateKey()) });
    }
    if (resource === "admin_log") {
      if (!isSuper(profile)) return json({ error: "Super Master access is required." }, 403);
      return json({ events: await fetchAdminEvents(admin) });
    }

    const states = await fetchStateCodes(admin);
    if (!states.length) return json({ error: "No sales door data is available." }, 503);
    const requested = url.searchParams.get("state")?.toUpperCase() ?? "";
    const selectedState = STATE_PATTERN.test(requested) && states.includes(requested) ? requested : states[0];
    const [doorRows, verifiedCustomers, retailerRows, allCalls, voids, personalStars, priorities, settings] = await Promise.all([
      fetchDoors(admin, selectedState),
      fetchVerifiedCustomers(admin),
      fetchVerifiedRetailers(admin),
      fetchAllCalls(admin),
      fetchVoidedCallIds(admin),
      fetchIdSet(admin, "sales_personal_stars", user.id),
      fetchIdSet(admin, "sales_company_priorities"),
      isSuper(profile) ? fetchTeamSettings(admin) : Promise.resolve(null),
    ]);
    const activeCalls = allCalls.filter((call) => !voids.has(Number(call.id)));
    const selectedIds = new Set(doorRows.map((door) => Number(door.id)));
    const selectedRetailers = retailerRows.filter((retailer) => retailer.state === selectedState);
    const selectedRetailerIds = new Set(selectedRetailers.map((retailer) => Number(retailer.id)));
    const selectedVerifiedCustomers = verifiedCustomers.filter(
      (customer) =>
        (customer.door_id !== null && selectedIds.has(Number(customer.door_id))) ||
        (customer.retailer_id !== null && selectedRetailerIds.has(Number(customer.retailer_id))),
    );
    const selectedVerifiedCustomerIds = new Set(
      selectedVerifiedCustomers.map((customer) => Number(customer.id)),
    );
    const doors = mapSalesTargets(
      doorRows,
      selectedVerifiedCustomers,
      selectedRetailers,
      activeCalls.filter(
        (call) =>
          (call.door_id !== null && selectedIds.has(Number(call.door_id))) ||
          (call.verified_customer_id !== null && selectedVerifiedCustomerIds.has(Number(call.verified_customer_id))),
      ),
      user.id,
      personalStars,
      priorities,
    );
    const snapshot: SalesSnapshot = {
      authenticated: true,
      user: {
        id: user.id,
        name: repName(user, profile),
        username: profile.username,
        role: profile.role,
        active: profile.active,
        teamSetupCode: settings ? displayTeamCode(settings.setup_code) : null,
        onboardingOpen: settings?.onboarding_open ?? null,
        stats: personalStats(activeCalls, user.id, chicagoDateKey()),
      },
      states,
      selectedState,
      purchasingCount: doors.filter((door) => door.isPurchasing).length,
      opportunityCount: doors.filter((door) => !door.isPurchasing).length,
      activeDispensaryCount: doorRows.filter((door) => !isClosedDoorRow(door)).length,
      closedCount: doorRows.filter(isClosedDoorRow).length,
      doors,
    };
    return json(snapshot);
  } catch (error) {
    console.error("Sales snapshot failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Sales data is temporarily unavailable." }, 503);
  }
}

async function manageAccount(admin: SupabaseClient, actor: RepProfile, input: Record<string, unknown>) {
  if (!isSuper(actor)) return json({ error: "Super Master access is required." }, 403);
  const targetId = typeof input.targetUserId === "string" ? input.targetUserId : "";
  const target = targetId ? await fetchRepProfile(admin, targetId) : null;
  if (!target) return json({ error: "That sales account was not found." }, 404);
  if (target.username === "paulie" || target.role === "super_master" || target.user_id === actor.user_id) {
    return json({ error: "The Super Master account is protected." }, 403);
  }
  const action = typeof input.accountAction === "string" ? input.accountAction : "";
  const reason = safeReason(input.reason);

  if (action === "deactivate") {
    const { error } = await admin.from("sales_rep_profiles").update({
      active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_by: actor.user_id,
      updated_at: new Date().toISOString(),
    }).eq("user_id", target.user_id);
    if (error) throw error;
    const { error: banError } = await admin.auth.admin.updateUserById(target.user_id, { ban_duration: "876000h" });
    if (banError) throw banError;
    const { error: revokeError } = await admin.rpc("revoke_sales_user_sessions", { p_user_id: target.user_id });
    if (revokeError) throw revokeError;
    await addAudit(admin, actor, "rep_deactivated", { target, reason });
    await addAudit(admin, actor, "sessions_revoked", { target, reason });
    return json({ success: true });
  }
  if (action === "reactivate") {
    const { error: unbanError } = await admin.auth.admin.updateUserById(target.user_id, { ban_duration: "none" });
    if (unbanError) throw unbanError;
    const { error } = await admin.from("sales_rep_profiles").update({
      active: true,
      deactivated_at: null,
      deactivated_by: null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", target.user_id);
    if (error) throw error;
    await addAudit(admin, actor, "rep_reactivated", { target, reason });
    return json({ success: true });
  }
  if (action === "correct_username") {
    const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
    if (!USERNAME_PATTERN.test(username)) return json({ error: "Use a valid first-name username." }, 400);
    const displayName = username[0].toUpperCase() + username.slice(1);
    const { error } = await admin.from("sales_rep_profiles").update({
      username,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    }).eq("user_id", target.user_id);
    if (error?.code === "23505") return json({ error: "That username is already taken." }, 409);
    if (error) throw error;
    const { error: metadataError } = await admin.auth.admin.updateUserById(target.user_id, { user_metadata: { display_name: displayName } });
    if (metadataError) throw metadataError;
    await addAudit(admin, actor, "username_corrected", {
      target,
      targetUsername: username,
      reason,
      metadata: { previous_username: target.username },
    });
    return json({ success: true });
  }
  if (action === "reset_pin") {
    const pin = typeof input.pin === "string" ? input.pin : "";
    if (!PIN_PATTERN.test(pin)) return json({ error: "Enter an exactly 6-digit replacement PIN." }, 400);
    const { error } = await admin.auth.admin.updateUserById(target.user_id, { password: pin });
    if (error) throw error;
    await addAudit(admin, actor, "pin_reset", { target, reason });
    return json({ success: true });
  }
  if (action === "set_role") {
    const role = input.role === "master" ? "master" : input.role === "sales_rep" ? "sales_rep" : null;
    if (!role) return json({ error: "Choose MASTER or SALES REP." }, 400);
    const { error } = await admin.from("sales_rep_profiles").update({ role, updated_at: new Date().toISOString() }).eq("user_id", target.user_id);
    if (error) throw error;
    await addAudit(admin, actor, role === "master" ? "role_promoted" : "role_demoted", {
      target,
      reason,
      metadata: { previous_role: target.role, new_role: role },
    });
    return json({ success: true });
  }
  return json({ error: "Invalid account action." }, 400);
}

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (input.action === "login") {
    const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!USERNAME_PATTERN.test(username) || !PIN_PATTERN.test(password)) {
      return json({ error: "Enter your first-name username and 6-digit PIN." }, 400);
    }
    const admin = createSalesAdminClient();
    const { data, error } = await admin.from("sales_rep_profiles")
      .select("user_id,username,display_name,can_invite,role,active,deactivated_at")
      .eq("username", username).maybeSingle();
    if (error || !data) return json({ error: "Username or PIN was not recognized." }, 401);
    const profile = data as RepProfile;
    if (!profile.active) return json({ error: "This sales account is inactive. Contact Paulie." }, 403);
    const owner = await admin.auth.admin.getUserById(profile.user_id);
    const email = owner.data.user?.email;
    if (owner.error || !email) return json({ error: "Username or PIN was not recognized." }, 401);
    const auth = await createSalesAuthClient();
    const signedIn = await auth.auth.signInWithPassword({ email, password });
    if (signedIn.error || !signedIn.data.user) return json({ error: "Username or PIN was not recognized." }, 401);
    return json({ authenticated: true, name: profile.display_name, username: profile.username });
  }

  if (input.action === "setup_rep") {
    const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
    const pin = typeof input.password === "string" ? input.password : "";
    const setupCode = typeof input.setupCode === "string" ? normalizeTeamCode(input.setupCode) : "";
    if (!USERNAME_PATTERN.test(username) || !PIN_PATTERN.test(pin) || !TEAM_CODE_PATTERN.test(setupCode)) {
      return json({ error: "Enter the sales team signup code, username, and 6-digit PIN." }, 400);
    }
    const admin = createSalesAdminClient();
    const duplicate = await admin.from("sales_rep_profiles").select("user_id").eq("username", username).maybeSingle();
    if (duplicate.error) return json({ error: "Account setup is temporarily unavailable." }, 503);
    if (duplicate.data) return json({ error: "That username is taken. Add a digit or initial." }, 409);
    const settings = await fetchTeamSettings(admin);
    if (!settings.onboarding_open) return json({ error: "New sales-account creation is temporarily closed. Contact Paulie." }, 403);
    if (settings.setup_code !== setupCode) return json({ error: "That sales team signup code is not valid." }, 401);
    const displayName = username[0].toUpperCase() + username.slice(1);
    const email = `${username}.${randomUUID()}@sales.presidential.internal`;
    const created = await admin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (created.error || !created.data.user) return json({ error: "Account setup is temporarily unavailable." }, 503);
    const inserted = await admin.from("sales_rep_profiles").insert({
      user_id: created.data.user.id,
      username,
      display_name: displayName,
      role: "sales_rep",
      active: true,
      can_invite: false,
    });
    if (inserted.error) {
      await admin.auth.admin.deleteUser(created.data.user.id);
      return json({ error: inserted.error.code === "23505" ? "That username is taken. Add a digit or initial." : "Account setup is temporarily unavailable." }, inserted.error.code === "23505" ? 409 : 503);
    }
    const auth = await createSalesAuthClient();
    const signedIn = await auth.auth.signInWithPassword({ email, password: pin });
    if (signedIn.error || !signedIn.data.user) return json({ error: "Account created. Please sign in." }, 201);
    return json({ authenticated: true, name: displayName, username }, 201);
  }

  const user = await authenticatedUser();
  if (!user) return json({ authenticated: false }, 401);

  try {
    const admin = createSalesAdminClient();
    const profile = await fetchRepProfile(admin, user.id);
    if (!profile?.active) return json({ error: "This sales account is inactive." }, 403);

    if (input.action === "change_pin") {
      const pin = typeof input.password === "string" ? input.password : "";
      if (!PIN_PATTERN.test(pin)) return json({ error: "Enter an exactly 6-digit PIN." }, 400);
      const auth = await createSalesAuthClient();
      const { error } = await auth.auth.updateUser({ password: pin });
      return error ? json({ error: "Your PIN could not be changed." }, 503) : json({ success: true });
    }

    if (input.action === "change_team_code") {
      if (!isSuper(profile)) return json({ error: "Only Paulie can change the team code." }, 403);
      const setupCode = typeof input.setupCode === "string" ? normalizeTeamCode(input.setupCode) : "";
      if (!TEAM_CODE_PATTERN.test(setupCode)) return json({ error: "Use 4–32 letters or digits for the team code." }, 400);
      const { error } = await admin.from("sales_team_settings").update({
        setup_code: setupCode,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }).eq("singleton", true);
      if (error) throw error;
      await addAudit(admin, profile, "team_code_changed", { target: profile, reason: safeReason(input.reason) });
      return json({ success: true, setupCode: displayTeamCode(setupCode) });
    }

    if (input.action === "set_onboarding") {
      if (!isSuper(profile)) return json({ error: "Only Paulie can control account creation." }, 403);
      const open = input.open === true;
      const { error } = await admin.from("sales_team_settings").update({
        onboarding_open: open,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }).eq("singleton", true);
      if (error) throw error;
      await addAudit(admin, profile, open ? "account_creation_reopened" : "account_creation_paused", { target: profile, reason: safeReason(input.reason) });
      return json({ success: true, onboardingOpen: open });
    }

    if (input.action === "manage_account") return manageAccount(admin, profile, input);

    if (input.action === "toggle_personal_star") {
      const doorId = Number(input.doorId);
      const starred = input.starred === true;
      if (!Number.isSafeInteger(doorId) || doorId === 0 || !(await validSalesTarget(admin, doorId))) {
        return json({ error: "A valid sales target is required." }, 400);
      }
      const columns = targetColumns(doorId);
      let error;
      if (starred) {
        let existingQuery = admin.from("sales_personal_stars").select("id").eq("user_id", user.id);
        existingQuery = columns.door_id !== null
          ? existingQuery.eq("door_id", columns.door_id)
          : existingQuery.eq("verified_customer_id", columns.verified_customer_id!);
        const existing = await existingQuery.maybeSingle();
        if (existing.error) throw existing.error;
        if (!existing.data) {
          ({ error } = await admin.from("sales_personal_stars").insert({ user_id: user.id, ...columns }));
        }
      } else {
        let deleteQuery = admin.from("sales_personal_stars").delete().eq("user_id", user.id);
        deleteQuery = columns.door_id !== null
          ? deleteQuery.eq("door_id", columns.door_id)
          : deleteQuery.eq("verified_customer_id", columns.verified_customer_id!);
        ({ error } = await deleteQuery);
      }
      if (error) throw error;
      return json({ success: true, doorId, starred });
    }

    if (input.action === "toggle_company_priority") {
      if (!isSuper(profile)) return json({ error: "Only Paulie can set company priorities." }, 403);
      const doorId = Number(input.doorId);
      const priority = input.priority === true;
      if (!Number.isSafeInteger(doorId) || doorId === 0 || !(await validSalesTarget(admin, doorId))) {
        return json({ error: "A valid sales target is required." }, 400);
      }
      const columns = targetColumns(doorId);
      let error;
      if (priority) {
        let existingQuery = admin.from("sales_company_priorities").select("id");
        existingQuery = columns.door_id !== null
          ? existingQuery.eq("door_id", columns.door_id)
          : existingQuery.eq("verified_customer_id", columns.verified_customer_id!);
        const existing = await existingQuery.maybeSingle();
        if (existing.error) throw existing.error;
        if (!existing.data) {
          ({ error } = await admin.from("sales_company_priorities").insert({ set_by: user.id, ...columns }));
        }
      } else {
        let deleteQuery = admin.from("sales_company_priorities").delete();
        deleteQuery = columns.door_id !== null
          ? deleteQuery.eq("door_id", columns.door_id)
          : deleteQuery.eq("verified_customer_id", columns.verified_customer_id!);
        ({ error } = await deleteQuery);
      }
      if (error) throw error;
      await addAudit(admin, profile, priority ? "company_priority_set" : "company_priority_cleared", {
        doorId: doorId > 0 ? doorId : null,
        reason: safeReason(input.reason),
        metadata: doorId < 0 ? { verified_customer_id: -doorId } : {},
      });
      return json({ success: true, doorId, priority });
    }

    if (input.action === "set_purchasing_verification") {
      if (!isSuper(profile)) return json({ error: "Only Paulie can verify purchasing truth." }, 403);
      const doorId = Number(input.doorId);
      const verified = input.verified === true;
      if (!Number.isSafeInteger(doorId) || doorId <= 0 || !(await validSalesTarget(admin, doorId))) {
        return json({ error: "A valid licensed door is required." }, 400);
      }
      const existing = await admin
        .from("sales_verified_customer_doors")
        .select("id,retailer_id,active,verification_source")
        .eq("door_id", doorId)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (verified) {
        if (!existing.data) {
          const { error } = await admin.from("sales_verified_customer_doors").insert({
            retailer_id: null,
            door_id: doorId,
            verification_source: "super_master_confirmed",
            verified_by: user.id,
            verified_at: new Date().toISOString(),
            verification_note: safeReason(input.reason) ?? "Explicit Super Master customer verification.",
            active: true,
          });
          if (error) throw error;
        } else if (!existing.data.active) {
          const { error } = await admin
            .from("sales_verified_customer_doors")
            .update({
              active: true,
              verified_by: user.id,
              verified_at: new Date().toISOString(),
              verification_note: safeReason(input.reason) ?? "Explicit Super Master customer re-verification.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.data.id);
          if (error) throw error;
        }
        await addAudit(admin, profile, "purchasing_customer_verified", {
          doorId,
          reason: safeReason(input.reason),
        });
        return json({ success: true, doorId, verified: true });
      }
      if (!existing.data?.active) return json({ success: true, doorId, verified: false });
      if (existing.data.retailer_id !== null) {
        return json({ error: "This customer is verified by the official retailer source and cannot be cleared here." }, 409);
      }
      const { error } = await admin
        .from("sales_verified_customer_doors")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("id", existing.data.id);
      if (error) throw error;
      await addAudit(admin, profile, "purchasing_customer_verification_cleared", {
        doorId,
        reason: safeReason(input.reason),
      });
      return json({ success: true, doorId, verified: false });
    }

    if (input.action === "correct_door") {
      if (!isSuper(profile)) return json({ error: "Only Paulie can correct global door data." }, 403);
      const doorId = Number(input.doorId);
      const status = typeof input.status === "string" ? input.status as DoorStatus : "" as DoorStatus;
      const callbackDate = typeof input.callbackDate === "string" && input.callbackDate ? input.callbackDate : null;
      if (!Number.isSafeInteger(doorId) || doorId === 0 || !(await validSalesTarget(admin, doorId))) {
        return json({ error: "Choose a valid sales target." }, 400);
      }
      if (callbackDate && !DATE_PATTERN.test(callbackDate)) return json({ error: "Use a valid callback date." }, 400);
      if (doorId < 0) {
        const nextCallbackAt = callbackDateToUtc(callbackDate);
        const verifiedCustomerId = -doorId;
        const before = await admin
          .from("sales_verified_customer_doors")
          .select("next_callback_at")
          .eq("id", verifiedCustomerId)
          .single();
        if (before.error) throw before.error;
        const { error } = await admin
          .from("sales_verified_customer_doors")
          .update({ next_callback_at: nextCallbackAt, updated_at: new Date().toISOString() })
          .eq("id", verifiedCustomerId);
        if (error) throw error;
        await addAudit(admin, profile, "verified_customer_callback_corrected", {
          reason: safeReason(input.reason),
          metadata: {
            verified_customer_id: verifiedCustomerId,
            previous_callback_at: before.data.next_callback_at,
            new_callback_at: nextCallbackAt,
          },
        });
        return json({ success: true, doorId, status: "review", nextCallbackAt });
      }
      if (!VALID_STATUSES.has(status)) return json({ error: "Choose a valid door status." }, 400);
      const before = await admin.from("market_doors").select("id,status,next_callback_at").eq("id", doorId).maybeSingle();
      if (before.error) throw before.error;
      if (!before.data) return json({ error: "That licensed door was not found." }, 404);
      const nextCallbackAt = callbackDateToUtc(callbackDate);
      const { error } = await admin.from("market_doors").update({ status, next_callback_at: nextCallbackAt, updated_at: new Date().toISOString() }).eq("id", doorId);
      if (error) throw error;
      await addAudit(admin, profile, "door_corrected", {
        doorId,
        reason: safeReason(input.reason),
        metadata: { previous_status: before.data.status, new_status: status, previous_callback_at: before.data.next_callback_at, new_callback_at: nextCallbackAt },
      });
      return json({ success: true, doorId, status, nextCallbackAt });
    }

    if (input.action === "undo_call") {
      const callId = Number(input.callId);
      if (!Number.isSafeInteger(callId) || callId <= 0) return json({ error: "A valid call is required." }, 400);
      const target = await admin
        .from("call_log")
        .select("door_id,verified_customer_id")
        .eq("id", callId)
        .maybeSingle();
      if (target.error || !target.data) return json({ error: "That call is unavailable." }, 404);
      const isVerifiedCustomerCall = target.data.verified_customer_id !== null;
      const result = isVerifiedCustomerCall
        ? await admin.rpc("undo_sales_verified_customer_call_as_actor", {
            p_call_id: callId,
            p_actor_id: user.id,
            p_actor_name: repName(user, profile),
          })
        : await admin.rpc("undo_sales_call_as_actor", {
            p_call_id: callId,
            p_actor_id: user.id,
            p_actor_name: repName(user, profile),
          });
      if (result.error) return json({ error: "Only the latest eligible call can be undone." }, 409);
      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!row) throw new Error("Undo returned no row.");
      const resultTargetId = isVerifiedCustomerCall
        ? -Number(row.result_verified_customer_id)
        : Number(row.result_door_id);
      if (row.original_rep_id !== user.id) {
        await addAudit(admin, profile, "administrative_call_undo", {
          doorId: resultTargetId > 0 ? resultTargetId : null,
          reason: safeReason(input.reason),
          metadata: {
            call_id: callId,
            original_rep_id: row.original_rep_id,
            ...(resultTargetId < 0 ? { verified_customer_id: -resultTargetId } : {}),
          },
        });
      }
      return json({
        success: true,
        undoneCallId: Number(row.undone_call_id),
        doorId: resultTargetId,
        status: isVerifiedCustomerCall ? "review" : row.door_status as DoorStatus,
        nextCallbackAt: row.result_callback_at as string | null,
      });
    }

    if (input.action !== "log_call") return json({ error: "Invalid sales action." }, 400);
    const doorId = Number(input.doorId);
    const outcome = input.outcome;
    const notes = typeof input.notes === "string" ? input.notes.trim().slice(0, 4000) : "";
    if (!Number.isSafeInteger(doorId) || doorId === 0 || !isSalesOutcome(outcome) || !(await validSalesTarget(admin, doorId))) {
      return json({ error: "Choose a valid sales target and outcome." }, 400);
    }
    const callbackInput = input.callbackDate;
    let callbackDate: string | null;
    if (callbackInput === undefined) callbackDate = defaultCallbackDate(outcome);
    else if (callbackInput === null || callbackInput === "") callbackDate = null;
    else if (typeof callbackInput === "string" && DATE_PATTERN.test(callbackInput)) callbackDate = callbackInput;
    else return json({ error: "Use a valid callback date." }, 400);
    const callbackAt = callbackDateToUtc(callbackDate);
    const logged = doorId > 0
      ? await admin.rpc("log_sales_call", {
          p_door_id: doorId,
          p_rep_id: user.id,
          p_rep_name: repName(user, profile),
          p_outcome: outcome,
          p_notes: notes || null,
          p_callback_at: callbackAt,
          p_called_at: null,
        })
      : await admin.rpc("log_sales_verified_customer_call", {
          p_verified_customer_id: -doorId,
          p_rep_id: user.id,
          p_rep_name: repName(user, profile),
          p_outcome: outcome,
          p_notes: notes || null,
          p_callback_at: callbackAt,
          p_called_at: null,
        });
    if (logged.error || !logged.data) throw logged.error ?? new Error("Call logging returned no row.");
    if (doorId > 0) {
      const door = await admin.from("market_doors").select("status,next_callback_at").eq("id", doorId).single();
      if (door.error) throw door.error;
      return json({ success: true, call: mapCall(logged.data as CallRow), status: door.data.status as DoorStatus, nextCallbackAt: door.data.next_callback_at as string | null });
    }
    return json({ success: true, call: mapCall(logged.data as CallRow), status: "review", nextCallbackAt: callbackAt });
  } catch (error) {
    console.error("Sales action failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "The sales action could not be completed." }, 503);
  }
}

export async function DELETE() {
  const auth = await createSalesAuthClient();
  await auth.auth.signOut();
  return json({ success: true });
}

import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  callbackDateToUtc,
  defaultCallbackDate,
  isSalesOutcome,
  type DoorStatus,
  type SalesAdminEvent,
  type SalesCall,
  type SalesOutcome,
  type SalesRole,
  type SalesSnapshot,
} from "@/lib/sales";
import { createSalesAdminClient, createSalesAuthClient } from "@/lib/supabase/sales-server";
import { browseSales, readSalesActivity, readSalesHistory, readSalesRequests } from "@/lib/sales-browse-server";
import { consumeSalesAttempt, requireSalesClaim, SalesWorkflowError } from "@/lib/sales-workflow-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGE_SIZE = 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const USERNAME_PATTERN = /^[a-z][a-z0-9]{0,31}$/;
const PIN_PATTERN = /^\d{6}$/;
const TEAM_CODE_PATTERN = /^[A-Z0-9]{4,32}$/;
const VALID_STATUSES = new Set<DoorStatus>(["stocked", "prospect", "review", "closed"]);


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




type RepProfile = Readonly<{
  user_id: string;
  username: string;
  display_name: string;
  can_invite: boolean;
  role: SalesRole;
  active: boolean;
  deactivated_at: string | null;
  activity_counters_reset_at: string | null;
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



async function authenticatedUser(): Promise<User | null> {
  const client = await createSalesAuthClient();
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

async function fetchRepProfile(admin: SupabaseClient, userId: string): Promise<RepProfile | null> {
  const { data, error } = await admin
    .from("sales_rep_profiles")
    .select("user_id,username,display_name,can_invite,role,active,deactivated_at,activity_counters_reset_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as RepProfile | null;
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








function salesTargetId(doorId: number | null, verifiedCustomerId: number | null): number {
  if (doorId !== null) return Number(doorId);
  if (verifiedCustomerId !== null) return -Number(verifiedCustomerId);
  throw new Error("Sales call has no target.");
}

function mapCall(row: CallRow, undone: boolean, undoEligible: boolean): SalesCall {
  return {
    id: Number(row.id),
    doorId: salesTargetId(row.door_id, row.verified_customer_id),
    repId: row.rep_id,
    repName: row.rep_name,
    calledAt: row.called_at,
    outcome: row.outcome,
    notes: row.notes,
    callbackAt: row.callback_at,
    undone,
    undoEligible,
  };
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
  const { data, error } = await admin.from("sales_target_directory").select("id").eq("id", targetId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function isVerifiedCustomerTarget(admin: SupabaseClient, targetId: number): Promise<boolean> {
  if (targetId < 0) return true;
  const { data, error } = await admin
    .from("sales_verified_customer_doors")
    .select("id")
    .eq("door_id", targetId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function latestEffectiveDoorCall(admin: SupabaseClient, doorId: number): Promise<CallRow | null> {
  const { data, error } = await admin.rpc("latest_sales_target_call", { p_door_id: doorId });
  if (error) throw error;
  return (data?.[0] as CallRow | undefined) ?? null;
}

export async function GET(request: Request) {
  const user = await authenticatedUser();
  if (!user) return json({ authenticated: false }, 401);
  try {
    const admin = createSalesAdminClient();
    const profile = await fetchRepProfile(admin, user.id);
    if (!profile?.active) return json({ error: "This sales account is inactive." }, 403);
    const params = new URL(request.url).searchParams;
    const resource = params.get("resource");
    if (resource === "activity") {
      if (profile.role === "sales_rep") return json({ error: "Master access is required." }, 403);
      return json({ activity: await readSalesActivity(admin, user.id) });
    }
    if (resource === "admin_log") {
      if (!isSuper(profile)) return json({ error: "Super Master access is required." }, 403);
      return json({ events: await fetchAdminEvents(admin) });
    }
    if (resource === "history") {
      const doorId = Number(params.get("doorId"));
      if (!Number.isSafeInteger(doorId) || !doorId) return json({ error: "Choose a store." }, 400);
      return json(await readSalesHistory(admin, user.id, doorId, Number(params.get("before")) || undefined));
    }
    if (resource === "data_review") {
      if (!isSuper(profile)) return json({ error: "Super Master access is required." }, 403);
      const state = ["AZ", "NY", "OK"].includes(params.get("state") ?? "") ? params.get("state")! : "AZ";
      const [customers, excluded] = await Promise.all([
        admin.from("sales_target_directory").select("id,verified_customer_id,dba_name,street_address,city,zip")
          .eq("state_code", state).is("market_door_id", null).order("city").limit(200),
        admin.from("market_doors").select("id,legal_name,street_address,city,sales_classification_source")
          .eq("state_code", state).eq("sales_business_type", "non_retail").limit(100),
      ]);
      if (customers.error || excluded.error) throw customers.error ?? excluded.error;
      const lookupId = Number(params.get("lookup"));
      const lookup = Number.isSafeInteger(lookupId) && lookupId > 0
        ? await admin.from("market_doors").select("id,legal_name,dba_name,street_address,city,state_code,zip,state_license_id,sales_business_type").eq("id", lookupId).maybeSingle()
        : null;
      const search = (params.get("search") ?? "").replace(/[,()%.*]/g, " ").trim().slice(0, 100);
      const candidates = search.length >= 2 ? await admin.from("market_doors").select("id,legal_name,dba_name,street_address,city,state_code,zip,state_license_id")
        .eq("state_code", state).neq("sales_business_type", "non_retail").or(`legal_name.ilike.%${search}%,dba_name.ilike.%${search}%`).limit(30) : null;
      return json({ customers: customers.data, excluded: excluded.data, lookup: lookup?.data ?? null, candidates: candidates?.data ?? [] });
    }
    if (resource === "verification_requests") return json({ requests: await readSalesRequests(admin, user.id), readOnly: profile.role === "master" });
    const [browse, settings, requests] = await Promise.all([browseSales(admin, user.id, params), isSuper(profile) ? fetchTeamSettings(admin) : Promise.resolve(null), readSalesRequests(admin, user.id)]);
    return json({
      ...browse,
      authenticated: true,
      user: { id: user.id, name: repName(user, profile), username: profile.username, role: profile.role, active: profile.active,
        teamSetupCode: settings ? displayTeamCode(settings.setup_code) : null, onboardingOpen: settings?.onboarding_open ?? null, stats: browse.stats },
      states: ["AZ", "NY", "OK"], activeDispensaryCount: browse.totalTargets, closedCount: 0, verificationRequests: requests,
      doors: browse.doors.map((door) => ({ ...door, pendingVerification: requests.find((item) => item.doorId === door.id && item.status === "pending") ?? null })),
    } satisfies SalesSnapshot);
  } catch (error) {
    console.error("Sales snapshot failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Sales data is temporarily unavailable. Please refresh." }, 503);
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
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Use the Presidential sales page to make changes." }, 403);
  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (input.action === "login" || input.action === "setup_rep") {
    try {
      const admin = createSalesAdminClient();
      const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
      const username = String(input.username ?? "").trim().toLowerCase().slice(0, 64);
      const bucket = (value: string) => createHash("sha256").update(value).digest("hex");
      const limits = await Promise.all([
        consumeSalesAttempt(admin, bucket(`${input.action}:ip:${ip}`), input.action === "login" ? 80 : 15, 300),
        consumeSalesAttempt(admin, bucket(`${input.action}:account:${username}`), 12, 300),
      ]);
      const blocked = limits.find((limit) => !limit.allowed);
      if (blocked) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes, then try again." }, { status: 429, headers: { "Retry-After": String(blocked.retryAfter), "Cache-Control": "no-store" } });
    } catch {
      return json({ error: "Sign-in is temporarily unavailable. Please try again shortly." }, 503);
    }
  }

  if (input.action === "login") {
    const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!USERNAME_PATTERN.test(username) || !PIN_PATTERN.test(password)) {
      return json({ error: "Enter your first-name username and 6-digit PIN." }, 400);
    }
    const admin = createSalesAdminClient();
    const { data, error } = await admin.from("sales_rep_profiles")
      .select("user_id,username,display_name,can_invite,role,active,deactivated_at,activity_counters_reset_at")
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

    if (input.action === "link_customer_source") {
      if (!isSuper(profile)) return json({ error: "Only Paulie can link customer source records." }, 403);
      const { error } = await admin.rpc("link_sales_customer_source", { p_actor_id: user.id, p_customer_id: Number(input.customerId), p_door_id: Number(input.doorId), p_evidence: safeReason(input.evidence) ?? "" });
      return error ? json({ error: "The source link could not be made. Check both records, their state and your evidence." }, 409) : json({ success: true });
    }

    if (input.action === "change_pin") {
      const pin = typeof input.password === "string" ? input.password : "";
      if (!PIN_PATTERN.test(pin)) return json({ error: "Enter an exactly 6-digit PIN." }, 400);
      const auth = await createSalesAuthClient();
      const { error } = await auth.auth.updateUser({ password: pin });
      return error ? json({ error: "Your PIN could not be changed." }, 503) : json({ success: true });
    }

    if (input.action === "reset_my_daily_calls") {
      const resetAt = new Date().toISOString();
      const { error } = await admin
        .from("sales_rep_profiles")
        .update({ activity_counters_reset_at: resetAt, updated_at: resetAt })
        .eq("user_id", user.id);
      if (error) throw error;
      await addAudit(admin, profile, "personal_daily_calls_reset", {
        reason: "User reset today's personal call counter while preserving weekly and monthly reporting.",
        metadata: { reset_at: resetAt },
      });
      return json({ success: true, resetAt });
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

    if (input.action === "submit_verification_request") {
      const doorId = Number(input.doorId);
      const claimedStatus = input.claimedStatus;
      const notes = typeof input.notes === "string" ? input.notes.trim().slice(0, 4000) : "";
      const callbackDate = typeof input.callbackDate === "string" && input.callbackDate ? input.callbackDate : null;
      if (!Number.isSafeInteger(doorId) || doorId <= 0 || !(await validSalesTarget(admin, doorId))) {
        return json({ error: "Choose a valid sales opportunity." }, 400);
      }
      if (claimedStatus !== "already_carries_us" && claimedStatus !== "sold") {
        return json({ error: "Choose ALREADY CARRIES PRESIDENTIAL or SOLD." }, 400);
      }
      if (callbackDate && !DATE_PATTERN.test(callbackDate)) {
        return json({ error: "Use a valid callback date." }, 400);
      }
      if (await isVerifiedCustomerTarget(admin, doorId)) {
        return json({ error: "This is already a verified Presidential customer." }, 403);
      }
      const latestCall = await latestEffectiveDoorCall(admin, doorId);
      if (latestCall?.outcome === "do_not_call") {
        return json({ error: "This store is locked Do Not Call." }, 403);
      }
      const inserted = await admin
        .from("sales_customer_verification_requests")
        .insert({
          door_id: doorId,
          submitted_by: user.id,
          submitted_by_name: profile.display_name,
          claimed_status: claimedStatus,
          notes: notes || null,
          callback_at: callbackDateToUtc(callbackDate),
        })
        .select("id,door_id,submitted_by,submitted_by_name,claimed_status,notes,callback_at,status,submitted_at,decided_at,decision_note")
        .single();
      if (inserted.error?.code === "23505") {
        return json({ error: "A customer-verification request is already pending for this store." }, 409);
      }
      if (inserted.error) throw inserted.error;
      await addAudit(admin, profile, "verification_request_submitted", {
        doorId,
        metadata: { request_id: inserted.data.id, claimed_status: claimedStatus },
      });
      return json({
        success: true,
        requestId: Number(inserted.data.id),
        requestSubmittedAt: inserted.data.submitted_at as string,
        requestCallbackAt: inserted.data.callback_at as string | null,
      });
    }

    if (input.action === "withdraw_verification_request") {
      const requestId = Number(input.requestId);
      if (!Number.isSafeInteger(requestId) || requestId <= 0) {
        return json({ error: "Choose a valid pending request." }, 400);
      }
      const withdrawn = await admin.rpc("withdraw_sales_customer_verification_request", {
        p_request_id: requestId,
        p_actor_id: user.id,
      });
      if (withdrawn.error) {
        return json({ error: "Only your latest eligible pending request can be withdrawn." }, 403);
      }
      return json({ success: true });
    }

    if (input.action === "decide_verification_request") {
      if (!isSuper(profile)) return json({ error: "Only Paulie can decide customer verification requests." }, 403);
      const requestId = Number(input.requestId);
      const decision = input.decision === "approved" ? "approved" : input.decision === "rejected" ? "rejected" : null;
      const decisionNote = safeReason(input.decisionNote);
      if (!Number.isSafeInteger(requestId) || requestId <= 0 || !decision) {
        return json({ error: "Choose a valid pending request and decision." }, 400);
      }
      if (decision === "rejected" && !decisionNote) {
        return json({ error: "A rejection reason is required." }, 400);
      }
      const decided = await admin.rpc("decide_sales_customer_verification_request", {
        p_request_id: requestId,
        p_actor_id: user.id,
        p_decision: decision,
        p_decision_note: decisionNote,
      });
      if (decided.error) return json({ error: "That request is no longer pending." }, 409);
      return json({ success: true });
    }

    if (input.action === "revert_verified_customer" || input.action === "add_verified_customer_note") {
      if (!isSuper(profile)) {
        return json({
          error: input.action === "revert_verified_customer"
            ? "Only Paulie can correct verified customer truth."
            : "Only Paulie can add a customer administrative note.",
        }, 403);
      }
      const verifiedCustomerId = Number(input.verifiedCustomerId);
      const reason = safeReason(input.action === "revert_verified_customer" ? input.reason : input.note);
      if (!Number.isSafeInteger(verifiedCustomerId) || verifiedCustomerId <= 0 || !reason) {
        return json({
          error: input.action === "revert_verified_customer"
            ? "A verified customer and correction reason are required."
            : "A verified customer and note are required.",
        }, 400);
      }
      const corrected = await admin.rpc("correct_sales_verified_customer_as_super", {
        p_verified_customer_id: verifiedCustomerId,
        p_actor_id: user.id,
        p_action: input.action === "revert_verified_customer" ? "revert_to_opportunity" : "add_admin_note",
        p_reason: reason,
      });
      if (corrected.error) return json({ error: "That verified customer is unavailable." }, 409);
      return json({ success: true });
    }

    if (input.action === "reopen_do_not_call") {
      if (!isSuper(profile)) return json({ error: "Only Paulie can reopen a locked Do Not Call store." }, 403);
      const doorId = Number(input.doorId);
      const reason = safeReason(input.reason);
      if (!Number.isSafeInteger(doorId) || doorId <= 0 || !reason) {
        return json({ error: "A valid store and reason are required." }, 400);
      }
      const reopened = await admin.rpc("reopen_sales_do_not_call_as_super", {
        p_door_id: doorId,
        p_actor_id: user.id,
        p_actor_name: profile.display_name,
        p_reason: reason,
      });
      if (reopened.error) return json({ error: "That store is not locked Do Not Call." }, 409);
      return json({ success: true });
    }

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
      if (!Number.isSafeInteger(doorId) || doorId <= 0 || !(await validSalesTarget(admin, doorId))) {
        return json({ error: "Choose a valid white opportunity." }, 400);
      }
      if (await isVerifiedCustomerTarget(admin, doorId)) {
        return json({ error: "Verified Presidential customers are locked from sales changes." }, 403);
      }
      if (callbackDate && !DATE_PATTERN.test(callbackDate)) return json({ error: "Use a valid callback date." }, 400);
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
      const targetId = salesTargetId(target.data.door_id, target.data.verified_customer_id);
      if (await isVerifiedCustomerTarget(admin, targetId)) {
        return json({ error: "Verified Presidential customers are locked from sales changes." }, 403);
      }
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
    if (await isVerifiedCustomerTarget(admin, doorId)) {
      return json({ error: "Verified Presidential customers are locked from sales activity." }, 403);
    }
    if (outcome === "already_carries_us" || outcome === "sold") {
      return json({ error: "Submit a customer-verification request for ALREADY CARRIES or SOLD." }, 400);
    }
    if (doorId < 0) return json({ error: "Verified Presidential customers are locked from sales activity." }, 403);
    const latestCall = await latestEffectiveDoorCall(admin, doorId);
    if (latestCall?.outcome === "do_not_call") {
      return json({ error: "This store is locked Do Not Call." }, 403);
    }
    const callbackInput = input.callbackDate;
    let callbackDate: string | null;
    if (callbackInput === undefined) callbackDate = defaultCallbackDate(outcome);
    else if (callbackInput === null || callbackInput === "") callbackDate = null;
    else if (typeof callbackInput === "string" && DATE_PATTERN.test(callbackInput)) callbackDate = callbackInput;
    else return json({ error: "Use a valid callback date." }, 400);
    const callbackAt = outcome === "do_not_call" ? null : callbackDateToUtc(callbackDate) ?? latestCall?.callback_at ?? null;
    await requireSalesClaim(admin, doorId, user.id);
    const requestId = typeof input.requestId === "string" && /^[0-9a-f-]{36}$/i.test(input.requestId) ? input.requestId : null;
    if (!requestId) return json({ error: "Refresh the page before recording this call." }, 400);
    const logged = await admin.rpc("log_sales_call_once", { p_actor_id: user.id, p_door_id: doorId, p_request_id: requestId, p_outcome: outcome, p_notes: notes || null, p_callback_at: callbackAt });
    if (logged.error || !logged.data) throw logged.error ?? new Error("Call logging returned no row.");
    const door = await admin.from("market_doors").select("status,next_callback_at").eq("id", doorId).single();
    if (door.error) throw door.error;
    return json({
      success: true,
      call: mapCall(logged.data.call as CallRow, false, true),
      status: door.data.status as DoorStatus,
      nextCallbackAt: door.data.next_callback_at as string | null,
    });
  } catch (error) {
    console.error("Sales action failed", error instanceof Error ? error.message : "unknown");
    if (error instanceof SalesWorkflowError) return json({ error: error.message }, error.status);
    return json({ error: "The sales action could not be completed." }, 503);
  }
}

export async function DELETE() {
  const auth = await createSalesAuthClient();
  await auth.auth.signOut();
  return json({ success: true });
}

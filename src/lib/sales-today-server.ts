import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isSalesOutcome, SALES_TIME_ZONE } from "@/lib/sales";
import type { SalesAccountResponse, SalesOperationStatus, TodayBucket, TodayResponse, TodayTask } from "@/lib/sales-today";
import { SalesWorkflowError } from "@/lib/sales-workflow-server";

const STATES = ["AZ", "NY", "OK"];
const BUCKETS: readonly string[] = ["due", "overdue", "today", "upcoming", "attention"];
const RECEIPT_ACTIONS = ["log_call", "save_note", "set_callback", "complete_callback", "request_correction"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function salesReadId(value: string | null, positive = false): number {
  if (!value || !/^-?[1-9]\d*$/.test(value)) throw new SalesWorkflowError("Choose a valid store.", 400);
  const id = Number(value);
  if (!Number.isSafeInteger(id) || (positive && id <= 0)) throw new SalesWorkflowError("Choose a valid store.", 400);
  return id;
}

function readState(params: URLSearchParams): string | null {
  const state = params.get("state") ?? "all";
  if (state !== "all" && !STATES.includes(state)) throw new SalesWorkflowError("Choose AZ, NY, OK, or all states.", 400);
  return state === "all" ? null : state;
}

function readFailure(error: { code?: string; message?: string } | null): never {
  if (error?.code === "22023") throw new SalesWorkflowError(error.message || "Invalid read options.", 400);
  if (error?.code === "42501") throw new SalesWorkflowError("This sales read is not permitted. Refresh your session.", 403);
  if (error?.code === "P0002") throw new SalesWorkflowError("This store is no longer in this view.", 404);
  throw new SalesWorkflowError("Sales data is temporarily unavailable. Please refresh.", 503);
}

type Cursor = { actor: string; state: string | null; bucket: string; tz: string; dueAt: string; id: number };

export async function readSalesToday(admin: SupabaseClient, actorId: string, params: URLSearchParams): Promise<TodayResponse> {
  const state = readState(params);
  const bucket = params.get("bucket") ?? params.get("view") ?? "due";
  if (!BUCKETS.includes(bucket)) throw new SalesWorkflowError("Choose a valid follow-up view.", 400);
  const timeZone = params.get("tz") ?? SALES_TIME_ZONE;
  if (timeZone.length > 80) throw new SalesWorkflowError("Choose a valid time zone.", 400);
  try { new Intl.DateTimeFormat("en-US", { timeZone }).format(); }
  catch { throw new SalesWorkflowError("Choose a valid time zone.", 400); }
  let cursor: Cursor | null = null;
  const encoded = params.get("cursor");
  if (encoded) {
    try {
      if (encoded.length > 1200) throw new Error();
      cursor = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Cursor;
      if (cursor.actor !== actorId || cursor.state !== state || cursor.bucket !== bucket || cursor.tz !== timeZone
        || !Number.isSafeInteger(cursor.id) || cursor.id <= 0 || typeof cursor.dueAt !== "string"
        || !Number.isFinite(Date.parse(cursor.dueAt))) throw new Error();
    } catch { throw new SalesWorkflowError("This follow-up page has expired. Refresh the list.", 400); }
  }
  const { data, error } = await admin.rpc("read_sales_today", {
    p_actor_id: actorId, p_state: state, p_bucket: bucket, p_time_zone: timeZone,
    p_after_due: cursor?.dueAt ?? null, p_after_id: cursor?.id ?? null,
  });
  if (error || !data) readFailure(error);
  const result = data as Omit<TodayResponse, "tasks" | "items" | "nextCursor"> & {
    items: TodayTask[]; next: { dueAt: string; id: number } | null;
  };
  if (!Array.isArray(result.items) || !result.counts || !result.readAt) readFailure(null);
  return {
    contractVersion: 1, generatedAt: result.readAt, readAt: result.readAt, timeZone: result.timeZone,
    dayEnd: result.dayEnd, filters: { state: state ?? "all", bucket: bucket as TodayBucket },
    counts: result.counts, totalMatching: result.totalMatching, tasks: result.items, items: result.items,
    nextCursor: result.next ? Buffer.from(JSON.stringify({ actor: actorId, state, bucket, tz: timeZone,
      dueAt: result.next.dueAt, id: result.next.id } satisfies Cursor)).toString("base64url") : null,
  };
}

export async function readSalesAccount(admin: SupabaseClient, actorId: string, params: URLSearchParams): Promise<SalesAccountResponse> {
  const { data, error } = await admin.rpc("read_sales_account", { p_actor_id: actorId, p_target_id: salesReadId(params.get("doorId")) });
  if (error || !data) readFailure(error);
  return { contractVersion: 1, door: data as SalesAccountResponse["door"] };
}

export async function readSalesArchivedHistory(admin: SupabaseClient, actorId: string, params: URLSearchParams) {
  const before = params.get("before");
  const { data, error } = await admin.rpc("read_sales_archived_history", {
    p_actor_id: actorId, p_door_id: salesReadId(params.get("doorId"), true),
    p_before_id: before ? salesReadId(before, true) : null,
  });
  if (error || !data) readFailure(error);
  return data;
}

export async function readSalesCallbackReview(admin: SupabaseClient, actorId: string, params: URLSearchParams) {
  const before = params.get("afterId");
  const mode = params.get("mode") ?? "legacy";
  if (!["legacy", "mismatch"].includes(mode)) throw new SalesWorkflowError("Choose legacy or mismatch review.", 400);
  const { data, error } = await admin.rpc("read_sales_callback_review", {
    p_actor_id: actorId, p_state: readState(params), p_mode: mode,
    p_after_id: before ? salesReadId(before, true) : null,
  });
  if (error || !data) readFailure(error);
  return data;
}

export async function readSalesOperationStatus(admin: SupabaseClient, actorId: string, params: URLSearchParams): Promise<SalesOperationStatus> {
  const requestId = params.get("requestId") ?? "";
  const action = params.get("action") ?? "";
  if (!UUID.test(requestId) || !RECEIPT_ACTIONS.includes(action)) throw new SalesWorkflowError("Choose a valid saved operation.", 400);
  // Actor/request scope is mandatory. Receipt payload is server-only; emit only the allowlisted fields below.
  const { data, error } = await admin.from("sales_workflow_receipts")
    .select("action,result,created_at,payload").eq("actor_id", actorId).eq("request_id", requestId).maybeSingle();
  if (error) readFailure(error);
  const base = { contractVersion: 1 as const, requestId, action };
  if (!data) return { ...base, status: "unknown", recorded: false };
  if (data.action !== action) throw new SalesWorkflowError("That request belongs to a different operation.", 409);
  const payload = data.payload as Record<string, unknown>;
  const saved = data.result as Record<string, unknown>;
  const doorId = Number(payload.doorId);
  if (!Number.isSafeInteger(doorId) || !doorId) readFailure(null);
  const result: NonNullable<SalesOperationStatus["result"]> = { success: true };
  for (const key of ["noteId", "eventId", "requestId"] as const) {
    if (typeof saved[key] === "number" && Number.isSafeInteger(saved[key]) && saved[key] > 0) result[key] = saved[key];
  }
  if (action === "log_call") {
    const call = saved.call as Record<string, unknown> | undefined;
    if (!call || !Number.isSafeInteger(Number(call.id)) || !isSalesOutcome(call.outcome) || typeof call.called_at !== "string") readFailure(null);
    result.call = { id: Number(call.id), outcome: call.outcome, calledAt: call.called_at };
  }
  return { ...base, status: "recorded", recorded: true, recordedAt: data.created_at, doorId, result };
}

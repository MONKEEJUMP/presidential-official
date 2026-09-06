import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { SalesRole } from "@/lib/sales";
import type { WorkflowAction, WorkflowDetail, WorkflowState } from "@/lib/sales-workflow";
import { createSalesAdminClient, createSalesAuthClient } from "@/lib/supabase/sales-server";

export class SalesWorkflowError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "SalesWorkflowError";
  }
}

export type WorkflowActor = Readonly<{
  user_id: string;
  username: string;
  display_name: string;
  role: SalesRole;
  active: boolean;
}>;

export async function requireSalesWorkflowActor() {
  const auth = await createSalesAuthClient();
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) throw new SalesWorkflowError("Please sign in to continue.", 401);

  const admin = createSalesAdminClient();
  const profile = await admin.from("sales_rep_profiles")
    .select("user_id,username,display_name,role,active")
    .eq("user_id", data.user.id).eq("active", true).maybeSingle();
  if (profile.error) throw new SalesWorkflowError("The sales workspace is temporarily unavailable.", 503);
  if (!profile.data || !["super_master", "master", "sales_rep"].includes(profile.data.role)) {
    throw new SalesWorkflowError("This sales account is not active. Contact Paulie.", 403);
  }
  return { admin, actor: profile.data as WorkflowActor };
}

function rpcFailure(error: { code?: string; message?: string }): never {
  // Only deliberate database guard errors are suitable for the browser.
  const status = error.code === "P0002" ? 404
    : error.code === "42501" ? 403
      : error.code === "P0001" || error.code === "23505" ? 409
        : error.code === "22023" ? 400 : 503;
  throw new SalesWorkflowError(status === 503
    ? "The sales workspace is temporarily unavailable. Your action was not saved."
    : error.message || "That action is not available. Refresh this dispensary and try again.", status);
}

export async function readSalesWorkflow(
  admin: SupabaseClient,
  actorId: string,
  options: { state?: string; doorId?: number; beforeNoteId?: number },
): Promise<WorkflowState | WorkflowDetail> {
  const { data, error } = await admin.rpc("read_sales_workflow", {
    p_actor_id: actorId,
    p_state: options.state ?? null,
    p_door_id: options.doorId ?? null,
    p_before_note_id: options.beforeNoteId ?? null,
  });
  if (error) rpcFailure(error);
  return data as WorkflowState | WorkflowDetail;
}

export async function applySalesWorkflow(admin: SupabaseClient, actorId: string, action: WorkflowAction) {
  const { data, error } = await admin.rpc("apply_sales_workflow", {
    p_actor_id: actorId,
    p_action: action.action,
    p_payload: action,
  });
  if (error) rpcFailure(error);
  return data as { success: true; eventId?: number; noteId?: number; requestId?: number };
}

/** The call-log trigger repeats this check inside the actual write transaction. */
export async function requireSalesClaim(admin: SupabaseClient, doorId: number, userId: string): Promise<void> {
  const { error } = await admin.rpc("acquire_sales_work_claim", {
    p_door_id: doorId, p_actor_id: userId, p_reason: null,
  });
  if (error) rpcFailure(error);
}

/** Buckets must be cryptographic hashes; never persist usernames, IPs or PINs here. */
export async function consumeSalesAttempt(
  admin: SupabaseClient,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (!/^[a-f0-9]{64}$/.test(bucket) || !Number.isInteger(limit) || !Number.isInteger(windowSeconds)) {
    throw new SalesWorkflowError("Sign-in protection is temporarily unavailable.", 503);
  }
  const { data, error } = await admin.rpc("consume_sales_auth_attempt", {
    p_bucket: bucket, p_limit: limit, p_window_seconds: windowSeconds,
  });
  if (error || !data || typeof data.allowed !== "boolean" || typeof data.retryAfter !== "number") {
    throw new SalesWorkflowError("Sign-in protection is temporarily unavailable. Please try again shortly.", 503);
  }
  return { allowed: data.allowed, retryAfter: data.retryAfter };
}

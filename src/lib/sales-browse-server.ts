import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SALES_TIME_ZONE, type SalesCall, type SalesContactProgress, type SalesDoor, type SalesPersonalStats, type SalesRepActivity, type SalesVerificationRequest } from "@/lib/sales";
import type { WorkflowSummary } from "@/lib/sales-workflow";

export type BrowseResult = {
  doors: SalesDoor[];
  stats: SalesPersonalStats;
  purchasingCount: number;
  opportunityCount: number;
  totalMatching: number;
  totalTargets: number;
  unlinkedCustomerCount: number;
  excludedNonRetailCount: number;
  cities: string[];
  page: number;
  pageSize: number;
  workflowSummaries: WorkflowSummary[];
};

function normalizedTimeZone(value: string | null): string {
  const candidate = (value ?? SALES_TIME_ZONE).slice(0, 80);
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return SALES_TIME_ZONE;
  }
}

export async function browseSales(admin: SupabaseClient, userId: string, params: URLSearchParams) {
  const search = (params.get("search") ?? "").slice(0, 160).trim();
  const requestedState = params.get("state") ?? "all";
  // The new search is geographic-global; explicit legacy state requests remain compatible.
  const globalSearch = Boolean(search) && (params.get("geography") === "global" || requestedState === "all");
  const state = globalSearch || !["AZ", "NY", "OK"].includes(requestedState) ? "all" : requestedState;
  const page = Math.min(100000, Math.max(0, Number.parseInt(params.get("page") ?? "0", 10) || 0));
  const filter = params.get("filter") ?? "not_purchasing";
  const queue = params.get("queue") ?? "all";
  const timeZone = normalizedTimeZone(params.get("tz"));
  const { data, error } = await admin.rpc("browse_sales_targets", {
    p_actor_id: userId, p_state: state, p_city: globalSearch ? "" : (params.get("city") ?? "").slice(0, 100),
    p_search: search,
    p_filter: ["all", "purchasing", "not_purchasing"].includes(filter) ? filter : "not_purchasing",
    p_queue: ["all", "stars", "worked", "callbacks", "upcoming"].includes(queue) ? queue : "all",
    p_offset: page * 40, p_limit: 40, p_time_zone: timeZone,
  });
  if (error || !data) throw error ?? new Error("The store list is unavailable.");
  return { ...(data as BrowseResult), selectedState: state, timeZone };
}

export async function readSalesHistory(admin: SupabaseClient, userId: string, doorId: number, beforeId?: number) {
  const [history, progress] = await Promise.all([
    admin.rpc("read_sales_call_history", { p_actor_id: userId, p_target_id: doorId, p_before_id: beforeId ?? null }),
    readSalesContactProgress(admin, userId, doorId),
  ]);
  const { data, error } = history;
  if (error) throw error;
  return { ...(data as { calls: SalesCall[]; hasMore: boolean }), contactProgress: progress };
}

export async function readSalesContactProgress(admin: SupabaseClient, userId: string, doorId: number) {
  const { data, error } = await admin.rpc("read_sales_contact_progress", { p_actor_id: userId, p_target_id: doorId });
  if (error || !data) throw error ?? new Error("The store's contact progress is unavailable.");
  return data as SalesContactProgress;
}

export async function readSalesActivity(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.rpc("sales_activity_summary", { p_actor_id: userId });
  if (error) throw error;
  return (data ?? []) as SalesRepActivity[];
}

export async function readSalesRequests(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.rpc("read_sales_verification_requests", { p_actor_id: userId });
  if (error) throw error;
  return (data ?? []) as SalesVerificationRequest[];
}

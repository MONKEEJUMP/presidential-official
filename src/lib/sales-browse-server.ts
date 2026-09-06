import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SalesCall, SalesDoor, SalesPersonalStats, SalesRepActivity, SalesVerificationRequest } from "@/lib/sales";

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
};

export async function browseSales(admin: SupabaseClient, userId: string, params: URLSearchParams) {
  const state = ["AZ", "NY", "OK"].includes(params.get("state") ?? "") ? params.get("state")! : "AZ";
  const page = Math.min(100000, Math.max(0, Number.parseInt(params.get("page") ?? "0", 10) || 0));
  const filter = params.get("filter") ?? "not_purchasing";
  const queue = params.get("queue") ?? "all";
  const { data, error } = await admin.rpc("browse_sales_targets", {
    p_actor_id: userId, p_state: state, p_city: (params.get("city") ?? "").slice(0, 100),
    p_search: (params.get("search") ?? "").slice(0, 160),
    p_filter: ["all", "purchasing", "not_purchasing"].includes(filter) ? filter : "not_purchasing",
    p_queue: ["all", "stars", "worked", "callbacks", "upcoming"].includes(queue) ? queue : "all",
    p_offset: page * 40, p_limit: 40, p_time_zone: (params.get("tz") ?? "America/Chicago").slice(0, 80),
  });
  if (error || !data) throw error ?? new Error("The store list is unavailable.");
  return { ...(data as BrowseResult), selectedState: state };
}

export async function readSalesHistory(admin: SupabaseClient, userId: string, doorId: number, beforeId?: number) {
  const { data, error } = await admin.rpc("read_sales_call_history", { p_actor_id: userId, p_target_id: doorId, p_before_id: beforeId ?? null });
  if (error) throw error;
  return data as { calls: SalesCall[]; hasMore: boolean };
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

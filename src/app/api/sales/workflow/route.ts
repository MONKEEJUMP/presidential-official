import { NextResponse } from "next/server";

import type { WorkflowAction } from "@/lib/sales-workflow";
import {
  applySalesWorkflow,
  readSalesWorkflow,
  requireSalesWorkflowActor,
  SalesWorkflowError,
} from "@/lib/sales-workflow-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

function failure(error: unknown) {
  return error instanceof SalesWorkflowError
    ? json({ error: error.message }, error.status)
    : json({ error: "The sales workspace is temporarily unavailable. Please try again." }, 503);
}

function id(value: unknown, signed = false): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" && /^-?\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(parsed) || parsed === 0 || (!signed && parsed < 0)) {
    throw new SalesWorkflowError("A valid dispensary or activity is required.");
  }
  return parsed;
}

function text(value: unknown, max: number, required = true): string | null {
  if (value === undefined || value === null || value === "") {
    if (!required) return null;
    throw new SalesWorkflowError("Please enter the requested information.");
  }
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new SalesWorkflowError(`Please use between 1 and ${max} characters.`);
  }
  return value.trim();
}

function requestKey(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) {
    throw new SalesWorkflowError("This action needs a fresh request. Please try again.");
  }
  return value;
}

function parseAction(value: unknown): WorkflowAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new SalesWorkflowError("Invalid action.");
  const input = value as Record<string, unknown>;
  const reason = () => text(input.reason, 1000, false) ?? undefined;
  switch (input.action) {
    case "save_note": return { action: input.action, doorId: id(input.doorId), text: text(input.text, 4000)!, requestId: requestKey(input.requestId) };
    case "undo_note": return { action: input.action, noteId: id(input.noteId) };
    case "set_callback": {
      const dueAt = text(input.dueAt, 60)!;
      if (!/(Z|[+-]\d{2}:\d{2})$/i.test(dueAt) || !Number.isFinite(Date.parse(dueAt))) {
        throw new SalesWorkflowError("Choose a valid callback date and time, including its time zone.");
      }
      return { action: input.action, doorId: id(input.doorId), dueAt: new Date(dueAt).toISOString(), note: text(input.note, 1000, false), requestId: requestKey(input.requestId), reason: reason() };
    }
    case "complete_callback": return { action: input.action, doorId: id(input.doorId), requestId: requestKey(input.requestId), reason: reason() };
    case "undo_callback": return { action: input.action, doorId: id(input.doorId), eventId: id(input.eventId) };
    case "claim": case "release_claim": return { action: input.action, doorId: id(input.doorId), reason: reason() };
    case "request_correction": return { action: input.action, doorId: id(input.doorId, true), reason: text(input.reason, 1000)!, requestId: requestKey(input.requestId) };
    case "resolve_correction": return { action: input.action, requestId: id(input.requestId), decisionNote: text(input.decisionNote, 1000)! };
    default: throw new SalesWorkflowError("Invalid action.");
  }
}

export async function GET(request: Request) {
  try {
    const { admin, actor } = await requireSalesWorkflowActor();
    const query = new URL(request.url).searchParams;
    const doorId = query.has("doorId") ? id(query.get("doorId"), true) : undefined;
    const state = query.get("state")?.toUpperCase();
    if (doorId === undefined && (!state || !/^[A-Z]{2}$/.test(state))) {
      throw new SalesWorkflowError("Select a state or dispensary.");
    }
    const beforeNoteId = query.has("beforeNoteId") ? id(query.get("beforeNoteId")) : undefined;
    return json(await readSalesWorkflow(admin, actor.user_id, { doorId, state, beforeNoteId }));
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new SalesWorkflowError("Invalid request origin.", 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      throw new SalesWorkflowError("Send this action as JSON.");
    }
    const { admin, actor } = await requireSalesWorkflowActor();
    const raw = await request.text();
    if (raw.length > 12_000) throw new SalesWorkflowError("That request is too large.", 413);
    let value: unknown;
    try { value = JSON.parse(raw); } catch { throw new SalesWorkflowError("Invalid action."); }
    const action = parseAction(value);
    return json(await applySalesWorkflow(admin, actor.user_id, action));
  } catch (error) { return failure(error); }
}

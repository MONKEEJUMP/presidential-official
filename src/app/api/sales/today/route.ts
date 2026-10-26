import "server-only";

import { NextResponse } from "next/server";
import { readSalesToday } from "@/lib/sales-today-server";
import { requireSalesWorkflowActor, SalesWorkflowError } from "@/lib/sales-workflow-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store, max-age=0" };
  try {
    const { admin, actor } = await requireSalesWorkflowActor();
    return NextResponse.json(await readSalesToday(admin, actor.user_id, new URL(request.url).searchParams), { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof SalesWorkflowError ? error.message : "Your follow-ups are temporarily unavailable. Please refresh." },
      { status: error instanceof SalesWorkflowError ? error.status : 503, headers });
  }
}

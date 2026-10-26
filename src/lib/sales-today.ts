import type { SalesDoor, SalesOutcome } from "@/lib/sales";

export type TodayBucket = "due" | "overdue" | "today" | "upcoming" | "attention";
export type TodayRestriction = "archived" | "non_retail" | "non_operational" | "verified_customer" | "do_not_call";

export type TodayTask = Readonly<{
  id: string;
  doorId: number;
  marketDoorId: number;
  directoryId: number | null;
  verifiedCustomerId: number | null;
  retailerId: number | null;
  doorKey: string;
  stateCode: string;
  name: string;
  city: string | null;
  dueAt: string;
  note: string | null;
  ownerId: string;
  ownerName: string;
  status: "open";
  lastEventId: number;
  restriction: TodayRestriction | null;
  bucket: Exclude<TodayBucket, "due">;
  primaryAction: "contact" | "view" | "archive";
  inUse: boolean;
}>;

export type TodayResponse = Readonly<{
  contractVersion: 1;
  generatedAt: string;
  readAt: string;
  timeZone: string;
  dayEnd: string;
  filters: { state: string; bucket: TodayBucket };
  counts: { overdue: number; today: number; upcoming: number; needsAttention: number };
  totalMatching: number;
  tasks: readonly TodayTask[];
  items: readonly TodayTask[];
  nextCursor: string | null;
}>;

export type SalesAccountResponse = Readonly<{ contractVersion: 1; door: SalesDoor }>;

export type SalesOperationStatus = Readonly<{
  contractVersion: 1;
  status: "recorded" | "unknown";
  recorded: boolean;
  requestId: string;
  action: string;
  recordedAt?: string;
  doorId?: number;
  result?: {
    success: true;
    noteId?: number;
    eventId?: number;
    requestId?: number;
    call?: { id: number; outcome: SalesOutcome; calledAt: string };
  };
}>;

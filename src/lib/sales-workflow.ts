export type WorkflowNote = Readonly<{
  id: number;
  doorId: number;
  text: string;
  repName: string;
  createdAt: string;
  undone: boolean;
  canUndo: boolean;
}>;

export type WorkflowCallback = Readonly<{
  doorId: number;
  ownerId: string;
  ownerName: string;
  dueAt: string;
  note: string | null;
  status: "open" | "done";
  canManage: boolean;
}>;

export type WorkflowClaim = Readonly<{
  doorId: number;
  ownerId: string | null;
  ownerName: string;
  expiresAt: string;
  mine: boolean;
}>;

export type WorkflowSummary = Readonly<{
  doorId: number;
  hasNotes: boolean;
  notePreview: string | null;
  callback: WorkflowCallback | null;
  claim: WorkflowClaim | null;
}>;

export type WorkflowCorrectionRequest = Readonly<{
  id: number;
  doorId: number;
  storeName: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: "pending" | "resolved";
  decisionNote: string | null;
}>;

export type WorkflowDetail = Readonly<{
  notes: WorkflowNote[];
  callback: WorkflowCallback | null;
  claim: WorkflowClaim | null;
  undoCallbackId: number | null;
  nextNoteCursor: number | null;
}>;

export type WorkflowState = Readonly<{
  summaries: WorkflowSummary[];
  correctionRequests?: WorkflowCorrectionRequest[];
}>;

export type WorkflowAction =
  | { action: "save_note"; doorId: number; text: string; requestId: string }
  | { action: "undo_note"; noteId: number }
  | { action: "set_callback"; doorId: number; dueAt: string; note?: string | null; requestId: string; reason?: string }
  | { action: "complete_callback"; doorId: number; requestId: string; reason?: string }
  | { action: "undo_callback"; doorId: number; eventId: number }
  | { action: "claim"; doorId: number; reason?: string }
  | { action: "release_claim"; doorId: number; reason?: string }
  | { action: "request_correction"; doorId: number; reason: string; requestId: string }
  | { action: "resolve_correction"; requestId: number; decisionNote: string };

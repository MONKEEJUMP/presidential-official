"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatSalesDate, type SalesDoor } from "@/lib/sales";
import type { WorkflowDetail } from "@/lib/sales-workflow";
import styles from "./sales.module.css";

function localInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function websiteHref(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

type Props = {
  door: SalesDoor;
  userId: string;
  isSuper: boolean;
  mode: "log" | "history";
  notes: string;
  externalBusy: boolean;
  onNoteSaved: () => void;
  onAvailability: (available: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
};

export function SalesToolkit({ door, userId, isSuper, mode, notes, externalBusy, onNoteSaved, onAvailability, onDirtyChange, onBusyChange }: Props) {
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dueDraft, setDueDraft] = useState("");
  const [callbackNote, setCallbackNote] = useState("");
  const [correction, setCorrection] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [timeZone, setTimeZone] = useState("your device time");
  const [ownerReason, setOwnerReason] = useState("");
  const requestRef = useRef<{ signature: string; id: string } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const draftRef = useRef(false);
  const callbackDirtyRef = useRef(false);
  const requestBusy = useRef(false);
  const claimRequired = mode === "log" && !door.doNotCallLocked;
  const canEdit = Boolean(detail?.claim?.mine && !door.doNotCallLocked && mode === "log");
  const website = websiteHref(door.website);

  const refresh = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const response = await fetch(`/api/sales/workflow?doorId=${door.id}`, { cache: "no-store", signal: abort.signal });
    const data = await response.json() as WorkflowDetail & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Unable to open the workspace.");
    if (abort.signal.aborted || !mounted.current) return;
    setDetail(data);
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (!callbackDirtyRef.current) {
      setDueDraft(data.callback ? localInput(data.callback.dueAt) : "");
      setCallbackNote(data.callback?.note ?? "");
    }
    onAvailability(mode === "log" && Boolean(data.claim?.mine) && !door.doNotCallLocked);
  }, [door.id, door.doNotCallLocked, mode, onAvailability]);

  useEffect(() => {
    mounted.current = true;
    async function open() {
      try {
        if (claimRequired) {
          const response = await fetch("/api/sales/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim", doorId: door.id }) });
          if (!response.ok) {
            const data = await response.json();
            if (mounted.current) setError(data.error ?? "This dispensary is in use.");
          }
        }
        await refresh();
      } catch (cause) {
        if (mounted.current && !(cause instanceof DOMException && cause.name === "AbortError")) setError(cause instanceof Error ? cause.message : "Workspace unavailable.");
      }
    }
    void open();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void open(); }, 120000);
    return () => { mounted.current = false; controller.current?.abort(); window.clearInterval(timer); };
  }, [userId, door.id, claimRequired, refresh, onAvailability]);

  useEffect(() => {
    callbackDirtyRef.current = dueDraft !== (detail?.callback ? localInput(detail.callback.dueAt) : "") || callbackNote !== (detail?.callback?.note ?? "");
    const dirty = Boolean(correction.trim()) || callbackDirtyRef.current;
    draftRef.current = dirty;
    onDirtyChange(dirty);
  }, [correction, dueDraft, callbackNote, detail, onDirtyChange]);

  async function act(action: Record<string, unknown>, success: string) {
    if (requestBusy.current || externalBusy) return;
    requestBusy.current = true;
    setBusy(true); onBusyChange(true); setError(""); setMessage("");
    const signature = JSON.stringify(action);
    if (requestRef.current?.signature !== signature) requestRef.current = { signature, id: crypto.randomUUID() };
    try {
      const response = await fetch("/api/sales/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...action, requestId: requestRef.current.id }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "The change was not saved.");
      requestRef.current = null;
      if (!mounted.current) return;
      if (action.action === "save_note") onNoteSaved();
      if (action.action === "request_correction") { setCorrection(""); setReportOpen(false); }
      if (["set_callback", "complete_callback", "undo_callback"].includes(String(action.action))) callbackDirtyRef.current = false;
      setMessage(success);
      await refresh();
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "The change was not saved. Your draft is still here.");
    } finally {
      requestBusy.current = false;
      if (mounted.current) { setBusy(false); onBusyChange(false); }
    }
  }

  return <section className={styles.toolkit} aria-label="Dispensary workspace tools">
    <div className={styles.contextDetails}>
      <div><span>Store address</span><p>{[door.streetAddress, door.city, door.stateCode, door.zip].filter(Boolean).join(", ")}</p></div>
      <div><span>Contact</span>{door.email ? <a href={`mailto:${door.email}`}>{door.email}</a> : <p>Email not on file</p>}{website ? <a href={website} target="_blank" rel="noopener noreferrer">Open store website ↗</a> : null}</div>
      {door.extraContacts ? <div><span>Additional contacts from the source list</span><pre>{door.extraContacts}</pre></div> : null}
    </div>
    {detail?.claim && !detail.claim.mine ? <p className={styles.claimNotice}>This dispensary is in use{detail.claim.ownerId ? ` by ${detail.claim.ownerName}` : ""}. You can read its history or move to the next store.</p> : canEdit ? <p className={styles.claimNotice}>Your workspace · other reps are prevented from logging over this active call.</p> : null}
    {isSuper && ((detail?.claim && !detail.claim.mine) || (detail?.callback && detail.callback.ownerId !== userId)) ? <div className={styles.toolkitActions}><label>Owner intervention reason<input value={ownerReason} maxLength={1000} onChange={(event) => setOwnerReason(event.target.value)} placeholder="Required before taking over another rep’s workspace or callback" /></label>{detail?.claim && !detail.claim.mine ? <button type="button" disabled={busy || !ownerReason.trim()} onClick={() => void act({ action: "claim", doorId: door.id, reason: ownerReason }, "Workspace taken over. Your reason was recorded.")}>Take over workspace</button> : null}</div> : null}
    {message ? <p role="status" className={styles.inlineMessage}>{message}</p> : null}
    {error ? <p role="alert" className={styles.inlineError}>{error} <button type="button" onClick={() => void refresh().catch(() => setError("Please reopen this dispensary."))}>Refresh workspace</button></p> : null}
    {mode === "log" ? <div className={styles.toolkitActions}>
      <button type="button" disabled={!canEdit || busy || externalBusy || !notes.trim()} onClick={() => void act({ action: "save_note", doorId: door.id, text: notes }, "Note saved. No call was added to your totals.")}>Save note only</button>
      <small>For a completed call, choose its outcome below. Save note only does not record a call.</small>
    </div> : null}
    <div className={styles.savedNotes}>
      <h3>Team notes</h3>
      {!detail ? <p>Loading notes…</p> : !detail.notes.length ? <p>No saved team notes yet. Call notes appear in call history.</p> : detail.notes.map((note) => <article className={styles.noteEntry} key={note.id}>
        <small>{note.repName} · {formatSalesDate(note.createdAt, true)}{note.undone ? " · UNDONE" : ""}</small>
        <p>{note.text}</p>
        {note.canUndo ? <button disabled={busy || externalBusy} type="button" onClick={() => void act({ action: "undo_note", noteId: note.id }, "Note undone. Its history is preserved.")}>Undo this note</button> : null}
      </article>)}
      {detail?.nextNoteCursor ? <button type="button" onClick={async () => {
        const response = await fetch(`/api/sales/workflow?doorId=${door.id}&beforeNoteId=${detail.nextNoteCursor}`, { cache: "no-store" });
        if (!response.ok) { setError("Older notes could not be loaded."); return; }
        const older = await response.json() as WorkflowDetail;
        if (mounted.current) setDetail((current) => current ? { ...current, notes: [...current.notes, ...older.notes], nextNoteCursor: older.nextNoteCursor } : current);
      }}>Older notes</button> : null}
    </div>
    <div className={styles.callbackForm}>
      <h3>Follow-up</h3>
      {detail?.callback ? <p>{detail.callback.status === "done" ? "Completed" : "Scheduled"} · {new Date(detail.callback.dueAt).toLocaleString()} ({timeZone}) · {detail.callback.ownerName}</p> : <p>No assigned follow-up. Set a time to put this store in your callback list.</p>}
      {mode === "log" && !door.doNotCallLocked ? <>
        <label><span>Callback date and time · {timeZone}</span><input aria-label="Follow-up date and time" type="datetime-local" value={dueDraft} onChange={(event) => setDueDraft(event.target.value)} disabled={!canEdit || busy || Boolean(detail?.callback && !detail.callback.canManage)} /></label>
        <label><span>What to follow up on</span><input maxLength={1000} value={callbackNote} onChange={(event) => setCallbackNote(event.target.value)} disabled={!canEdit || busy || Boolean(detail?.callback && !detail.callback.canManage)} /></label>
        <button type="button" disabled={!canEdit || busy || externalBusy || !dueDraft || Boolean(detail?.callback && !detail.callback.canManage)} onClick={() => {
          const due = new Date(dueDraft);
          if (!Number.isFinite(due.getTime())) { setError("Choose a valid callback date and time."); return; }
          void act({ action: "set_callback", doorId: door.id, dueAt: due.toISOString(), note: callbackNote || null, ...(ownerReason.trim() ? { reason: ownerReason } : {}) }, "Callback saved to your follow-up list.");
        }}>{detail?.callback ? "Reschedule my callback" : "Schedule my callback"}</button>
      </> : null}
      {!door.isPurchasing && detail?.callback?.status === "open" && detail.callback.canManage ? <button type="button" disabled={busy || externalBusy} onClick={() => void act({ action: "complete_callback", doorId: door.id, ...(ownerReason.trim() ? { reason: ownerReason } : {}) }, "Callback marked complete.")}>Mark callback complete</button> : null}
      {detail?.undoCallbackId ? <button type="button" disabled={busy || externalBusy} onClick={() => void act({ action: "undo_callback", doorId: door.id, eventId: detail.undoCallbackId }, "Latest callback change undone.")}>Undo callback change</button> : null}
    </div>
    <div className={styles.toolkitActions}>
      <button type="button" onClick={() => setReportOpen((open) => !open)}>Request a correction</button>
      {reportOpen ? <><label><span>Explain the mistake or incorrect store information for the owner</span><textarea maxLength={1000} value={correction} onChange={(event) => setCorrection(event.target.value)} /></label><button type="button" disabled={busy || externalBusy || !correction.trim()} onClick={() => void act({ action: "request_correction", doorId: door.id, reason: correction }, "Correction request sent to the owner. Store records were not altered.")}>Send correction request</button></> : null}
    </div>
    <details className={styles.welcomeHelp}><summary>Quick call checklist</summary><p>Ask for the purchasing manager. Confirm whether the store already carries Presidential. Record who you spoke with, the result, and the agreed next step. Check the store’s local hours before calling.</p></details>
  </section>;
}

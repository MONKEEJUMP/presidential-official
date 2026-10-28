"use client";

import { type ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatSalesDate, isClosedDoor } from "@/lib/sales";
import type { WorkflowDetail } from "@/lib/sales-workflow";
import type { SalesToolkit } from "./sales-toolkit";
import styles from "./sales-workspace.module.css";

type Props = ComponentProps<typeof SalesToolkit> & { onChanged?: () => void; onPendingChange?: (pending: boolean) => void };
type PendingSave = { id: string; payload: Record<string, unknown>; success: string };
const RECEIPTED = new Set(["save_note", "set_callback", "complete_callback", "request_correction"]);

function localInput(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
}
function safeWebsite(value: string | null) {
  if (!value) return null;
  try { const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export function SalesWorkspaceTools({ door, timeZone, userId, isSuper, mode, notes, notesActionsTarget, externalBusy, onNoteSaved, onNotesLoaded, onAvailability, onDirtyChange, onBusyChange, onChanged, onPendingChange }: Props) {
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dueDraft, setDueDraft] = useState("");
  const [callbackNote, setCallbackNote] = useState("");
  const [correction, setCorrection] = useState("");
  const [ownerReason, setOwnerReason] = useState("");
  const [pending, setPending] = useState<PendingSave | null>(null);
  const [readAt, setReadAt] = useState(0);
  const callbackDirty = useRef(false);
  const mounted = useRef(true);
  const requestBusy = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restricted = door.isPurchasing || door.doNotCallLocked || isClosedDoor(door);
  const canEdit = Boolean(detail?.claim?.mine && !restricted && mode === "log");
  const website = safeWebsite(door.website);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const response = await fetch(`/api/sales/workflow?doorId=${door.id}`, { cache: "no-store", signal: controller.signal });
    const data = await response.json() as WorkflowDetail & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Unable to refresh this account.");
    if (controller.signal.aborted || !mounted.current) return;
    setDetail(data);
    setReadAt(Date.now());
    const latestNote = data.notes.find(note => !note.undone);
    const latestCall = door.lastCall;
    const callIsNewer = latestCall?.notes && !latestCall.undone && (!latestNote || Date.parse(latestCall.calledAt) > Date.parse(latestNote.createdAt));
    onNotesLoaded(callIsNewer ? latestCall!.notes! : latestNote?.text ?? "");
    if (!callbackDirty.current) {
      setDueDraft(data.callback ? localInput(data.callback.dueAt) : "");
      setCallbackNote(data.callback?.note ?? "");
    }
    onAvailability(mode === "log" && Boolean(data.claim?.mine) && !restricted);
  }, [door.id, door.lastCall, mode, restricted, onNotesLoaded, onAvailability]);

  useEffect(() => {
    mounted.current = true;
    async function open() {
      try {
        if (mode === "log" && !restricted) {
          const response = await fetch("/api/sales/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim", doorId: door.id }) });
          if (!response.ok) { const data = await response.json(); if (mounted.current) setError(data.error ?? "Another salesperson is using this account."); }
        }
        await refresh();
      } catch (cause) {
        if (mounted.current && !(cause instanceof DOMException && cause.name === "AbortError")) setError(cause instanceof Error ? cause.message : "Account unavailable.");
      }
    }
    void open();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible" && !requestBusy.current) void open(); }, 120000);
    return () => { mounted.current = false; abortRef.current?.abort(); window.clearInterval(timer); if (feedbackTimer.current) clearTimeout(feedbackTimer.current); };
  }, [door.id, userId, mode, restricted, refresh]);

  useEffect(() => {
    callbackDirty.current = dueDraft !== (detail?.callback ? localInput(detail.callback.dueAt) : "") || callbackNote !== (detail?.callback?.note ?? "");
    onDirtyChange(Boolean(correction.trim()) || callbackDirty.current || Boolean(pending));
  }, [correction, dueDraft, callbackNote, detail, pending, onDirtyChange]);
  useEffect(() => { onPendingChange?.(Boolean(pending)); }, [pending, onPendingChange]);

  function feedback(value: string) {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setMessage(value);
    if (value) feedbackTimer.current = setTimeout(() => { if (mounted.current) setMessage(""); }, 1800);
  }

  async function acknowledge(payload: Record<string, unknown>, success: string) {
    if (!mounted.current) return;
    setPending(null);
    if (payload.action === "save_note") onNoteSaved(String(payload.text));
    if (payload.action === "request_correction") setCorrection("");
    if (["set_callback", "complete_callback", "undo_callback"].includes(String(payload.action))) callbackDirty.current = false;
    feedback(success);
    onChanged?.();
    try { await refresh(); } catch { if (mounted.current) setError("The change was saved. Account details could not refresh; use Refresh account to reload them."); }
  }

  async function act(payload: Record<string, unknown>, success: string) {
    if (requestBusy.current || externalBusy || pending) return;
    requestBusy.current = true;
    setBusy(true); setSavingNote(payload.action === "save_note"); onBusyChange(true); setError(""); setMessage("");
    const receipt = RECEIPTED.has(String(payload.action));
    const id = crypto.randomUUID();
    let status: number | undefined;
    try {
      const response = await fetch("/api/sales/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestId: id }) });
      status = response.status;
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? "This change was not saved.");
      await acknowledge(payload, success);
    } catch (cause) {
      if (mounted.current) {
        if (receipt && (status === undefined || status >= 500 || (status >= 200 && status < 300))) {
          setPending({ id, payload, success });
          setError("The save result is unknown. Your draft is kept. Check save status before leaving or starting another save.");
        } else setError(cause instanceof Error ? cause.message : "This change was not saved. Your draft is still here.");
      }
    } finally {
      requestBusy.current = false;
      if (mounted.current) { setBusy(false); setSavingNote(false); onBusyChange(false); }
    }
  }

  async function checkPendingSave(retry = false) {
    if (!pending || requestBusy.current) return;
    requestBusy.current = true; setBusy(true); onBusyChange(true);
    try {
      const query = new URLSearchParams({ resource: "operation_status", action: String(pending.payload.action), requestId: pending.id });
      const response = await fetch(`/api/sales?${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Save status is unavailable.");
      if (result.recorded) { setError(""); await acknowledge(pending.payload, pending.success); }
      else if (retry) {
        const saved = await fetch("/api/sales/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pending.payload, requestId: pending.id }) });
        const savedResult = await saved.json();
        if (saved.ok && savedResult.success) { setError(""); await acknowledge(pending.payload, pending.success); }
        else setError(`${savedResult.error ?? "Save is not confirmed."} Your original request is retained. Check save status again before leaving.`);
      } else setError("The save is not confirmed yet. Check again or retry the original save. Your original request and draft are retained.");
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "Save status is unavailable. Your draft is still here."); }
    finally { requestBusy.current = false; if (mounted.current) { setBusy(false); onBusyChange(false); } }
  }

  const locked = busy || externalBusy || Boolean(pending);
  const callbackLocked = locked || !canEdit || Boolean(detail?.callback && !detail.callback.canManage);
  const ownerPayload = ownerReason.trim() ? { reason: ownerReason.trim() } : {};
  return <div className={`${styles.workspace} ${styles.toolset}`}>
    {message ? <p className={styles.success} role="status">{message}</p> : null}
    {error ? <div className={styles.error} role="alert"><p>{error}</p>{pending ? <div className={styles.actions}><button type="button" disabled={busy} onClick={() => void checkPendingSave()}>Check save status</button><button type="button" disabled={busy} onClick={() => void checkPendingSave(true)}>Retry original save</button></div> : <button type="button" disabled={busy} onClick={() => void refresh().then(() => setError("")).catch(() => setError("Unable to refresh this account. Your drafts are retained."))}>Refresh account</button>}</div> : null}
    <section className={styles.toolCard} aria-label="Follow-up">
      <h2>{detail?.callback?.status === "open" ? "Open follow-up" : "Follow-up"}</h2>
      {!detail ? <p className={styles.muted}>Loading follow-up…</p> : detail.callback ? <><p className={detail.callback.status === "open" && Date.parse(detail.callback.dueAt) < readAt ? styles.error : styles.muted}>{detail.callback.status === "done" ? "Completed" : Date.parse(detail.callback.dueAt) < readAt ? "Overdue" : "Scheduled"} · {formatSalesDate(detail.callback.dueAt, true, timeZone)} · {timeZone}</p><p className={styles.muted}>Assigned to {detail.callback.ownerName}</p>{detail.callback.note ? <p>{detail.callback.note}</p> : null}</> : <p className={styles.muted}>No follow-up scheduled.</p>}
      {!door.isPurchasing && detail?.callback?.status === "open" && detail.callback.canManage ? <button className={styles.primary} type="button" disabled={locked} onClick={() => void act({ action: "complete_callback", doorId: door.id, ...ownerPayload }, "Follow-up marked complete.")}>Mark follow-up complete</button> : null}
      {mode === "log" && !restricted ? <div>
        <h3>{detail?.callback ? "Reschedule follow-up" : "Set a follow-up"}</h3>
        <div className={styles.stack}>
          <label className={styles.field}><span>Date and time · your device&apos;s local time</span><input type="datetime-local" value={dueDraft} onChange={event => setDueDraft(event.target.value)} disabled={callbackLocked} /></label>
          <label className={styles.field}><span>What should happen next?</span><input value={callbackNote} maxLength={1000} onChange={event => setCallbackNote(event.target.value)} disabled={callbackLocked} /></label>
          <button className={styles.primary} type="button" disabled={callbackLocked || !dueDraft} onClick={() => { const due = new Date(dueDraft); if (!Number.isFinite(due.getTime())) { setError("Choose a valid follow-up date and time."); return; } void act({ action: "set_callback", doorId: door.id, dueAt: due.toISOString(), note: callbackNote || null, ...ownerPayload }, "Follow-up saved."); }}>Save follow-up</button>
        </div>
      </div> : null}
      {detail?.undoCallbackId ? <button type="button" disabled={locked} onClick={() => void act({ action: "undo_callback", doorId: door.id, eventId: detail.undoCallbackId }, "Follow-up change undone.")}>Undo latest follow-up change</button> : null}
    </section>
    {detail?.claim && !detail.claim.mine ? <p className={styles.notice}>In use by {detail.claim.ownerName}. You can read this account or move to the next dispensary.</p> : canEdit ? <p className={styles.badge}>Reserved for you</p> : null}
    {isSuper && ((detail?.claim && !detail.claim.mine) || (detail?.callback && detail.callback.ownerId !== userId)) ? <section className={styles.toolCard}>
      <h3>Owner intervention</h3><label className={styles.field}><span>Required reason</span><input value={ownerReason} maxLength={1000} onChange={event => setOwnerReason(event.target.value)} /></label>
      {detail?.claim && !detail.claim.mine ? <button type="button" disabled={locked || !ownerReason.trim()} onClick={() => void act({ action: "claim", doorId: door.id, reason: ownerReason }, "Workspace taken over. Reason recorded.")}>Take over workspace</button> : null}
    </section> : null}
    {mode === "log" && notesActionsTarget ? createPortal(<button type="button" aria-busy={savingNote} disabled={!canEdit || locked} onClick={() => void act({ action: "save_note", doorId: door.id, text: notes }, "Notes saved.")}>{savingNote ? "Saving…" : "Save notes"}</button>, notesActionsTarget) : null}
    <section className={styles.toolCard} aria-label="Contact details">
      <h2>Contact details</h2><div className={styles.stack}>
        <div><span className={styles.label}>Store address</span><p>{[door.streetAddress, door.city, door.stateCode, door.zip].filter(Boolean).join(", ") || "Address not recorded"}</p></div>
        {door.streetAddress || door.city ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([door.streetAddress, door.city, door.stateCode, door.zip].filter(Boolean).join(", "))}`} target="_blank" rel="noopener noreferrer">Open map ↗</a> : null}
        <div><span className={styles.label}>Source email · buyer not verified</span>{door.email ? <a href={`mailto:${door.email}`}>{door.email}</a> : <p>Email not recorded</p>}</div>
        {website ? <a href={website} target="_blank" rel="noopener noreferrer">Open store website ↗</a> : null}
        {door.extraContacts ? <div><span className={styles.label}>Additional source contacts · roles unverified</span><pre>{door.extraContacts}</pre></div> : null}
        <button type="button" onClick={() => void navigator.clipboard.writeText([door.dbaName || door.legalName, door.phone, door.email, door.streetAddress, door.city, door.stateCode, door.zip].filter(Boolean).join("\n")).then(() => feedback("Contact details copied.")).catch(() => setError("Could not copy. Select the contact text and copy it manually."))}>Copy contact details</button>
      </div>
    </section>
    <section className={styles.toolCard} id="crm-team-notes" aria-label="Saved team notes">
      <h2>Saved team notes</h2><div className={styles.stack}>
        {!detail ? <p className={styles.muted}>Loading notes…</p> : !detail.notes.length ? <p className={styles.muted}>No saved team notes yet.</p> : detail.notes.map(note => <article key={note.id} className={note.undone ? styles.undone : styles.historyEntry}><small>{note.repName} · {formatSalesDate(note.createdAt, true, timeZone)}{note.undone ? " · Undone" : ""}</small><p className={styles.noteText}>{note.text || "Current note cleared"}</p>{note.canUndo ? <button type="button" disabled={locked} onClick={() => void act({ action: "undo_note", noteId: note.id }, "Note undone. History preserved.")}>Undo this note</button> : null}</article>)}
        {detail?.nextNoteCursor ? <button type="button" disabled={locked} onClick={async () => {
          try {
            const response = await fetch(`/api/sales/workflow?doorId=${door.id}&beforeNoteId=${detail.nextNoteCursor}`, { cache: "no-store" });
            if (!response.ok) throw new Error("Older notes could not be loaded.");
            const older = await response.json() as WorkflowDetail;
            if (mounted.current) setDetail(current => current ? { ...current, notes: [...current.notes, ...older.notes], nextNoteCursor: older.nextNoteCursor } : current);
          } catch { if (mounted.current) setError("Older notes could not be loaded."); }
        }}>Older notes</button> : null}
      </div>
    </section>
    <section className={styles.toolCard}>
      <h2>Request a correction</h2>
      <label className={styles.field}><span>Explain the incorrect account information</span><textarea maxLength={1000} value={correction} disabled={locked} onChange={event => setCorrection(event.target.value)} /></label><button type="button" disabled={locked || !correction.trim()} onClick={() => void act({ action: "request_correction", doorId: door.id, reason: correction }, "Correction request sent to the owner.")}>Send correction request</button>
    </section>
  </div>;
}

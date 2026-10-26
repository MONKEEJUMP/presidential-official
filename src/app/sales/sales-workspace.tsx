"use client";

import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";
import { displayDoorName, formatSalesDate, salesOutcome, type SalesOutcome, type SalesVerificationClaim } from "@/lib/sales";
import type { SalesInlineWorkArea } from "./sales-inline-work-area";
import styles from "./sales-workspace.module.css";

type Props = ComponentProps<typeof SalesInlineWorkArea> & { onBeginContact?: () => void; ownerActions?: ReactNode };
const OUTCOMES: readonly SalesOutcome[] = ["no_answer", "left_message", "talked_to_buyer", "interested", "not_interested"];

export function SalesWorkspace({ door, timeZone, mode, notes, canWork, saving, undoing, toolkitBusy, discardWarning,
  positionLabel, hasPrevious, hasNext, message, error, onClose, onPrevious, onNext, onBeginContact,
  onClearOutcome, onOutcome, loggedCall, onNotesChange, onNotesActionsTarget, onUndo, hasMoreHistory,
  onMoreHistory, onWithdrawRequest, tools, onSubmitVerification, onKeepWorking, onDiscard, ownerActions }: Props) {
  const [tab, setTab] = useState<"contact" | "notes" | "history">("contact");
  const [confirm, setConfirm] = useState<SalesVerificationClaim | "do_not_call" | null>(null);
  const keepEditing = useRef<HTMLButtonElement>(null);
  const busy = saving || undoing || toolkitBusy;
  const protectedAccount = door.isPurchasing || door.doNotCallLocked || door.status === "closed";
  const canRecord = mode === "log" && canWork && !protectedAccount;
  const progress = door.contactProgress;
  const latestUndo = door.callHistory.find(call => call.undoEligible && !call.undone);
  const pendingReport = door.pendingVerification;
  const address = [door.streetAddress, door.city, door.stateCode, door.zip].filter(Boolean).join(", ");

  useEffect(() => { if (discardWarning) keepEditing.current?.focus(); }, [discardWarning]);

  function active(outcome: SalesOutcome) {
    if (!progress) return false;
    if (outcome === "no_answer") return progress.noAnswer;
    if (outcome === "left_message") return progress.leftMessage;
    if (outcome === "talked_to_buyer") return progress.spokeToBuyer;
    return progress.disposition === outcome;
  }

  return <section className={styles.workspace} aria-label={`Account: ${displayDoorName(door)}`} onKeyDown={event => {
    if (event.key === "Escape" && !busy && !event.defaultPrevented) {
      event.stopPropagation();
      if (confirm) setConfirm(null); else if (discardWarning) onKeepWorking(); else onClose();
    }
  }}>
    <nav className={styles.backNavigation} aria-label="Account navigation">
      <button type="button" disabled={busy} onClick={onClose}>← Back to list</button>
      <span>{positionLabel}</span>
      <div><button type="button" disabled={busy || !hasPrevious} onClick={onPrevious}>Previous</button><button type="button" disabled={busy || !hasNext} onClick={onNext}>Next dispensary →</button></div>
    </nav>
    {message ? <p className={styles.success} role="status">{message}</p> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.columns}>
      <div className={styles.card}>
        <header className={styles.accountHeader}>
          <h1>{displayDoorName(door)}</h1>
          <p>{[door.city, door.stateCode].filter(Boolean).join(", ")}</p>
          <span className={door.isPurchasing ? styles.customerBadge : door.doNotCallLocked ? styles.dangerBadge : styles.badge}>{door.isPurchasing ? "Verified Presidential customer" : door.doNotCallLocked ? "Do not call" : door.status === "closed" ? "Closed / unavailable" : "Prospect"}</span>
        </header>
        <nav className={styles.tabs} aria-label="Account sections">
          {(["contact", "notes", "history"] as const).map(value => <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{value === "notes" ? "Shared notes" : value === "history" ? "History" : "Contact"}</button>)}
        </nav>
        <div className={styles.contactLine}>
          <div><span className={styles.label}>Phone</span>{door.phone ? <strong className={styles.phone}>{door.phone}</strong> : <p>Phone number not on file</p>}</div>
          <div><span className={styles.label}>Store address</span>{door.streetAddress ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer">{address}</a> : <p>Street address not recorded{address ? ` · ${address}` : ""}</p>}</div>
        </div>
        {tab === "contact" ? <div className={styles.stack}>
          <p className={styles.muted}>Store contact · Buyer not recorded</p>
          {canRecord && door.phone ? <a className={styles.primary} href={`tel:${door.phone}`}>Call store</a> : null}
          {mode === "history" && !protectedAccount && onBeginContact ? <button className={styles.primary} type="button" disabled={busy} onClick={onBeginContact}>Begin contact</button> : null}
          {mode === "log" && !canWork && !protectedAccount ? <p className={styles.notice}>Opening your reserved workspace… If another rep is using this account, you can still read its history.</p> : null}
          {protectedAccount ? <p className={styles.notice}>{door.isPurchasing ? "This customer is protected. Read shared history or request a correction below." : door.doNotCallLocked ? "Calling is restricted for this account. The owner can review the restriction." : "This account is unavailable for prospect calling."}</p> : null}
          <div><span className={styles.label}>Latest shared note</span><p className={styles.noteText}>{notes || "No shared note loaded. Open Shared notes for the complete team record."}</p></div>
          {mode === "log" && !protectedAccount ? <>
            <h2>What happened?</h2>
            <div className={styles.outcomes}>{OUTCOMES.map(outcome => {
              const selected = active(outcome);
              const callId = progress?.activeCallIds?.[outcome];
              return <button type="button" key={outcome} aria-pressed={selected} disabled={busy || (selected ? !callId : !canRecord)} onClick={() => selected ? callId && onClearOutcome(outcome, callId) : onOutcome(outcome)}>{selected ? `Undo ${salesOutcome(outcome).label.toLowerCase()}` : salesOutcome(outcome).label}</button>;
            })}</div>
            <p className={styles.muted}>Call results save separately. Complete or reschedule the open follow-up using its own controls.</p>
          </> : null}
          {loggedCall ? <p className={styles.success} role="status">Call saved · {salesOutcome(loggedCall.outcome).label}</p> : null}
          <button type="button" onClick={() => setTab("notes")}>Add or update shared notes</button>
        </div> : tab === "notes" ? <div className={styles.stack}>
          <h2>Shared notes</h2>
          {mode === "log" && !protectedAccount ? <>
            <label className={styles.field}><span>Notes for this dispensary</span><textarea disabled={busy || !canWork} maxLength={4000} value={notes} onChange={event => onNotesChange(event.target.value)} placeholder="Record the buyer, conversation, and next step…" /></label>
            <div className={styles.noteActions} ref={onNotesActionsTarget} />
            <p className={styles.muted}>Save notes updates the shared team record. Saving an empty field clears the current note and keeps its history.</p>
          </> : <p className={styles.notice}>Saved team notes appear below. Begin contact to edit an eligible prospect account.</p>}
          <a href="#crm-team-notes">View saved team notes ↓</a>
        </div> : <div className={styles.stack}>
          <h2>Call history</h2>
          {door.callHistory.length ? door.callHistory.map(call => <article key={call.id} className={call.undone ? styles.undone : styles.historyEntry}>
            <strong>{salesOutcome(call.outcome).label}{call.undone ? " · Undone" : ""}</strong>
            <p className={styles.muted}>{call.repName} · {formatSalesDate(call.calledAt, true, timeZone)}</p>
            {call.notes ? <p className={styles.noteText}>{call.notes}</p> : null}
            {call.callbackAt ? <p className={styles.muted}>Recorded callback date: {formatSalesDate(call.callbackAt, false, timeZone)}</p> : null}
            {!call.undone && call.undoEligible ? <button type="button" disabled={busy} onClick={() => onUndo(call)}>Undo this call</button> : null}
          </article>) : <p>No call history yet.</p>}
          {hasMoreHistory ? <button type="button" disabled={busy} onClick={onMoreHistory}>Older call history</button> : null}
          <p className={styles.muted}>Historical Undo keeps its existing author and time limits. Request a correction when Undo is unavailable.</p>
        </div>}
        <details className={styles.more}>
          <summary>Customer reports and more actions</summary>
          <div className={styles.stack}>
            {pendingReport ? <div className={styles.notice}><strong>{pendingReport.claimedStatus === "sold" ? "Sold report" : "Already carries report"} · Awaiting owner review</strong>{pendingReport.notes ? <p>{pendingReport.notes}</p> : null}{pendingReport.canWithdraw ? <button type="button" disabled={busy} onClick={() => onWithdrawRequest(pendingReport)}>Withdraw my report</button> : null}</div> : null}
            {(["already_carries_us", "sold", "do_not_call"] as const).map(action => <button type="button" key={action} disabled={busy || !canRecord || (action !== "do_not_call" && door.hasPendingVerification)} onClick={() => setConfirm(action)}>{action === "already_carries_us" ? "Report already carries Presidential" : action === "sold" ? "Report a sale" : "Mark do not call"}</button>)}
            {latestUndo?.outcome === "do_not_call" ? <button type="button" disabled={busy} onClick={() => onUndo(latestUndo)}>Undo my do-not-call action</button> : null}
          </div>
        </details>
        {ownerActions ? <details className={styles.more}><summary>Owner actions</summary><div className={styles.stack}>{ownerActions}</div></details> : null}
      </div>
      <aside className={styles.tools} aria-label="Follow-up and account details">{tools}</aside>
    </div>
    {confirm ? <div className={styles.overlay}><section className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="crm-confirm-title">
      <h2 id="crm-confirm-title">{confirm === "do_not_call" ? "Mark this dispensary do not call?" : confirm === "sold" ? "Submit a sale report?" : "Report that this store carries Presidential?"}</h2>
      <p>{confirm === "do_not_call" ? "This restricts prospect calling for this account." : "The owner will verify this report before the account becomes a protected customer."}</p>
      <div className={styles.actions}><button type="button" onClick={() => setConfirm(null)}>Cancel</button><button className={confirm === "do_not_call" ? styles.danger : styles.primary} type="button" disabled={busy || !canRecord} onClick={() => { const action = confirm; setConfirm(null); if (action === "do_not_call") onOutcome(action); else onSubmitVerification(action); }}>Confirm</button></div>
    </section></div> : null}
    {discardWarning ? <div className={styles.overlay}><section className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="crm-draft-title">
      <h2 id="crm-draft-title">You have unfinished work</h2><p>Keep editing to save your notes or follow-up before leaving this account. If a save result is unknown, return to its save status first.</p>
      <div className={styles.actions}><button className={styles.primary} type="button" ref={keepEditing} onClick={onKeepWorking}>Keep editing</button><button type="button" onClick={onDiscard}>Leave without saving drafts</button></div>
    </section></div> : null}
  </section>;
}


"use client";

import { type ReactNode, useState } from "react";

import {
  formatSalesDate,
  salesOutcome,
  type SalesCall,
  type SalesDoor,
  type SalesOutcome,
  type SalesVerificationClaim,
  type SalesVerificationRequest,
} from "@/lib/sales";

import styles from "./sales.module.css";

const NORMAL_OUTCOMES: readonly SalesOutcome[] = [
  "no_answer",
  "left_message",
  "talked_to_buyer",
  "interested",
  "not_interested",
];

const CUSTOMER_ACTIONS: readonly { action: SalesVerificationClaim | "do_not_call"; label: string }[] = [
  { action: "already_carries_us", label: "ALREADY CARRIES PRESIDENTIAL" },
  { action: "sold", label: "SOLD" },
  { action: "do_not_call", label: "DO NOT CALL" },
];

export function undoActionLabel(call: SalesCall): string {
  return `UNDO ${salesOutcome(call.outcome).label.toUpperCase()}`;
}

type SalesInlineWorkAreaProps = Readonly<{
  door: SalesDoor;
  timeZone: string;
  mode: "log" | "history";
  notes: string;
  callbackDate: string;
  discardWarning: boolean;
  loggedCall: SalesCall | null;
  message: string;
  error: string;
  saving: boolean;
  undoing: boolean;
  canWork: boolean;
  tools: ReactNode;
  toolkitBusy: boolean;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  positionLabel: string;
  onMoreHistory: () => void;
  hasMoreHistory: boolean;
  onNotesChange: (value: string) => void;
  onNotesActionsTarget: (target: HTMLDivElement | null) => void;
  onCallbackChange: (value: string) => void;
  onOutcome: (outcome: SalesOutcome) => void;
  onSubmitVerification: (claim: SalesVerificationClaim) => void;
  onWithdrawRequest: (request: SalesVerificationRequest) => void;
  onUndo: (call: SalesCall) => void;
  onClose: () => void;
  onDiscard: () => void;
  onKeepWorking: () => void;
}>;

export function SalesInlineWorkArea({
  door,
  timeZone,
  mode,
  notes,
  discardWarning,
  message,
  error,
  saving,
  undoing,
  onNotesChange,
  onNotesActionsTarget,
  onOutcome,
  onSubmitVerification,
  onWithdrawRequest,
  onUndo,
  onClose,
  onDiscard,
  onKeepWorking,
  canWork, tools, toolkitBusy, onPrevious, onNext, hasPrevious, hasNext, positionLabel, onMoreHistory, hasMoreHistory,
}: SalesInlineWorkAreaProps) {
  const [confirmation, setConfirmation] = useState<SalesVerificationClaim | "do_not_call" | null>(null);
  const undoableCall = door.callHistory.find((call) => call.undoEligible && !call.undone) ?? null;
  const undoableRequest = door.pendingVerification?.canWithdraw ? door.pendingVerification : null;
  const busy = saving || undoing || toolkitBusy;
  const canRecord = mode === "log" && canWork && !door.isPurchasing && !door.doNotCallLocked;
  const progress = door.contactProgress;
  const progressLabels: string[] = [];
  if (progress?.spokeToBuyer) {
    progressLabels.push("SPOKE TO BUYER");
  } else if (!progress?.disposition) {
    if (progress?.noAnswer) progressLabels.push("NO ANSWER");
    if (progress?.leftMessage) progressLabels.push("LEFT MESSAGE");
  }
  if (progress?.disposition) progressLabels.push(salesOutcome(progress.disposition).label.toUpperCase());
  if (door.doNotCallLocked) progressLabels.push("DO NOT CALL");

  function isActiveOutcome(outcome: SalesOutcome) {
    if (!progress) return true;
    if (outcome === "no_answer") return progress.noAnswer;
    if (outcome === "left_message") return progress.leftMessage;
    if (outcome === "talked_to_buyer") return progress.spokeToBuyer;
    return progress.disposition === outcome;
  }

  function confirmHighImpactAction() {
    if (!confirmation) return;
    const action = confirmation;
    setConfirmation(null);
    if (action === "do_not_call") onOutcome(action);
    else onSubmitVerification(action);
  }

  function actionButtons() {
    return <>
      <div className={styles.normalOutcomes}>
        <span>CALL OUTCOME — CLICK AGAIN TO UNDO</span>
        <div>
          {NORMAL_OUTCOMES.map((outcome) => {
            const saved = undoableCall?.outcome === outcome && isActiveOutcome(outcome) ? undoableCall : null;
            return <button
              className={saved ? styles.outcomeUndo : undefined}
              aria-pressed={Boolean(saved)}
              disabled={busy || (!saved && !canRecord)}
              key={outcome}
              onClick={() => saved ? onUndo(saved) : onOutcome(outcome)}
              type="button"
            >{saved ? undoActionLabel(saved) : salesOutcome(outcome).label}</button>;
          })}
        </div>
      </div>
      <div className={styles.highImpactActions}>
        <span>CUSTOMER STATUS — CONFIRMATION REQUIRED</span>
        <div>
          {CUSTOMER_ACTIONS.map(({ action, label }) => {
            const savedCall = action === "do_not_call" && undoableCall?.outcome === action ? undoableCall : null;
            const savedRequest = undoableRequest?.claimedStatus === action ? undoableRequest : null;
            const canUndo = Boolean(savedCall || savedRequest);
            return <button
              className={`${action === "do_not_call" ? styles.doNotCallAction : ""} ${canUndo ? styles.outcomeUndo : ""}`}
              aria-pressed={canUndo}
              disabled={busy || (!canUndo && (!canRecord || (action !== "do_not_call" && door.hasPendingVerification)))}
              key={action}
              onClick={() => {
                if (savedCall) onUndo(savedCall);
                else if (savedRequest) onWithdrawRequest(savedRequest);
                else setConfirmation(action);
              }}
              type="button"
            >{canUndo ? `UNDO ${label}` : label}</button>;
          })}
        </div>
        {confirmation ? (
          <div className={confirmation === "do_not_call" ? styles.doNotCallConfirmation : styles.customerConfirmation} role="alertdialog" aria-modal="true">
            <strong>
              {confirmation === "do_not_call"
                ? "Mark this dispensary DO NOT CALL?"
                : confirmation === "sold"
                  ? "Report this dispensary as SOLD?"
                  : "Report that this dispensary currently carries Presidential?"}
            </strong>
            <p>{confirmation === "do_not_call"
              ? "This removes it from normal calling activity."
              : "This sends the information to the owner for verification. It does not immediately change verified customer truth."}</p>
            <div>
              <button onClick={() => setConfirmation(null)} type="button">CANCEL</button>
              <button disabled={busy || !canRecord} onClick={confirmHighImpactAction} type="button">
                {confirmation === "do_not_call" ? "CONFIRM DO NOT CALL" : confirmation === "sold" ? "SUBMIT SOLD REPORT" : "SUBMIT ALREADY CARRIES REPORT"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>;
  }

  return (
    <section className={styles.inlineWorkArea} onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented && !busy) { event.stopPropagation(); if (confirmation) setConfirmation(null); else onClose(); } }} aria-label={`${mode === "log" ? "Log result" : "History"} for ${door.dbaName || door.legalName}`}>
      <header className={styles.inlineWorkHeader}>
        <button disabled={busy} onClick={onClose} type="button">← BACK TO LIST</button>
        <div>
          <span>{mode === "log" ? "LOG RESULT" : "CALL HISTORY"}</span>
          <strong>{door.dbaName || door.legalName}</strong>
          {door.phone && canWork && !door.doNotCallLocked ? <a href={`tel:${door.phone}`}>CALL {door.phone}</a> : <span>{door.doNotCallLocked ? "DO NOT CALL — LOCKED" : door.phone ? "Open Log Result to reserve this store before calling" : "Phone number not on file"}</span>}
        </div>
        <button disabled={busy} onClick={onClose} type="button">CLOSE</button>
      </header>
      <nav className={styles.nextNavigation} aria-label="Move through dispensaries">
        <button disabled={busy || !hasPrevious} onClick={onPrevious} type="button">← Previous</button>
        <span>{positionLabel}</span>
        <button disabled={busy || !hasNext} onClick={onNext} type="button">Next dispensary →</button>
      </nav>

      {message ? <p className={styles.inlineMessage} role="status">{message}</p> : null}
      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

      {!discardWarning && progressLabels.length > 0 ? (
        <div className={styles.inlineComposer}>
          {progressLabels.map((label) => (
            <div className={styles.inlineConfirmation} key={label}>
              <strong>{label} SAVED</strong>
            </div>
          ))}
        </div>
      ) : null}

      {discardWarning ? (
        <div className={styles.discardWarning} role="alertdialog" aria-modal="true" aria-labelledby="discard-warning-title">
          <strong id="discard-warning-title">YOU HAVE UNSAVED CALL INFORMATION.</strong>
          <p>DISCARD UNSAVED CHANGES AND CONTINUE?</p>
          <div>
            <button onClick={onKeepWorking} type="button">KEEP WORKING</button>
            <button onClick={onDiscard} type="button">DISCARD AND CONTINUE</button>
          </div>
        </div>
      ) : mode === "history" ? (
        <div className={styles.inlineHistory}>
          <div className={styles.inlineComposer}>{actionButtons()}</div>
          {door.callHistory.length ? door.callHistory.map((call) => (
            <article className={call.undone ? styles.undoneActivity : ""} key={call.id}>
              <div>
                <strong>{salesOutcome(call.outcome).label}</strong>
                {call.undone ? <span className={styles.undoneBadge}>UNDONE</span> : null}
              </div>
              <span>{formatSalesDate(call.calledAt, true, timeZone)} · {call.repName}{new Date(call.calledAt).getTime() < Date.parse("2026-09-02T22:18:00Z") ? " · PRELAUNCH ARCHIVE" : ""}</span>
              {call.callbackAt ? <span>Callback: {formatSalesDate(call.callbackAt, false, timeZone)}</span> : null}
              {call.notes ? <p>{call.notes}</p> : null}
            </article>
          )) : <p>No call activity yet.</p>}
          {hasMoreHistory ? <button type="button" onClick={onMoreHistory}>Older call history</button> : null}
          <small>Undo is available for your latest eligible action for 24 hours. If it is no longer available, use Request a correction below.</small>

          {door.pendingVerification ? (
            <article className={styles.pendingRequestCard}>
              <strong>{door.pendingVerification.claimedStatus === "sold" ? "SOLD REPORT" : "ALREADY CARRIES REPORT"}</strong>
              <span>Submitted {formatSalesDate(door.pendingVerification.submittedAt, true, timeZone)}</span>
              <span>AWAITING OWNER REVIEW</span>
              {door.pendingVerification.notes ? <p>{door.pendingVerification.notes}</p> : null}
            </article>
          ) : null}

          <button className={styles.backToListButton} onClick={onClose} type="button">← BACK TO LIST</button>
        </div>
      ) : (
        <div className={styles.inlineComposer}>
          {door.hasPendingVerification ? (
            <div className={styles.pendingNotice}>
              <strong>AWAITING OWNER REVIEW</strong>
            </div>
          ) : null}

          <div className={styles.alwaysOpenFields}>
            <label>
              <span>Notes</span>
              <textarea
                disabled={busy}
                maxLength={4000}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Write shared notes for this store…"
                value={notes}
              />
            </label>
            <div className={styles.notesActions} ref={onNotesActionsTarget} />
          </div>

          {actionButtons()}
        </div>
      )}
      {tools}
    </section>
  );
}

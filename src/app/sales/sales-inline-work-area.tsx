"use client";

import { useState } from "react";

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

export function undoActionLabel(call: SalesCall): string {
  return `UNDO ${salesOutcome(call.outcome).label.toUpperCase()}`;
}

type SalesInlineWorkAreaProps = Readonly<{
  door: SalesDoor;
  mode: "log" | "history";
  notes: string;
  callbackDate: string;
  discardWarning: boolean;
  loggedCall: SalesCall | null;
  message: string;
  error: string;
  saving: boolean;
  undoing: boolean;
  onNotesChange: (value: string) => void;
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
  mode,
  notes,
  callbackDate,
  discardWarning,
  loggedCall,
  message,
  error,
  saving,
  undoing,
  onNotesChange,
  onCallbackChange,
  onOutcome,
  onSubmitVerification,
  onWithdrawRequest,
  onUndo,
  onClose,
  onDiscard,
  onKeepWorking,
}: SalesInlineWorkAreaProps) {
  const [confirmation, setConfirmation] = useState<SalesVerificationClaim | "do_not_call" | null>(null);
  const undoableCall = door.callHistory.find((call) => call.undoEligible && !call.undone) ?? null;
  const undoableRequest = door.pendingVerification?.canWithdraw ? door.pendingVerification : null;

  function confirmHighImpactAction() {
    if (!confirmation) return;
    const action = confirmation;
    setConfirmation(null);
    if (action === "do_not_call") onOutcome(action);
    else onSubmitVerification(action);
  }

  return (
    <section className={styles.inlineWorkArea} aria-label={`${mode === "log" ? "Log result" : "History"} for ${door.dbaName || door.legalName}`}>
      <header className={styles.inlineWorkHeader}>
        <button onClick={onClose} type="button">← BACK TO LIST</button>
        <div>
          <span>{mode === "log" ? "LOG RESULT" : "CALL HISTORY"}</span>
          <strong>{door.dbaName || door.legalName}</strong>
          {door.phone ? <a href={`tel:${door.phone}`}>CALL {door.phone}</a> : null}
        </div>
        <button onClick={onClose} type="button">CLOSE</button>
      </header>

      {message ? <p className={styles.inlineMessage} role="status">{message}</p> : null}
      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

      {discardWarning ? (
        <div className={styles.discardWarning} role="alertdialog" aria-modal="true" aria-labelledby="discard-warning-title">
          <strong id="discard-warning-title">YOU HAVE UNSAVED CALL INFORMATION.</strong>
          <p>DISCARD IT AND RETURN TO THE LIST?</p>
          <div>
            <button onClick={onKeepWorking} type="button">KEEP WORKING</button>
            <button onClick={onDiscard} type="button">DISCARD AND RETURN</button>
          </div>
        </div>
      ) : mode === "history" ? (
        <div className={styles.inlineHistory}>
          {door.callHistory.length ? door.callHistory.map((call) => (
            <article className={call.undone ? styles.undoneActivity : ""} key={call.id}>
              <div>
                <strong>{salesOutcome(call.outcome).label}</strong>
                {call.undone ? <span className={styles.undoneBadge}>UNDONE</span> : null}
              </div>
              <span>{formatSalesDate(call.calledAt, true)} · {call.repName}</span>
              {call.callbackAt ? <span>Callback: {formatSalesDate(call.callbackAt)}</span> : null}
              {call.notes ? <p>{call.notes}</p> : null}
              {call.undoEligible ? (
                <button disabled={undoing} onClick={() => onUndo(call)} type="button">
                  {undoing ? "UNDOING…" : undoActionLabel(call)}
                </button>
              ) : null}
            </article>
          )) : <p>No call activity yet.</p>}

          {door.pendingVerification ? (
            <article className={styles.pendingRequestCard}>
              <strong>{door.pendingVerification.claimedStatus === "sold" ? "SOLD REPORT" : "ALREADY CARRIES REPORT"}</strong>
              <span>Submitted {formatSalesDate(door.pendingVerification.submittedAt, true)}</span>
              <span>AWAITING PAULIE VERIFICATION</span>
              {door.pendingVerification.notes ? <p>{door.pendingVerification.notes}</p> : null}
              {door.pendingVerification.canWithdraw ? (
                <button onClick={() => onWithdrawRequest(door.pendingVerification!)} type="button">
                  {door.pendingVerification.claimedStatus === "sold" ? "WITHDRAW SOLD REPORT" : "WITHDRAW ALREADY CARRIES REPORT"}
                </button>
              ) : null}
            </article>
          ) : null}

          <button className={styles.backToListButton} onClick={onClose} type="button">← BACK TO LIST</button>
        </div>
      ) : (
        <div className={styles.inlineComposer}>
          {loggedCall ? (
            <div className={styles.inlineConfirmation} role="status">
              <strong>{salesOutcome(loggedCall.outcome).label.toUpperCase()} SAVED</strong>
              {loggedCall.notes ? <p>{loggedCall.notes}</p> : null}
              {loggedCall.callbackAt ? <span>Callback: {formatSalesDate(loggedCall.callbackAt)}</span> : null}
            </div>
          ) : null}
          {door.hasPendingVerification ? (
            <div className={styles.pendingNotice}>
              <strong>AWAITING PAULIE VERIFICATION</strong>
              {door.pendingVerification?.canWithdraw ? (
                <button onClick={() => onWithdrawRequest(door.pendingVerification!)} type="button">
                  {door.pendingVerification.claimedStatus === "sold" ? "WITHDRAW SOLD REPORT" : "WITHDRAW ALREADY CARRIES REPORT"}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className={styles.alwaysOpenFields}>
            <label>
              <span>Notes</span>
              <textarea
                autoFocus
                maxLength={4000}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Write the useful details from this call…"
                value={notes}
              />
            </label>
            <label>
              <span>Callback date</span>
              <input
                onChange={(event) => onCallbackChange(event.target.value)}
                type="date"
                value={callbackDate}
              />
            </label>
          </div>

          <div className={styles.normalOutcomes}>
            <span>CALL OUTCOME — ONE CLICK SAVES EVERYTHING ABOVE</span>
            <div>
              {NORMAL_OUTCOMES.map((outcome) => (
                <button disabled={saving} key={outcome} onClick={() => onOutcome(outcome)} type="button">
                  {salesOutcome(outcome).label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.highImpactActions}>
            <span>CUSTOMER STATUS — CONFIRMATION REQUIRED</span>
            {confirmation ? (
              <div className={confirmation === "do_not_call" ? styles.doNotCallConfirmation : styles.customerConfirmation} role="alertdialog" aria-modal="true">
                <strong>
                  {confirmation === "do_not_call"
                    ? "Mark this dispensary DO NOT CALL?"
                    : confirmation === "sold"
                      ? "Report this dispensary as SOLD?"
                      : "Report that this dispensary currently carries Presidential?"}
                </strong>
                <p>
                  {confirmation === "do_not_call"
                    ? "This removes it from normal calling activity."
                    : "This sends the information to Paulie for verification. It does not immediately change verified customer truth."}
                </p>
                <div>
                  <button onClick={() => setConfirmation(null)} type="button">CANCEL</button>
                  <button disabled={saving} onClick={confirmHighImpactAction} type="button">
                    {confirmation === "do_not_call"
                      ? "CONFIRM DO NOT CALL"
                      : confirmation === "sold"
                        ? "SUBMIT SOLD REPORT"
                        : "SUBMIT ALREADY CARRIES REPORT"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  disabled={saving || door.hasPendingVerification}
                  onClick={() => setConfirmation("already_carries_us")}
                  type="button"
                >
                  ALREADY CARRIES PRESIDENTIAL
                </button>
                <button
                  disabled={saving || door.hasPendingVerification}
                  onClick={() => setConfirmation("sold")}
                  type="button"
                >
                  SOLD
                </button>
                <button
                  className={styles.doNotCallAction}
                  disabled={saving}
                  onClick={() => setConfirmation("do_not_call")}
                  type="button"
                >
                  DO NOT CALL
                </button>
              </div>
            )}
          </div>

          {undoableCall || undoableRequest ? (
            <div className={styles.undoActionStack}>
              <span>UNDO LATEST ACTION</span>
              {undoableRequest ? (
                <button disabled={undoing} onClick={() => onWithdrawRequest(undoableRequest)} type="button">
                  {undoing ? "UNDOING…" : `UNDO ${undoableRequest.claimedStatus === "sold" ? "SOLD REPORT" : "ALREADY CARRIES REPORT"}`}
                </button>
              ) : null}
              {undoableCall ? (
                <button disabled={undoing} onClick={() => onUndo(undoableCall)} type="button">
                  {undoing ? "UNDOING…" : undoActionLabel(undoableCall)}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

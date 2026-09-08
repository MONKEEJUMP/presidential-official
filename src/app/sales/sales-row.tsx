"use client";

import {
  displayDoorName,
  formatSalesDate,
  salesOutcome,
  type SalesDoor,
} from "@/lib/sales";

import styles from "./sales.module.css";

function callbackLabel(value: string | null, timeZone: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

type SalesRowProps = Readonly<{
  door: SalesDoor;
  timeZone: string;
  calledToday: boolean;
  callbackDue: boolean;
  struck: boolean;
  canSetPriority: boolean;
  canCorrectCustomer: boolean;
  openMode: "log" | "history" | null;
  workedByMeToday: boolean;
  onLogResult: (door: SalesDoor) => void;
  onHistory: (door: SalesDoor) => void;
  onTogglePersonalStar: (door: SalesDoor) => void;
  onTogglePriority: (door: SalesDoor) => void;
  onCorrectCustomer: (door: SalesDoor) => void;
  onReopenDoNotCall: (door: SalesDoor) => void;
}>;

export function SalesRow({
  door,
  timeZone,
  calledToday,
  callbackDue,
  struck,
  canSetPriority,
  canCorrectCustomer,
  openMode,
  workedByMeToday,
  onLogResult,
  onHistory,
  onTogglePersonalStar,
  onTogglePriority,
  onCorrectCustomer,
  onReopenDoNotCall,
}: SalesRowProps) {
  const lastCall = door.lastCall;
  const address = [door.streetAddress, door.city, door.stateCode, door.zip]
    .filter(Boolean)
    .join(", ");
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address || displayDoorName(door),
  )}`;
  const className = [
    styles.doorRow,
    door.isPurchasing ? styles.stockedRow : styles.prospectRow,
    door.companyPriority ? styles.priorityRow : "",
    callbackDue && !door.isPurchasing ? styles.callbackRow : "",
    calledToday && !door.isPurchasing ? styles.calledTodayRow : "",
    struck && !door.isPurchasing ? styles.struckRow : "",
    door.doNotCallLocked ? styles.doNotCallRow : "",
  ].filter(Boolean).join(" ");

  return (
    <article className={className}>
      <div className={styles.storeCell}>
        <div className={styles.rowBadges}>
          {door.companyPriority ? <span className={styles.priorityBadge}>★ PRIORITY</span> : null}
          {door.isPurchasing ? <span className={styles.presidentialBadge}>PRESIDENTIAL</span> : null}
          {workedByMeToday ? <span className={styles.myWorkBadge}>MY WORK TODAY</span> : null}
          {door.doNotCallLocked ? <span className={styles.doNotCallBadge}>DO NOT CALL — LOCKED</span> : null}
          {door.hasPendingVerification ? <span className={styles.pendingBadge}>AWAITING OWNER REVIEW</span> : null}
          {calledToday && lastCall && !door.isPurchasing ? (
            <span className={styles.calledBadge}>Called today by {lastCall.repName}</span>
          ) : null}
        </div>

        <div className={styles.storeTitleLine}>
          <strong>{displayDoorName(door)}</strong>
          <button
            aria-label={door.personallyStarred ? "Remove personal star" : "Add personal star"}
            className={door.personallyStarred ? styles.starButtonActive : styles.starButton}
            onClick={() => onTogglePersonalStar(door)}
            title="My star"
            type="button"
          >
            {door.personallyStarred ? "★" : "☆"}
          </button>
          {canSetPriority ? (
            <button
              aria-label={door.companyPriority ? "Clear company priority" : "Set company priority"}
              className={door.companyPriority ? styles.companyStarActive : styles.companyStarButton}
              onClick={() => onTogglePriority(door)}
              title="Company priority"
              type="button"
            >
              P
            </button>
          ) : null}
        </div>

        {door.dbaName && door.legalName && door.dbaName !== door.legalName ? (
          <small>{door.legalName}</small>
        ) : null}
        {!door.isPurchasing && lastCall?.notes ? (
          <p className={styles.notePreview}>{lastCall.notes.split(/\r?\n/, 1)[0]}</p>
        ) : null}
      </div>

      <div className={styles.rowField}>
        <span>City</span>
        <strong>{door.city ?? ""}</strong>
      </div>

      <div className={styles.rowField}>
        <span>Phone</span>
        {door.phone ? door.doNotCallLocked ? <strong>Do not call</strong> : door.isPurchasing ? <a href={`tel:${door.phone}`}>{door.phone}</a> : <button className={styles.phoneAction} onClick={() => onLogResult(door)} type="button" title="Open this store to call">{door.phone}</button> : <strong>Not on file</strong>}
      </div>

      <div className={styles.rowField}>
        <span>Email</span>
        {door.email ? (
          <div className={styles.emailLine}>
            <a href={`mailto:${door.email}`}>{door.email}</a>
            <button onClick={async (event) => { const button = event.currentTarget; try { await navigator.clipboard.writeText(door.email!); button.textContent = "COPIED"; } catch { button.textContent = "SELECT EMAIL TO COPY"; } }} type="button">
              Copy
            </button>
          </div>
        ) : <strong />}
      </div>

      <div className={styles.rowField}>
        <span>Address</span>
        <a href={mapHref} rel="noreferrer" target="_blank">{door.streetAddress || "Open map"}</a>
      </div>

      {door.isPurchasing ? (
        <div className={styles.customerLockCell}>
          <strong>CURRENT PRESIDENTIAL CUSTOMER</strong>
          <button onClick={() => onHistory(door)} type="button">View customer / request correction</button>
          {canCorrectCustomer ? (
            <button onClick={() => onCorrectCustomer(door)} type="button">
              CUSTOMER CORRECTION
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className={styles.rowField}>
            <span>Last called</span>
            <strong>{formatSalesDate(lastCall?.calledAt ?? null, false, timeZone)}</strong>
          </div>

          <div className={styles.rowField}>
            <span>Rep</span>
            <strong>{lastCall?.repName ?? ""}</strong>
          </div>

          <div className={styles.rowField}>
            <span>Outcome</span>
            {lastCall ? (
              <strong className={styles.outcomeBadge}>{salesOutcome(lastCall.outcome).label}</strong>
            ) : <strong />}
          </div>

          <div className={styles.rowField}>
            <span>Callback due</span>
            <strong>{callbackLabel(door.nextCallbackAt, timeZone)}</strong>
          </div>

          <div className={styles.rowActions}>
            {door.doNotCallLocked ? (
              canCorrectCustomer ? (
                <button onClick={() => onReopenDoNotCall(door)} type="button">REOPEN</button>
              ) : <span>LOCKED</span>
            ) : (
              <button className={openMode === "log" ? styles.activeRowAction : undefined} onClick={() => onLogResult(door)} type="button">{openMode === "log" ? "CLOSE LOG RESULT" : "LOG RESULT"}</button>
            )}
            <button className={openMode === "history" ? styles.activeRowAction : undefined} onClick={() => onHistory(door)} type="button">{openMode === "history" ? "CLOSE HISTORY" : "HISTORY"}</button>
          </div>
        </>
      )}
    </article>
  );
}

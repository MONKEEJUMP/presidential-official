"use client";

import {
  SALES_TIME_ZONE,
  displayDoorName,
  formatSalesDate,
  salesOutcome,
  type SalesDoor,
} from "@/lib/sales";

import styles from "./sales.module.css";

function callbackLabel(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SALES_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

type SalesRowProps = Readonly<{
  door: SalesDoor;
  calledToday: boolean;
  callbackDue: boolean;
  closed: boolean;
  struck: boolean;
  canSetPriority: boolean;
  onOpen: (door: SalesDoor) => void;
  onTogglePersonalStar: (door: SalesDoor) => void;
  onTogglePriority: (door: SalesDoor) => void;
}>;

export function SalesRow({
  door,
  calledToday,
  callbackDue,
  closed,
  struck,
  canSetPriority,
  onOpen,
  onTogglePersonalStar,
  onTogglePriority,
}: SalesRowProps) {
  const lastCall = door.lastCall;
  const address = [door.streetAddress, door.city, door.stateCode, door.zip].filter(Boolean).join(", ");
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || displayDoorName(door))}`;
  const className = [
    styles.doorRow,
    door.status === "stocked" ? styles.stockedRow : styles.prospectRow,
    door.companyPriority ? styles.priorityRow : "",
    callbackDue ? styles.callbackRow : "",
    calledToday ? styles.calledTodayRow : "",
    closed ? styles.closedRow : "",
    struck ? styles.struckRow : "",
  ].filter(Boolean).join(" ");

  return (
    <article
      className={className}
      onClick={() => onOpen(door)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(door);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className={styles.storeCell}>
        <div className={styles.rowBadges}>
          {door.companyPriority ? <span className={styles.priorityBadge}>★ PRIORITY</span> : null}
          {door.status === "stocked" ? <span className={styles.presidentialBadge}>PRESIDENTIAL</span> : null}
          {closed ? <span className={styles.closedBadge}>CLOSED</span> : null}
          {calledToday && lastCall ? <span className={styles.calledBadge}>Called today by {lastCall.repName}</span> : null}
        </div>
        <div className={styles.storeTitleLine}>
          <strong>{displayDoorName(door)}</strong>
          <button
            aria-label={door.personallyStarred ? "Remove personal star" : "Add personal star"}
            className={door.personallyStarred ? styles.starButtonActive : styles.starButton}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePersonalStar(door);
            }}
            title="My star"
            type="button"
          >
            {door.personallyStarred ? "★" : "☆"}
          </button>
          {canSetPriority ? (
            <button
              aria-label={door.companyPriority ? "Clear company priority" : "Set company priority"}
              className={door.companyPriority ? styles.companyStarActive : styles.companyStarButton}
              onClick={(event) => {
                event.stopPropagation();
                onTogglePriority(door);
              }}
              title="Company priority"
              type="button"
            >
              P
            </button>
          ) : null}
        </div>
        {door.dbaName && door.legalName && door.dbaName !== door.legalName ? <small>{door.legalName}</small> : null}
        {lastCall?.notes ? <p className={styles.notePreview}>{lastCall.notes.split(/\r?\n/, 1)[0]}</p> : null}
      </div>

      <div className={styles.rowField}>
        <span>City</span>
        <strong>{door.city ?? ""}</strong>
      </div>

      <div className={styles.rowField}>
        <span>Phone</span>
        {door.phone ? <a href={`tel:${door.phone}`} onClick={(event) => event.stopPropagation()}>{door.phone}</a> : <strong />}
      </div>

      <div className={styles.rowField}>
        <span>Email</span>
        {door.email ? (
          <div className={styles.emailLine}>
            <a href={`mailto:${door.email}`} onClick={(event) => event.stopPropagation()}>{door.email}</a>
            <button
              onClick={(event) => {
                event.stopPropagation();
                void navigator.clipboard.writeText(door.email!);
              }}
              type="button"
            >
              COPY
            </button>
          </div>
        ) : <strong />}
      </div>

      <div className={styles.rowField}>
        <span>Address</span>
        <a href={mapHref} onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank">MAPS</a>
      </div>

      <div className={styles.rowField}>
        <span>Last called</span>
        <strong>{formatSalesDate(lastCall?.calledAt ?? null)}</strong>
      </div>

      <div className={styles.rowField}>
        <span>Rep</span>
        <strong>{lastCall?.repName ?? ""}</strong>
      </div>

      <div className={styles.rowField}>
        <span>Outcome</span>
        {lastCall ? <strong className={styles.outcomeBadge}>{salesOutcome(lastCall.outcome).label}</strong> : <strong />}
      </div>

      <div className={styles.rowField}>
        <span>Callback due</span>
        <strong>{callbackLabel(door.nextCallbackAt)}</strong>
      </div>
    </article>
  );
}

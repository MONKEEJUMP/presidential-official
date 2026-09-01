"use client";

import {
  displayDoorName,
  formatSalesDate,
  salesOutcome,
  type SalesDoor,
} from "@/lib/sales";

import styles from "./sales.module.css";

type SalesRowProps = Readonly<{
  door: SalesDoor;
  calledToday: boolean;
  callbackDue: boolean;
  closed: boolean;
  struck: boolean;
  onOpen: (door: SalesDoor) => void;
}>;

export function SalesRow({
  door,
  calledToday,
  callbackDue,
  closed,
  struck,
  onOpen,
}: SalesRowProps) {
  const lastCall = door.lastCall;
  const className = [
    styles.doorRow,
    door.status === "stocked" ? styles.stockedRow : styles.prospectRow,
    callbackDue ? styles.callbackRow : "",
    calledToday ? styles.calledTodayRow : "",
    closed ? styles.closedRow : "",
    struck ? styles.struckRow : "",
  ]
    .filter(Boolean)
    .join(" ");

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
          {door.status === "stocked" ? <span className={styles.presidentialBadge}>PRESIDENTIAL</span> : null}
          {closed ? <span className={styles.closedBadge}>CLOSED</span> : null}
          {calledToday && lastCall ? (
            <span className={styles.calledBadge}>Called today by {lastCall.repName}</span>
          ) : null}
        </div>
        <strong>{displayDoorName(door)}</strong>
        {door.dbaName && door.legalName && door.dbaName !== door.legalName ? (
          <small>{door.legalName}</small>
        ) : null}
      </div>

      <div className={styles.rowField}>
        <span>City</span>
        <strong>{door.city ?? ""}</strong>
      </div>

      <div className={styles.rowField}>
        <span>Phone</span>
        {door.phone ? (
          <a
            href={`tel:${door.phone}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpen(door);
            }}
          >
            {door.phone}
          </a>
        ) : (
          <strong />
        )}
      </div>

      <div className={styles.rowField}>
        <span>Email</span>
        {door.email ? (
          <a href={`mailto:${door.email}`} onClick={(event) => event.stopPropagation()}>
            {door.email}
          </a>
        ) : (
          <strong />
        )}
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
        {lastCall ? (
          <strong className={styles.outcomeBadge}>{salesOutcome(lastCall.outcome).label}</strong>
        ) : (
          <strong />
        )}
      </div>

      <div className={styles.rowField}>
        <span>Callback due</span>
        <strong>{formatSalesDate(door.nextCallbackAt)}</strong>
      </div>
    </article>
  );
}

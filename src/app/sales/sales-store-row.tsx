"use client";

import { displayDoorName, formatSalesDate, salesOutcome, type SalesDoor } from "@/lib/sales";
import ui from "./sales-v2.module.css";

type Props = Readonly<{
  door: SalesDoor; timeZone: string; callbackDue: boolean; calledToday: boolean; struck: boolean;
  canSetPriority: boolean; canCorrectCustomer: boolean; openMode: "log" | "history" | null;
  workedByMeToday: boolean; notePreview: string | null;
  onLogResult: (door: SalesDoor) => void; onHistory: (door: SalesDoor) => void;
  onTogglePersonalStar: (door: SalesDoor) => void; onTogglePriority: (door: SalesDoor) => void;
  onCorrectCustomer: (door: SalesDoor) => void; onReopenDoNotCall: (door: SalesDoor) => void;
}>;

export function SalesStoreRow({ door, timeZone, callbackDue, calledToday, canSetPriority, canCorrectCustomer, workedByMeToday, notePreview, onHistory, onTogglePersonalStar, onTogglePriority, onCorrectCustomer, onReopenDoNotCall }: Props) {
  const lastCall = door.lastCall;
  return <article className={ui.storeRow}>
    <div className={ui.storeSummary}>
      {(door.isPurchasing || door.companyPriority || door.doNotCallLocked || door.hasPendingVerification || workedByMeToday) ? <div className={ui.rowBadges}>
        {door.isPurchasing ? <span className={ui.customerBadge}>Purchasing Presidential</span> : null}
        {door.companyPriority ? <span className={ui.badge}>Company priority</span> : null}
        {door.doNotCallLocked ? <span className={ui.restrictedBadge}>Do not call · Locked</span> : null}
        {door.hasPendingVerification ? <span className={ui.badge}>Owner review pending</span> : null}
        {workedByMeToday ? <span className={ui.badge}>My work today</span> : null}
      </div> : null}
      <h2>{displayDoorName(door)}</h2>
      <p>{[door.city, door.stateCode].filter(Boolean).join(", ")}{lastCall ? ` · ${calledToday ? "Contacted today" : formatSalesDate(lastCall.calledAt, false, timeZone)}` : " · Never contacted"}</p>
      {notePreview ? <p className={ui.notePreview}>{notePreview}</p> : <p className={ui.nextAction}>{door.doNotCallLocked ? "Review account history and restrictions." : door.isPurchasing ? "Verified customer · Account and history available." : callbackDue ? `Follow-up due ${formatSalesDate(door.nextCallbackAt, false, timeZone)}` : door.nextCallbackAt ? `Next follow-up ${formatSalesDate(door.nextCallbackAt, false, timeZone)}` : lastCall ? salesOutcome(lastCall.outcome).label : "Find the right store contact."}</p>}
      {canSetPriority || canCorrectCustomer ? <details className={ui.rowMore}><summary>Account options</summary><div>
        {canSetPriority ? <button type="button" onClick={() => onTogglePriority(door)}>{door.companyPriority ? "Clear company priority" : "Set company priority"}</button> : null}
        {door.isPurchasing && canCorrectCustomer ? <button type="button" onClick={() => onCorrectCustomer(door)}>Customer correction</button> : null}
        {door.doNotCallLocked && canCorrectCustomer ? <button type="button" onClick={() => onReopenDoNotCall(door)}>Reopen do not call</button> : null}
      </div></details> : null}
    </div>
    <div className={ui.storeActions}>
      <button className={door.personallyStarred ? ui.starActive : ui.star} aria-label={door.personallyStarred ? `Remove star from ${displayDoorName(door)}` : `Star ${displayDoorName(door)}`} aria-pressed={door.personallyStarred} type="button" onClick={() => onTogglePersonalStar(door)}>{door.personallyStarred ? "★" : "☆"}</button>
      <button type="button" onClick={() => onHistory(door)}>Open</button>
    </div>
  </article>;
}

"use client";

import { displayDoorName, formatSalesDate, salesOutcome, type SalesDoor } from "@/lib/sales";
import ui from "./sales-v2.module.css";

type Props = Readonly<{
  door: SalesDoor; timeZone: string; callbackDue: boolean; calledToday: boolean;
  workedByMeToday: boolean; notePreview: string | null;
  onOpen: (door: SalesDoor) => void;
  onTogglePersonalStar: (door: SalesDoor) => void;
}>;

export function SalesStoreRow({ door, timeZone, callbackDue, calledToday, workedByMeToday, notePreview, onOpen, onTogglePersonalStar }: Props) {
  const lastCall = door.lastCall;
  const address = [door.streetAddress, door.city, door.stateCode, door.zip].filter(Boolean).join(", ");
  return <article className={ui.storeRow}>
    <button type="button" className={ui.storeOpen} aria-label={`Open ${displayDoorName(door)}`} onClick={() => onOpen(door)}><span>Open</span></button>
    <div className={ui.storeSummary}>
      {(door.isPurchasing || door.companyPriority || door.doNotCallLocked || door.hasPendingVerification || workedByMeToday) ? <div className={ui.rowBadges}>
        {door.isPurchasing ? <span className={ui.customerBadge}>Purchasing Presidential</span> : null}
        {door.companyPriority ? <span className={ui.badge}>Pinned for team</span> : null}
        {door.doNotCallLocked ? <span className={ui.restrictedBadge}>Do not call · Locked</span> : null}
        {door.hasPendingVerification ? <span className={ui.badge}>Owner review pending</span> : null}
        {workedByMeToday ? <span className={ui.badge}>My work today</span> : null}
      </div> : null}
      <h2>{displayDoorName(door)}</h2>
      {door.legalName && door.dbaName && door.legalName !== door.dbaName ? <p>{door.legalName}</p> : null}
      <p>{[door.city, door.stateCode].filter(Boolean).join(", ")}{lastCall ? ` · ${calledToday ? "Contacted today" : formatSalesDate(lastCall.calledAt, false, timeZone)}` : " · Never contacted"}</p>
      <div className={ui.storeContactLine}>
        <div><span>Phone</span><strong>{door.phone || "Phone not recorded"}</strong></div>
        <div><span>Store address</span>{door.streetAddress ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer">{address}</a> : <p>Street address not recorded{address ? ` · ${address}` : ""}</p>}</div>
      </div>
      {notePreview ? <p className={ui.notePreview}>{notePreview}</p> : <p className={ui.nextAction}>{door.doNotCallLocked ? "Review account history and restrictions." : door.isPurchasing ? "Verified customer · Account and history available." : callbackDue ? `Follow-up due ${formatSalesDate(door.nextCallbackAt, false, timeZone)}` : door.nextCallbackAt ? `Next follow-up ${formatSalesDate(door.nextCallbackAt, false, timeZone)}` : lastCall ? salesOutcome(lastCall.outcome).label : "Find the right store contact."}</p>}
    </div>
    <div className={ui.storeActions}>
      <button className={door.personallyStarred ? ui.starActive : ui.star} aria-label={door.personallyStarred ? `Remove star from ${displayDoorName(door)}` : `Star ${displayDoorName(door)}`} aria-pressed={door.personallyStarred} type="button" onClick={() => onTogglePersonalStar(door)}>{door.personallyStarred ? "★" : "☆"}</button>
    </div>
  </article>;
}

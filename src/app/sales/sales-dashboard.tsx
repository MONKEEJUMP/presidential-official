"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  SALES_OUTCOMES,
  chicagoDateKey,
  defaultCallbackDate,
  displayDoorName,
  formatSalesDate,
  isClosedDoor,
  salesOutcome,
  type DoorStatus,
  type SalesCall,
  type SalesDoor,
  type SalesOutcome,
  type SalesSnapshot,
} from "@/lib/sales";

import styles from "./sales.module.css";
import { SalesRow } from "./sales-row";

type ViewMode = "today" | "all";
type LogResponse = Readonly<{
  success?: boolean;
  error?: string;
  call?: SalesCall;
  status?: DoorStatus;
  nextCallbackAt?: string | null;
}>;

const STRUCK_OUTCOMES = new Set<SalesOutcome>(["not_interested", "do_not_call"]);

function calledToday(door: SalesDoor, today: string): boolean {
  return Boolean(door.lastCall && chicagoDateKey(door.lastCall.calledAt) === today);
}

function callbackDue(door: SalesDoor, today: string): boolean {
  return Boolean(door.nextCallbackAt && chicagoDateKey(door.nextCallbackAt) <= today);
}

function struck(door: SalesDoor): boolean {
  return Boolean(door.lastCall && STRUCK_OUTCOMES.has(door.lastCall.outcome));
}

function oldestCallValue(door: SalesDoor): number {
  return door.lastCall ? new Date(door.lastCall.calledAt).getTime() : Number.MIN_SAFE_INTEGER;
}

function compareDoors(left: SalesDoor, right: SalesDoor, today: string): number {
  const rank = (door: SalesDoor) => {
    if (struck(door)) return 5;
    if (isClosedDoor(door)) return 4;
    if (callbackDue(door, today)) return 0;
    if (!door.lastCall) return 1;
    return 2;
  };
  const rankDifference = rank(left) - rank(right);
  if (rankDifference !== 0) return rankDifference;
  if (!left.lastCall && !right.lastCall) {
    return (
      (left.city ?? "").localeCompare(right.city ?? "") ||
      displayDoorName(left).localeCompare(displayDoorName(right))
    );
  }
  return (
    oldestCallValue(left) - oldestCallValue(right) ||
    (left.city ?? "").localeCompare(right.city ?? "") ||
    displayDoorName(left).localeCompare(displayDoorName(right))
  );
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function SalesDashboard({ initiallyAuthenticated }: Readonly<{ initiallyAuthenticated: boolean }>) {
  const [snapshot, setSnapshot] = useState<SalesSnapshot | null>(null);
  const [ready, setReady] = useState(!initiallyAuthenticated);
  const [loadingData, setLoadingData] = useState(false);
  const [pageError, setPageError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("today");
  const [activeDoorId, setActiveDoorId] = useState<number | null>(null);
  const [callStartedAt, setCallStartedAt] = useState<Date | null>(null);
  const [advancedLog, setAdvancedLog] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<SalesOutcome | null>(null);
  const [notes, setNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [savingCall, setSavingCall] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [loggedCall, setLoggedCall] = useState<SalesCall | null>(null);
  const [nextDoor, setNextDoor] = useState<SalesDoor | null>(null);

  const loadSnapshot = useCallback(async (state?: string) => {
    setLoadingData(true);
    setPageError("");
    try {
      const query = state ? `?state=${encodeURIComponent(state)}` : "";
      const response = await fetch(`/api/sales${query}`, { cache: "no-store" });
      if (response.status === 401) {
        setSnapshot(null);
        return;
      }
      const payload = (await response.json()) as SalesSnapshot & { error?: string };
      if (!response.ok || !payload.authenticated) {
        throw new Error(payload.error ?? "Sales data is temporarily unavailable.");
      }
      setSnapshot(payload);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Sales data is temporarily unavailable.");
    } finally {
      setReady(true);
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const today = chicagoDateKey();
  const searchedDoors = useMemo(() => {
    if (!snapshot) return [];
    const needle = search.trim().toLowerCase();
    if (!needle) return [...snapshot.doors];
    return snapshot.doors.filter((door) =>
      [door.dbaName, door.legalName, door.city]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    );
  }, [search, snapshot]);

  const visibleDoors = useMemo(() => {
    const sorted = [...searchedDoors].sort((left, right) => compareDoors(left, right, today));
    if (view === "all") return sorted;
    const eligible = sorted.filter(
      (door) => !isClosedDoor(door) && !calledToday(door, today),
    );
    const due = eligible.filter((door) => callbackDue(door, today));
    const dueIds = new Set(due.map((door) => door.id));
    const neverCalled = eligible
      .filter((door) => !door.lastCall && door.status !== "stocked" && !dueIds.has(door.id))
      .sort(
        (left, right) =>
          (left.city ?? "").localeCompare(right.city ?? "") ||
          displayDoorName(left).localeCompare(displayDoorName(right)),
      )
      .slice(0, 15);
    return [...due, ...neverCalled].sort((left, right) => compareDoors(left, right, today));
  }, [searchedDoors, today, view]);

  const activeDoor = snapshot?.doors.find((door) => door.id === activeDoorId) ?? null;

  function openDoor(door: SalesDoor) {
    setActiveDoorId(door.id);
    setCallStartedAt(new Date());
    setAdvancedLog(false);
    setSelectedOutcome(null);
    setNotes("");
    setCallbackDate("");
    setPanelError("");
    setLoggedCall(null);
    setNextDoor(null);
  }

  function closeDoor() {
    setActiveDoorId(null);
    setLoggedCall(null);
    setPanelError("");
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loggingIn) return;
    const form = new FormData(event.currentTarget);
    setLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Login failed.");
      await loadSnapshot();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await fetch("/api/sales", { method: "DELETE" });
    setSnapshot(null);
    closeDoor();
  }

  function chooseAdvancedOutcome(outcome: SalesOutcome) {
    setSelectedOutcome(outcome);
    setCallbackDate(defaultCallbackDate(outcome) ?? "");
    setPanelError("");
  }

  async function logCall(outcome: SalesOutcome, custom: boolean) {
    if (!activeDoor || savingCall) return;
    const currentIndex = visibleDoors.findIndex((door) => door.id === activeDoor.id);
    const followingDoor = currentIndex >= 0 ? visibleDoors[currentIndex + 1] ?? null : null;
    setSavingCall(true);
    setPanelError("");
    try {
      const body: Record<string, unknown> = {
        action: "log_call",
        doorId: activeDoor.id,
        outcome,
        notes: custom ? notes : "",
      };
      if (custom) body.callbackDate = callbackDate || null;
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as LogResponse;
      if (!response.ok || !payload.success || !payload.call || !payload.status) {
        throw new Error(payload.error ?? "The call could not be logged.");
      }
      setSnapshot((current) =>
        current
          ? {
              ...current,
              stockedCount:
                activeDoor.status !== "stocked" && payload.status === "stocked"
                  ? current.stockedCount + 1
                  : current.stockedCount,
              doors: current.doors.map((door) =>
                door.id === activeDoor.id
                  ? {
                      ...door,
                      status: payload.status!,
                      nextCallbackAt: payload.nextCallbackAt ?? null,
                      lastCall: payload.call!,
                      callHistory: [payload.call!, ...door.callHistory],
                    }
                  : door,
              ),
            }
          : current,
      );
      setLoggedCall(payload.call);
      setNextDoor(followingDoor);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The call could not be logged.");
    } finally {
      setSavingCall(false);
    }
  }

  function exportCsv() {
    if (!snapshot) return;
    const headers = [
      "Store Name",
      "DBA",
      "License Number",
      "Street Address",
      "City",
      "State",
      "Zip",
      "Phone",
      "Email",
      "Website",
      "Status",
      "Operational Status",
      "Last Called Date",
      "Rep Name",
      "Last Outcome",
      "Callback Due",
    ];
    const rows = visibleDoors.map((door) => [
      displayDoorName(door),
      door.dbaName,
      door.stateLicenseId,
      door.streetAddress,
      door.city,
      door.stateCode,
      door.zip,
      door.phone,
      door.email,
      door.website,
      door.status,
      door.operationalStatus,
      door.lastCall?.calledAt ?? "",
      door.lastCall?.repName ?? "",
      door.lastCall ? salesOutcome(door.lastCall.outcome).label : "",
      door.nextCallbackAt ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `presidential-sales-${snapshot.selectedState}-${view}-${today}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) {
    return <main className={styles.loginPage}><p>Opening Presidential Sales…</p></main>;
  }

  if (!snapshot) {
    return (
      <main className={styles.loginPage}>
        <form className={styles.loginCard} onSubmit={login}>
          <span>PRESIDENTIAL INTERNAL</span>
          <h1>SALES LOGIN</h1>
          <p>Owner-created rep accounts only. There is no public signup.</p>
          <label>
            <span>First name</span>
            <input
              autoCapitalize="none"
              autoComplete="username"
              maxLength={32}
              name="username"
              pattern="[A-Za-z][A-Za-z0-9]*"
              placeholder="paulie"
              required
              type="text"
            />
          </label>
          <label>
            <span>6-digit PIN</span>
            <input
              autoComplete="current-password"
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              name="password"
              pattern="[0-9]{6}"
              required
              type="password"
            />
          </label>
          <button disabled={loggingIn} type="submit">
            {loggingIn ? "SIGNING IN…" : "SIGN IN"}
          </button>
          {loginError || pageError ? <p className={styles.errorMessage}>{loginError || pageError}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className={styles.salesPage}>
      <header className={styles.salesHeader}>
        <div>
          <span>PRESIDENTIAL INTERNAL</span>
          <h1>SALES DOORS</h1>
        </div>
        <div className={styles.repIdentity}>
          <span>{snapshot.user.name}</span>
          <button onClick={() => void logout()} type="button">SIGN OUT</button>
        </div>
      </header>

      <section className={styles.commandBar} aria-label="Sales list controls">
        <label>
          <span>State</span>
          <select
            disabled={loadingData}
            onChange={(event) => void loadSnapshot(event.target.value)}
            value={snapshot.selectedState}
          >
            {snapshot.states.map((state) => <option key={state}>{state}</option>)}
          </select>
        </label>
        <label className={styles.searchControl}>
          <span>Search store or city</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Start typing…"
            type="search"
            value={search}
          />
        </label>
        <div className={styles.viewToggle} aria-label="Sales list view">
          <button className={view === "today" ? styles.activeToggle : ""} onClick={() => setView("today")} type="button">TODAY</button>
          <button className={view === "all" ? styles.activeToggle : ""} onClick={() => setView("all")} type="button">ALL</button>
        </div>
        <button className={styles.exportButton} onClick={exportCsv} type="button">EXPORT CSV</button>
      </section>

      <section className={styles.countLine} aria-live="polite">
        <strong>In {snapshot.stockedCount} of {snapshot.licensedDoorCount} licensed doors</strong>
        <span>{visibleDoors.length} shown · {view.toUpperCase()}{search ? ` · “${search}”` : ""}</span>
      </section>

      {pageError ? <p className={styles.errorMessage}>{pageError}</p> : null}

      <section className={styles.doorList} aria-busy={loadingData} aria-label="Licensed dispensary doors">
        {visibleDoors.map((door) => (
          <SalesRow
            callbackDue={callbackDue(door, today)}
            calledToday={calledToday(door, today)}
            closed={isClosedDoor(door)}
            door={door}
            key={door.id}
            onOpen={openDoor}
            struck={struck(door)}
          />
        ))}
        {visibleDoors.length === 0 ? <p className={styles.emptyState}>No doors match this view.</p> : null}
      </section>

      {activeDoor ? (
        <aside className={styles.callPanel} aria-label={`Call log for ${displayDoorName(activeDoor)}`}>
          <div className={styles.panelHeader}>
            <div>
              <span>{activeDoor.stateCode} · {activeDoor.stateLicenseId || "NO LICENSE ID"}</span>
              <h2>{displayDoorName(activeDoor)}</h2>
              <p>{[activeDoor.streetAddress, activeDoor.city, activeDoor.stateCode, activeDoor.zip].filter(Boolean).join(" · ")}</p>
            </div>
            <button aria-label="Close call panel" onClick={closeDoor} type="button">×</button>
          </div>

          {activeDoor.phone ? <a className={styles.actionLink} href={`tel:${activeDoor.phone}`}>CALL {activeDoor.phone}</a> : null}
          {activeDoor.email ? <a className={styles.actionLink} href={`mailto:${activeDoor.email}`}>EMAIL {activeDoor.email}</a> : null}
          {activeDoor.extraContacts ? (
            <div className={styles.extraContacts}><span>Extra contacts</span><pre>{activeDoor.extraContacts}</pre></div>
          ) : null}

          {loggedCall ? (
            <div className={styles.loggedState} role="status">
              <strong>CALL LOGGED</strong>
              <span>{salesOutcome(loggedCall.outcome).label} · {formatSalesDate(loggedCall.calledAt, true)}</span>
              {nextDoor ? (
                <button onClick={() => openDoor(nextDoor)} type="button">NEXT: {displayDoorName(nextDoor)}</button>
              ) : (
                <button onClick={closeDoor} type="button">BACK TO LIST</button>
              )}
            </div>
          ) : (
            <div className={styles.logComposer}>
              <div className={styles.callClock}>
                <span>Call started</span>
                <strong>{callStartedAt ? formatSalesDate(callStartedAt.toISOString(), true) : "Now"}</strong>
              </div>
              <p>Tap an outcome to log immediately.</p>
              <div className={styles.outcomeGrid}>
                {SALES_OUTCOMES.map((outcome) => (
                  <button
                    className={selectedOutcome === outcome.value ? styles.selectedOutcome : ""}
                    disabled={savingCall}
                    key={outcome.value}
                    onClick={() => advancedLog ? chooseAdvancedOutcome(outcome.value) : void logCall(outcome.value, false)}
                    type="button"
                  >
                    {outcome.label}
                  </button>
                ))}
              </div>

              <button
                className={styles.advancedToggle}
                onClick={() => {
                  setAdvancedLog((current) => !current);
                  setSelectedOutcome(null);
                  setCallbackDate("");
                }}
                type="button"
              >
                {advancedLog ? "CANCEL NOTES / CALLBACK" : "ADD NOTES OR CHANGE CALLBACK"}
              </button>

              {advancedLog ? (
                <div className={styles.advancedFields}>
                  <label>
                    <span>Notes</span>
                    <textarea maxLength={4000} onChange={(event) => setNotes(event.target.value)} value={notes} />
                  </label>
                  <label>
                    <span>Callback date</span>
                    <input onChange={(event) => setCallbackDate(event.target.value)} type="date" value={callbackDate} />
                  </label>
                  <button
                    disabled={!selectedOutcome || savingCall}
                    onClick={() => selectedOutcome ? void logCall(selectedOutcome, true) : undefined}
                    type="button"
                  >
                    {savingCall ? "LOGGING…" : selectedOutcome ? `LOG ${salesOutcome(selectedOutcome).label.toUpperCase()}` : "CHOOSE AN OUTCOME"}
                  </button>
                </div>
              ) : null}
              {panelError ? <p className={styles.errorMessage}>{panelError}</p> : null}
            </div>
          )}

          <section className={styles.callHistory}>
            <h3>CALL HISTORY</h3>
            {activeDoor.callHistory.length > 0 ? activeDoor.callHistory.map((call) => (
              <article key={call.id}>
                <strong>{salesOutcome(call.outcome).label}</strong>
                <span>{formatSalesDate(call.calledAt, true)} · {call.repName}</span>
                {call.callbackAt ? <span>Callback: {formatSalesDate(call.callbackAt)}</span> : null}
                {call.notes ? <p>{call.notes}</p> : null}
              </article>
            )) : <p>No calls logged yet.</p>}
          </section>
        </aside>
      ) : null}
    </main>
  );
}

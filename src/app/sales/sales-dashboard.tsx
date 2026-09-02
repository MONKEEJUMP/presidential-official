"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  SALES_OUTCOMES,
  chicagoDateKey,
  defaultCallbackDate,
  displayDoorName,
  formatSalesDate,
  isClosedDoor,
  salesOutcome,
  type DoorStatus,
  type SalesAdminEvent,
  type SalesCall,
  type SalesDoor,
  type SalesOutcome,
  type SalesRepActivity,
  type SalesRole,
  type SalesSnapshot,
} from "@/lib/sales";

import styles from "./sales.module.css";
import { SalesRow } from "./sales-row";

type Worklist = "today" | "week" | "all";
type StatusFilter = "all" | "purchasing" | "not_purchasing";

type ApiResponse = Readonly<{
  success?: boolean;
  authenticated?: boolean;
  error?: string;
  call?: SalesCall;
  status?: DoorStatus;
  nextCallbackAt?: string | null;
  doorId?: number;
  setupCode?: string;
  onboardingOpen?: boolean;
}>;

const STRUCK_OUTCOMES = new Set<SalesOutcome>(["not_interested", "do_not_call"]);

function roleLabel(role: SalesRole): string {
  return role === "super_master" ? "SUPER MASTER" : role === "master" ? "MASTER" : "SALES REP";
}

function dateKeyOffset(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function calledToday(door: SalesDoor, today: string): boolean {
  return Boolean(door.lastCall && chicagoDateKey(door.lastCall.calledAt) === today);
}

function callbackDue(door: SalesDoor, today: string): boolean {
  return Boolean(door.nextCallbackAt && chicagoDateKey(door.nextCallbackAt) <= today);
}

function struck(door: SalesDoor): boolean {
  return Boolean(door.lastCall && STRUCK_OUTCOMES.has(door.lastCall.outcome));
}

function compareDoors(left: SalesDoor, right: SalesDoor, today: string, myBook: boolean): number {
  if (left.companyPriority !== right.companyPriority) return left.companyPriority ? -1 : 1;
  if (myBook) {
    const activityDifference = new Date(right.myLastActivityAt ?? 0).getTime() - new Date(left.myLastActivityAt ?? 0).getTime();
    if (activityDifference) return activityDifference;
  }
  const rank = (door: SalesDoor) => {
    if (struck(door)) return 5;
    if (isClosedDoor(door)) return 4;
    if (callbackDue(door, today)) return 0;
    if (!door.lastCall) return 1;
    return 2;
  };
  return (
    rank(left) - rank(right) ||
    new Date(left.lastCall?.calledAt ?? 0).getTime() - new Date(right.lastCall?.calledAt ?? 0).getTime() ||
    (left.city ?? "").localeCompare(right.city ?? "") ||
    displayDoorName(left).localeCompare(displayDoorName(right))
  );
}

function phoneDigits(value: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

export function SalesDashboard({ initiallyAuthenticated }: Readonly<{ initiallyAuthenticated: boolean }>) {
  const panelRef = useRef<HTMLElement>(null);
  const [snapshot, setSnapshot] = useState<SalesSnapshot | null>(null);
  const [ready, setReady] = useState(!initiallyAuthenticated);
  const [loadingData, setLoadingData] = useState(false);
  const [pageError, setPageError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "setup">("login");
  const [settingUp, setSettingUp] = useState(false);
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<readonly SalesRepActivity[]>([]);
  const [adminEvents, setAdminEvents] = useState<readonly SalesAdminEvent[]>([]);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [changingTeamCode, setChangingTeamCode] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("ALL CITIES");
  const [worklist, setWorklist] = useState<Worklist>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [myBook, setMyBook] = useState(false);
  const [myStars, setMyStars] = useState(false);
  const [activeDoorId, setActiveDoorId] = useState<number | null>(null);
  const [callStartedAt, setCallStartedAt] = useState<Date | null>(null);
  const [advancedLog, setAdvancedLog] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<SalesOutcome | null>(null);
  const [notes, setNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [savingCall, setSavingCall] = useState(false);
  const [undoingCall, setUndoingCall] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [undoMessage, setUndoMessage] = useState("");
  const [loggedCall, setLoggedCall] = useState<SalesCall | null>(null);
  const [nextDoor, setNextDoor] = useState<SalesDoor | null>(null);

  const loadSnapshot = useCallback(async (state?: string) => {
    setLoadingData(true);
    setPageError("");
    try {
      const query = state ? `?state=${encodeURIComponent(state)}` : "";
      const response = await fetch(`/api/sales${query}`, { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        setSnapshot(null);
        if (response.status === 403) {
          const payload = (await response.json()) as { error?: string };
          setLoginError(payload.error ?? "This sales account is inactive.");
        }
        return;
      }
      const payload = (await response.json()) as SalesSnapshot & { error?: string };
      if (!response.ok || !payload.authenticated) throw new Error(payload.error ?? "Sales data is temporarily unavailable.");
      setSnapshot(payload);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Sales data is temporarily unavailable.");
    } finally {
      setReady(true);
      setLoadingData(false);
    }
  }, []);

  const loadActivity = useCallback(async (includeAudit: boolean) => {
    setAdminBusy(true);
    setAdminMessage("");
    try {
      const activityResponse = await fetch("/api/sales?resource=activity", { cache: "no-store" });
      const activityPayload = (await activityResponse.json()) as { activity?: SalesRepActivity[]; error?: string };
      if (!activityResponse.ok || !activityPayload.activity) throw new Error(activityPayload.error ?? "Rep activity is unavailable.");
      setActivity(activityPayload.activity);
      if (includeAudit) {
        const auditResponse = await fetch("/api/sales?resource=admin_log", { cache: "no-store" });
        const auditPayload = (await auditResponse.json()) as { events?: SalesAdminEvent[]; error?: string };
        if (!auditResponse.ok || !auditPayload.events) throw new Error(auditPayload.error ?? "Admin history is unavailable.");
        setAdminEvents(auditPayload.events);
      }
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Account information is unavailable.");
    } finally {
      setAdminBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const today = chicagoDateKey();
  const cities = useMemo(() => {
    if (!snapshot) return [];
    return [...new Set(snapshot.doors.map((door) => door.city?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
  }, [snapshot]);

  const filteredDoors = useMemo(() => {
    if (!snapshot) return [];
    const needle = search.trim().toLowerCase();
    const digits = phoneDigits(search);
    let doors = snapshot.doors.filter((door) => {
      if (city !== "ALL CITIES" && door.city !== city) return false;
      if (statusFilter === "purchasing" && door.status !== "stocked") return false;
      if (statusFilter === "not_purchasing" && !["prospect", "review"].includes(door.status)) return false;
      if (myBook && !door.myLastActivityAt) return false;
      if (myStars && !door.personallyStarred) return false;
      if (!needle) return true;
      const textMatch = [door.dbaName, door.legalName, door.city].filter(Boolean).some((value) => value!.toLowerCase().includes(needle));
      const phoneMatch = Boolean(digits && phoneDigits(door.phone).includes(digits));
      return textMatch || phoneMatch;
    });

    if (worklist === "today") {
      const eligible = doors.filter((door) => !isClosedDoor(door) && !calledToday(door, today));
      const due = eligible.filter((door) => callbackDue(door, today));
      const dueIds = new Set(due.map((door) => door.id));
      const neverCalled = eligible
        .filter((door) => !door.lastCall && door.status !== "stocked" && !dueIds.has(door.id))
        .sort((a, b) => (a.city ?? "").localeCompare(b.city ?? "") || displayDoorName(a).localeCompare(displayDoorName(b)))
        .slice(0, 15);
      doors = [...due, ...neverCalled];
    } else if (worklist === "week") {
      const end = dateKeyOffset(today, 7);
      doors = doors.filter((door) => {
        if (!door.nextCallbackAt || isClosedDoor(door)) return false;
        const key = chicagoDateKey(door.nextCallbackAt);
        return key >= today && key <= end;
      });
    }
    return [...doors].sort((a, b) => compareDoors(a, b, today, myBook));
  }, [city, myBook, myStars, search, snapshot, statusFilter, today, worklist]);

  const activeDoor = snapshot?.doors.find((door) => door.id === activeDoorId) ?? null;
  const isSuper = snapshot?.user.role === "super_master";
  const canSeeActivity = snapshot?.user.role === "super_master" || snapshot?.user.role === "master";

  function openDoor(door: SalesDoor) {
    setActiveDoorId(door.id);
    setCallStartedAt(new Date());
    setAdvancedLog(false);
    setSelectedOutcome(null);
    setNotes("");
    setCallbackDate("");
    setPanelError("");
    setUndoMessage("");
    setLoggedCall(null);
    setNextDoor(null);
  }

  function closeDoor() {
    setActiveDoorId(null);
    setLoggedCall(null);
    setPanelError("");
    setUndoMessage("");
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
        body: JSON.stringify({ action: "login", username: form.get("username"), password: form.get("password") }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) throw new Error(payload.error ?? "Login failed.");
      await loadSnapshot();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function setupRep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settingUp) return;
    const form = new FormData(event.currentTarget);
    const pin = String(form.get("password") ?? "");
    if (pin !== String(form.get("confirmPassword") ?? "")) {
      setLoginError("The two PIN entries do not match.");
      return;
    }
    setSettingUp(true);
    setLoginError("");
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup_rep", setupCode: form.get("setupCode"), username: form.get("username"), password: pin }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.authenticated) throw new Error(payload.error ?? "Account setup failed.");
      await loadSnapshot();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Account setup failed.");
    } finally {
      setSettingUp(false);
    }
  }

  async function postAction(body: Record<string, unknown>): Promise<ApiResponse> {
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as ApiResponse;
    if (!response.ok || !payload.success) throw new Error(payload.error ?? "The action could not be completed.");
    return payload;
  }

  async function changeTeamCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changingTeamCode) return;
    const form = new FormData(event.currentTarget);
    setChangingTeamCode(true);
    setAdminMessage("");
    try {
      const payload = await postAction({ action: "change_team_code", setupCode: form.get("teamCode") });
      setSnapshot((current) => current && payload.setupCode ? { ...current, user: { ...current.user, teamSetupCode: payload.setupCode } } : current);
      setAdminMessage("TEAM CODE UPDATED. Existing accounts were not changed.");
      await loadActivity(true);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "The team code could not be changed.");
    } finally {
      setChangingTeamCode(false);
    }
  }

  async function setOnboarding(open: boolean) {
    setAdminBusy(true);
    setAdminMessage("");
    try {
      await postAction({ action: "set_onboarding", open });
      setSnapshot((current) => current ? { ...current, user: { ...current.user, onboardingOpen: open } } : current);
      setAdminMessage(open ? "NEW ACCOUNT CREATION IS OPEN." : "NEW ACCOUNT CREATION IS PAUSED.");
      await loadActivity(true);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Account creation could not be changed.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function changePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changingPin) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const pin = String(form.get("newPin") ?? "");
    if (pin !== String(form.get("confirmNewPin") ?? "")) {
      setPinMessage("The two PIN entries do not match.");
      return;
    }
    setChangingPin(true);
    setPinMessage("");
    try {
      await postAction({ action: "change_pin", password: pin });
      formElement.reset();
      setPinMessage("PIN UPDATED. Use the new PIN next time you sign in.");
    } catch (error) {
      setPinMessage(error instanceof Error ? error.message : "Your PIN could not be changed.");
    } finally {
      setChangingPin(false);
    }
  }

  async function manageAccount(rep: SalesRepActivity, accountAction: string) {
    if (!isSuper || adminBusy) return;
    const body: Record<string, unknown> = { action: "manage_account", accountAction, targetUserId: rep.userId };
    if (accountAction === "correct_username") {
      const username = window.prompt(`Correct username for ${rep.displayName}:`, rep.username);
      if (!username) return;
      body.username = username;
    }
    if (accountAction === "reset_pin") {
      const pin = window.prompt(`Enter a replacement 6-digit PIN for ${rep.displayName}:`);
      if (!pin) return;
      body.pin = pin;
    }
    if (accountAction === "set_role") body.role = rep.role === "master" ? "sales_rep" : "master";
    if (accountAction === "deactivate" && !window.confirm(`Deactivate ${rep.displayName} and revoke active sessions?`)) return;
    setAdminBusy(true);
    setAdminMessage("");
    try {
      await postAction(body);
      setAdminMessage(`${rep.displayName.toUpperCase()}: ACTION COMPLETED.`);
      await loadActivity(true);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "The account action could not be completed.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function togglePersonalStar(door: SalesDoor) {
    try {
      await postAction({ action: "toggle_personal_star", doorId: door.id, starred: !door.personallyStarred });
      setSnapshot((current) => current ? { ...current, doors: current.doors.map((item) => item.id === door.id ? { ...item, personallyStarred: !door.personallyStarred } : item) } : current);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The personal star could not be changed.");
    }
  }

  async function togglePriority(door: SalesDoor) {
    try {
      await postAction({ action: "toggle_company_priority", doorId: door.id, priority: !door.companyPriority });
      setSnapshot((current) => current ? { ...current, doors: current.doors.map((item) => item.id === door.id ? { ...item, companyPriority: !door.companyPriority } : item) } : current);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The company priority could not be changed.");
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
    if (!activeDoor || !snapshot || savingCall) return;
    const currentIndex = filteredDoors.findIndex((door) => door.id === activeDoor.id);
    const followingDoor = currentIndex >= 0 ? filteredDoors[currentIndex + 1] ?? null : null;
    setSavingCall(true);
    setPanelError("");
    try {
      const body: Record<string, unknown> = { action: "log_call", doorId: activeDoor.id, outcome, notes: custom ? notes : "" };
      if (custom) body.callbackDate = callbackDate || null;
      const response = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.success || !payload.call) throw new Error(payload.error ?? "The call could not be logged.");
      await loadSnapshot(snapshot.selectedState);
      setLoggedCall(payload.call);
      setNextDoor(followingDoor);
      window.requestAnimationFrame(() => panelRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The call could not be logged.");
    } finally {
      setSavingCall(false);
    }
  }

  async function undoCall(callId: number) {
    if (!activeDoor || !snapshot || undoingCall) return;
    setUndoingCall(true);
    setPanelError("");
    setUndoMessage("");
    try {
      await postAction({ action: "undo_call", callId });
      await loadSnapshot(snapshot.selectedState);
      setLoggedCall(null);
      setNextDoor(null);
      setUndoMessage("Last call undone. The original record remains in immutable history.");
      window.requestAnimationFrame(() => panelRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The last call could not be undone.");
    } finally {
      setUndoingCall(false);
    }
  }

  async function correctDoor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeDoor || !snapshot) return;
    const form = new FormData(event.currentTarget);
    setPanelError("");
    try {
      await postAction({ action: "correct_door", doorId: activeDoor.id, status: form.get("doorStatus"), callbackDate: form.get("doorCallback") });
      await loadSnapshot(snapshot.selectedState);
      setUndoMessage("Door status and callback corrected. The action was added to admin history.");
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The door correction could not be saved.");
    }
  }

  if (!ready) return <main className={styles.loginPage}><p>Opening Presidential Sales…</p></main>;

  if (!snapshot) {
    return (
      <main className={styles.loginPage}>
        <form className={styles.loginCard} onSubmit={authMode === "login" ? login : setupRep}>
          <span>PRESIDENTIAL INTERNAL</span>
          <h1>{authMode === "login" ? "SALES LOGIN" : "CREATE LOGIN"}</h1>
          <div className={styles.authModeToggle}>
            <button className={authMode === "login" ? styles.activeAuthMode : ""} onClick={() => { setAuthMode("login"); setLoginError(""); }} type="button">SIGN IN</button>
            <button className={authMode === "setup" ? styles.activeAuthMode : ""} onClick={() => { setAuthMode("setup"); setLoginError(""); }} type="button">CREATE USERNAME + PIN</button>
          </div>
          <p>{authMode === "login" ? "Use your first-name username and 6-digit PIN." : "Enter the shared sales team signup code, then choose your username and PIN."}</p>
          {authMode === "setup" ? (
            <label><span>Sales team signup code</span><input autoCapitalize="characters" autoComplete="off" maxLength={40} name="setupCode" placeholder="ABCD-EFGH" required type="text" /></label>
          ) : null}
          <label><span>First-name username</span><input autoCapitalize="none" autoComplete="username" maxLength={32} name="username" pattern="[A-Za-z][A-Za-z0-9]*" placeholder="paulie" required type="text" /></label>
          <label><span>6-digit PIN</span><input autoComplete={authMode === "setup" ? "new-password" : "current-password"} inputMode="numeric" maxLength={6} minLength={6} name="password" pattern="[0-9]{6}" required type="password" /></label>
          {authMode === "setup" ? <label><span>Confirm 6-digit PIN</span><input autoComplete="new-password" inputMode="numeric" maxLength={6} minLength={6} name="confirmPassword" pattern="[0-9]{6}" required type="password" /></label> : null}
          <button disabled={loggingIn || settingUp} type="submit">{authMode === "login" ? loggingIn ? "SIGNING IN…" : "SIGN IN" : settingUp ? "CREATING…" : "CREATE MY LOGIN"}</button>
          {loginError || pageError ? <p className={styles.errorMessage}>{loginError || pageError}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className={styles.salesPage}>
      <header className={styles.salesHeader}>
        <div><span>PRESIDENTIAL INTERNAL</span><h1>SALES DOORS</h1></div>
        <div className={styles.repIdentity}>
          <div><span>{snapshot.user.name}</span><strong className={`${styles.roleBadge} ${styles[snapshot.user.role]}`}>{roleLabel(snapshot.user.role)}</strong></div>
          {isSuper ? <button onClick={() => { const next = !teamPanelOpen; setTeamPanelOpen(next); setActivityOpen(next); if (next) void loadActivity(true); }} type="button">TEAM ADMIN</button> : null}
          {canSeeActivity && !isSuper ? <button onClick={() => { const next = !activityOpen; setActivityOpen(next); if (next) void loadActivity(false); }} type="button">REP ACTIVITY</button> : null}
          <button onClick={() => { setChangePinOpen((current) => !current); setPinMessage(""); }} type="button">CHANGE PIN</button>
          <button onClick={() => void logout()} type="button">SIGN OUT</button>
        </div>
      </header>

      {teamPanelOpen && isSuper ? (
        <section className={styles.teamAdminPanel}>
          <div className={styles.teamCodeBlock}>
            <span>CURRENT SALES TEAM SIGNUP CODE</span>
            <strong>{snapshot.user.teamSetupCode}</strong>
            <p>Reusable for the whole team. Changing it affects future signups only.</p>
          </div>
          <form className={styles.teamCodeForm} onSubmit={changeTeamCode}>
            <label><span>Change team code</span><input defaultValue={snapshot.user.teamSetupCode ?? ""} maxLength={40} name="teamCode" pattern="[A-Za-z0-9 -]{4,40}" required type="text" /></label>
            <button disabled={changingTeamCode} type="submit">{changingTeamCode ? "UPDATING…" : "SAVE TEAM CODE"}</button>
          </form>
          <div className={styles.onboardingControl}>
            <span>NEW ACCOUNT CREATION</span>
            <strong>{snapshot.user.onboardingOpen ? "OPEN" : "PAUSED"}</strong>
            <button disabled={adminBusy} onClick={() => void setOnboarding(!snapshot.user.onboardingOpen)} type="button">{snapshot.user.onboardingOpen ? "PAUSE SIGNUPS" : "REOPEN SIGNUPS"}</button>
          </div>
          {adminMessage ? <p className={styles.adminMessage} role="status">{adminMessage}</p> : null}
        </section>
      ) : null}

      {changePinOpen ? (
        <form className={styles.pinPanel} onSubmit={changePin}>
          <strong>CHOOSE YOUR NEW PIN</strong>
          <label><span>New 6-digit PIN</span><input autoComplete="new-password" inputMode="numeric" maxLength={6} minLength={6} name="newPin" pattern="[0-9]{6}" required type="password" /></label>
          <label><span>Confirm PIN</span><input autoComplete="new-password" inputMode="numeric" maxLength={6} minLength={6} name="confirmNewPin" pattern="[0-9]{6}" required type="password" /></label>
          <button disabled={changingPin} type="submit">{changingPin ? "UPDATING…" : "SAVE MY PIN"}</button>
          {pinMessage ? <p role="status">{pinMessage}</p> : null}
        </form>
      ) : null}

      {activityOpen && canSeeActivity ? (
        <section className={styles.activityPanel}>
          <div className={styles.sectionHeading}><div><span>EXECUTIVE VISIBILITY</span><h2>REP ACTIVITY</h2></div><button disabled={adminBusy} onClick={() => void loadActivity(Boolean(isSuper))} type="button">REFRESH</button></div>
          <div className={styles.tableScroller}>
            <table>
              <thead><tr><th>Rep</th><th>Role</th><th>Status</th><th>Today</th><th>Week</th><th>Month</th><th>Sold month</th><th>Last activity</th>{isSuper ? <th>Paulie controls</th> : null}</tr></thead>
              <tbody>
                {activity.map((rep) => (
                  <tr key={rep.userId}>
                    <td><strong>{rep.displayName}</strong><small>@{rep.username}</small></td>
                    <td>{roleLabel(rep.role)}</td>
                    <td>{rep.active ? "ACTIVE" : "INACTIVE"}</td>
                    <td>{rep.callsToday}</td><td>{rep.callsThisWeek}</td><td>{rep.callsThisMonth}</td><td>{rep.soldThisMonth}</td><td>{formatSalesDate(rep.lastActivityAt, true) || "—"}</td>
                    {isSuper ? (
                      <td>
                        {rep.role === "super_master" ? <span className={styles.protectedLabel}>PROTECTED</span> : (
                          <div className={styles.adminActions}>
                            <button disabled={adminBusy} onClick={() => void manageAccount(rep, rep.active ? "deactivate" : "reactivate")} type="button">{rep.active ? "DEACTIVATE" : "REACTIVATE"}</button>
                            <button disabled={adminBusy} onClick={() => void manageAccount(rep, "set_role")} type="button">{rep.role === "master" ? "MAKE REP" : "MAKE MASTER"}</button>
                            <button disabled={adminBusy} onClick={() => void manageAccount(rep, "correct_username")} type="button">USERNAME</button>
                            <button disabled={adminBusy} onClick={() => void manageAccount(rep, "reset_pin")} type="button">RESET PIN</button>
                          </div>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isSuper ? (
            <details className={styles.auditHistory}>
              <summary>ADMINISTRATIVE ACTION HISTORY ({adminEvents.length})</summary>
              {adminEvents.length ? adminEvents.map((event) => <p key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong> · {event.actorName}{event.targetUsername ? ` → ${event.targetUsername}` : ""}{event.doorId ? ` · door ${event.doorId}` : ""} · {formatSalesDate(event.createdAt, true)}{event.reason ? ` · ${event.reason}` : ""}</p>) : <p>No administrative actions yet.</p>}
            </details>
          ) : null}
        </section>
      ) : null}

      <section className={styles.personalCounter} aria-label="Your sales activity">
        <strong>{snapshot.user.stats.callsToday} calls today</strong><span>·</span><strong>{snapshot.user.stats.callsThisWeek} this week</strong><span>·</span><strong>{snapshot.user.stats.soldThisMonth} sold this month</strong>
      </section>

      <section className={styles.commandBar} aria-label="Sales list controls">
        <label><span>State</span><select disabled={loadingData} onChange={(event) => { setCity("ALL CITIES"); void loadSnapshot(event.target.value); }} value={snapshot.selectedState}>{snapshot.states.map((state) => <option key={state}>{state}</option>)}</select></label>
        <label><span>City</span><select onChange={(event) => setCity(event.target.value)} value={city}><option>ALL CITIES</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className={styles.searchControl}><span>Search</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search name, city, or phone" type="search" value={search} /></label>
        <div className={styles.controlGroup}><span>Worklist</span><div className={styles.segmentedControl}><button className={worklist === "today" ? styles.activeToggle : ""} onClick={() => setWorklist("today")} type="button">TODAY</button><button className={worklist === "week" ? styles.activeToggle : ""} onClick={() => setWorklist("week")} type="button">THIS WEEK</button><button className={worklist === "all" ? styles.activeToggle : ""} onClick={() => setWorklist("all")} type="button">ALL</button></div></div>
        <div className={styles.controlGroup}><span>Purchasing status</span><div className={styles.segmentedControl}><button className={statusFilter === "all" ? styles.activeToggle : ""} onClick={() => setStatusFilter("all")} type="button">ALL STATUS</button><button className={statusFilter === "purchasing" ? styles.activeToggle : ""} onClick={() => setStatusFilter("purchasing")} type="button">PURCHASING PRESIDENTIAL</button><button className={statusFilter === "not_purchasing" ? styles.activeToggle : ""} onClick={() => setStatusFilter("not_purchasing")} type="button">NOT PURCHASING</button></div></div>
        <div className={styles.listToggles}><button className={myBook ? styles.activeToggle : ""} onClick={() => setMyBook((value) => !value)} type="button">MY BOOK</button><button className={myStars ? styles.activeToggle : ""} onClick={() => setMyStars((value) => !value)} type="button">MY STARS</button></div>
      </section>

      <section className={styles.countLine} aria-live="polite"><strong>In {snapshot.stockedCount} of {snapshot.licensedDoorCount} licensed doors</strong><span>{filteredDoors.length} shown · {worklist.toUpperCase()}{city !== "ALL CITIES" ? ` · ${city}` : ""}</span></section>
      {pageError ? <p className={styles.errorMessage}>{pageError}</p> : null}

      <section className={styles.doorList} aria-busy={loadingData} aria-label="Licensed dispensary doors">
        {filteredDoors.map((door) => <SalesRow callbackDue={callbackDue(door, today)} calledToday={calledToday(door, today)} canSetPriority={Boolean(isSuper)} closed={isClosedDoor(door)} door={door} key={door.id} onOpen={openDoor} onTogglePersonalStar={(item) => void togglePersonalStar(item)} onTogglePriority={(item) => void togglePriority(item)} struck={struck(door)} />)}
        {!filteredDoors.length ? <p className={styles.emptyState}>No doors match this view.</p> : null}
      </section>

      {activeDoor ? (
        <aside className={styles.callPanel} aria-label={`Call log for ${displayDoorName(activeDoor)}`} ref={panelRef}>
          <div className={styles.panelHeader}><div><span>{activeDoor.stateCode} · {activeDoor.stateLicenseId || "NO LICENSE ID"}</span><h2>{displayDoorName(activeDoor)}</h2><p>{[activeDoor.streetAddress, activeDoor.city, activeDoor.stateCode, activeDoor.zip].filter(Boolean).join(" · ")}</p></div><button aria-label="Close call panel" onClick={closeDoor} type="button">×</button></div>
          <div className={styles.panelStarControls}><button className={activeDoor.personallyStarred ? styles.starButtonActive : styles.starButton} onClick={() => void togglePersonalStar(activeDoor)} type="button">{activeDoor.personallyStarred ? "★ MY STAR" : "☆ ADD MY STAR"}</button>{isSuper ? <button className={activeDoor.companyPriority ? styles.companyStarActive : styles.companyStarButton} onClick={() => void togglePriority(activeDoor)} type="button">{activeDoor.companyPriority ? "★ COMPANY PRIORITY" : "SET COMPANY PRIORITY"}</button> : null}</div>
          {activeDoor.phone ? <a className={styles.actionLink} href={`tel:${activeDoor.phone}`}>CALL {activeDoor.phone}</a> : null}
          {activeDoor.email ? <div className={styles.panelEmail}><a className={styles.actionLink} href={`mailto:${activeDoor.email}`}>EMAIL {activeDoor.email}</a><button onClick={() => void navigator.clipboard.writeText(activeDoor.email!)} type="button">COPY EMAIL</button></div> : null}
          <a className={styles.actionLink} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([activeDoor.streetAddress, activeDoor.city, activeDoor.stateCode, activeDoor.zip].filter(Boolean).join(", "))}`} rel="noreferrer" target="_blank">OPEN IN GOOGLE MAPS</a>
          {activeDoor.extraContacts ? <div className={styles.extraContacts}><span>Extra contacts</span><pre>{activeDoor.extraContacts}</pre></div> : null}
          {undoMessage ? <p className={styles.undoNotice} role="status">{undoMessage}</p> : null}

          {loggedCall ? (
            <div className={styles.loggedState} role="status"><strong>CALL LOGGED</strong><span>{salesOutcome(loggedCall.outcome).label} · {formatSalesDate(loggedCall.calledAt, true)}</span><span>Saved. This door now moves to ALL because it was called today.</span><button className={styles.undoButton} disabled={undoingCall} onClick={() => void undoCall(loggedCall.id)} type="button">{undoingCall ? "UNDOING…" : "UNDO LAST CALL"}</button>{nextDoor ? <button onClick={() => openDoor(nextDoor)} type="button">NEXT: {displayDoorName(nextDoor)}</button> : <button onClick={closeDoor} type="button">BACK TO LIST</button>}</div>
          ) : (
            <div className={styles.logComposer}>
              {activeDoor.lastCall && (activeDoor.lastCall.repId === snapshot.user.id || isSuper) ? <div className={styles.undoBar}><span>Last saved: {salesOutcome(activeDoor.lastCall.outcome).label} · {formatSalesDate(activeDoor.lastCall.calledAt, true)} · {activeDoor.lastCall.repName}</span><button className={styles.undoButton} disabled={undoingCall} onClick={() => void undoCall(activeDoor.lastCall!.id)} type="button">{undoingCall ? "UNDOING…" : "UNDO LAST CALL"}</button></div> : null}
              <div className={styles.callClock}><span>Call started</span><strong>{callStartedAt ? formatSalesDate(callStartedAt.toISOString(), true) : "Now"}</strong></div>
              <p><strong>TAP ONCE TO SAVE IMMEDIATELY.</strong> You can undo the last eligible call if you make a mistake.</p>
              <div className={styles.outcomeGrid}>{SALES_OUTCOMES.map((outcome) => <button className={selectedOutcome === outcome.value ? styles.selectedOutcome : ""} disabled={savingCall} key={outcome.value} onClick={() => advancedLog ? chooseAdvancedOutcome(outcome.value) : void logCall(outcome.value, false)} type="button">SAVE: {outcome.label}</button>)}</div>
              <button className={styles.advancedToggle} onClick={() => { setAdvancedLog((current) => !current); setSelectedOutcome(null); setCallbackDate(""); }} type="button">{advancedLog ? "CANCEL NOTES / CALLBACK" : "ADD NOTES OR CHANGE CALLBACK"}</button>
              {advancedLog ? <div className={styles.advancedFields}><label><span>Notes</span><textarea maxLength={4000} onChange={(event) => setNotes(event.target.value)} value={notes} /></label><label><span>Callback date</span><input onChange={(event) => setCallbackDate(event.target.value)} type="date" value={callbackDate} /></label><button disabled={!selectedOutcome || savingCall} onClick={() => selectedOutcome ? void logCall(selectedOutcome, true) : undefined} type="button">{savingCall ? "LOGGING…" : selectedOutcome ? `SAVE: ${salesOutcome(selectedOutcome).label.toUpperCase()}` : "CHOOSE AN OUTCOME"}</button></div> : null}
              {panelError ? <p className={styles.errorMessage}>{panelError}</p> : null}
            </div>
          )}

          {isSuper ? <form className={styles.doorCorrection} onSubmit={correctDoor}><strong>SUPER MASTER CORRECTION</strong><label><span>Door status</span><select defaultValue={activeDoor.status} name="doorStatus"><option value="stocked">PURCHASING PRESIDENTIAL</option><option value="prospect">PROSPECT</option><option value="review">REVIEW</option><option value="closed">CLOSED</option></select></label><label><span>Callback date</span><input defaultValue={activeDoor.nextCallbackAt ? chicagoDateKey(activeDoor.nextCallbackAt) : ""} name="doorCallback" type="date" /></label><button type="submit">SAVE CORRECTION</button></form> : null}

          <section className={styles.callHistory}><h3>CALL HISTORY</h3>{activeDoor.callHistory.length ? activeDoor.callHistory.map((call) => <article key={call.id}><strong>{salesOutcome(call.outcome).label}</strong><span>{formatSalesDate(call.calledAt, true)} · {call.repName}</span>{call.callbackAt ? <span>Callback: {formatSalesDate(call.callbackAt)}</span> : null}{call.notes ? <p>{call.notes}</p> : null}</article>) : <p>No calls logged yet.</p>}</section>
        </aside>
      ) : null}
    </main>
  );
}

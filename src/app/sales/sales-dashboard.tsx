"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import {
  chicagoDateKey,
  displayDoorName,
  formatSalesDate,
  salesOutcome,
  type DoorStatus,
  type SalesAdminEvent,
  type SalesCall,
  type SalesDoor,
  type SalesOutcome,
  type SalesRepActivity,
  type SalesRole,
  type SalesSnapshot,
  type SalesVerificationClaim,
  type SalesVerificationRequest,
} from "@/lib/sales";

import styles from "./sales.module.css";
import { SalesInlineWorkArea } from "./sales-inline-work-area";
import { SalesRow } from "./sales-row";
import { SalesToolkit } from "./sales-toolkit";
import { SalesDataReview } from "./sales-data-review";

type DispensaryFilter = "all" | "purchasing" | "not_purchasing";
type WorkQueue = "all" | "worked" | "stars" | "callbacks" | "upcoming";
type BrowseFilters = { city: string; search: string; filter: DispensaryFilter; queue: WorkQueue; page: number };

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
  requestId?: number;
  requestSubmittedAt?: string;
  requestCallbackAt?: string | null;
  resetAt?: string;
}>;

const STRUCK_OUTCOMES = new Set<SalesOutcome>(["not_interested", "do_not_call"]);
const STATE_NAMES: Readonly<Record<string, string>> = {
  AZ: "ARIZONA",
  NY: "NEW YORK",
  OK: "OKLAHOMA",
};

function roleLabel(role: SalesRole): string {
  return role === "super_master" ? "SUPER MASTER" : role === "master" ? "MASTER" : "SALES REP";
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



export function SalesDashboard({ initiallyAuthenticated }: Readonly<{ initiallyAuthenticated: boolean }>) {
  const requestSequence = useRef(0);
  const activitySequence = useRef(0);
  const historySequence = useRef(0);
  const browseAbort = useRef<AbortController | null>(null);
  const browseFilters = useRef<BrowseFilters>({ city: "", search: "", filter: "not_purchasing", queue: "all", page: 0 });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMove = useRef<(() => void) | null>(null);
  const callRequest = useRef<{ signature: string; id: string } | null>(null);
  const [queue, setQueue] = useState<WorkQueue>("all");
  const [canWork, setCanWork] = useState(false);
  const [toolkitDirty, setToolkitDirty] = useState(false);
  const [toolkitBusy, setToolkitBusy] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [dataReviewOpen, setDataReviewOpen] = useState(false);
  const listScrollY = useRef(0);
  const openListOrder = useRef<readonly number[] | null>(null);
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
  const [dispensaryFilter, setDispensaryFilter] = useState<DispensaryFilter>("not_purchasing");
  const [activeDoorId, setActiveDoorId] = useState<number | null>(null);
  const [workMode, setWorkMode] = useState<"log" | "history" | null>(null);
  const [notes, setNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [discardWarning, setDiscardWarning] = useState(false);
  const [savingCall, setSavingCall] = useState(false);
  const [undoingCall, setUndoingCall] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [undoMessage, setUndoMessage] = useState("");
  const [loggedCall, setLoggedCall] = useState<SalesCall | null>(null);

  const loadSnapshot = useCallback(async (state?: string, filters = browseFilters.current, quiet = false) => {
    const sequence = ++requestSequence.current;
    browseAbort.current?.abort();
    const controller = new AbortController();
    browseAbort.current = controller;
    if (!quiet) setLoadingData(true);
    setPageError("");
    try {
      let selectedState = state;
      if (!selectedState) { try { selectedState = localStorage.getItem(`presidential.sales.state:${sessionStorage.getItem("presidential.sales.user") ?? ""}`) ?? undefined; } catch { /* Preferences are optional. */ } }
      const query = new URLSearchParams({ state: selectedState ?? "AZ", city: filters.city, search: filters.search, filter: filters.filter, queue: filters.queue, page: String(filters.page), tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const response = await fetch(`/api/sales?${query}`, { cache: "no-store", signal: controller.signal });
      if (sequence !== requestSequence.current) return null;
      if (response.status === 401 || response.status === 403) {
        setSnapshot(null);
        setActivity([]); setAdminEvents([]); setTeamPanelOpen(false); setActivityOpen(false); setDataReviewOpen(false);
        if (response.status === 403) {
          const payload = (await response.json()) as { error?: string };
          setLoginError(payload.error ?? "This sales account is inactive.");
        }
        return null;
      }
      const payload = (await response.json()) as SalesSnapshot & { error?: string };
      if (!response.ok || !payload.authenticated) throw new Error(payload.error ?? "Sales data is temporarily unavailable.");
      if (sequence !== requestSequence.current) return null;
      setSnapshot(payload);
      try { sessionStorage.setItem("presidential.sales.user", payload.user.username); localStorage.setItem(`presidential.sales.state:${payload.user.username}`, payload.selectedState); } catch { /* Preferences are optional. */ }
      return payload;
    } catch (error) {
      if (sequence !== requestSequence.current || controller.signal.aborted) return null;
      setPageError(error instanceof Error ? error.message : "Sales data is temporarily unavailable.");
      return null;
    } finally {
      if (sequence === requestSequence.current) { setReady(true); setLoadingData(false); }
    }
  }, []);

  const loadActivity = useCallback(async (includeAudit: boolean) => {
    const sequence = ++activitySequence.current;
    setAdminBusy(true);
    setAdminMessage("");
    try {
      const activityResponse = await fetch("/api/sales?resource=activity", { cache: "no-store" });
      const activityPayload = (await activityResponse.json()) as { activity?: SalesRepActivity[]; error?: string };
      if (sequence !== activitySequence.current) return;
      if (!activityResponse.ok || !activityPayload.activity) throw new Error(activityPayload.error ?? "Rep activity is unavailable.");
      setActivity(activityPayload.activity);
      const requestsResponse = await fetch("/api/sales?resource=verification_requests", { cache: "no-store" });
      const requestsPayload = await requestsResponse.json();
      if (sequence !== activitySequence.current) return;
      if (requestsResponse.ok) setSnapshot((current) => current ? { ...current, verificationRequests: requestsPayload.requests ?? [] } : current);
      if (includeAudit) {
        const auditResponse = await fetch("/api/sales?resource=admin_log", { cache: "no-store" });
        const auditPayload = (await auditResponse.json()) as { events?: SalesAdminEvent[]; error?: string };
        if (sequence !== activitySequence.current) return;
        if (!auditResponse.ok || !auditPayload.events) throw new Error(auditPayload.error ?? "Admin history is unavailable.");
        setAdminEvents(auditPayload.events);
      }
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Account information is unavailable.");
    } finally {
      if (sequence === activitySequence.current) setAdminBusy(false);
    }
  }, []);

  useEffect(() => {
    // The authenticated snapshot is the page's initial client-side data source.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    if (!snapshot?.user.id || !activeDoorId || workMode !== "log") return;
    try {
      const key = `presidential.sales.draft:${snapshot.user.id}:${activeDoorId}`;
      if (notes) sessionStorage.setItem(key, notes); else sessionStorage.removeItem(key);
    } catch { /* Draft protection still applies when storage is disabled. */ }
  }, [notes, activeDoorId, workMode, snapshot?.user.id]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (notes.trim() || toolkitDirty || savingCall || toolkitBusy) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [notes, toolkitDirty, savingCall, toolkitBusy]);

  useEffect(() => {
    if (!activeDoorId || !workMode) return;
    const mobileWorkArea = window.matchMedia("(max-width: 35rem)");
    const priorOverflow = document.body.style.overflow;
    const syncBodyScroll = () => {
      document.body.style.overflow = mobileWorkArea.matches ? "hidden" : priorOverflow;
    };
    syncBodyScroll();
    mobileWorkArea.addEventListener("change", syncBodyScroll);
    return () => {
      mobileWorkArea.removeEventListener("change", syncBodyScroll);
      document.body.style.overflow = priorOverflow;
    };
  }, [activeDoorId, workMode]);

  const today = chicagoDateKey();
  const cities = snapshot?.cities ?? [];
  const filteredDoors = snapshot?.doors ?? [];

  const activeDoor = snapshot?.doors.find((door) => door.id === activeDoorId) ?? null;
  const isSuper = snapshot?.user.role === "super_master";
  const canSeeActivity = snapshot?.user.role === "super_master" || snapshot?.user.role === "master";
  const visibleActivity = isSuper
    ? activity
    : activity.filter((rep) => rep.role !== "super_master" && rep.username !== "paulie");
  const visibleExecutiveRequests = isSuper
    ? snapshot?.verificationRequests ?? []
    : (snapshot?.verificationRequests ?? []).filter((request) => request.submittedByName.trim().toLowerCase() !== "paulie");

  function openWorkArea(door: SalesDoor, mode: "log" | "history") {
    if (mode === "log" && (door.isPurchasing || door.doNotCallLocked)) return;
    if (activeDoorId === door.id && workMode === mode) {
      finishCloseWorkArea();
      return;
    }
    requestMove(() => {
    listScrollY.current = window.scrollY;
    openListOrder.current = filteredDoors.map((item) => item.id);
    setActiveDoorId(door.id);
    setWorkMode(mode);
    let draft = "";
    try { draft = sessionStorage.getItem(`presidential.sales.draft:${snapshot?.user.id}:${door.id}`) ?? ""; } catch { /* Optional draft recovery. */ }
    setNotes(mode === "log" ? draft : "");
    setCallbackDate("");
    setPanelError("");
    setUndoMessage("");
    setLoggedCall(null);
    setDiscardWarning(false);
    setCanWork(false); setToolkitDirty(false); setToolkitBusy(false); setHasMoreHistory(false);
    void loadDoorHistory(door.id);
    });
  }

  function requestMove(action: () => void) {
    if (savingCall || undoingCall || toolkitBusy) return;
    if (activeDoorId && (notes.trim() || toolkitDirty)) {
      pendingMove.current = action;
      setDiscardWarning(true);
      return;
    }
    if (activeDoorId) closeWorkAreaImmediately();
    action();
  }

  function finishCloseWorkArea() {
    requestMove(() => { if (snapshot) void loadSnapshot(snapshot.selectedState, browseFilters.current, true); });
  }

  function discardAndMove() {
    const next = pendingMove.current;
    pendingMove.current = null;
    try { sessionStorage.removeItem(`presidential.sales.draft:${snapshot?.user.id}:${activeDoorId}`); } catch { /* Optional storage. */ }
    closeWorkAreaImmediately();
    next?.();
  }

  async function loadDoorHistory(doorId: number, before?: number) {
    const sequence = requestSequence.current;
    const historyRequest = ++historySequence.current;
    try {
      const response = await fetch(`/api/sales?resource=history&doorId=${doorId}${before ? `&before=${before}` : ""}`, { cache: "no-store" });
      const data = await response.json() as { calls: SalesCall[]; hasMore: boolean; error?: string };
      if (sequence !== requestSequence.current || historyRequest !== historySequence.current) return;
      if (!response.ok) throw new Error(data.error ?? "History unavailable.");
      setSnapshot((current) => current ? { ...current, doors: current.doors.map((door) => door.id === doorId ? { ...door, callHistory: before ? [...door.callHistory, ...data.calls] : data.calls } : door) } : current);
      setHasMoreHistory(data.hasMore);
    } catch (cause) { setPanelError(cause instanceof Error ? cause.message : "History unavailable."); }
  }

  function changeFilters(update: Partial<BrowseFilters>, state?: string) {
    requestMove(() => {
      const next = { ...browseFilters.current, ...update, page: update.page ?? 0 };
      browseFilters.current = next;
      setCity(next.city || "ALL CITIES"); setSearch(next.search); setDispensaryFilter(next.filter); setQueue(next.queue);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (update.search !== undefined) searchTimer.current = setTimeout(() => void loadSnapshot(state ?? snapshot?.selectedState, next), 250);
      else void loadSnapshot(state ?? snapshot?.selectedState, next).then(() => { if (update.page !== undefined) document.querySelector('[aria-label="Licensed dispensary doors"]')?.scrollIntoView({ block: "start" }); });
    });
  }

  function moveToDoor(direction: -1 | 1) {
    const index = filteredDoors.findIndex((door) => door.id === activeDoorId);
    const next = filteredDoors[index + direction];
    if (next) { openWorkArea(next, next.isPurchasing || next.doNotCallLocked ? "history" : "log"); return; }
    if (!snapshot) return;
    const nextPage = snapshot.page + direction;
    if (nextPage < 0 || nextPage * snapshot.pageSize >= snapshot.totalMatching) return;
    requestMove(() => {
      const filters = { ...browseFilters.current, page: nextPage };
      browseFilters.current = filters;
      void loadSnapshot(snapshot.selectedState, filters).then((data) => {
        const available = data?.doors ?? [];
        const candidate = direction > 0 ? available[0] : available.at(-1);
        if (candidate) openWorkArea(candidate, candidate.isPurchasing || candidate.doNotCallLocked ? "history" : "log");
      });
    });
  }

  function closeWorkAreaImmediately() {
    ++historySequence.current;
    if (activeDoorId) void fetch("/api/sales/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "release_claim", doorId: activeDoorId }), keepalive: true }).catch(() => {});
    openListOrder.current = null;
    setActiveDoorId(null);
    setWorkMode(null);
    setLoggedCall(null);
    setNotes("");
    setCallbackDate("");
    setPanelError("");
    setUndoMessage("");
    setDiscardWarning(false);
    setToolkitDirty(false); setToolkitBusy(false); setCanWork(false); callRequest.current = null;
    window.requestAnimationFrame(() => window.scrollTo({ top: listScrollY.current }));
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
      ++activitySequence.current;
      browseFilters.current = { city: "", search: "", filter: "not_purchasing", queue: "all", page: 0 };
      setCity("ALL CITIES"); setSearch(""); setDispensaryFilter("not_purchasing"); setQueue("all");
      try { sessionStorage.setItem("presidential.sales.user", String(form.get("username") ?? "").trim().toLowerCase()); } catch { /* Optional preferences. */ }
      setActivity([]);
      setAdminEvents([]);
      setActivityOpen(false);
      setTeamPanelOpen(false);
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
      browseFilters.current = { city: "", search: "", filter: "not_purchasing", queue: "all", page: 0 };
      try { sessionStorage.setItem("presidential.sales.user", String(form.get("username") ?? "").trim().toLowerCase()); } catch { /* Optional preferences. */ }
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
    ++requestSequence.current; ++activitySequence.current;
    browseAbort.current?.abort();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    await fetch("/api/sales", { method: "DELETE" });
    try { const prefix = `presidential.sales.draft:${snapshot?.user.id}:`; for (const key of Object.keys(sessionStorage)) if (key.startsWith(prefix)) sessionStorage.removeItem(key); } catch { /* Optional drafts. */ }
    setSnapshot(null);
    setActivity([]);
    setAdminEvents([]);
    setActivityOpen(false);
    setTeamPanelOpen(false);
    setActiveDoorId(null);
    setWorkMode(null);
    setNotes(""); setToolkitDirty(false); setDataReviewOpen(false); setReady(true); setLoadingData(false);
  }

  async function resetMyDailyCalls() {
    if (!snapshot || !window.confirm("RESET ONLY TODAY'S PERSONAL CALL COUNTER? Weekly and monthly reports stay unchanged.")) return;
    setPageError("");
    try {
      await postAction({ action: "reset_my_daily_calls" });
      setSnapshot((current) => current ? {
        ...current,
        user: {
          ...current.user,
          stats: { ...current.user.stats, callsToday: 0 },
        },
        doors: current.doors.map((door) => ({ ...door, myLastActivityAt: null })),
      } : current);
      setQueue("all"); browseFilters.current.queue = "all";
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Your counters could not be reset.");
    }
  }

  function showTeamActivityReport() {
    if (!canSeeActivity) return;
    setActivityOpen(true);
    void loadActivity(Boolean(isSuper));
    window.requestAnimationFrame(() => document.getElementById("rep-activity")?.scrollIntoView({ block: "start" }));
  }

  async function logCall(outcome: SalesOutcome) {
    if (!activeDoor || !snapshot || savingCall || toolkitBusy || !canWork) return;
    setSavingCall(true);
    setPanelError("");
    try {
      const signature = JSON.stringify({ doorId: activeDoor.id, outcome, notes });
      if (callRequest.current?.signature !== signature) callRequest.current = { signature, id: crypto.randomUUID() };
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_call",
          doorId: activeDoor.id,
          outcome,
          notes,
          callbackDate: outcome === "do_not_call" ? null : callbackDate || null,
          requestId: callRequest.current.id,
        }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.success || !payload.call) throw new Error(payload.error ?? "The call could not be logged.");
      const savedCall = payload.call;
      setSnapshot((current) => current ? {
        ...current,
        user: {
          ...current.user,
          stats: {
            ...current.user.stats,
            callsToday: current.user.stats.callsToday + 1,
            callsThisWeek: current.user.stats.callsThisWeek + 1,
          },
        },
        doors: current.doors.map((door) => door.id === activeDoor.id ? {
          ...door,
          status: payload.status ?? door.status,
          nextCallbackAt: payload.nextCallbackAt === undefined ? door.nextCallbackAt : payload.nextCallbackAt,
          callHistory: [savedCall, ...door.callHistory.map((call) => ({ ...call, undoEligible: false }))],
          lastCall: savedCall,
          myLastActivityAt: savedCall.calledAt,
          doNotCallLocked: outcome === "do_not_call",
        } : door),
      } : current);
      setLoggedCall(savedCall);
      setNotes(""); setCallbackDate(""); callRequest.current = null;
      setUndoMessage("");
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The call could not be logged.");
    } finally {
      setSavingCall(false);
    }
  }

  async function undoCall(call: SalesCall) {
    if (!activeDoor || !snapshot || undoingCall) return;
    setUndoingCall(true);
    setPanelError("");
    setUndoMessage("");
    try {
      await postAction({ action: "undo_call", callId: call.id });
      await loadSnapshot(snapshot.selectedState);
      await loadDoorHistory(activeDoor.id);
      setLoggedCall(null);
      setUndoMessage(`${salesOutcome(call.outcome).label.toUpperCase()} UNDONE. The original record remains in immutable history.`);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The last call could not be undone.");
    } finally {
      setUndoingCall(false);
    }
  }

  async function submitVerification(claim: SalesVerificationClaim) {
    if (!activeDoor || !snapshot || savingCall) return;
    const claimLabel = claim === "sold" ? "SOLD" : "ALREADY CARRIES PRESIDENTIAL";
    setSavingCall(true);
    setPanelError("");
    try {
      const payload = await postAction({
        action: "submit_verification_request",
        doorId: activeDoor.id,
        claimedStatus: claim,
        notes,
        callbackDate: callbackDate || null,
      });
      if (!payload.requestId || !payload.requestSubmittedAt) throw new Error("The saved customer report could not be reopened.");
      const pendingVerification: SalesVerificationRequest = {
        id: payload.requestId,
        doorId: activeDoor.id,
        storeName: displayDoorName(activeDoor),
        city: activeDoor.city,
        stateCode: activeDoor.stateCode,
        submittedBy: snapshot.user.id,
        submittedByName: snapshot.user.name,
        claimedStatus: claim,
        notes: notes.trim() || null,
        callbackAt: payload.requestCallbackAt ?? null,
        status: "pending",
        submittedAt: payload.requestSubmittedAt,
        decidedAt: null,
        decisionNote: null,
        canWithdraw: true,
      };
      setSnapshot((current) => current ? {
        ...current,
        doors: current.doors.map((door) => door.id === activeDoor.id ? {
          ...door,
          hasPendingVerification: true,
          pendingVerification,
        } : door),
        verificationRequests: [pendingVerification, ...current.verificationRequests],
      } : current);
      setNotes("");
      setCallbackDate("");
      setUndoMessage(`${claimLabel} REPORT SUBMITTED. It is awaiting owner verification.`);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The verification request could not be submitted.");
    } finally {
      setSavingCall(false);
    }
  }

  async function withdrawVerification(request: SalesVerificationRequest) {
    if (!snapshot) return;
    try {
      await postAction({ action: "withdraw_verification_request", requestId: request.id });
      await loadSnapshot(snapshot.selectedState);
      setUndoMessage(`${request.claimedStatus === "sold" ? "SOLD" : "ALREADY CARRIES"} REPORT WITHDRAWN.`);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The request could not be withdrawn.");
    }
  }

  async function decideVerification(request: SalesVerificationRequest, decision: "approved" | "rejected") {
    if (!snapshot || !isSuper) return;
    let decisionNote: string | null = null;
    if (decision === "rejected") {
      decisionNote = window.prompt("Enter the rejection reason:")?.trim() || null;
      if (!decisionNote) return;
    } else if (!window.confirm(`Approve ${request.submittedByName}'s customer report? This store becomes gold and locked.`)) {
      return;
    }
    setAdminBusy(true);
    setAdminMessage("");
    try {
      await postAction({
        action: "decide_verification_request",
        requestId: request.id,
        decision,
        decisionNote,
      });
      setAdminMessage(`CUSTOMER REPORT ${decision.toUpperCase()}.`);
      setActiveDoorId(null);
      setWorkMode(null);
      await Promise.all([loadSnapshot(snapshot.selectedState), loadActivity(true)]);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "The request decision could not be saved.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function correctVerifiedCustomer(door: SalesDoor) {
    if (!snapshot || !isSuper || !door.verifiedCustomerId) return;
    const choice = window.prompt(
      "Type NOTE to attach an administrative note, or REVERT to return this verified customer to a white opportunity.",
    )?.trim().toUpperCase();
    if (choice === "NOTE") {
      const note = window.prompt("Enter the administrative customer note:")?.trim();
      if (!note) return;
      try {
        await postAction({ action: "add_verified_customer_note", verifiedCustomerId: door.verifiedCustomerId, note });
        setAdminMessage("CUSTOMER ADMINISTRATIVE NOTE RECORDED.");
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "The customer note could not be recorded.");
      }
      return;
    }
    if (choice !== "REVERT") return;
    const reason = window.prompt("Enter the required reason for returning this customer to a white opportunity:")?.trim();
    if (!reason || !window.confirm(`REVERT ${displayDoorName(door)} TO A WHITE OPPORTUNITY?`)) return;
    try {
      await postAction({ action: "revert_verified_customer", verifiedCustomerId: door.verifiedCustomerId, reason });
      await loadSnapshot(snapshot.selectedState);
      setAdminMessage("VERIFIED CUSTOMER RETURNED TO A WHITE OPPORTUNITY. ORIGINAL EVIDENCE PRESERVED.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The customer correction could not be completed.");
    }
  }

  async function reopenDoNotCall(door: SalesDoor) {
    if (!snapshot || !isSuper || !door.marketDoorId) return;
    const reason = window.prompt("Enter the required reason for reopening this Do Not Call store:")?.trim();
    if (!reason || !window.confirm(`REOPEN ${displayDoorName(door)} FOR SALES ACTIVITY?`)) return;
    try {
      await postAction({ action: "reopen_do_not_call", doorId: door.marketDoorId, reason });
      await loadSnapshot(snapshot.selectedState);
      setAdminMessage("DO NOT CALL LOCK REOPENED. ORIGINAL ACTIVITY PRESERVED.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The Do Not Call lock could not be reopened.");
    }
  }

  if (!ready) return <main className={styles.loginPage}><p>Opening Presidential Sales…</p></main>;

  if (!snapshot) {
    return (
      <main className={styles.loginPage}>
        <form className={styles.loginCard} onSubmit={authMode === "login" ? login : setupRep}>
          <Link href="/">← Back to website</Link>
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
          <Link className={styles.websiteLink} href="/" onClick={(event) => { event.preventDefault(); requestMove(() => window.location.assign("/")); }}>← BACK TO WEBSITE</Link>
          {isSuper ? <button onClick={() => { const next = !teamPanelOpen; setTeamPanelOpen(next); setActivityOpen(next); if (next) void loadActivity(true); }} type="button">TEAM ADMIN</button> : null}
          {canSeeActivity && !isSuper ? <button onClick={() => { const next = !activityOpen; setActivityOpen(next); if (next) void loadActivity(false); }} type="button">REP ACTIVITY</button> : null}
          <button onClick={() => { setChangePinOpen((current) => !current); setPinMessage(""); }} type="button">CHANGE PIN</button>
          {isSuper ? <button onClick={() => requestMove(() => setDataReviewOpen((open) => !open))} type="button">DATA REVIEW ({snapshot.unlinkedCustomerCount})</button> : null}
          <button disabled={savingCall || toolkitBusy} onClick={() => requestMove(() => void logout())} type="button">SIGN OUT</button>
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
        <section className={styles.activityPanel} id="rep-activity">
          <div className={styles.sectionHeading}><div><span>EXECUTIVE VISIBILITY</span><h2>REP ACTIVITY</h2></div><button disabled={adminBusy} onClick={() => void loadActivity(Boolean(isSuper))} type="button">REFRESH</button></div>
          <section className={styles.verificationRequests}>
            <h3>CUSTOMER VERIFICATION REQUESTS</h3>
            {visibleExecutiveRequests.length ? visibleExecutiveRequests.map((request) => (
              <article key={request.id}>
                <div>
                  <strong>{request.storeName} · {request.stateCode}{request.city ? ` · ${request.city}` : ""}</strong>
                  <span>{request.claimedStatus === "sold" ? "SOLD" : "ALREADY CARRIES PRESIDENTIAL"}</span>
                  <span>{request.submittedByName} · {formatSalesDate(request.submittedAt, true)} · {request.status.toUpperCase()}</span>
                </div>
                {request.notes ? <p>{request.notes}</p> : null}
                {request.callbackAt ? <span>Callback: {formatSalesDate(request.callbackAt)}</span> : null}
                {request.decisionNote ? <span>Decision note: {request.decisionNote}</span> : null}
                {isSuper && request.status === "pending" ? (
                  <div>
                    <button disabled={adminBusy} onClick={() => void decideVerification(request, "approved")} type="button">APPROVE</button>
                    <button disabled={adminBusy} onClick={() => void decideVerification(request, "rejected")} type="button">REJECT</button>
                  </div>
                ) : null}
              </article>
            )) : <p>No customer-verification requests yet.</p>}
          </section>
          <div className={styles.tableScroller}>
            <table>
              <thead><tr><th>Rep</th><th>Role</th><th>Status</th><th>Today</th><th>Week</th><th>Month</th><th>Sold month</th><th>Last activity</th>{isSuper ? <th>Paulie controls</th> : null}</tr></thead>
              <tbody>
                {visibleActivity.map((rep) => (
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

      {isSuper && dataReviewOpen ? <SalesDataReview state={snapshot.selectedState} onChanged={() => void loadSnapshot(snapshot.selectedState)} /> : null}
      <section className={styles.personalCounter} aria-label="Your sales activity">
        <div className={styles.personalMetric}>
          {canSeeActivity ? <button className={styles.metricButton} onClick={showTeamActivityReport} type="button">{snapshot.user.stats.callsToday} CALLS TODAY</button> : <strong>{snapshot.user.stats.callsToday} CALLS TODAY</strong>}
          <button className={styles.dailyResetButton} onClick={() => void resetMyDailyCalls()} type="button">RESET TODAY</button>
        </div>
        <div className={styles.personalMetric}>
          {canSeeActivity ? <button className={styles.metricButton} onClick={showTeamActivityReport} type="button">{snapshot.user.stats.callsThisWeek} THIS WEEK</button> : <strong>{snapshot.user.stats.callsThisWeek} THIS WEEK</strong>}
        </div>
        <div className={styles.personalMetric}>
          {canSeeActivity ? <button className={styles.metricButton} onClick={showTeamActivityReport} type="button">{snapshot.user.stats.soldThisMonth} SOLD THIS MONTH</button> : <strong>{snapshot.user.stats.soldThisMonth} SOLD THIS MONTH</strong>}
        </div>
      </section>

      {snapshot.user.role === "sales_rep" && snapshot.verificationRequests.length ? (
        <details className={styles.myVerificationRequests}>
          <summary>MY CUSTOMER REPORTS ({snapshot.verificationRequests.length})</summary>
          {snapshot.verificationRequests.map((request) => (
            <article key={request.id}>
              <strong>{request.storeName}</strong>
              <span>{request.claimedStatus === "sold" ? "SOLD" : "ALREADY CARRIES PRESIDENTIAL"} · {request.status.toUpperCase()}</span>
              <span>{formatSalesDate(request.submittedAt, true)}</span>
              {request.decisionNote ? <p>{request.decisionNote}</p> : null}
              {request.canWithdraw ? (
                <button onClick={() => void withdrawVerification(request)} type="button">
                  {request.claimedStatus === "sold" ? "WITHDRAW SOLD REPORT" : "WITHDRAW ALREADY CARRIES REPORT"}
                </button>
              ) : null}
            </article>
          ))}
        </details>
      ) : null}

      <section className={styles.commandBar} aria-label="Sales list controls">
        <label><span>State</span><select disabled={loadingData || savingCall || toolkitBusy} onChange={(event) => changeFilters({ city: "", search: "", filter: "not_purchasing", queue: "all" }, event.target.value)} value={snapshot.selectedState}>{snapshot.states.map((state) => <option key={state}>{state}</option>)}</select></label>
        <label><span>City</span><select onChange={(event) => changeFilters({ city: event.target.value === "ALL CITIES" ? "" : event.target.value })} value={city}><option>ALL CITIES</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className={styles.searchControl}><span>Search stores</span><input onChange={(event) => changeFilters({ search: event.target.value })} placeholder="Name, city, phone, address or email" type="search" value={search} /></label>
        <div className={styles.controlGroup}><span>Dispensaries</span><div className={styles.segmentedControl}>
          <button aria-pressed={dispensaryFilter === "not_purchasing"} className={dispensaryFilter === "not_purchasing" ? styles.activeToggle : ""} onClick={() => changeFilters({ filter: "not_purchasing", queue: "all" })} type="button">Dispensaries not purchasing Presidential</button>
          <button aria-pressed={dispensaryFilter === "purchasing"} className={dispensaryFilter === "purchasing" ? styles.activeToggle : ""} onClick={() => changeFilters({ filter: "purchasing", queue: "all" })} type="button">Dispensaries purchasing Presidential</button>
          <button aria-pressed={dispensaryFilter === "all"} className={dispensaryFilter === "all" ? styles.activeToggle : ""} onClick={() => changeFilters({ filter: "all", queue: "all" })} type="button">All dispensaries</button>
        </div></div>
        <div className={styles.listToggles}>
          {([["all", "Browse all"], ["callbacks", "My callbacks due"], ["upcoming", "My upcoming callbacks"], ["worked", "My work today"], ["stars", "My starred stores"]] as const).map(([value, label]) => <button key={value} aria-pressed={queue === value} className={queue === value ? styles.activeToggle : ""} onClick={() => changeFilters({ queue: value, ...(value === "callbacks" || value === "upcoming" ? { filter: "not_purchasing" as const } : {}) })} type="button">{label}</button>)}
        </div>
        <label className={styles.queueSelect}><span>Work view</span><select value={queue} onChange={(event) => changeFilters({ queue: event.target.value as WorkQueue, ...(event.target.value === "callbacks" || event.target.value === "upcoming" ? { filter: "not_purchasing" as const } : {}) })}><option value="all">Browse stores</option><option value="callbacks">My callbacks due</option><option value="upcoming">My upcoming callbacks</option><option value="worked">My work today</option><option value="stars">My starred stores</option></select></label>
      </section>
      <section className={styles.filterSummary} aria-live="polite">
        <strong>{loadingData ? "Updating…" : `${snapshot.totalMatching} matching ${dispensaryFilter === "purchasing" ? "customers" : dispensaryFilter === "not_purchasing" ? "prospect records" : "store records"}`}</strong>
        <span>{STATE_NAMES[snapshot.selectedState] ?? snapshot.selectedState}{city !== "ALL CITIES" ? ` · ${city}` : ""}{search ? ` · “${search}”` : ""} · {queue === "all" ? "Browsing" : queue === "callbacks" ? "Your due callbacks" : queue === "upcoming" ? "Your upcoming callbacks" : queue === "worked" ? "Your work today" : "Your stars"}</span>
        <button type="button" onClick={() => changeFilters({ city: "", search: "", filter: "not_purchasing", queue: "all" })}>Clear filters</button>
        <button type="button" disabled={loadingData} onClick={() => requestMove(() => void loadSnapshot(snapshot.selectedState))}>Refresh list</button>
      </section>
      <details className={styles.welcomeHelp}>
        <summary>{snapshot.purchasingCount} verified Presidential customers · How this list works</summary>
        <p>Champagne cards are protected customers. White cards are prospects whose purchasing status is not confirmed; ask before pitching. These are source records, not a claim that every record is a different store. Notes and call history stay with each store. Log Result reserves a workspace for you; choose a call outcome, then use Next dispensary.</p>
        <p>Your callbacks due and upcoming callbacks are separate from My Work Today, which shows calls you already recorded today. Reset Daily Calls affects only your personal daily view, not the permanent team report.</p>
      </details>
      {pageError ? <p className={styles.errorMessage}>{pageError}</p> : null}

      <section className={styles.doorList} aria-busy={loadingData} aria-label="Licensed dispensary doors">
        {filteredDoors.map((door) => (
          <div className={styles.salesTargetGroup} key={door.id}>
            <SalesRow
              callbackDue={callbackDue(door, today)}
              calledToday={calledToday(door, today)}
              canCorrectCustomer={Boolean(isSuper)}
              canSetPriority={Boolean(isSuper)}
              door={door}
              openMode={activeDoor?.id === door.id ? workMode : null}
              onCorrectCustomer={(item) => void correctVerifiedCustomer(item)}
              onHistory={(item) => openWorkArea(item, "history")}
              onLogResult={(item) => openWorkArea(item, "log")}
              onReopenDoNotCall={(item) => void reopenDoNotCall(item)}
              onTogglePersonalStar={(item) => void togglePersonalStar(item)}
              onTogglePriority={(item) => void togglePriority(item)}
              struck={struck(door)}
              workedByMeToday={Boolean(door.myLastActivityAt && chicagoDateKey(door.myLastActivityAt) === today)}
            />
            {activeDoor?.id === door.id && workMode ? (
              <SalesInlineWorkArea
                callbackDate={callbackDate}
                discardWarning={discardWarning}
                door={activeDoor}
                error={panelError}
                loggedCall={loggedCall}
                message={undoMessage}
                mode={workMode}
                notes={notes}
                onCallbackChange={setCallbackDate}
                onClose={finishCloseWorkArea}
              onDiscard={discardAndMove}
                onKeepWorking={() => setDiscardWarning(false)}
                onNotesChange={setNotes}
                onOutcome={(outcome) => void logCall(outcome)}
                onSubmitVerification={(claim) => void submitVerification(claim)}
                onUndo={(call) => void undoCall(call)}
                onWithdrawRequest={(request) => void withdrawVerification(request)}
                saving={savingCall}
                undoing={undoingCall}
                canWork={canWork}
                toolkitBusy={toolkitBusy}
                onPrevious={() => moveToDoor(-1)}
                onNext={() => moveToDoor(1)}
                hasPrevious={snapshot.page > 0 || filteredDoors.findIndex((item) => item.id === activeDoor.id) > 0}
                hasNext={snapshot.page * snapshot.pageSize + filteredDoors.findIndex((item) => item.id === activeDoor.id) + 1 < snapshot.totalMatching}
                positionLabel={`Store ${snapshot.page * snapshot.pageSize + filteredDoors.findIndex((item) => item.id === activeDoor.id) + 1} of ${snapshot.totalMatching}`}
                hasMoreHistory={hasMoreHistory}
                onMoreHistory={() => void loadDoorHistory(activeDoor.id, activeDoor.callHistory.at(-1)?.id)}
                tools={<SalesToolkit key={`${snapshot.user.id}:${activeDoor.id}:${workMode}`} door={activeDoor} userId={snapshot.user.id} isSuper={Boolean(isSuper)} mode={workMode} notes={notes} externalBusy={savingCall || undoingCall} onNoteSaved={() => { setNotes(""); setLoggedCall(null); }} onAvailability={setCanWork} onDirtyChange={setToolkitDirty} onBusyChange={setToolkitBusy} />}
              />
            ) : null}
          </div>
        ))}
        {!filteredDoors.length ? <p className={styles.emptyState}>{queue === "callbacks" ? "You're caught up—no callbacks are due in this view." : queue === "upcoming" ? "No upcoming callbacks in this view." : queue === "stars" ? "No starred stores in this view. Use the star on a store you want to return to." : "No stores match these filters. Try Clear filters or another city."}</p> : null}
      </section>
      <nav className={styles.listPagination} aria-label="Store list pages">
        <button type="button" disabled={loadingData || snapshot.page === 0} onClick={() => changeFilters({ page: snapshot.page - 1 })}>← Previous page</button>
        <span>{snapshot.totalMatching ? snapshot.page * snapshot.pageSize + 1 : 0}–{Math.min((snapshot.page + 1) * snapshot.pageSize, snapshot.totalMatching)} of {snapshot.totalMatching}</span>
        <button type="button" disabled={loadingData || (snapshot.page + 1) * snapshot.pageSize >= snapshot.totalMatching} onClick={() => changeFilters({ page: snapshot.page + 1 })}>Next page →</button>
      </nav>

    </main>
  );
}

"use client";

import Link from "next/link";
import { SalesEmail } from "@/components/contact/sales-email";
import { SiteHeader } from "@/components/presidential/layout/site-header";
import { SiteFooter } from "@/components/presidential/layout/site-footer";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createSalesDateKey,
  displayDoorName,
  formatSalesDate,
  salesOutcome,
  type DoorStatus,
  type SalesAdminEvent,
  type SalesCall,
  type SalesContactProgress,
  type SalesDoor,
  type SalesOutcome,
  type SalesRepActivity,
  type SalesRole,
  type SalesSnapshot,
  type SalesVerificationClaim,
  type SalesVerificationRequest,
  SALES_TIME_ZONE,
} from "@/lib/sales";

import legacyStyles from "./sales.module.css";
import ui from "./sales-v2.module.css";
import type { WorkflowState } from "@/lib/sales-workflow";
import type { TodayResponse, TodayTask, TodayBucket } from "@/lib/sales-today";
import { SalesWorkspace } from "./sales-workspace";
import { SalesStoreRow } from "./sales-store-row";
import { SalesWorkspaceTools } from "./sales-workspace-tools";
import { SalesDataReview } from "./sales-data-review";

const styles = { ...legacyStyles, ...ui };

type ArchivedAccount = Readonly<{
  target: { id: number; name: string; stateCode: string; city: string | null; streetAddress: string | null; phone: string | null; email: string | null };
  calls: readonly SalesCall[];
  notes: readonly { id: number; text: string; repName: string; createdAt: string; undone: boolean }[];
  callback: { ownerName: string; dueAt: string; note: string | null; status: string } | null;
  hasMore: boolean;
}>;

type DispensaryFilter = "all" | "purchasing" | "not_purchasing";
type WorkQueue = "all" | "worked" | "stars" | "callbacks" | "upcoming";
type BrowseFilters = { city: string; search: string; filter: DispensaryFilter; queue: WorkQueue; page: number };

type ApiResponse = Readonly<{
  success?: boolean;
  mustChangePin?: boolean;
  username?: string;
  authenticated?: boolean;
  error?: string;
  call?: SalesCall;
  contactProgress?: SalesContactProgress;
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
  all: "All states",
  AZ: "ARIZONA",
  NY: "NEW YORK",
  OK: "OKLAHOMA",
};

function roleLabel(role: SalesRole): string {
  return role === "super_master" ? "SUPER MASTER" : role === "master" ? "MASTER" : "SALES REP";
}

type SalesDateKey = ReturnType<typeof createSalesDateKey>;

function calledToday(door: SalesDoor, today: string, dateKey: SalesDateKey): boolean {
  return Boolean(door.lastCall && dateKey(door.lastCall.calledAt) === today);
}

function callbackDue(door: SalesDoor, today: string, dateKey: SalesDateKey): boolean {
  return Boolean(door.nextCallbackAt && dateKey(door.nextCallbackAt) <= today);
}

function struck(door: SalesDoor): boolean {
  return Boolean(door.lastCall && STRUCK_OUTCOMES.has(door.lastCall.outcome));
}



export function SalesApp({ initiallyAuthenticated }: Readonly<{ initiallyAuthenticated: boolean }>) {
  const requestSequence = useRef(0);
  const activitySequence = useRef(0);
  const historySequence = useRef(0);
  const browseAbort = useRef<AbortController | null>(null);
  const browseFilters = useRef<BrowseFilters>({ city: "", search: "", filter: "not_purchasing", queue: "all", page: 0 });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMove = useRef<(() => void) | null>(null);
  const callRequest = useRef<{ signature: string; id: string; body: Record<string, unknown> } | null>(null);
  const [callPending, setCallPending] = useState(false);
  const [toolPending, setToolPending] = useState(false);
  const [view, setView] = useState<"today" | "dispensaries" | "team" | "management">("today");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [browseDoorIds, setBrowseDoorIds] = useState<readonly number[]>([]);
  const [workflowSummaries, setWorkflowSummaries] = useState<WorkflowState["summaries"]>([]);
  const [todayData, setTodayData] = useState<TodayResponse | null>(null);
  const [todayBucket, setTodayBucket] = useState<TodayBucket>("due");
  const [todayState, setTodayState] = useState("all");
  const [todayBusy, setTodayBusy] = useState(false);
  const [todayError, setTodayError] = useState("");
  const todaySequence = useRef(0);
  const taskSequence = useRef(0);
  const [openingTask, setOpeningTask] = useState<number | null>(null);
  const [taskRestriction, setTaskRestriction] = useState<string | null>(null);
  const [archivedAccount, setArchivedAccount] = useState<ArchivedAccount | null>(null);
  const [queue, setQueue] = useState<WorkQueue>("all");
  const [canWork, setCanWork] = useState(false);
  const [toolkitDirty, setToolkitDirty] = useState(false);
  const [toolkitBusy, setToolkitBusy] = useState(false);
  const [notesActionsTarget, setNotesActionsTarget] = useState<HTMLDivElement | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [dataReviewOpen, setDataReviewOpen] = useState(false);
  const [reviewState, setReviewState] = useState("AZ");
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
  const [pinChangeRequired, setPinChangeRequired] = useState(false);
  const [creatingRep, setCreatingRep] = useState(false);
  const [createdRepMessage, setCreatedRepMessage] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("ALL CITIES");
  const [dispensaryFilter, setDispensaryFilter] = useState<DispensaryFilter>("not_purchasing");
  const [activeDoorId, setActiveDoorId] = useState<number | null>(null);
  const activeDoorRef = useRef<number | null>(null);
  const [workMode, setWorkMode] = useState<"log" | "history" | null>(null);
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const savedNotesRef = useRef("");
  const notesDirty = notes !== savedNotes;
  const loadSharedNotes = useCallback((value: string) => {
    const previous = savedNotesRef.current;
    savedNotesRef.current = value;
    setSavedNotes(value);
    setNotes((current) => current === previous ? value : current);
  }, []);
  const rememberSavedNotes = useCallback((value: string) => {
    savedNotesRef.current = value;
    setSavedNotes(value);
  }, []);
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
      const selectedState = filters.search.trim() ? "all" : state ?? "all";
      const query = new URLSearchParams({ geography: "global", state: selectedState, city: filters.search.trim() ? "" : filters.city, search: filters.search, filter: filters.filter, queue: filters.queue, page: String(filters.page), tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const response = await fetch(`/api/sales?${query}`, { cache: "no-store", signal: controller.signal });
      if (sequence !== requestSequence.current) return null;
      if (response.status === 401 || response.status === 403) {
        ++todaySequence.current; ++taskSequence.current;
        setTodayData(null); setTodayError(""); setTodayBusy(false); setArchivedAccount(null);
        setSnapshot(null);
        setActivity([]); setAdminEvents([]); setTeamPanelOpen(false); setActivityOpen(false); setDataReviewOpen(false);
        if (response.status === 403) {
          const payload = (await response.json()) as { error?: string };
          setLoginError(payload.error ?? "This sales account is inactive.");
        }
        return null;
      }
      const payload = (await response.json()) as SalesSnapshot & { error?: string; mustChangePin?: boolean; workflowSummaries?: WorkflowState["summaries"] };
      if (!response.ok || !payload.authenticated) throw new Error(payload.error ?? "Sales data is temporarily unavailable.");
      if (sequence !== requestSequence.current) return null;
      if (payload.mustChangePin) {
        ++todaySequence.current; ++taskSequence.current;
        setTodayData(null); setTodayError(""); setTodayBusy(false); setArchivedAccount(null);
        setSnapshot(null);
        setPinChangeRequired(true);
        setActivity([]); setAdminEvents([]); setTeamPanelOpen(false); setActivityOpen(false);
        return null;
      }
      setPinChangeRequired(false);
      setWorkflowSummaries(payload.workflowSummaries ?? []);
      setBrowseDoorIds(payload.doors.map((door) => door.id));
      setSnapshot((current) => ({
        ...payload,
        doors: [...payload.doors.map((door) => {
          const previous = current?.doors.find((item) => item.id === door.id);
          return previous ? { ...door, callHistory: previous.callHistory, contactProgress: previous.contactProgress } : door;
        }), ...(current?.doors.filter((door) => door.id === activeDoorRef.current && !payload.doors.some((item) => item.id === door.id)) ?? [])],
      }));
      try { sessionStorage.setItem("presidential.sales.user", payload.user.username); } catch { /* Preferences are optional. */ }
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
      if (notesDirty) sessionStorage.setItem(key, notes); else sessionStorage.removeItem(key);
    } catch { /* Draft protection still applies when storage is disabled. */ }
  }, [notes, notesDirty, activeDoorId, workMode, snapshot?.user.id]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (notesDirty || toolkitDirty || savingCall || toolkitBusy || callPending || toolPending) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [notesDirty, toolkitDirty, savingCall, toolkitBusy, callPending, toolPending]);

  const timeZone = snapshot?.timeZone ?? SALES_TIME_ZONE;
  const dateKey = useMemo(() => createSalesDateKey(timeZone), [timeZone]);
  const today = dateKey();
  const cities = snapshot?.cities ?? [];
  const filteredDoors = (snapshot?.doors ?? []).filter((door) => browseDoorIds.includes(door.id));

  const activeDoor = snapshot?.doors.find((door) => door.id === activeDoorId) ?? null;
  const isSuper = snapshot?.user.role === "super_master";
  const canSeeActivity = Boolean(snapshot);
  const visibleActivity = activity;
  const visibleExecutiveRequests = snapshot?.verificationRequests ?? [];

  function openWorkArea(door: SalesDoor, mode: "log" | "history") {
    if (mode === "log" && (door.isPurchasing || door.doNotCallLocked || taskRestriction)) return;
    if (activeDoorId === door.id && workMode === mode) {
      finishCloseWorkArea();
      return;
    }
    requestMove(() => {
    listScrollY.current = window.scrollY;
    openListOrder.current = filteredDoors.map((item) => item.id);
    setActiveDoorId(door.id);
    activeDoorRef.current = door.id;
    setWorkMode(mode);
    let draft = "";
    try { draft = sessionStorage.getItem(`presidential.sales.draft:${snapshot?.user.id}:${door.id}`) ?? ""; } catch { /* Optional draft recovery. */ }
    setNotes(mode === "log" ? draft : "");
    rememberSavedNotes("");
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
    if (callPending || toolPending) { setPanelError("Confirm the pending save result before leaving this account. Your work is still here."); return; }
    if (activeDoorId && (notesDirty || toolkitDirty)) {
      pendingMove.current = action;
      setDiscardWarning(true);
      return;
    }
    ++taskSequence.current;
    if (activeDoorId) closeWorkAreaImmediately();
    action();
  }

  function finishCloseWorkArea() {
    requestMove(() => { if (snapshot) void loadSnapshot(snapshot.selectedState, browseFilters.current, true); });
  }

  function discardAndMove() {
    if (callPending || toolPending || savingCall || toolkitBusy) return;
    const next = pendingMove.current;
    pendingMove.current = null;
    try { sessionStorage.removeItem(`presidential.sales.draft:${snapshot?.user.id}:${activeDoorId}`); } catch { /* Optional storage. */ }
    closeWorkAreaImmediately();
    ++taskSequence.current;
    next?.();
  }

  async function loadDoorHistory(doorId: number, before?: number) {
    const historyRequest = ++historySequence.current;
    try {
      const response = await fetch(`/api/sales?resource=history&doorId=${doorId}${before ? `&before=${before}` : ""}`, { cache: "no-store" });
      const data = await response.json() as { calls: SalesCall[]; hasMore: boolean; contactProgress: SalesContactProgress; error?: string };
      if (historyRequest !== historySequence.current) return;
      if (!response.ok) throw new Error(data.error ?? "History unavailable.");
      setSnapshot((current) => current ? { ...current, doors: current.doors.map((door) => door.id === doorId ? { ...door, callHistory: before ? [...door.callHistory, ...data.calls] : data.calls, contactProgress: data.contactProgress } : door) } : current);
      setHasMoreHistory(data.hasMore);
    } catch (cause) { setPanelError(cause instanceof Error ? cause.message : "History unavailable."); }
  }

  function changeFilters(update: Partial<BrowseFilters>, state?: string) {
    requestMove(() => {
      const next = { ...browseFilters.current, ...update, page: update.page ?? 0 };
      if (state !== undefined || update.city !== undefined) next.search = "";
      const selectedState = next.search.trim() ? "all" : state ?? snapshot?.selectedState ?? "all";
      if (next.search.trim()) next.city = "";
      browseFilters.current = next;
      ++requestSequence.current;
      browseAbort.current?.abort();
      setLoadingData(true);
      setSnapshot(current => current ? { ...current, selectedState } : current);
      setCity(next.city || "ALL CITIES"); setSearch(next.search); setDispensaryFilter(next.filter); setQueue(next.queue);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (update.search !== undefined) searchTimer.current = setTimeout(() => void loadSnapshot(selectedState, next), 250);
      else void loadSnapshot(selectedState, next).then(() => { if (update.page !== undefined) document.querySelector('[aria-label="Licensed dispensary doors"]')?.scrollIntoView({ block: "start" }); });
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
    if (activeDoorId && workMode === "log") void fetch("/api/sales/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "release_claim", doorId: activeDoorId }), keepalive: true }).catch(() => {});
    openListOrder.current = null;
    setActiveDoorId(null); activeDoorRef.current = null;
    setWorkMode(null);
    setLoggedCall(null);
    setNotes("");
    rememberSavedNotes("");
    setCallbackDate("");
    setPanelError("");
    setUndoMessage("");
    setDiscardWarning(false);
    setToolkitDirty(false); setToolkitBusy(false); setCanWork(false); setCallPending(false); setToolPending(false); setTaskRestriction(null); callRequest.current = null;
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
    setSettingUp(true);
    setLoginError("");
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup_rep", setupCode: form.get("setupCode"), username: form.get("username") }),
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
      if (pinChangeRequired) await loadSnapshot();
    } catch (error) {
      setPinMessage(error instanceof Error ? error.message : "Your PIN could not be changed.");
    } finally {
      setChangingPin(false);
    }
  }

  async function createRep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingRep) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setCreatingRep(true);
    setCreatedRepMessage("");
    try {
      const created = await postAction({ action: "create_rep", username: form.get("username"), displayName: form.get("displayName") });
      formElement.reset();
      setCreatedRepMessage(`Account created: ${created.username}. Temporary PIN: 0000. They must choose a new 4-digit PIN at first login.`);
      await loadActivity(true);
    } catch (error) {
      setCreatedRepMessage(error instanceof Error ? error.message : "Account creation failed.");
    } finally {
      setCreatingRep(false);
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
      if (!window.confirm(`Reset ${rep.displayName} to temporary PIN 0000? They must choose a new PIN at next login.`)) return;
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
    ++requestSequence.current; ++activitySequence.current; ++todaySequence.current; ++taskSequence.current;
    setTodayData(null); setTodayError(""); setTodayBusy(false); setArchivedAccount(null);
    browseAbort.current?.abort();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    await fetch("/api/sales", { method: "DELETE" });
    try { const prefix = `presidential.sales.draft:${snapshot?.user.id}:`; for (const key of Object.keys(sessionStorage)) if (key.startsWith(prefix)) sessionStorage.removeItem(key); } catch { /* Optional drafts. */ }
    setSnapshot(null);
    setPinChangeRequired(false);
    setActivity([]);
    setAdminEvents([]);
    setActivityOpen(false);
    setTeamPanelOpen(false);
    setActiveDoorId(null); activeDoorRef.current = null;
    setWorkMode(null);
    setView("today"); setMenuOpen(false); setCallPending(false); setToolPending(false); setTodayData(null);
    setNotes(""); rememberSavedNotes(""); setToolkitDirty(false); setDataReviewOpen(false); setReady(true); setLoadingData(false);
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
    navigate("team");
  }

  async function logCall(outcome: SalesOutcome) {
    if (!activeDoor || !snapshot || savingCall || toolkitBusy || !canWork || callPending || toolPending || taskRestriction) return;
    const body = { action: "log_call", doorId: activeDoor.id, outcome, notes, callbackDate: outcome === "do_not_call" ? null : callbackDate || null };
    const signature = JSON.stringify(body);
    if (callRequest.current?.signature !== signature) callRequest.current = { signature, id: crypto.randomUUID(), body };
    await sendCallRequest();
  }

  async function sendCallRequest(recovering = false) {
    const request = callRequest.current;
    if (!request || !activeDoor || !snapshot || savingCall) return;
    const doorId = activeDoor.id;
    setSavingCall(true); setPanelError("");
    let definiteFailure = false;
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request.body, requestId: request.id }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.success || !payload.call) {
        definiteFailure = !recovering && response.status >= 400 && response.status < 500;
        throw new Error(payload.error ?? "The call save result could not be confirmed.");
      }
      const savedCall = payload.call;
      setSnapshot((current) => current ? {
        ...current,
        doors: current.doors.map((door) => door.id === doorId ? {
          ...door,
          status: payload.status ?? door.status,
          nextCallbackAt: payload.nextCallbackAt === undefined ? door.nextCallbackAt : payload.nextCallbackAt,
          callHistory: [savedCall, ...door.callHistory.filter((call) => call.id !== savedCall.id).map((call) => ({ ...call, undoEligible: false }))],
          contactProgress: payload.contactProgress,
          lastCall: savedCall,
          myLastActivityAt: savedCall.calledAt,
          doNotCallLocked: savedCall.outcome === "do_not_call" || door.doNotCallLocked,
        } : door),
      } : current);
      setLoggedCall(savedCall);
      setCallbackDate(""); callRequest.current = null; setCallPending(false);
      setUndoMessage("Call saved. Shared notes and the scheduled follow-up have their own save controls.");
      // A call contains a note snapshot; it does not save or clear the shared-note draft.
      void loadSnapshot(snapshot.selectedState, browseFilters.current, true);
      void loadToday(todayBucket, todayState, timeZone);
    } catch (error) {
      setCallPending(!definiteFailure);
      setPanelError(error instanceof Error ? error.message : "The call save result could not be confirmed.");
      if (definiteFailure) callRequest.current = null;
    } finally {
      setSavingCall(false);
    }
  }

  async function recoverCall(): Promise<boolean> {
    const request = callRequest.current;
    if (!request || !activeDoor || savingCall) return false;
    const doorId = activeDoor.id;
    setSavingCall(true); setPanelError("");
    try {
      const params = new URLSearchParams({ resource: "operation_status", requestId: request.id, action: "log_call" });
      const response = await fetch(`/api/sales?${params}`, { cache: "no-store" });
      const receipt = await response.json() as { recorded?: boolean; error?: string };
      if (!response.ok) throw new Error(receipt.error ?? "Save status could not be checked.");
      if (!receipt.recorded) { setPanelError("The result is still unknown. Keep this account open. You can check again or retry the same preserved request."); return false; }
      callRequest.current = null; setCallPending(false); setCallbackDate("");
      setUndoMessage("Call save confirmed. Shared notes and follow-ups save separately.");
      await refreshAccount(doorId);
      if (snapshot) await loadSnapshot(snapshot.selectedState, browseFilters.current, true);
      void loadToday(todayBucket, todayState, timeZone);
      return true;
    } catch (cause) { setPanelError(cause instanceof Error ? cause.message : "Save status could not be checked."); return false; }
    finally { setSavingCall(false); }
  }

  async function retryPendingCall() {
    if (!callPending || !callRequest.current || savingCall || toolkitBusy) return;
    // Reuse the exact UUID and original payload so the receipt deduplicates a committed save.
    const confirmed = await recoverCall();
    if (!confirmed && callRequest.current) await sendCallRequest(true);
  }

  async function refreshAccount(doorId: number) {
    const response = await fetch(`/api/sales?resource=account&doorId=${doorId}`, { cache: "no-store" });
    const data = await response.json() as { door?: SalesDoor; error?: string };
    if (!response.ok || !data.door) throw new Error(data.error ?? "Account refresh could not be completed.");
    const door = data.door;
    setSnapshot((current) => current ? { ...current, doors: [...current.doors.filter((item) => item.id !== door.id), door] } : current);
    await loadDoorHistory(doorId);
  }

  async function clearContactOutcome(outcome: SalesOutcome, callId: number) {
    if (!activeDoor || undoingCall || savingCall || toolkitBusy || callPending || toolPending) return;
    const doorId = activeDoor.id;
    setUndoingCall(true);
    setPanelError("");
    setUndoMessage("");
    try {
      const payload = await postAction({ action: "clear_contact_outcome", doorId, outcome, callId });
      setSnapshot((current) => current ? {
        ...current,
        doors: current.doors.map((door) => door.id === doorId ? {
          ...door, contactProgress: payload.contactProgress ?? door.contactProgress,
        } : door),
      } : current);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The shared status could not be cleared.");
      await loadDoorHistory(doorId);
    } finally {
      setUndoingCall(false);
    }
  }

  async function undoCall(call: SalesCall) {
    if (!activeDoor || !snapshot || undoingCall || savingCall || toolkitBusy || callPending || toolPending) return;
    setUndoingCall(true);
    setPanelError("");
    setUndoMessage("");
    try {
      const payload = await postAction({ action: "undo_call", callId: call.id });
      setSnapshot((current) => current ? {
        ...current,
        doors: current.doors.map((door) => door.id === activeDoor.id ? {
          ...door,
          contactProgress: payload.contactProgress ?? door.contactProgress,
          callHistory: door.callHistory.map((item) => item.id === call.id ? { ...item, undone: true, undoEligible: false } : item),
        } : door),
      } : current);
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
    if (!activeDoor || !snapshot || savingCall || toolkitBusy || callPending || toolPending) return;
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
      setCallbackDate("");
      setUndoMessage(`${claimLabel} REPORT SUBMITTED. It is awaiting owner verification.`);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The verification request could not be submitted.");
    } finally {
      setSavingCall(false);
    }
  }

  async function withdrawVerification(request: SalesVerificationRequest) {
    if (!snapshot || undoingCall || savingCall || toolkitBusy || callPending || toolPending) return;
    setUndoingCall(true);
    setPanelError("");
    try {
      await postAction({ action: "withdraw_verification_request", requestId: request.id });
      await loadSnapshot(snapshot.selectedState);
      setUndoMessage(`${request.claimedStatus === "sold" ? "SOLD" : "ALREADY CARRIES"} REPORT WITHDRAWN.`);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "The request could not be withdrawn.");
    } finally {
      setUndoingCall(false);
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
      setActiveDoorId(null); activeDoorRef.current = null;
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

  const loadToday = useCallback(async (bucket: TodayBucket, state: string, timeZone: string, cursor?: string) => {
    const sequence = ++todaySequence.current;
    setTodayBusy(true); setTodayError("");
    try {
      const params = new URLSearchParams({ bucket, state, tz: timeZone });
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`/api/sales/today?${params}`, { cache: "no-store" });
      const data = await response.json() as TodayResponse & { error?: string };
      if (sequence !== todaySequence.current) return;
      if (!response.ok || !Array.isArray(data.tasks)) throw new Error(data.error ?? "Follow-ups could not be loaded.");
      setTodayData((current) => cursor && current ? { ...data, tasks: [...current.tasks, ...data.tasks] } : data);
    } catch (cause) { if (sequence === todaySequence.current) setTodayError(cause instanceof Error ? cause.message : "Follow-ups could not be loaded."); }
    finally { if (sequence === todaySequence.current) setTodayBusy(false); }
  }, []);

  useEffect(() => {
    if (!snapshot?.user.id) return;
    // Loading a selected view is an external read, never a CRM write.
    void loadToday(todayBucket, todayState, timeZone);
  }, [snapshot?.user.id, todayBucket, todayState, timeZone, loadToday]);

  function navigate(next: typeof view) {
    requestMove(() => {
      setView(next); setMenuOpen(false); setDataReviewOpen(false); setChangePinOpen(false); setTeamPanelOpen(false);
      setArchivedAccount(null);
      setActivityOpen(next === "team");
      if (next === "team") void loadActivity(Boolean(isSuper));
      if (next === "today") void loadToday(todayBucket, todayState, timeZone);
      window.scrollTo({ top: 0 });
    });
  }

  function openManagement(kind: "team" | "data" | "pin") {
    requestMove(() => {
      setView("management"); setMenuOpen(false); setTeamPanelOpen(kind === "team"); setDataReviewOpen(kind === "data"); setChangePinOpen(kind === "pin"); setActivityOpen(kind === "team");
      setArchivedAccount(null);
      if (kind === "team") void loadActivity(true);
    });
  }

  function refreshWorkspaceData() {
    if (!snapshot) return;
    void loadSnapshot(snapshot.selectedState, browseFilters.current, true);
    void loadToday(todayBucket, todayState, timeZone);
  }

  async function openTodayTask(task: TodayTask) {
    requestMove(() => {
      setOpeningTask(task.doorId); setTodayError("");
      const sequence = ++taskSequence.current;
      void (async () => {
        try {
          const targetId = task.directoryId ?? task.doorId;
          const response = await fetch(`/api/sales?resource=account&doorId=${targetId}`, { cache: "no-store" });
          const data = await response.json() as { door?: SalesDoor; error?: string };
          if (sequence !== taskSequence.current) return;
          if (!response.ok && (task.restriction === "archived" || response.status === 404)) {
            const archiveResponse = await fetch(`/api/sales?resource=archived_history&doorId=${task.doorId}`, { cache: "no-store" });
            const archive = await archiveResponse.json() as ArchivedAccount & { error?: string };
            if (sequence !== taskSequence.current) return;
            if (!archiveResponse.ok || !archive.target) throw new Error(archive.error ?? "Archived account history is unavailable.");
            setArchivedAccount(archive);
            return;
          }
          if (!response.ok || !data.door) throw new Error(data.error ?? "This account is no longer in the directory. Open its archived history from Needs attention.");
          const door = data.door;
          setSnapshot((current) => current ? { ...current, doors: [...current.doors.filter((item) => item.id !== door.id), door] } : current);
          openWorkArea(door, "history");
          setTaskRestriction(task.restriction);
        } catch (cause) { setTodayError(cause instanceof Error ? cause.message : "This follow-up account could not be opened."); }
        finally { setOpeningTask(null); }
      })();
    });
  }

  async function loadMoreArchive() {
    if (!archivedAccount || openingTask !== null || !archivedAccount.hasMore) return;
    const targetId = archivedAccount.target.id;
    const before = archivedAccount.calls.at(-1)?.id;
    if (!before) return;
    const sequence = taskSequence.current;
    setOpeningTask(targetId); setPageError("");
    try {
      const response = await fetch(`/api/sales?resource=archived_history&doorId=${targetId}&before=${before}`, { cache: "no-store" });
      const data = await response.json() as ArchivedAccount & { error?: string };
      if (sequence !== taskSequence.current) return;
      if (!response.ok || !Array.isArray(data.calls)) throw new Error(data.error ?? "Older archived calls are unavailable.");
      setArchivedAccount((current) => current?.target.id === targetId ? { ...data, calls: [...current.calls, ...data.calls] } : current);
    } catch (cause) { setPageError(cause instanceof Error ? cause.message : "Older archived calls are unavailable."); }
    finally { setOpeningTask(null); }
  }

  if (!ready) return <main className={ui.app}><header className={ui.header}><span className={ui.brand}>PRESIDENTIAL</span></header><div className={ui.page}><p role="status">Opening your sales workspace…</p></div></main>;

  if (pinChangeRequired) {
    return <><SiteHeader /><main className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={changePin}>
        <span>PRESIDENTIAL INTERNAL</span>
        <h1>CHANGE YOUR PIN</h1>
        <p>Choose your own 4-digit PIN to finish signing in. The temporary PIN cannot be reused.</p>
        <label><span>New 4-digit PIN</span><input autoComplete="new-password" inputMode="numeric" maxLength={4} minLength={4} name="newPin" pattern="[0-9]{4}" required type="password" /></label>
        <label><span>Confirm 4-digit PIN</span><input autoComplete="new-password" inputMode="numeric" maxLength={4} minLength={4} name="confirmNewPin" pattern="[0-9]{4}" required type="password" /></label>
        <button disabled={changingPin} type="submit">{changingPin ? "UPDATING…" : "SAVE PIN AND OPEN CRM"}</button>
        {pinMessage || pageError ? <p className={styles.errorMessage} role="status">{pinMessage || pageError}</p> : null}
        <button disabled={changingPin} onClick={() => void logout()} type="button">SIGN OUT</button>
      </form>
    </main><SiteFooter /></>;
  }

  if (!snapshot) {
    return (
      <><SiteHeader />
      <main className={styles.loginPage}>
        <div className="w-full max-w-[31rem]">
        <form className={styles.loginCard} onSubmit={authMode === "login" ? login : setupRep}>
          <Link href="/">← Back to website</Link>
          <span>PRESIDENTIAL INTERNAL</span>
          <h1>{authMode === "login" ? "SALES LOGIN" : "CREATE LOGIN"}</h1>
          <div className={styles.authModeToggle}>
            <button className={authMode === "login" ? styles.activeAuthMode : ""} onClick={() => { setAuthMode("login"); setLoginError(""); }} type="button">SIGN IN</button>
            <button className={authMode === "setup" ? styles.activeAuthMode : ""} onClick={() => { setAuthMode("setup"); setLoginError(""); }} type="button">CREATE USERNAME + PIN</button>
          </div>
          <p>{authMode === "login" ? "Use your username and 4-digit PIN. First time signing in? Start with 0000, then choose your own PIN." : "Enter the shared sales team signup code and choose your username. Your temporary PIN is 0000; choose your own PIN on the next screen."}</p>
          {authMode === "setup" ? (
            <label><span>Sales team signup code</span><input autoCapitalize="characters" autoComplete="off" maxLength={40} name="setupCode" placeholder="ABCD-EFGH" required type="text" /></label>
          ) : null}
          <label><span>Username</span><input autoCapitalize="none" autoComplete="username" maxLength={32} name="username" pattern="[A-Za-z][A-Za-z0-9]*" placeholder="joemason" required type="text" /></label>
          {authMode === "login" ? <label><span>4-digit PIN</span><input autoComplete="current-password" inputMode="numeric" maxLength={4} minLength={4} name="password" pattern="[0-9]{4}" required type="password" /></label> : <p>Temporary PIN: 0000</p>}
          <button disabled={loggingIn || settingUp} type="submit">{authMode === "login" ? loggingIn ? "SIGNING IN…" : "SIGN IN" : settingUp ? "CREATING…" : "CREATE MY LOGIN"}</button>
          {loginError || pageError ? <p className={styles.errorMessage}>{loginError || pageError}</p> : null}
        </form>
        <SalesEmail variant="strip" prefix="Need a retailer account? Email" />
        </div>
      </main>
      <SiteFooter /></>
    );
  }

  return (
    <main className={ui.app}>
      <header className={ui.header}>
        <Link className={ui.brand} href="/sales" onClick={(event) => { event.preventDefault(); navigate("today"); }}>PRESIDENTIAL<span>Sales workspace</span></Link>
        <nav className={ui.desktopNav} aria-label="Main navigation">
          <button type="button" aria-current={view === "today" ? "page" : undefined} onClick={() => navigate("today")}>Today</button>
          <button type="button" aria-current={view === "dispensaries" ? "page" : undefined} onClick={() => navigate("dispensaries")}>Dispensaries</button>
          <button type="button" aria-current={view === "team" ? "page" : undefined} onClick={() => navigate("team")}>Team activity</button>
        </nav>
        <div className={ui.headerAccount}><span>{snapshot.user.name}<small>{roleLabel(snapshot.user.role)}</small></span><button type="button" aria-expanded={menuOpen} aria-controls="sales-account-menu" onClick={() => requestMove(() => setMenuOpen((current) => !current))}>Menu</button></div>
      </header>
      <div className={ui.page}>
        {menuOpen ? <section className={ui.menu} id="sales-account-menu" aria-label="Account and management menu">
          <div><strong>{snapshot.user.name}</strong><span>@{snapshot.user.username} · {roleLabel(snapshot.user.role)}</span></div>
          <button type="button" onClick={() => navigate("team")}>Team activity & reports</button>
          {isSuper ? <><button type="button" onClick={() => openManagement("team")}>Owner controls & audit history</button><button type="button" onClick={() => openManagement("data")}>Data review ({snapshot.unlinkedCustomerCount})</button></> : null}
          <button type="button" onClick={() => openManagement("pin")}>Change my PIN</button>
          <button type="button" onClick={() => requestMove(() => window.location.assign("/"))}>Presidential website</button>
          <button disabled={savingCall || toolkitBusy} type="button" onClick={() => requestMove(() => void logout())}>Sign out</button>
        </section> : null}
        {pageError ? <p className={ui.error} role="alert">{pageError}</p> : null}
        {archivedAccount ? <section className={ui.archive}>
          <button type="button" onClick={() => requestMove(() => setArchivedAccount(null))}>Back to follow-ups</button>
          <div className={ui.heading}><div><p>Archived source account · Read only</p><h1>{archivedAccount.target.name}</h1><span>{[archivedAccount.target.city, archivedAccount.target.stateCode].filter(Boolean).join(", ")}</span></div></div>
          <p className={ui.notice}>This account is no longer in the current calling directory. Its notes and history remain available. Contact actions, edits and undo are unavailable here. The follow-up remains visible under Needs attention.</p>
          <article><h2>Recorded contact information</h2><p>{archivedAccount.target.streetAddress || "Address not recorded"}</p><p>{archivedAccount.target.phone || "Phone not recorded"}</p><p>{archivedAccount.target.email || "Email not recorded"}</p></article>
          {archivedAccount.callback ? <article><h2>Follow-up</h2><p>{formatSalesDate(archivedAccount.callback.dueAt, true, timeZone)} · {archivedAccount.callback.ownerName} · {archivedAccount.callback.status}</p>{archivedAccount.callback.note ? <p>{archivedAccount.callback.note}</p> : null}</article> : null}
          <article><h2>Shared notes</h2>{archivedAccount.notes.length ? archivedAccount.notes.map((note) => <div key={note.id}><p>{note.undone ? "Note undone · Original retained" : note.text}</p><small>{note.repName} · {formatSalesDate(note.createdAt, true, timeZone)}</small></div>) : <p>No shared notes recorded.</p>}</article>
          <article><h2>Call history</h2>{archivedAccount.calls.length ? archivedAccount.calls.map((call) => <div key={call.id}><strong>{salesOutcome(call.outcome).label}{call.undone ? " · Undone" : ""}</strong><p>{call.repName} · {formatSalesDate(call.calledAt, true, timeZone)}</p>{call.notes ? <p>{call.notes}</p> : null}</div>) : <p>No calls recorded.</p>}{archivedAccount.hasMore ? <button type="button" disabled={openingTask !== null} onClick={() => void loadMoreArchive()}>Older calls</button> : null}</article>
        </section> : activeDoor && workMode ? <>
          {taskRestriction ? <p className={ui.notice}>This follow-up requires attention: {taskRestriction.replaceAll("_", " ")}. Account context is read only. Review or complete the scheduled follow-up below.</p> : null}
          {callPending ? <div className={ui.error} role="alert"><strong>Call save result is not confirmed.</strong><p>Your original request is kept. Check its result before leaving this account or recording another outcome.</p><button disabled={savingCall} type="button" onClick={() => void recoverCall()}>Check save status</button><button disabled={savingCall} type="button" onClick={() => void retryPendingCall()}>Retry the same save</button></div> : null}
<SalesWorkspace
                onBeginContact={!taskRestriction && !activeDoor.isPurchasing && !activeDoor.doNotCallLocked ? () => openWorkArea(activeDoor, "log") : undefined}
                callbackDate={callbackDate}
                discardWarning={discardWarning}
                door={activeDoor}
                timeZone={timeZone}
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
                onClearOutcome={(outcome, callId) => void clearContactOutcome(outcome, callId)}
                onWithdrawRequest={(request) => void withdrawVerification(request)}
                saving={savingCall || callPending || toolPending}
                undoing={undoingCall}
                canWork={canWork && !toolPending && !callPending}
                toolkitBusy={toolkitBusy}
                onPrevious={() => moveToDoor(-1)}
                onNext={() => moveToDoor(1)}
                hasPrevious={view === "dispensaries" && (snapshot.page > 0 || filteredDoors.findIndex((item) => item.id === activeDoor.id) > 0)}
                hasNext={view === "dispensaries" && filteredDoors.some((item) => item.id === activeDoor.id) && snapshot.page * snapshot.pageSize + filteredDoors.findIndex((item) => item.id === activeDoor.id) + 1 < snapshot.totalMatching}
                positionLabel={view === "dispensaries" && filteredDoors.some((item) => item.id === activeDoor.id) ? `Store ${snapshot.page * snapshot.pageSize + filteredDoors.findIndex((item) => item.id === activeDoor.id) + 1} of ${snapshot.totalMatching}` : "Follow-up account"}
                hasMoreHistory={hasMoreHistory}
                onMoreHistory={() => void loadDoorHistory(activeDoor.id, activeDoor.callHistory.at(-1)?.id)}
                onNotesActionsTarget={setNotesActionsTarget}
                tools={<SalesWorkspaceTools key={`${snapshot.user.id}:${activeDoor.id}:${workMode}`} door={activeDoor} timeZone={timeZone} userId={snapshot.user.id} isSuper={Boolean(isSuper)} mode={workMode} notes={notes} notesActionsTarget={notesActionsTarget} externalBusy={savingCall || undoingCall || callPending} onNoteSaved={rememberSavedNotes} onNotesLoaded={loadSharedNotes} onAvailability={setCanWork} onDirtyChange={setToolkitDirty} onBusyChange={setToolkitBusy} onPendingChange={setToolPending} onChanged={refreshWorkspaceData} />}
              />
        </> : <>
          {view === "team" || view === "management" ? <div className={ui.management}>
            <div className={ui.heading}><div><p>Presidential sales</p><h1>{view === "team" ? "Team activity" : "Account & owner tools"}</h1></div><button type="button" onClick={() => navigate("dispensaries")}>Find a dispensary</button></div>
      {teamPanelOpen && isSuper ? (
        <section className={styles.teamAdminPanel}>
          <form className={styles.teamCodeForm} onSubmit={createRep}>
            <strong>CREATE SALES REP</strong>
            <label><span>Full name</span><input maxLength={120} name="displayName" required type="text" /></label>
            <label><span>Username</span><input autoCapitalize="none" maxLength={32} name="username" pattern="[A-Za-z][A-Za-z0-9]*" required type="text" /></label>
            <p>Temporary PIN: 0000. The new rep must change it before using the CRM.</p>
            <button disabled={creatingRep} type="submit">{creatingRep ? "CREATING…" : "CREATE USER"}</button>
            {createdRepMessage ? <p role="status">{createdRepMessage}</p> : null}
          </form>
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
          <label><span>New 4-digit PIN</span><input autoComplete="new-password" inputMode="numeric" maxLength={4} minLength={4} name="newPin" pattern="[0-9]{4}" required type="password" /></label>
          <label><span>Confirm PIN</span><input autoComplete="new-password" inputMode="numeric" maxLength={4} minLength={4} name="confirmNewPin" pattern="[0-9]{4}" required type="password" /></label>
          <button disabled={changingPin} type="submit">{changingPin ? "UPDATING…" : "SAVE MY PIN"}</button>
          {pinMessage ? <p role="status">{pinMessage}</p> : null}
        </form>
      ) : null}

      {activityOpen && canSeeActivity ? (
        <section className={styles.activityPanel} id="rep-activity">
          <div className={styles.sectionHeading}><div><span>SHARED TEAM VISIBILITY</span><h2>REP ACTIVITY</h2></div><button disabled={adminBusy} onClick={() => void loadActivity(Boolean(isSuper))} type="button">REFRESH</button></div>
          <section className={styles.verificationRequests}>
            <h3>CUSTOMER VERIFICATION REQUESTS</h3>
            {visibleExecutiveRequests.length ? visibleExecutiveRequests.map((request) => (
              <article key={request.id}>
                <div>
                  <strong>{request.storeName} · {request.stateCode}{request.city ? ` · ${request.city}` : ""}</strong>
                  <span>{request.claimedStatus === "sold" ? "SOLD" : "ALREADY CARRIES PRESIDENTIAL"}</span>
                  <span>{request.submittedByName} · {formatSalesDate(request.submittedAt, true, timeZone)} · {request.status.toUpperCase()}</span>
                </div>
                {request.notes ? <p>{request.notes}</p> : null}
                {request.callbackAt ? <span>Callback: {formatSalesDate(request.callbackAt, false, timeZone)}</span> : null}
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
                    <td>{rep.callsToday}</td><td>{rep.callsThisWeek}</td><td>{rep.callsThisMonth}</td><td>{rep.soldThisMonth}</td><td>{formatSalesDate(rep.lastActivityAt, true, timeZone) || "—"}</td>
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
              {adminEvents.length ? adminEvents.map((event) => <p key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong> · {event.actorName}{event.targetUsername ? ` → ${event.targetUsername}` : ""}{event.doorId ? ` · door ${event.doorId}` : ""} · {formatSalesDate(event.createdAt, true, timeZone)}{event.reason ? ` · ${event.reason}` : ""}</p>) : <p>No administrative actions yet.</p>}
            </details>
          ) : null}
        </section>
      ) : null}

      {isSuper && dataReviewOpen ? <><label className={ui.field}><span>Source review state</span><select value={reviewState} onChange={event => setReviewState(event.target.value)}>{snapshot.states.map(state => <option key={state} value={state}>{STATE_NAMES[state] ?? state}</option>)}</select></label><SalesDataReview key={reviewState} state={reviewState} onChanged={() => void loadSnapshot(snapshot.selectedState)} /><OwnerCallbackReview initialState={snapshot.selectedState} states={snapshot.states} timeZone={timeZone} /></> : null}

          </div> : null}
          {view === "today" ? <section className={ui.today} aria-label="Your follow-ups">
            <div className={ui.heading}><div><p>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone }).format(new Date())}</p><h1>Today</h1><span>Know who to contact and what to do next.</span></div><button className={ui.primary} type="button" onClick={() => navigate("dispensaries")}>Find a dispensary</button></div>
            <div className={ui.todayToolbar}><div className={ui.buckets}>
              {([["due", "Due now", (todayData?.counts.overdue ?? 0) + (todayData?.counts.today ?? 0)], ["overdue", "Overdue", todayData?.counts.overdue], ["today", "Today", todayData?.counts.today], ["upcoming", "Upcoming", todayData?.counts.upcoming], ["attention", "Needs attention", todayData?.counts.needsAttention]] as const).map(([value, label, count]) => <button type="button" key={value} aria-pressed={todayBucket === value} onClick={() => { if (todayBucket === value) void loadToday(value, todayState, timeZone); else { setTodayData(null); setTodayBucket(value); } }}>{label}{typeof count === "number" ? <span>{count}</span> : null}</button>)}
            </div><label className={ui.field}><span>State</span><select value={todayState} onChange={(event) => { setTodayData(null); setTodayState(event.target.value); }}><option value="all">All my states</option>{snapshot.states.map((state) => <option key={state} value={state}>{STATE_NAMES[state] ?? state}</option>)}</select></label><button disabled={todayBusy} type="button" onClick={() => void loadToday(todayBucket, todayState, timeZone)}>Refresh</button></div>
            <p className={ui.muted}>Your assigned follow-ups · {timeZone.replaceAll("_", " ")}</p>
            {todayError ? <div className={ui.error} role="alert">{todayError}<button type="button" disabled={todayBusy} onClick={() => void loadToday(todayBucket, todayState, timeZone)}>Try again</button></div> : null}
            {todayBusy && !todayData ? <p className={ui.empty} role="status">Loading your follow-ups…</p> : todayData && !todayData.tasks.length ? <div className={ui.empty}><h2>{todayBucket === "upcoming" ? "No upcoming follow-ups." : todayBucket === "attention" ? "No follow-ups need attention." : "No follow-ups scheduled in this view."}</h2><p>Find a dispensary to contact, then set the next follow-up.</p><button className={ui.primary} type="button" onClick={() => navigate("dispensaries")}>Find a dispensary</button></div> : null}
            <div className={ui.taskList} aria-busy={todayBusy}>{todayData?.tasks.map((task) => <article className={ui.task} key={task.id}>
              <div><div className={ui.rowBadges}><span className={task.bucket === "overdue" ? ui.overdue : ui.badge}>{task.restriction ? "Needs attention" : task.bucket === "overdue" ? "Overdue" : task.bucket === "today" ? "Today" : "Upcoming"}</span>{task.inUse ? <span className={ui.badge}>In use</span> : null}</div><h2>{task.name}</h2><p>{[task.city, task.stateCode].filter(Boolean).join(", ")} · {formatSalesDate(task.dueAt, true, todayData.timeZone)}</p>{task.note ? <p className={ui.notePreview}>{task.note}</p> : null}{task.restriction ? <small>{task.restriction.replaceAll("_", " ")}</small> : null}</div>
              <button disabled={openingTask !== null} type="button" onClick={() => void openTodayTask(task)}>{openingTask === task.doorId ? "Opening…" : "Open"}</button>
            </article>)}</div>
            {todayData?.nextCursor ? <button className={ui.loadMore} type="button" disabled={todayBusy} onClick={() => void loadToday(todayBucket, todayState, timeZone, todayData.nextCursor!)}>{todayBusy ? "Loading…" : "More follow-ups"}</button> : null}
          </section> : null}
          {view === "dispensaries" ? <section aria-label="Dispensary browsing">
            <div className={ui.heading}><div><p>Presidential sales</p><h1>Dispensaries</h1></div></div>
            <label className={ui.search}><span className={ui.visuallyHidden}>Search dispensaries</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7"/><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.7"/></svg><input type="search" value={search} placeholder="Search name, city or ZIP" onChange={(event) => changeFilters({ search: event.target.value })}/></label>
            <p className={ui.selectorLabel}>Purchasing Presidential</p>
            <div className={ui.purchasing} role="group" aria-label="Purchasing Presidential">
              <button type="button" aria-pressed={dispensaryFilter === "not_purchasing"} onClick={() => changeFilters({ filter: "not_purchasing", queue: "all" })}>Not purchasing</button>
              <button type="button" aria-pressed={dispensaryFilter === "purchasing"} onClick={() => changeFilters({ filter: "purchasing", queue: "all" })}>Purchasing</button>
              <button type="button" aria-pressed={dispensaryFilter === "all"} onClick={() => changeFilters({ filter: "all", queue: "all" })}>All dispensaries</button>
            </div>
            <div className={ui.browseToolbar}><button type="button" aria-expanded={filtersOpen} onClick={() => requestMove(() => setFiltersOpen((current) => !current))}>Filters · {snapshot.selectedState === "all" ? "All states" : snapshot.selectedState}{city !== "ALL CITIES" ? ` · ${city}` : ""}</button><label className={ui.workView}><span>Work view</span><select value={queue} onChange={(event) => changeFilters({ queue: event.target.value as WorkQueue, ...(event.target.value === "callbacks" || event.target.value === "upcoming" ? { filter: "not_purchasing" as const } : {}) })}><option value="all">Browse all</option><option value="callbacks">My callbacks due</option><option value="upcoming">My upcoming callbacks</option><option value="worked">My work today</option><option value="stars">My starred stores</option></select></label><button type="button" disabled={loadingData} onClick={() => requestMove(() => void loadSnapshot(snapshot.selectedState))}>Refresh</button></div>
            {filtersOpen ? <section className={ui.filterPanel} aria-label="Filter dispensaries"><label className={ui.field}><span>State</span><select disabled={loadingData} onChange={(event) => changeFilters({ city: "", search: "" }, event.target.value)} value={snapshot.selectedState}><option value="all">All states</option>{snapshot.states.map((state) => <option key={state}>{state}</option>)}</select></label><label className={ui.field}><span>City</span><select disabled={loadingData} value={city} onChange={(event) => changeFilters({ city: event.target.value === "ALL CITIES" ? "" : event.target.value })}><option value="ALL CITIES">All cities</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" onClick={() => changeFilters({ city: "", search: "", filter: "not_purchasing", queue: "all" }, "all")}>Clear filters</button></section> : null}
            <div className={ui.filterSummary} aria-live="polite"><span>{STATE_NAMES[snapshot.selectedState] ?? snapshot.selectedState} · {loadingData ? "Updating…" : `${snapshot.totalMatching.toLocaleString()} matching dispensaries`}</span>{search ? <span>“{search}”</span> : null}</div>
            <section className={ui.doorList} aria-busy={loadingData} aria-label="Licensed dispensary doors">
              {filteredDoors.map((door) => <SalesStoreRow key={door.id} door={door} timeZone={timeZone} callbackDue={callbackDue(door, today, dateKey)} calledToday={calledToday(door, today, dateKey)} struck={struck(door)} canCorrectCustomer={Boolean(isSuper)} canSetPriority={Boolean(isSuper)} openMode={null} onCorrectCustomer={(item) => void correctVerifiedCustomer(item)} onHistory={(item) => openWorkArea(item, "history")} onLogResult={(item) => openWorkArea(item, "log")} onReopenDoNotCall={(item) => void reopenDoNotCall(item)} onTogglePersonalStar={(item) => void togglePersonalStar(item)} onTogglePriority={(item) => void togglePriority(item)} workedByMeToday={Boolean(door.myLastActivityAt && dateKey(door.myLastActivityAt) === today)} notePreview={workflowSummaries.find((item) => item.doorId === door.id)?.notePreview ?? null} />)}
              {!filteredDoors.length ? <div className={ui.empty}><h2>{queue === "callbacks" ? "No callbacks due in this view." : queue === "upcoming" ? "No upcoming callbacks in this view." : queue === "stars" ? "No starred stores in this view." : "No dispensaries match these filters."}</h2><p>{queue === "stars" ? "Use the star on a dispensary you want to return to." : "Try another city or clear your filters."}</p><button type="button" onClick={() => changeFilters({ city: "", search: "", filter: "not_purchasing", queue: "all" }, "all")}>Clear filters</button></div> : null}
            </section>
            <nav className={ui.pagination} aria-label="Store list pages"><button type="button" disabled={loadingData || snapshot.page === 0} onClick={() => changeFilters({ page: snapshot.page - 1 })}>Previous page</button><span>{snapshot.totalMatching ? snapshot.page * snapshot.pageSize + 1 : 0}–{Math.min((snapshot.page + 1) * snapshot.pageSize, snapshot.totalMatching)} of {snapshot.totalMatching}</span><button type="button" disabled={loadingData || (snapshot.page + 1) * snapshot.pageSize >= snapshot.totalMatching} onClick={() => changeFilters({ page: snapshot.page + 1 })}>Next page</button></nav>
            <details className={ui.help}><summary>How the dispensary list works</summary><p>Gold labels identify verified Presidential customers. Other records are prospects whose purchasing status is not confirmed; ask before pitching. Source records can include separate licenses for one location. Shared notes and history stay with each dispensary.</p><p>Opening an account is read only. Begin contact reserves the workspace. Call outcomes, shared notes and follow-ups save separately.</p></details>
          </section> : null}
          <details className={ui.stats}><summary>My activity · {snapshot.user.stats.callsToday} calls today</summary><div><button type="button" onClick={showTeamActivityReport}>{snapshot.user.stats.callsToday} calls today · {snapshot.user.stats.callsThisWeek} this week · {snapshot.user.stats.soldThisMonth} sold this month</button><button type="button" onClick={() => requestMove(() => void resetMyDailyCalls())}>Reset today’s personal counter</button></div></details>
      {snapshot.user.role === "sales_rep" && snapshot.verificationRequests.length ? (
        <details className={styles.myVerificationRequests}>
          <summary>TEAM CUSTOMER REPORTS ({snapshot.verificationRequests.length})</summary>
          {snapshot.verificationRequests.map((request) => (
            <article key={request.id}>
              <strong>{request.storeName}</strong>
              <span>{request.claimedStatus === "sold" ? "SOLD" : "ALREADY CARRIES PRESIDENTIAL"} · {request.status.toUpperCase()}</span>
              <span>{formatSalesDate(request.submittedAt, true, timeZone)}</span>
              {request.decisionNote ? <p>{request.decisionNote}</p> : null}
            </article>
          ))}
        </details>
      ) : null}


        </>}
      </div>
      <nav className={ui.bottomNav} aria-label="Phone navigation"><button type="button" aria-current={view === "today" ? "page" : undefined} onClick={() => navigate("today")}>Today</button><button type="button" aria-current={view === "dispensaries" ? "page" : undefined} onClick={() => navigate("dispensaries")}>Dispensaries</button></nav>
    </main>
  );
}

type CallbackReviewResponse = Readonly<{
  totalMatching: number; nextCursor: number | null;
  items: readonly { doorId: number; name: string; city: string | null; stateCode: string; legacyDueAt: string; workflowDueAt: string | null; workflowStatus: string | null; ownerName: string | null; archived: boolean }[];
}>;

function OwnerCallbackReview({ initialState, states, timeZone }: Readonly<{ initialState: string; states: readonly string[]; timeZone: string }>) {
  const [state, setState] = useState(initialState);
  const [mode, setMode] = useState<"legacy" | "mismatch">("legacy");
  const [data, setData] = useState<CallbackReviewResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  const load = useCallback(async (afterId?: number) => {
    const sequence = ++request.current;
    setBusy(true); setError("");
    try {
      const params = new URLSearchParams({ resource: "callback_review", mode, state });
      if (afterId) params.set("afterId", String(afterId));
      const response = await fetch(`/api/sales?${params}`, { cache: "no-store" });
      const payload = await response.json() as CallbackReviewResponse & { error?: string };
      if (sequence !== request.current) return;
      if (!response.ok || !Array.isArray(payload.items)) throw new Error(payload.error ?? "Callback review could not be loaded.");
      setData((current) => afterId && current ? { ...payload, items: [...current.items, ...payload.items] } : payload);
    } catch (cause) { if (sequence === request.current) setError(cause instanceof Error ? cause.message : "Callback review could not be loaded."); }
    finally { if (sequence === request.current) setBusy(false); }
  }, [mode, state]);
  const invalidateReview = useCallback(() => { ++request.current; }, []);
  useEffect(() => {
    // Read-only owner report; no tasks are assigned or changed by loading it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    return invalidateReview;
  }, [load, invalidateReview]);
  return <section className={ui.callbackReview} aria-label="Owner callback data review">
    <h2>Callback data review</h2>
    <p>Legacy callback dates are not assigned follow-ups. These reports preserve the original dates for owner review; viewing them does not assign, complete, or rewrite anything.</p>
    <div className={ui.browseToolbar}><label className={ui.field}><span>State</span><select value={state} onChange={(event) => { setData(null); setState(event.target.value); }}><option value="all">All states</option>{states.map((value) => <option key={value}>{value}</option>)}</select></label><div className={ui.buckets}><button type="button" aria-pressed={mode === "legacy"} onClick={() => { if (mode === "legacy") void load(); else { setData(null); setMode("legacy"); } }}>Unassigned legacy dates</button><button type="button" aria-pressed={mode === "mismatch"} onClick={() => { if (mode === "mismatch") void load(); else { setData(null); setMode("mismatch"); } }}>Date mismatches</button></div><button type="button" disabled={busy} onClick={() => void load()}>Refresh</button></div>
    {error ? <p className={ui.error} role="alert">{error}</p> : null}
    <p className={ui.muted} aria-live="polite">{busy && !data ? "Loading…" : data ? `${data.totalMatching.toLocaleString()} records · Read only` : ""}</p>
    <div className={ui.taskList}>{data?.items.map((item) => <article className={ui.task} key={item.doorId}><div><h3>{item.name}</h3><p>{[item.city, item.stateCode].filter(Boolean).join(", ")}{item.archived ? " · Archived source" : ""}</p><p>Legacy date: {formatSalesDate(item.legacyDueAt, true, timeZone)}</p>{mode === "mismatch" ? <p>Assigned follow-up: {formatSalesDate(item.workflowDueAt, true, timeZone) || "Not recorded"} · {item.ownerName || "Owner not recorded"} · {item.workflowStatus}</p> : <p>No assigned workflow follow-up.</p>}</div></article>)}</div>
    {data && !data.items.length ? <p>No records match this report.</p> : null}
    {data?.nextCursor ? <button className={ui.loadMore} type="button" disabled={busy} onClick={() => void load(data.nextCursor!)}>More records</button> : null}
  </section>;
}

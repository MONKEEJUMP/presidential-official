export const SALES_TIME_ZONE = "America/Chicago";

export const SALES_OUTCOMES = [
  { value: "no_answer", label: "No answer", callbackDays: 2, stocked: false },
  { value: "left_message", label: "Left message", callbackDays: 4, stocked: false },
  { value: "talked_to_buyer", label: "Spoke to buyer", callbackDays: 7, stocked: false },
  { value: "interested", label: "Interested", callbackDays: 3, stocked: false },
  { value: "not_interested", label: "Not interested", callbackDays: 30, stocked: false },
  { value: "already_carries_us", label: "Already carries us", callbackDays: null, stocked: true },
  { value: "sold", label: "SOLD", callbackDays: null, stocked: true },
  { value: "do_not_call", label: "Do not call", callbackDays: null, stocked: false },
] as const;

export type SalesOutcome = (typeof SALES_OUTCOMES)[number]["value"];
export type DoorStatus = "stocked" | "prospect" | "review" | "closed";
export type SalesRole = "super_master" | "master" | "sales_rep";
export type SalesVerificationClaim = "already_carries_us" | "sold";
export type SalesVerificationStatus = "pending" | "approved" | "rejected" | "withdrawn";

export type SalesPersonalStats = Readonly<{
  callsToday: number;
  callsThisWeek: number;
  soldThisMonth: number;
}>;

export type SalesRepActivity = Readonly<{
  userId: string;
  username: string;
  displayName: string;
  role: SalesRole;
  active: boolean;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  soldThisMonth: number;
  lastActivityAt: string | null;
}>;

export type SalesAdminEvent = Readonly<{
  id: number;
  actorName: string;
  actorRole: SalesRole;
  targetUsername: string | null;
  doorId: number | null;
  action: string;
  reason: string | null;
  createdAt: string;
}>;

export type SalesCall = Readonly<{
  id: number;
  doorId: number;
  repId: string;
  repName: string;
  calledAt: string;
  outcome: SalesOutcome;
  notes: string | null;
  callbackAt: string | null;
  undone: boolean;
  undoEligible: boolean;
}>;

export type SalesVerificationRequest = Readonly<{
  id: number;
  doorId: number;
  storeName: string;
  city: string | null;
  stateCode: string;
  submittedBy: string;
  submittedByName: string;
  claimedStatus: SalesVerificationClaim;
  notes: string | null;
  callbackAt: string | null;
  status: SalesVerificationStatus;
  submittedAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  canWithdraw: boolean;
}>;

export type SalesDoor = Readonly<{
  id: number;
  marketDoorId: number | null;
  verifiedCustomerId: number | null;
  retailerId: number | null;
  state: string;
  doorKey: string;
  stateLicenseId: string | null;
  legalName: string | null;
  dbaName: string | null;
  streetAddress: string | null;
  city: string | null;
  stateCode: string;
  zip: string | null;
  phone: string | null;
  email: string | null;
  extraContacts: string | null;
  website: string | null;
  operationalStatus: string | null;
  status: DoorStatus;
  isPurchasing: boolean;
  noLicenseMatch: boolean;
  nextCallbackAt: string | null;
  sourceListDate: string;
  callHistory: readonly SalesCall[];
  lastCall: SalesCall | null;
  personallyStarred: boolean;
  companyPriority: boolean;
  myLastActivityAt: string | null;
  doNotCallLocked: boolean;
  hasPendingVerification: boolean;
  pendingVerification: SalesVerificationRequest | null;
}>;

export type SalesSnapshot = Readonly<{
  authenticated: true;
  user: Readonly<{
    id: string;
    name: string;
    username: string;
    role: SalesRole;
    active: boolean;
    teamSetupCode: string | null;
    onboardingOpen: boolean | null;
    stats: SalesPersonalStats;
  }>;
  states: readonly string[];
  selectedState: string;
  purchasingCount: number;
  linkedCustomerCount: number;
  unlinkedCustomerCount: number;
  opportunityCount: number;
  activeDispensaryCount: number;
  closedCount: number;
  totalSalesRows: number;
  verificationRequests: readonly SalesVerificationRequest[];
  doors: readonly SalesDoor[];
}>;

export function isSalesOutcome(value: unknown): value is SalesOutcome {
  return SALES_OUTCOMES.some((outcome) => outcome.value === value);
}

export function salesOutcome(value: SalesOutcome) {
  return SALES_OUTCOMES.find((outcome) => outcome.value === value)!;
}

function chicagoParts(date: Date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SALES_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
}

export function chicagoDateKey(value: string | Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = chicagoParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function defaultCallbackDate(outcome: SalesOutcome, from = new Date()): string | null {
  const days = salesOutcome(outcome).callbackDays;
  if (days === null) return null;
  const parts = chicagoParts(from);
  const shifted = new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + days, 15, 0, 0),
  );
  return shifted.toISOString().slice(0, 10);
}

export function callbackDateToUtc(date: string | null): string | null {
  return date ? `${date}T15:00:00.000Z` : null;
}

export function displayDoorName(door: Pick<SalesDoor, "dbaName" | "legalName">): string {
  return door.dbaName || door.legalName || "Unnamed licensed door";
}

export function isClosedDoor(door: Pick<SalesDoor, "status" | "operationalStatus">): boolean {
  const operational = door.operationalStatus?.toLowerCase() ?? "";
  return (
    door.status === "closed" ||
    operational.includes("non-operational") ||
    operational.includes("non operational") ||
    operational.includes("not operating")
  );
}

export function formatSalesDate(value: string | null, includeTime = false): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SALES_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

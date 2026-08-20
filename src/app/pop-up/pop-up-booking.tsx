"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "./pop-up.module.css";

export type OklahomaRetailer = Readonly<{
  id: number;
  name: string;
  city: string;
}>;

type Slot = "morning" | "afternoon";

type AvailabilityDay = Readonly<{
  date: string;
  morningBooked: boolean;
  afternoonBooked: boolean;
}>;

type AvailabilityPayload = Readonly<{
  month: string;
  days: readonly AvailabilityDay[];
}>;

type Selection = Readonly<{
  date: string;
  slot: Slot;
}>;

type BookingResponse = Readonly<{
  success?: boolean;
  error?: string;
  manageToken?: string;
  booking?: ManagedBooking;
  customerNotificationAccepted?: boolean;
}>;

type ManagedBooking = Readonly<{
  eventDate: string;
  slots: readonly Slot[];
  wholeDay: boolean;
  dispensaryName: string;
}>;

type ManageResponse = Readonly<{
  success?: boolean;
  error?: string;
  message?: string;
  booking?: ManagedBooking;
}>;

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const MANAGE_SESSION_KEY = "presidential-popup-manage-token";

function chicagoDateParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function chicagoToday(): string {
  const parts = chicagoDateParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function currentChicagoMonth(): string {
  const parts = chicagoDateParts();
  return `${parts.year}-${parts.month}`;
}

function shiftMonth(month: string, difference: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + difference, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

function dayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isFreeDate(date: string): boolean {
  const weekday = dayOfWeek(date);
  return weekday === 4 || weekday === 5 || weekday === 6;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function retailerLabel(retailer: OklahomaRetailer): string {
  return `${retailer.name} — ${retailer.city}`;
}

function isAvailabilityPayload(value: unknown): value is AvailabilityPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  if (typeof payload.month !== "string" || !Array.isArray(payload.days)) return false;
  return payload.days.every((day) => {
    if (!day || typeof day !== "object") return false;
    const row = day as Record<string, unknown>;
    return (
      typeof row.date === "string" &&
      typeof row.morningBooked === "boolean" &&
      typeof row.afternoonBooked === "boolean"
    );
  });
}

export function PopUpBooking({
  retailers,
}: Readonly<{ retailers: readonly OklahomaRetailer[] }>) {
  const calendarRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const [month, setMonth] = useState(currentChicagoMonth);
  const [today] = useState(chicagoToday);
  const [availability, setAvailability] = useState<Record<string, AvailabilityDay>>({});
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarMessage, setCalendarMessage] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dispensary, setDispensary] = useState("");
  const [wholeDay, setWholeDay] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [manageToken, setManageToken] = useState("");
  const [managedBooking, setManagedBooking] = useState<ManagedBooking | null>(null);
  const [managing, setManaging] = useState(false);
  const [manageMessage, setManageMessage] = useState("");
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [customerEmailSent, setCustomerEmailSent] = useState<boolean | null>(null);

  const retailerByLabel = useMemo(
    () => new Map(retailers.map((retailer) => [retailerLabel(retailer), retailer])),
    [retailers],
  );

  const loadAvailability = useCallback(async (targetMonth: string, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/pop-up/availability?month=${encodeURIComponent(targetMonth)}`,
        { cache: "no-store", signal },
      );
      const payload = (await response.json()) as unknown;
      if (!response.ok || !isAvailabilityPayload(payload) || payload.month !== targetMonth) {
        throw new Error("Availability response was unavailable.");
      }
      setAvailability(Object.fromEntries(payload.days.map((day) => [day.date, day])));
      setLoadedMonth(targetMonth);
      setCalendarMessage("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAvailability({});
      setLoadedMonth(null);
      setCalendarMessage("Calendar availability is refreshing. Please try again in a moment.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  const loadManagedBooking = useCallback(async (token: string) => {
    setManaging(true);
    setManageMessage("");
    setCancelled(false);
    try {
      const response = await fetch("/api/pop-up/booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manageToken: token }),
        cache: "no-store",
      });
      const payload = (await response.json()) as ManageResponse;
      if (!response.ok || !payload.success || !payload.booking) {
        window.sessionStorage.removeItem(MANAGE_SESSION_KEY);
        setManageToken("");
        setManagedBooking(null);
        setManageMessage(payload.error ?? "This private booking link is invalid or expired.");
        return;
      }
      setManageToken(token);
      setManagedBooking(payload.booking);
      window.setTimeout(
        () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        0,
      );
    } catch {
      setManageMessage("Booking management is temporarily unavailable.");
    } finally {
      setManaging(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadAvailability(month, controller.signal);
    return () => controller.abort();
  }, [loadAvailability, month]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashToken = hash.get("manage")?.trim() ?? "";
    const storedToken = window.sessionStorage.getItem(MANAGE_SESSION_KEY)?.trim() ?? "";
    const token = hashToken || storedToken;
    if (!token) return;

    window.sessionStorage.setItem(MANAGE_SESSION_KEY, token);
    if (hashToken) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    void loadManagedBooking(token);
  }, [loadManagedBooking]);

  const calendarCells = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const leading = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const cells: Array<string | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= count; day += 1) {
      cells.push(`${month}-${String(day).padStart(2, "0")}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const selectSlot = (date: string, slot: Slot) => {
    setSelection({ date, slot });
    setWholeDay(false);
    setManagedBooking(null);
    setCancelled(false);
    setCancelPrompt(false);
    setFormMessage("");
    window.setTimeout(
      () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  };

  const changeDay = () => {
    setSelection(null);
    setWholeDay(false);
    setManagedBooking(null);
    setCancelled(false);
    setCancelPrompt(false);
    setFormMessage("");
    calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selection || submitting) return;

    const form = new FormData(event.currentTarget);
    const selectedRetailer = retailerByLabel.get(dispensary);
    setSubmitting(true);
    setFormMessage("");

    try {
      const response = await fetch("/api/pop-up/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDate: selection.date,
          slot: selection.slot,
          wholeDay,
          dispensaryName: selectedRetailer?.name ?? dispensary,
          retailerId: selectedRetailer?.id ?? null,
          contactName: form.get("contactName"),
          phone: form.get("phone"),
          email: form.get("email"),
        }),
      });
      const payload = (await response.json()) as BookingResponse;

      if (response.status === 409 || payload.error === "that slot was just taken") {
        setSelection(null);
        setWholeDay(false);
        await loadAvailability(month);
        setCalendarMessage("That slot was just taken — pick another day.");
        window.setTimeout(
          () => calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          0,
        );
        return;
      }

      if (!response.ok || !payload.success) {
        setFormMessage(payload.error ?? "Booking is temporarily unavailable.");
        return;
      }

      setAvailability((current) => {
        const day = current[selection.date] ?? {
          date: selection.date,
          morningBooked: false,
          afternoonBooked: false,
        };
        return {
          ...current,
          [selection.date]: {
            ...day,
            morningBooked: wholeDay || selection.slot === "morning" || day.morningBooked,
            afternoonBooked: wholeDay || selection.slot === "afternoon" || day.afternoonBooked,
          },
        };
      });
      const booking = payload.booking ?? {
        eventDate: selection.date,
        slots: wholeDay ? (["morning", "afternoon"] as const) : [selection.slot],
        wholeDay,
        dispensaryName: selectedRetailer?.name ?? dispensary,
      };
      setManagedBooking(booking);
      setCancelled(false);
      setCancelPrompt(false);
      setCustomerEmailSent(payload.customerNotificationAccepted ?? false);
      if (payload.manageToken) {
        setManageToken(payload.manageToken);
        window.sessionStorage.setItem(MANAGE_SESSION_KEY, payload.manageToken);
      }
    } catch {
      setFormMessage("Booking is temporarily unavailable.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestManageLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (recoverySubmitting) return;
    const form = new FormData(event.currentTarget);
    setRecoverySubmitting(true);
    setRecoveryMessage("");
    try {
      const response = await fetch("/api/pop-up/booking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("manageEmail") }),
        cache: "no-store",
      });
      const payload = (await response.json()) as ManageResponse;
      setRecoveryMessage(
        payload.message ?? "If that email matches an active booking, a private link is on its way.",
      );
    } catch {
      setRecoveryMessage("Booking management is temporarily unavailable.");
    } finally {
      setRecoverySubmitting(false);
    }
  };

  const cancelManagedBooking = async () => {
    if (!manageToken || !managedBooking || managing) return;
    setManaging(true);
    setManageMessage("");
    try {
      const response = await fetch("/api/pop-up/booking", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manageToken }),
        cache: "no-store",
      });
      const payload = (await response.json()) as ManageResponse;
      if (!response.ok || !payload.success) {
        setManageMessage(payload.error ?? "Booking cancellation is temporarily unavailable.");
        return;
      }

      setAvailability((current) => {
        const day = current[managedBooking.eventDate];
        if (!day) return current;
        return {
          ...current,
          [managedBooking.eventDate]: {
            ...day,
            morningBooked: managedBooking.slots.includes("morning")
              ? false
              : day.morningBooked,
            afternoonBooked: managedBooking.slots.includes("afternoon")
              ? false
              : day.afternoonBooked,
          },
        };
      });
      setCancelled(true);
      setCancelPrompt(false);
      setManageToken("");
      window.sessionStorage.removeItem(MANAGE_SESSION_KEY);
    } catch {
      setManageMessage("Booking cancellation is temporarily unavailable.");
    } finally {
      setManaging(false);
    }
  };

  const monthReady = loadedMonth === month && !loading;
  const selectedAvailability = selection ? availability[selection.date] : undefined;
  const selectedOtherSlotBooked = selection
    ? selection.slot === "morning"
      ? selectedAvailability?.afternoonBooked ?? false
      : selectedAvailability?.morningBooked ?? false
    : false;

  return (
    <>
      <section
        className={styles.calendarFold}
        id="book-your-day"
        ref={calendarRef}
        aria-labelledby="calendar-heading"
      >
        <div className={styles.foldHeading}>
          <p>Step 1</p>
          <h2 id="calendar-heading">BOOK YOUR DAY</h2>
          <span>Oklahoma time · Morning and afternoon slots</span>
        </div>

        <div className={styles.calendarControls}>
          <button type="button" onClick={() => setMonth((value) => shiftMonth(value, -1))}>
            <span aria-hidden="true">←</span> PREVIOUS
          </button>
          <strong>{monthLabel(month)}</strong>
          <button type="button" onClick={() => setMonth((value) => shiftMonth(value, 1))}>
            NEXT <span aria-hidden="true">→</span>
          </button>
        </div>

        {calendarMessage ? <p className={styles.calendarMessage}>{calendarMessage}</p> : null}

        <div className={styles.calendarScroller} aria-busy={loading}>
          <div className={styles.calendarGrid}>
            {WEEKDAYS.map((weekday) => (
              <div className={styles.weekday} key={weekday}>{weekday}</div>
            ))}
            {calendarCells.map((date, index) => {
              if (!date) return <div className={styles.blankDay} key={`blank-${index}`} />;

              const day = availability[date];
              const past = date < today;
              const free = isFreeDate(date);
              const morningBooked = day?.morningBooked ?? false;
              const afternoonBooked = day?.afternoonBooked ?? false;
              const dayNumber = Number(date.slice(-2));

              return (
                <article className={`${styles.dayCell} ${past ? styles.pastDay : ""}`} key={date}>
                  <span className={styles.dayNumber}>{dayNumber}</span>
                  {(["morning", "afternoon"] as const).map((slot) => {
                    const booked = slot === "morning" ? morningBooked : afternoonBooked;
                    const selected = selection?.date === date && selection.slot === slot;
                    const disabled = past || booked || !monthReady;
                    return (
                      <button
                        aria-label={`${formatDate(date)}, ${slot}, ${booked ? "booked" : free ? "free" : "open"}`}
                        className={[
                          styles.slot,
                          slot === "morning" ? styles.morningSlot : styles.afternoonSlot,
                          booked
                            ? slot === "morning"
                              ? styles.morningBooked
                              : styles.afternoonBooked
                            : "",
                          selected ? styles.selectedSlot : "",
                        ].filter(Boolean).join(" ")}
                        disabled={disabled}
                        key={slot}
                        onClick={() => selectSlot(date, slot)}
                        type="button"
                      >
                        <small>{slot}</small>
                        <strong>{booked ? "BOOKED" : free ? "FREE" : "OPEN"}</strong>
                        {!free && !booked ? <span>$3,000 / slot · $4,500 day</span> : null}
                      </button>
                    );
                  })}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className={styles.formFold}
        id="your-information"
        ref={formRef}
        aria-labelledby="information-heading"
      >
        <div className={styles.formInner}>
          <div className={styles.foldHeading}>
            <p>Step 2</p>
            <h2 id="information-heading">YOUR INFORMATION</h2>
          </div>

          {managedBooking ? (
            <div className={styles.confirmation} role="status">
              <p>{cancelled ? "Booking cancelled." : "You’re on the calendar."}</p>
              <strong>
                {formatDate(managedBooking.eventDate)} · {managedBooking.wholeDay
                  ? "whole day"
                  : managedBooking.slots.join(" + ")}
              </strong>
              <span>{managedBooking.dispensaryName}</span>

              {cancelled ? (
                <span>Your calendar slot is open again. Confirmation was sent by email.</span>
              ) : (
                <>
                  <span>Only someone with your private management link can change this booking.</span>
                  {customerEmailSent === false ? (
                    <span className={styles.manageWarning}>
                      The private link could not be emailed, but you can manage the booking on this screen.
                    </span>
                  ) : null}
                  {manageMessage ? <span className={styles.manageWarning}>{manageMessage}</span> : null}

                  {cancelPrompt ? (
                    <div className={styles.cancelActions}>
                      <button
                        className={styles.cancelButton}
                        disabled={managing}
                        onClick={() => void cancelManagedBooking()}
                        type="button"
                      >
                        {managing ? "CANCELLING" : "YES, CANCEL MY BOOKING"}
                      </button>
                      <button
                        className={styles.keepBookingButton}
                        disabled={managing}
                        onClick={() => setCancelPrompt(false)}
                        type="button"
                      >
                        KEEP MY BOOKING
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.cancelButton}
                      onClick={() => setCancelPrompt(true)}
                      type="button"
                    >
                      CANCEL THIS BOOKING
                    </button>
                  )}
                </>
              )}
            </div>
          ) : managing ? (
            <p className={styles.selectionPrompt}>Opening your private booking…</p>
          ) : !selection ? (
            <div className={styles.selectionStart}>
              {manageMessage ? <p className={styles.formMessage}>{manageMessage}</p> : null}
              <p className={styles.selectionPrompt}>
                Choose an open morning or afternoon above to continue.
              </p>
              <form className={styles.manageRecovery} onSubmit={requestManageLink}>
                <div>
                  <h3>Already booked?</h3>
                  <p>Enter the same email you booked with and we’ll send your private management link.</p>
                </div>
                <label>
                  <span>Booking email</span>
                  <input
                    autoComplete="email"
                    maxLength={254}
                    name="manageEmail"
                    required
                    type="email"
                  />
                </label>
                <button disabled={recoverySubmitting} type="submit">
                  {recoverySubmitting ? "SENDING" : "EMAIL MY PRIVATE LINK"}
                </button>
                {recoveryMessage ? <p role="status">{recoveryMessage}</p> : null}
              </form>
            </div>
          ) : (
            <>
              <div className={styles.selectionSummary}>
                <div>
                  <span>Your day</span>
                  <strong>{formatDate(selection.date)} · {selection.slot}</strong>
                </div>
                <button type="button" onClick={changeDay}>CHANGE YOUR DAY</button>
              </div>

              <form className={styles.bookingForm} onSubmit={submitBooking}>
                  <label className={styles.fullField}>
                    <span>Dispensary</span>
                    <input
                      autoComplete="organization"
                      list="oklahoma-popup-retailers"
                      maxLength={160}
                      onChange={(event) => setDispensary(event.target.value)}
                      required
                      value={dispensary}
                    />
                    <small>Don&apos;t see your store? Type it in.</small>
                  </label>
                  <datalist id="oklahoma-popup-retailers">
                    {retailers.map((retailer) => (
                      <option key={retailer.id} value={retailerLabel(retailer)} />
                    ))}
                  </datalist>

                  <label>
                    <span>Contact name</span>
                    <input autoComplete="name" maxLength={120} name="contactName" required />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input autoComplete="tel" inputMode="tel" maxLength={32} name="phone" required type="tel" />
                  </label>
                  <label>
                    <span>Email</span>
                    <input autoComplete="email" maxLength={254} name="email" required type="email" />
                  </label>

                  {!isFreeDate(selection.date) ? (
                    <label className={`${styles.wholeDayField} ${selectedOtherSlotBooked ? styles.unavailableWholeDay : ""}`}>
                      <input
                        checked={wholeDay}
                        disabled={selectedOtherSlotBooked}
                        onChange={(event) => setWholeDay(event.target.checked)}
                        type="checkbox"
                      />
                      <span>
                        Make it the whole day — $4,500
                        {selectedOtherSlotBooked ? <small>The other slot is already booked.</small> : null}
                      </span>
                    </label>
                  ) : null}

                  {formMessage ? <p className={styles.formMessage} role="alert">{formMessage}</p> : null}

                  <button className={styles.submitButton} disabled={submitting} type="submit">
                    {submitting ? "SUBMITTING" : "SUBMIT YOUR INFORMATION"}
                  </button>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}

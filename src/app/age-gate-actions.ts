"use server";

import { cookies } from "next/headers";

import { ADULT_CONFIRMATION_COOKIE } from "./age-gate-constants";

const ADULT_CONFIRMATION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export async function confirmAdultAccess() {
  const cookieStore = await cookies();

  cookieStore.set(ADULT_CONFIRMATION_COOKIE, "true", {
    httpOnly: true,
    maxAge: ADULT_CONFIRMATION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdultAccess() {
  const cookieStore = await cookies();

  cookieStore.delete(ADULT_CONFIRMATION_COOKIE);
}

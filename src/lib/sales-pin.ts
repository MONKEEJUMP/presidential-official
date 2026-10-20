import "server-only";

import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SALES_PIN_PATTERN = /^\d{4}$/;

// The private per-account key stays in the server-only profiles table.
// Supabase receives a strong derived password; the user's PIN is never stored.
export function salesAuthPassword(pin: string, key: string): string {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("PIN configuration is unavailable.");
  return `${createHmac("sha256", Buffer.from(key, "hex")).update(`sales-pin-v1:${pin}`).digest("hex")}aA1!`;
}

export function newSalesPinKey(): string {
  return randomBytes(32).toString("hex");
}

export async function createSalesRepAccount(
  admin: SupabaseClient,
  input: { username: string; displayName: string; pin: string; temporary: boolean },
) {
  if (!/^[a-z][a-z0-9]{0,31}$/.test(input.username) || !SALES_PIN_PATTERN.test(input.pin)) {
    throw new Error("Enter a valid username and 4-digit PIN.");
  }
  if (!input.displayName.trim() || input.displayName.length > 120) throw new Error("Enter the user's full name.");
  const key = newSalesPinKey();
  const email = `${input.username}.${randomUUID()}@sales.presidential.internal`;
  const created = await admin.auth.admin.createUser({
    email, password: salesAuthPassword(input.pin, key), email_confirm: true,
    user_metadata: { display_name: input.displayName.trim() },
  });
  if (created.error || !created.data.user) throw new Error("Account creation is temporarily unavailable.");
  const inserted = await admin.from("sales_rep_profiles").insert({
    user_id: created.data.user.id, username: input.username, display_name: input.displayName.trim(),
    role: "sales_rep", active: true, can_invite: false,
    pin_key: key, must_change_pin: input.temporary,
  });
  if (inserted.error) {
    await admin.auth.admin.deleteUser(created.data.user.id);
    throw new Error(inserted.error.code === "23505" ? "That username is already taken." : "Account creation is temporarily unavailable.");
  }
  return { userId: created.data.user.id, email, username: input.username, name: input.displayName.trim() };
}

export async function setSalesPin(
  admin: SupabaseClient,
  profile: { user_id: string; pin_key: string | null },
  pin: string,
  temporary = false,
) {
  if (!SALES_PIN_PATTERN.test(pin) || (!temporary && pin === "0000")) {
    throw new Error(temporary ? "Enter a 4-digit PIN." : "Choose a 4-digit PIN other than the temporary PIN.");
  }
  const key = profile.pin_key ?? newSalesPinKey();
  // Keep the gate closed across both writes. A failed final write remains recoverable.
  const pending = await admin.from("sales_rep_profiles")
    .update({ must_change_pin: true, pin_key: key, updated_at: new Date().toISOString() })
    .eq("user_id", profile.user_id);
  if (pending.error) throw new Error("Your PIN could not be changed. Please try again.");
  const updated = await admin.auth.admin.updateUserById(profile.user_id, { password: salesAuthPassword(pin, key) });
  if (updated.error) throw new Error("Your PIN could not be changed. Please try again.");
  const finished = await admin.from("sales_rep_profiles")
    .update({ must_change_pin: temporary, updated_at: new Date().toISOString() })
    .eq("user_id", profile.user_id);
  if (finished.error) throw new Error("Your PIN was updated. Please retry to finish account setup.");
}

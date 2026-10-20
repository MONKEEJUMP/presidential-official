import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { salesPinAdmin } from "./lib/sales-pin-admin.mjs";

const { admin, createSalesRepAccount, setSalesPin, salesAuthPassword } = await salesPinAdmin();
const base = process.env.CRM_QA_BASE_URL ?? "http://localhost:3052";
const username = `qapin${randomUUID().replaceAll("-", "").slice(0, 12)}`;
const newPin = String(randomInt(1000, 10000));
const fixture = await createSalesRepAccount(admin, { username, displayName: "PIN onboarding QA", pin: "0000", temporary: true });
const cookies = new Map();
let checks = 0;
async function request(path, body, method = body ? "POST" : "GET") {
  const response = await fetch(new URL(path, base), {
    method, headers: { "Content-Type": "application/json", Origin: new URL(base).origin,
      Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; ") },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";"); const at = pair.indexOf("=");
    cookies.set(pair.slice(0, at), pair.slice(at + 1));
  }
  return { status: response.status, data: await response.json() };
}
function check(condition, message) { assert.ok(condition, message); checks += 1; }
try {
  const first = await request("/api/sales", { action: "login", username, password: "0000" });
  check(first.status === 200 && first.data.mustChangePin, "Temporary login must require PIN change");
  const locked = await request("/api/sales");
  check(locked.data.mustChangePin && !locked.data.doors && !locked.data.user?.role, "First-login response must withhold CRM data");
  check(!JSON.stringify(locked.data).includes("pin_key"), "Private PIN key must never reach browser");
  const forbidden = await request("/api/sales", { action: "reset_my_daily_calls" });
  check(forbidden.status === 403, "Temporary PIN must not permit CRM mutations");
  const workflow = await request("/api/sales/workflow?state=OK");
  check(workflow.status === 403, "Temporary PIN must not permit workflow API access");
  for (const invalid of ["0000", "123", "123456", "abcd"]) {
    const denied = await request("/api/sales", { action: "change_pin", password: invalid });
    check(denied.status === 400, "New PIN must be four digits and different from temporary PIN");
  }
  const changed = await request("/api/sales", { action: "change_pin", password: newPin });
  check(changed.status === 200 && changed.data.success, "User must be able to choose their own PIN");
  const unlocked = await request("/api/sales?state=OK");
  check(unlocked.status === 200 && Array.isArray(unlocked.data.doors), `Choosing a PIN must unlock CRM access (status ${unlocked.status}, ${unlocked.data.error ?? "no error"})`);
  const creationDenied = await request("/api/sales", { action: "create_rep", username: "unauthorized", displayName: "Unauthorized" });
  check(creationDenied.status === 403, "Sales Reps must not create accounts");
  await request("/api/sales", undefined, "DELETE");
  check((await request("/api/sales", { action: "login", username, password: "0000" })).status === 401, "Temporary PIN must stop working after a change");
  check((await request("/api/sales", { action: "login", username, password: newPin })).status === 200, "Chosen PIN must work on subsequent login");
  const profile = await admin.from("sales_rep_profiles").select("user_id,pin_key,must_change_pin").eq("user_id", fixture.userId).single();
  assert.ifError(profile.error);
  check(profile.data.must_change_pin === false && profile.data.pin_key !== newPin, "Database must not store plaintext PIN");
  check(salesAuthPassword(newPin, profile.data.pin_key).length > 60, "Provider password must be derived server-side");
  await setSalesPin(admin, profile.data, "0000", true);
  const resetSession = await request("/api/sales");
  check(resetSession.status === 401 || resetSession.data.mustChangePin === true, "Admin reset must re-lock an existing session");
  await request("/api/sales", undefined, "DELETE");
  check((await request("/api/sales", { action: "login", username, password: "0000" })).data.mustChangePin === true, "Reset PIN must require a new choice again");
  console.log(JSON.stringify({ passed: true, checks, temporaryGate: true, chosenPinLogin: true, resetGate: true }));
} finally {
  await request("/api/sales", undefined, "DELETE").catch(() => {});
  const deleted = await admin.auth.admin.deleteUser(fixture.userId);
  if (deleted.error) throw new Error("QA fixture cleanup failed; inspect the PIN onboarding QA account.");
}

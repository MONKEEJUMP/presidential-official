import { salesPinAdmin } from "./lib/sales-pin-admin.mjs";

const { admin, createSalesRepAccount, setSalesPin } = await salesPinAdmin();
const createJoe = process.argv.includes("--create-joe");
const initialize = process.argv.includes("--initialize-existing");
const apply = process.argv.includes("--apply");
if (!createJoe && !initialize) throw new Error("Choose --create-joe or --initialize-existing; --apply performs the authorized change.");

const owner = await admin.from("sales_rep_profiles").select("user_id,display_name,role")
  .eq("username", "paulie").eq("active", true).single();
if (owner.error || owner.data.role !== "super_master") throw new Error("Owner profile verification failed.");

async function record(username, userId, action) {
  const audit = await admin.from("sales_admin_log").insert({
    actor_id: owner.data.user_id, actor_name: owner.data.display_name, actor_role: owner.data.role,
    target_user_id: userId, target_username: username, action,
    reason: "Owner authorized four-digit PIN onboarding with mandatory first-login change.",
  });
  if (audit.error) throw new Error("Account updated but audit recording failed.");
}

if (createJoe) {
  const existing = await admin.from("sales_rep_profiles").select("user_id,username,display_name,role,must_change_pin")
    .eq("username", "joemason").maybeSingle();
  if (existing.error) throw new Error("Joe account lookup failed.");
  if (existing.data && existing.data.display_name !== "Joe Mason") throw new Error("Username belongs to a different profile; no change made.");
  if (!existing.data && apply) {
    const created = await createSalesRepAccount(admin, {
      username: "joemason", displayName: "Joe Mason", pin: "0000", temporary: true,
    });
    await record(created.username, created.userId, "rep_created");
    console.log(JSON.stringify({ created: true, username: created.username, name: created.name, role: "sales_rep", mustChangePin: true }));
  } else console.log(JSON.stringify({ username: "joemason", exists: Boolean(existing.data), applied: false }));
}

if (initialize) {
  // Only accounts still using the old scheme are initialized. Never reset a chosen new PIN on rerun.
  const targets = await admin.from("sales_rep_profiles").select("user_id,username,pin_key").is("pin_key", null);
  if (targets.error) throw new Error("CRM account lookup failed.");
  const initialized = [];
  for (const profile of targets.data) {
    if (apply) {
      await setSalesPin(admin, profile, "0000", true);
      await record(profile.username, profile.user_id, "pin_reset");
    }
    initialized.push(profile.username);
  }
  console.log(JSON.stringify({ initialized, applied: apply, mustChangePin: true }));
}

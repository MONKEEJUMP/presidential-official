import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: actors, error: actorError } = await admin.from("sales_rep_profiles")
  .select("user_id,username").in("username", ["paulie", "everett"]).eq("active", true);
assert.ifError(actorError);
assert.ok(actors.length > 0, "An existing active CRM user is required");
const directory = [];
for (let offset = 0; ; offset += 1000) {
  const { data, error } = await admin.from("sales_target_directory")
    .select("id,state_code,city,zip,is_purchasing").order("id").range(offset, offset + 999);
  assert.ifError(error);
  directory.push(...data);
  if (data.length < 1000) break;
}
const cases = [
  { state: "OK", search: "73162", zip: "73162" },
  { state: "OK", search: " 73162 ", zip: "73162" },
  { state: "OK", search: "73162-1234", zip: "73162" },
];
for (const state of [...new Set(directory.map((row) => row.state_code))]) {
  const sample = directory.find((row) => row.state_code === state && /^\d{5}$/.test(row.zip ?? ""));
  assert.ok(sample, `${state} needs a stored ZIP example`);
  cases.push({ state, search: sample.zip, zip: sample.zip });
}
let checks = 0;
for (const actor of actors) {
  for (const example of cases) {
    for (const filter of ["all", "purchasing", "not_purchasing"]) {
      const expected = directory.filter((row) => row.state_code === example.state && row.zip === example.zip
        && (filter === "all" || row.is_purchasing === (filter === "purchasing")));
      const { data, error } = await admin.rpc("browse_sales_targets", {
        p_actor_id: actor.user_id, p_state: example.state, p_search: example.search,
        p_filter: filter, p_queue: "all", p_limit: 40, p_offset: 0,
      });
      assert.ifError(error);
      assert.equal(data.totalMatching, expected.length,
        `${actor.username}: ${example.state} ZIP ${example.search} / ${filter} must match stored territory records`);
      assert.ok(data.doors.every((row) => row.zip === example.zip), "ZIP search must not return unrelated phone-number matches");
      checks += 1;
    }
  }
}
console.log(JSON.stringify({ passed: true, checks, actors: actors.map((row) => row.username),
  directoryRecords: directory.length,
  zip73162: { prospects: directory.filter((row) => row.state_code === "OK" && row.zip === "73162" && !row.is_purchasing).length,
    purchasing: directory.filter((row) => row.state_code === "OK" && row.zip === "73162" && row.is_purchasing).length } }));

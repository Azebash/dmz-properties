import assert from "node:assert/strict";
import postgres from "postgres";

// Use only an isolated, migrated local test database. Fixtures always roll back.
const endpoint = new URL(process.env.DMZ_TEST_DATABASE_URL || "");
if (!["localhost", "127.0.0.1"].includes(endpoint.hostname)) {
  throw new Error("Listing rule verification requires a local test database");
}
const sql = postgres(endpoint.toString(), { max: 1 });
let checks = 0;
const adminId = "93333333-3333-4333-8333-333333333333";
const viewerId = "94444444-4444-4444-8444-444444444444";
const managerId = "95555555-5555-4555-8555-555555555555";
const check = (condition, message) => { assert.ok(condition, message); checks++; };
async function scalar(query, args = []) {
  const rows = await sql.unsafe(query, args);
  return Object.values(rows[0])[0];
}
async function rejects(query, args, code) {
  await sql.unsafe("savepoint expected_failure");
  try {
    await sql.unsafe(query, args);
    throw new Error("Expected database rejection");
  } catch (error) {
    assert.equal(error.code, code);
    checks++;
  } finally { await sql.unsafe("rollback to savepoint expected_failure"); }
}

try {
  await sql.unsafe("begin");
  for (const [id, role] of [[adminId, "administrator"], [viewerId, "viewer"], [managerId, "property_manager"]]) {
    await sql`insert into auth.users (id,email,email_confirmed_at,encrypted_password)
      values (${id}, ${`${role}@local-test.invalid`}, now(), 'local-fixture-hash')`;
    await sql`insert into public.staff_profiles (user_id,display_name,role)
      values (${id}, ${`Test ${role}`}, ${role})`;
  }
  const benchmark = await scalar("select get_published_area_guide('kyc-homes-phase-ii')->'developerPrice'");
  check(benchmark.amount > 0 && benchmark.confirmedAt, "migration preserves a confirmed independent benchmark");
  const payload = { reference: "DMZ-LOCAL-RULE", slug: "local-listing-rules", title: "Local test listing",
    source: "owner_resale", propertyType: "Land", locationName: "KYC Homes Phase II",
    description: "Local test only", features: [], isFeatured: true };
  await sql.unsafe("set local role authenticated");
  await sql`select set_config('request.jwt.claim.sub', ${viewerId}, true)`;
  await rejects("select save_property($1::jsonb)", [payload], "42501");
  await sql`select set_config('request.jwt.claim.sub', ${adminId}, true)`;
  const id = await scalar("select save_property($1::jsonb)", [payload]);
  check(await scalar("select status from properties where id=$1", [id]) === "draft", "creation starts private");
  check(await scalar("select is_featured from properties where id=$1", [id]), "feature flag persists");
  await rejects("select transition_property_status($1,'published')", [id], "23514");
  await scalar("select save_property($1::jsonb)", [{ ...payload, id, lastVerifiedAt: "2026-09-17" }]);
  await sql.unsafe("set local role anon");
  check(await scalar("select count(*)::int from properties where id=$1", [id]) === 0, "anonymous visitors cannot read featured drafts");
  await rejects("select transition_property_status($1,'published')", [id], "42501");
  await sql.unsafe("set local role authenticated");
  await sql`select set_config('request.jwt.claim.sub', ${managerId}, true)`;
  check(await scalar("select transition_property_status($1,'published')", [id]) === "published", "manager publishes directly from draft");
  await rejects("select save_property($1::jsonb)", [{ ...payload, id, slug: "changed-url", lastVerifiedAt: "2026-09-17" }], "23514");
  await sql.unsafe("set local role anon");
  check(await scalar("select count(*)::int from properties where id=$1", [id]) === 1, "published listing is public");
  await sql.unsafe("set local role authenticated");
  for (const status of ["reserved", "published", "under_review"]) {
    await scalar("select transition_property_status($1,$2::property_status)", [id, status]);
    await sql.unsafe("set local role anon");
    check(await scalar("select count(*)::int from properties where id=$1", [id]) === (status === "published" ? 1 : 0), `${status} has correct public visibility`);
    await sql.unsafe("set local role authenticated");
  }
  await scalar("select transition_property_status($1,'published')", [id]);
  await scalar("select transition_property_status($1,'sold')", [id]);
  await sql.unsafe("set local role anon");
  check(await scalar("select count(*)::int from properties where id=$1", [id]) === 0, "sold listing is hidden");
  await sql.unsafe("reset role");
  check(await scalar("select count(*)::int from audit_events where entity_type='property' and entity_id=$1", [id]) >= 8, "mutations and transitions are audited");
  await sql.unsafe("set local role authenticated");
  await sql`select set_config('request.jwt.claim.sub', ${adminId}, true)`;
  const draft = await scalar("select draft_copy from area_guides where slug='kyc-homes-phase-ii'");
  const updated = { ...draft, developerPrice: { amount: 15000000, plotSizeSqm: 650, confirmedAt: "2026-09-20", visible: true } };
  await scalar("select save_area_guide('kyc-homes-phase-ii',$1::jsonb)", [updated]);
  check(JSON.stringify(await scalar("select get_published_area_guide('kyc-homes-phase-ii')->'developerPrice'")) === JSON.stringify(benchmark), "benchmark draft does not change approved price");
  await rejects("select save_area_guide('kyc-homes-phase-ii',$1::jsonb)", [{ ...updated, developerPrice: { ...updated.developerPrice, amount: -1 } }], "23514");
  await rejects("select save_area_guide('kyc-homes-phase-ii',$1::jsonb)", [{ ...updated, developerPrice: { ...updated.developerPrice, confirmedAt: "2099-01-01" } }], "23514");
  await scalar("select transition_area_guide_status('kyc-homes-phase-ii','under_review')");
  await scalar("select transition_area_guide_status('kyc-homes-phase-ii','published')");
  check(await scalar("select (get_published_area_guide('kyc-homes-phase-ii')->'developerPrice'->>'amount')::int") === 15000000, "published benchmark updates independently of listings");
  await scalar("select save_area_guide('kyc-homes-phase-ii',$1::jsonb)", [{ ...updated, developerPrice: { ...updated.developerPrice, visible: false } }]);
  await scalar("select transition_area_guide_status('kyc-homes-phase-ii','under_review')");
  await scalar("select transition_area_guide_status('kyc-homes-phase-ii','published')");
  check(await scalar("select (get_published_area_guide('kyc-homes-phase-ii')->'developerPrice'->>'visible')::boolean") === false, "staff can withdraw benchmark visibility");
  await sql`select set_config('request.jwt.claim.sub', ${viewerId}, true)`;
  await rejects("select save_area_guide('kyc-homes-phase-ii',$1::jsonb)", [updated], "42501");
  console.log(`${checks} listing and benchmark database checks passed; fixtures rolled back.`);
} finally { await sql.unsafe("rollback").catch(() => {}); await sql.end(); }

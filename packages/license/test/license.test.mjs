import test from "node:test";
import assert from "node:assert/strict";
import { LicenseManager, LicenseError, editionForTier, FEATURES } from "../dist/index.js";

const b64u = (b) => Buffer.from(b).toString("base64url");

async function setup(alg = "EdDSA") {
  const gen = alg === "EdDSA" ? { name: "Ed25519" } : { name: "ECDSA", namedCurve: "P-256" };
  const sg = alg === "EdDSA" ? { name: "Ed25519" } : { name: "ECDSA", hash: "SHA-256" };
  const kp = await crypto.subtle.generateKey(gen, true, ["sign", "verify"]);
  const mgr = new LicenseManager();
  mgr.configure({ publicKeys: [await crypto.subtle.exportKey("jwk", kp.publicKey)] });
  const issue = async (o = {}, tamper = false) => {
    const pl = { v: 1, id: "L1", customer: "Acme", tier: "professional", seats: 0, apps: [], issued: "2026-01-01", updatesUntil: "2027-01-01", ...o };
    const h = b64u(JSON.stringify({ alg, typ: "AAIRA-LIC", v: 1 }));
    const p = b64u(JSON.stringify(pl));
    const sig = await crypto.subtle.sign(sg, kp.privateKey, Buffer.from(`${h}.${p}`));
    return `AAIRA-${h}.${tamper ? b64u(JSON.stringify({ ...pl, tier: "enterprise" })) : p}.${b64u(sig)}`;
  };
  return { mgr, issue };
}
const opts = { now: new Date("2026-06-01"), releaseDate: "2026-11-20" };

test("free by default", () => {
  const m = new LicenseManager();
  assert.equal(m.edition, "free");
  assert.equal(m.has("core.basic"), true);
  assert.equal(m.has("extras.dualList"), false);
  assert.throws(() => m.assert("extras.dualList"), LicenseError);
});

test("pro key unlocks pro, not enterprise", async () => {
  const { mgr, issue } = await setup();
  assert.equal((await mgr.activate(await issue(), opts)).valid, true);
  assert.equal(mgr.edition, "pro");
  assert.equal(mgr.has("extras.dualList"), true);
  assert.equal(mgr.has("security.sso"), false);
});

test("enterprise key unlocks all", async () => {
  const { mgr, issue } = await setup();
  await mgr.activate(await issue({ tier: "enterprise" }), opts);
  for (const f of Object.keys(FEATURES)) assert.equal(mgr.has(f), true, f);
});

test("ES256 verifies", async () => {
  const { mgr, issue } = await setup("ES256");
  assert.equal((await mgr.activate(await issue(), opts)).valid, true);
});

test("tampered or foreign-signed keys rejected", async () => {
  const a = await setup();
  const b = await setup();
  assert.equal((await a.mgr.activate(await a.issue({}, true), opts)).reason, "bad-signature");
  assert.equal(a.mgr.edition, "free");
  assert.equal((await b.mgr.activate(await a.issue(), opts)).reason, "bad-signature");
});

test("no public key fails closed; malformed tokens", async () => {
  const { issue } = await setup();
  const m = new LicenseManager();
  assert.equal((await m.activate(await issue(), opts)).reason, "no-public-key");
  assert.equal((await m.activate("garbage")).reason, "malformed");
  assert.equal((await m.activate("AAIRA-a.b")).reason, "malformed");
  assert.equal((await m.activate("AAIRA-!!.@@.##")).reason, "malformed");
});

test("expired trial -> free", async () => {
  const { mgr, issue } = await setup();
  const s = await mgr.activate(await issue({ tier: "trial", updatesUntil: "2026-03-01" }), opts);
  assert.equal(s.reason, "expired");
  assert.equal(mgr.edition, "free");
});

test("release not covered by lapsed key; older release works", async () => {
  const { mgr, issue } = await setup();
  const t = await issue({ updatesUntil: "2026-06-30" });
  assert.equal((await mgr.activate(t, opts)).reason, "release-not-covered");
  assert.equal((await mgr.activate(t, { ...opts, releaseDate: "2026-05-01" })).valid, true);
});

test("per-application key checks appName", async () => {
  const { mgr, issue } = await setup();
  const t = await issue({ tier: "application", apps: ["HR Portal"] });
  assert.equal((await mgr.activate(t, { ...opts, appName: "Finance" })).reason, "wrong-application");
  assert.equal((await mgr.activate(t, { ...opts, appName: "hr portal" })).valid, true);
});

test("require() warns once and returns false", () => {
  const m = new LicenseManager();
  let n = 0;
  assert.equal(m.require("extras.dualList", () => n++), false);
  assert.equal(m.require("extras.dualList", () => n++), false);
  assert.equal(n, 1);
});

test("editionForTier", () => {
  assert.equal(editionForTier("professional"), "pro");
  assert.equal(editionForTier("trial"), "pro");
  assert.equal(editionForTier("enterprise"), "enterprise");
  assert.equal(editionForTier("x"), "free");
});

test("enableTrial activates trial mode, unlocks features, and sets watermark", () => {
  const m = new LicenseManager();
  assert.equal(m.isTrial, false);
  assert.equal(m.watermarkText, undefined);
  m.allowUnsignedTrial = true; // dev/test only

  const state = m.enableTrial({ edition: "enterprise", maxRows: 25, maxConditions: 4, maxSelectedItems: 5, customer: "ACME Trial" });
  assert.equal(state.valid, true);
  assert.equal(state.trial, true);
  assert.equal(m.isTrial, true);
  assert.equal(m.edition, "enterprise");
  assert.equal(m.has("extras.dualList"), true);
  assert.equal(m.has("security.sso"), true);
  assert.equal(m.maxRows, 25);
  assert.equal(m.maxConditions, 4);
  assert.equal(m.maxSelectedItems, 5);
  assert.ok(m.watermarkText.includes("Trial Edition"));

  m.reset();
  assert.equal(m.isTrial, false);
  assert.equal(m.edition, "free");
  assert.equal(m.has("extras.dualList"), false);
});

test("unsigned trial is disabled by default (cannot unlock paid controls from the console)", () => {
  const m = new LicenseManager();
  const state = m.enableTrial({ edition: "enterprise" });
  assert.equal(state.valid, false);
  assert.equal(state.reason, "unsigned-trial-disabled");
  assert.equal(m.edition, "free");
  assert.equal(m.has("data.gridView"), false);
});

test("tier map: data controls are Pro, SqlWhereBuilder and auth are Enterprise", async () => {
  assert.equal(FEATURES["data.gridView"], "pro");
  assert.equal(FEATURES["data.dataList"], "pro");
  assert.equal(FEATURES["data.repeater"], "pro");
  assert.equal(FEATURES["datasource.object"], "pro");
  assert.equal(FEATURES["extras.dualList"], "pro");
  assert.equal(FEATURES["extras.sqlWhereBuilder"], "enterprise");
  assert.equal(FEATURES["security.auth"], "enterprise");
  assert.equal(FEATURES["adapters.account"], undefined); // Login adapters stay free
  const { mgr, issue } = await setup();
  await mgr.activate(await issue(), opts); // professional
  assert.equal(mgr.has("data.gridView"), true);
  assert.equal(mgr.has("extras.sqlWhereBuilder"), false);
  assert.equal(mgr.has("security.auth"), false);
  await mgr.activate(await issue({ tier: "enterprise" }), opts);
  assert.equal(mgr.has("security.auth"), true);
});

test("license features[] grants extra features on top of the tier", async () => {
  const { mgr, issue } = await setup();
  await mgr.activate(await issue({ features: ["security.auth", "not.a.feature"] }), opts);
  assert.equal(mgr.edition, "pro");
  assert.equal(mgr.has("security.auth"), true);
  assert.equal(mgr.has("extras.sqlWhereBuilder"), false);
});

test("evaluation mode: unlicensed and trial are limited, a commercial key is not", async () => {
  const m = new LicenseManager();
  assert.equal(m.evaluation("data.gridView"), true);
  assert.equal(m.rowLimit("data.gridView"), 10);
  assert.match(m.watermarkFor("data.gridView"), /Unlicensed/);
  assert.equal(m.watermarkFor("core.basic"), undefined);
  assert.equal(m.evaluation("core.basic"), false);

  const { mgr, issue } = await setup();
  const t = await mgr.activate(await issue({ tier: "trial", updatesUntil: "2026-12-31" }), opts); // signed trial
  assert.equal(t.valid, true);
  assert.equal(t.trial, true);
  assert.equal(mgr.rowLimit("data.gridView"), 10);
  assert.match(mgr.watermarkFor("data.gridView"), /Trial Edition/);

  await mgr.activate(await issue(), opts); // professional
  assert.equal(mgr.evaluation("data.gridView"), false);
  assert.equal(mgr.rowLimit("data.gridView"), undefined);
  assert.equal(mgr.watermarkFor("data.gridView"), undefined);
  assert.equal(mgr.evaluation("security.auth"), true); // not licensed for Enterprise
});

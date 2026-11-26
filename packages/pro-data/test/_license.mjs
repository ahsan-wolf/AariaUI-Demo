// Test helper: sign a real Pro license (Ed25519) and activate it on the shared License singleton,
// so the Pro data controls run without evaluation limits. Import it first in a test file.
import { License } from "@wf-controls/license";

const b64u = (b) => Buffer.from(b).toString("base64url");

export async function activate(tier = "professional", extra = {}) {
  const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  License.reset();
  License.configure({ publicKeys: [await crypto.subtle.exportKey("jwk", kp.publicKey)], replace: true });
  const pl = { v: 1, id: "T", customer: "Test", tier, seats: 0, apps: [], issued: "2026-01-01", updatesUntil: "2030-01-01", ...extra };
  const h = b64u(JSON.stringify({ alg: "EdDSA", typ: "AAIRA-LIC", v: 1 }));
  const p = b64u(JSON.stringify(pl));
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, kp.privateKey, Buffer.from(`${h}.${p}`));
  const s = await License.activate(`AAIRA-${h}.${p}.${b64u(sig)}`, { now: new Date("2026-06-01"), releaseDate: "2026-11-20" });
  if (!s.valid) throw new Error("test license invalid: " + s.reason);
  return s;
}

export function unlicensed() {
  License.reset();
  License.configure({ publicKeys: [], replace: true });
}

await activate();

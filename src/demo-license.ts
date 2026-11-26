// DEMO ONLY: signs a throw-away Enterprise license with a key generated in this browser tab / process and activates it,
// so the Pro and Enterprise controls in the samples run without evaluation limits.
//
// Real apps never do this. They ship the vendor's PUBLIC key (License.configure or the embedded key) and activate a
// token issued by the vendor, e.g.   await License.activate(tokenFromYourSettings).
//
// The same file is copied next to each sample (samples/auth-js/src, samples/react/src, samples/angular/src/app,
// samples/employee-manager/src, samples/demo-showcase/src, apps/aaira-gallery/src). Master: samples/auth-js/src.
import { License } from "@wf-controls/license";

const b64u = (bytes: Uint8Array): string => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const text = (o: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(o));

export async function activateDemoLicense(tier: "professional" | "enterprise" | "trial" = "enterprise"): Promise<void> {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  License.reset();
  License.configure({ publicKeys: [await crypto.subtle.exportKey("jwk", kp.publicKey)], replace: true });
  const header = b64u(text({ alg: "EdDSA", typ: "AAIRA-LIC", v: 1 }));
  const payload = b64u(text({
    v: 1, id: "DEMO", customer: "Sample app (demo key)", tier, seats: 0, apps: [],
    issued: new Date().toISOString().slice(0, 10), updatesUntil: "2099-12-31"
  }));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, kp.privateKey, new TextEncoder().encode(`${header}.${payload}`)));
  const state = await License.activate(`AAIRA-${header}.${payload}.${b64u(sig)}`);
  if (!state.valid) throw new Error(`Demo license was rejected: ${state.reason}`);
}

/** A signed trial token (tier "trial"): Pro controls keep the 10-row cap but allow editing, with a trial notice. */
export const activateDemoTrial = (): Promise<void> => activateDemoLicense("trial");

/** Back to "no license": evaluation mode for every paid control. */
export function deactivateDemoLicense(): void {
  License.reset();
  License.configure({ publicKeys: [], replace: true });
}

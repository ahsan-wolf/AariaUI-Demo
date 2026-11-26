// FREE membership engine: hashing, stores, StoreMembershipProvider, roles, reset tokens, rate limiting, audit, claims.
import test from "node:test";
import assert from "node:assert/strict";
import { pbkdf2Sync } from "node:crypto";
import {
  Pbkdf2PasswordHasher, PBKDF2_MIN_ITERATIONS,
  toBase64Url, fromBase64Url, constantTimeEqual, randomToken, randomString, secureRandom, hashToken,
  InMemoryUserStore, InMemoryRoleStore, userStoreContractCases, roleStoreContractCases,
  StoreMembershipProvider, StoreRoleProvider, InMemoryAuthProvider, InMemoryAuditSink, FORBIDDEN_AUDIT_KEYS,
  SlidingWindowRateLimiter, PasswordPolicy, GenericIdentity, GenericPrincipal, principalHasClaim, SecurityManager,
} from "../dist/index.js";

const fast = () => Pbkdf2PasswordHasher.forTesting();
/** Wraps a hasher and counts calls, so tests can prove how much work an operation did. */
function spy(inner = fast()) {
  const s = { hash: 0, verify: 0, hasher: null };
  s.hasher = {
    hash: (p) => { s.hash++; return inner.hash(p); },
    verify: (p, e) => { s.verify++; return inner.verify(p, e); },
    needsRehash: (e) => inner.needsRehash(e),
  };
  return s;
}
function make(over = {}) {
  let now = 1_700_000_000_000;
  const clock = { advance: (ms) => { now += ms; }, get now() { return now; } };
  const audit = new InMemoryAuditSink();
  const userStore = new InMemoryUserStore();
  const roleStore = new InMemoryRoleStore();
  const provider = new StoreMembershipProvider({ userStore, roleStore, hasher: fast(), auditSink: audit, now: () => now, ...over });
  return { provider, userStore, roleStore, audit, clock };
}
const PW = "correct horse battery";

// ------------------------------------------------------------------------------------------------ crypto helpers

test("base64url round-trips and matches Node's encoding", () => {
  for (const n of [0, 1, 2, 3, 4, 5, 31, 32, 33]) {
    const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) & 255);
    const text = toBase64Url(bytes);
    assert.equal(text, Buffer.from(bytes).toString("base64url"));
    assert.deepEqual([...fromBase64Url(text)], [...bytes]);
  }
  assert.throws(() => fromBase64Url("abc$"), /Invalid base64url/);
});

test("constantTimeEqual compares bytes and strings, including different lengths", () => {
  assert.equal(constantTimeEqual("abc", "abc"), true);
  assert.equal(constantTimeEqual("abc", "abd"), false);
  assert.equal(constantTimeEqual("abc", "abcd"), false);
  assert.equal(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])), true);
  assert.equal(constantTimeEqual("", ""), true);
});

test("secure random helpers: sizes, charset, uniqueness", () => {
  assert.equal(secureRandom(16).length, 16);
  assert.throws(() => secureRandom(0));
  assert.equal(fromBase64Url(randomToken(32)).length, 32);
  assert.notEqual(randomToken(), randomToken());
  const s = randomString(200, "ab");
  assert.equal(s.length, 200);
  assert.match(s, /^[ab]+$/);
  assert.ok(s.includes("a") && s.includes("b"));
});

// ------------------------------------------------------------------------------------------------ password hasher

test("PBKDF2 hasher agrees with Node's independent pbkdf2 implementation", async () => {
  const h = new Pbkdf2PasswordHasher({ iterations: PBKDF2_MIN_ITERATIONS });
  const encoded = await h.hash("pässword");
  assert.match(encoded, /^\$pbkdf2-sha256\$i=100000\$[\w-]+\$[\w-]+$/);
  const [, , iter, salt, hash] = encoded.split("$");
  const expected = pbkdf2Sync("pässword".normalize("NFKC"), Buffer.from(fromBase64Url(salt)), Number(iter.slice(2)), 32, "sha256");
  assert.equal(hash, expected.toString("base64url"));
});

test("hasher: verify accepts the right password and rejects wrong, malformed and oversized input", async () => {
  const h = fast();
  const e = await h.hash("s3cret!");
  assert.equal(await h.verify("s3cret!", e), true);
  assert.equal(await h.verify("s3cret?", e), false);
  for (const bad of ["", "plain", "$pbkdf2-sha256$i=abc$x$y", "$pbkdf2-sha256$i=1000$AAAA$AAAA", "$other$i=1000$a$b", null, undefined]) assert.equal(await h.verify("s3cret!", bad), false);
  assert.equal(await h.verify("x".repeat(5000), e), false);
  await assert.rejects(h.hash(""), /non-empty/);
  await assert.rejects(h.hash("x".repeat(5000)), /longer than/);
});

test("hasher: unique salts, NFKC normalization, rehash detection and a floor on iterations", async () => {
  const h = fast();
  assert.notEqual(await h.hash("same"), await h.hash("same"), "per-password random salt");
  const composed = "café", decomposed = "café";
  assert.equal(await h.verify(decomposed, await h.hash(composed)), true);
  const strong = new Pbkdf2PasswordHasher({ iterations: 150_000 });
  assert.equal(strong.needsRehash(await h.hash("x")), true);
  assert.equal(strong.needsRehash(await strong.hash("x")), false);
  assert.equal(strong.needsRehash("garbage"), true);
  assert.throws(() => new Pbkdf2PasswordHasher({ iterations: 1000 }), /at least 100000/);
  assert.throws(() => new Pbkdf2PasswordHasher({ iterations: 0 }));
});

// ------------------------------------------------------------------------------------------------ store contracts

for (const c of userStoreContractCases(() => new InMemoryUserStore())) test(`InMemoryUserStore contract: ${c.name}`, () => c.run(assert));
for (const c of roleStoreContractCases(() => new InMemoryRoleStore())) test(`InMemoryRoleStore contract: ${c.name}`, () => c.run(assert));

// ------------------------------------------------------------------------------------------------ creating and reading users

test("createUser validates every field and reports the exact ASP.NET status", async () => {
  const { provider } = make({ requiresQuestionAndAnswer: true });
  assert.equal((await provider.createUser("", PW, "a@b.co", "q?", "answer")).status, "InvalidUserName");
  assert.equal((await provider.createUser("bad,name", PW, "a@b.co", "q?", "answer")).status, "InvalidUserName");
  assert.equal((await provider.createUser("u1", PW, "not-mail", "q?", "answer")).status, "InvalidEmail");
  assert.equal((await provider.createUser("u1", "short", "a@b.co", "q?", "answer")).status, "InvalidPassword");
  assert.equal((await provider.createUser("u1", PW, "a@b.co")).status, "InvalidQuestion");
  assert.equal((await provider.createUser("u1", PW, "a@b.co", "q?", "ab")).status, "InvalidAnswer");
  const ok = await provider.createUser("u1", PW, "a@b.co", "q?", "answer");
  assert.equal(ok.status, "Success");
  assert.equal(ok.user.userName, "u1");
  assert.equal(ok.user.email, "a@b.co");
  assert.ok(ok.user.providerUserKey && ok.user.creationDate instanceof Date && ok.user.lastPasswordChangedDate instanceof Date);
  assert.equal((await provider.createUser("U1", PW, "z@b.co", "q?", "answer")).status, "DuplicateUserName");
  assert.equal((await provider.createUser("u2", PW, "A@B.CO", "q?", "answer")).status, "DuplicateEmail");
});

test("NOTHING secret is stored in plain text: password and security answer are hashes", async () => {
  const { provider, userStore } = make();
  await provider.createUser("alice", "Tr0ub4dor&3 horse", "alice@example.com", "Pet?", "Rex The Dog");
  const rec = await userStore.findByName("alice");
  const dump = JSON.stringify(rec);
  assert.ok(!dump.includes("Tr0ub4dor"), "password absent");
  assert.ok(!dump.toLowerCase().includes("rex the dog") && !dump.toLowerCase().includes("rex"), "answer absent");
  assert.match(rec.passwordHash, /^\$pbkdf2-sha256\$/);
  assert.match(rec.passwordAnswerHash, /^\$pbkdf2-sha256\$/);
  assert.equal(await provider.validateUser("alice", "Tr0ub4dor&3 horse"), true);
  assert.equal(await provider.validateUser("alice", "tr0ub4dor&3 horse"), false);
});

test("getUser exposes the full MembershipUser and no secrets; names are case-insensitive", async () => {
  const { provider } = make();
  await provider.createUser("Alice", PW, "alice@example.com", "Pet?", "rex1");
  const u = await provider.getUser("aLiCe");
  assert.equal(u.userName, "Alice");
  assert.equal(u.passwordQuestion, "Pet?");
  assert.equal(u.isApproved, true);
  assert.equal(u.isLockedOut, false);
  assert.equal(JSON.stringify(u).includes("pbkdf2"), false);
  assert.equal(await provider.getUser("nobody"), null);
  assert.equal(await provider.getPasswordQuestion("alice"), "Pet?");
  assert.equal(await provider.getPasswordQuestion("nobody"), null);
});

// ------------------------------------------------------------------------------------------------ validation, lockout, enumeration

test("unknown, locked and wrong-password cases all do exactly one hash verification (no user enumeration by work)", async () => {
  const s = spy();
  const { provider } = make({ hasher: s.hasher, maxInvalidPasswordAttempts: 2 });
  await provider.createUser("alice", PW, "a@b.co");
  await provider.createUser("bob", PW, "b@b.co");
  const cases = [["alice", PW], ["alice", "wrong password!"], ["nobody", PW], ["bob", "x"], ["bob", "y"], ["bob", PW /* locked now */]];
  for (const [u, p] of cases) {
    const before = s.verify;
    await provider.validateUser(u, p);
    assert.equal(s.verify - before, 1, `${u}: exactly one verify`);
  }
});

test("lockout counts failures only inside the attempt window and a good password resets the count", async () => {
  const { provider, clock } = make({ maxInvalidPasswordAttempts: 3, passwordAttemptWindowMinutes: 10 });
  await provider.createUser("alice", PW, "a@b.co");
  await provider.validateUser("alice", "bad one"); await provider.validateUser("alice", "bad two");
  clock.advance(11 * 60_000); // the window expires: counting starts again
  await provider.validateUser("alice", "bad three");
  await provider.validateUser("alice", "bad four");
  assert.equal((await provider.getUser("alice")).isLockedOut, false, "two failures in the new window");
  assert.equal(await provider.validateUser("alice", PW), true, "success resets the counter");
  await provider.validateUser("alice", "bad five"); await provider.validateUser("alice", "bad six");
  assert.equal((await provider.getUser("alice")).isLockedOut, false);
  await provider.validateUser("alice", "bad seven");
  const locked = await provider.getUser("alice");
  assert.equal(locked.isLockedOut, true);
  assert.ok(locked.lastLockoutDate instanceof Date);
  assert.equal(await provider.validateUser("alice", PW), false, "locked: even the right password fails");
  assert.equal(await provider.unlockUser("alice"), true);
  assert.equal(await provider.validateUser("alice", PW), true);
  assert.equal(await provider.unlockUser("nobody"), false);
});

test("lockoutDurationMinutes unlocks automatically; unapproved users cannot sign in", async () => {
  const { provider, clock } = make({ maxInvalidPasswordAttempts: 1, lockoutDurationMinutes: 15 });
  await provider.createUser("alice", PW, "a@b.co");
  await provider.validateUser("alice", "bad one");
  assert.equal(await provider.validateUser("alice", PW), false);
  clock.advance(16 * 60_000);
  assert.equal(await provider.validateUser("alice", PW), true);
  await provider.createUser("pending", PW, "p@b.co", undefined, undefined, false);
  assert.equal(await provider.validateUser("pending", PW), false);
  assert.equal(await provider.updateUser({ userName: "pending", isApproved: true }), true);
  assert.equal(await provider.validateUser("pending", PW), true);
});

test("a stale hash is upgraded on the next successful sign-in (rehash)", async () => {
  const userStore = new InMemoryUserStore();
  const weak = new StoreMembershipProvider({ userStore, hasher: fast() });
  await weak.createUser("alice", PW, "a@b.co");
  assert.match((await userStore.findByName("alice")).passwordHash, /i=1000\$/);
  const stronger = new StoreMembershipProvider({ userStore, hasher: new Pbkdf2PasswordHasher({ iterations: 120_000 }) });
  assert.equal(await stronger.validateUser("alice", PW), true);
  assert.match((await userStore.findByName("alice")).passwordHash, /i=120000\$/);
  assert.equal(await stronger.validateUser("alice", PW), true, "still verifies after the upgrade");
});

test("login updates dates and online status, notifies SecurityManager; logout clears", async () => {
  const { provider, clock } = make({ userIsOnlineTimeWindowMinutes: 15 });
  await provider.createUser("alice", PW, "a@b.co");
  const seen = [];
  const off = SecurityManager.currentUserChanged.subscribe((_p, u) => { seen.push(u?.userName ?? null); });
  assert.equal(await provider.login("alice", "nope nope nope"), false);
  assert.equal(provider.getCurrentUser(), null);
  assert.equal(await provider.login("alice", PW), true);
  assert.equal(provider.getCurrentUser().userName, "alice");
  assert.ok(provider.getCurrentUser().lastLoginDate instanceof Date);
  assert.equal(await provider.getNumberOfUsersOnline(), 1);
  clock.advance(16 * 60_000);
  assert.equal(await provider.getNumberOfUsersOnline(), 0);
  await provider.logout();
  assert.equal(provider.getCurrentUser(), null);
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(seen.filter((x) => x !== undefined).slice(-2), ["alice", null]);
  off();
});

// ------------------------------------------------------------------------------------------------ changing passwords

test("changePassword needs the old password, applies the policy, clears reset tokens and updates the change date", async () => {
  const { provider, userStore, clock } = make();
  await provider.createUser("alice", PW, "a@b.co");
  const tok = await provider.createPasswordResetToken("alice");
  assert.equal(await provider.changePassword("alice", "wrong old pass", "another long pass"), false);
  assert.equal(await provider.changePassword("alice", PW, "short"), false);
  clock.advance(1000);
  assert.equal(await provider.changePassword("alice", PW, "another long pass"), true);
  assert.equal(await provider.validateUser("alice", PW), false);
  assert.equal(await provider.validateUser("alice", "another long pass"), true);
  const rec = await userStore.findByName("alice");
  assert.equal(rec.resetTokenHash, undefined, "an outstanding reset token dies with a password change");
  assert.equal(await provider.resetPasswordWithToken("alice", tok.token, "yet another long pass"), "InvalidToken");
  assert.ok(rec.lastPasswordChangedDate > rec.creationDate);
});

test("changePasswordQuestionAndAnswer re-hashes the answer and requires the password", async () => {
  const { provider, userStore } = make();
  await provider.createUser("alice", PW, "a@b.co", "Old?", "oldanswer");
  assert.equal(await provider.changePasswordQuestionAndAnswer("alice", "wrong one", "New?", "newanswer"), false);
  assert.equal(await provider.changePasswordQuestionAndAnswer("alice", PW, "New?", "xy"), false);
  assert.equal(await provider.changePasswordQuestionAndAnswer("alice", PW, "New?", "newanswer"), true);
  assert.equal(await provider.getPasswordQuestion("alice"), "New?");
  assert.ok(!JSON.stringify(await userStore.findByName("alice")).includes("newanswer"));
  const temp = await provider.resetPassword("alice", " NEWANSWER ");
  assert.ok(temp, "answers are normalized (trim, case)");
});

// ------------------------------------------------------------------------------------------------ reset tokens

test("reset token: random, only its hash is stored, single use, expiring, replaced by a newer one", async () => {
  const { provider, userStore, clock } = make({ resetTokenLifetimeMinutes: 30 });
  await provider.createUser("alice", PW, "a@b.co");
  const t1 = await provider.createPasswordResetToken("alice");
  assert.ok(t1.token.length >= 43 && t1.expiresAt === clock.now + 30 * 60_000);
  const rec = await userStore.findByName("alice");
  assert.ok(!JSON.stringify(rec).includes(t1.token), "the token itself is never stored");
  assert.equal(rec.resetTokenHash, await hashToken(t1.token));

  assert.equal(await provider.resetPasswordWithToken("alice", "not-the-token", "brand new long pass"), "InvalidToken");
  assert.equal(await provider.resetPasswordWithToken("alice", t1.token, "short"), "InvalidPassword");
  const t2 = await provider.createPasswordResetToken("alice");
  assert.notEqual(t1.token, t2.token);
  assert.equal(await provider.resetPasswordWithToken("alice", t1.token, "brand new long pass"), "InvalidToken", "older token no longer works");
  assert.equal(await provider.resetPasswordWithToken("bob", t2.token, "brand new long pass"), "InvalidToken", "token is bound to the user");
  assert.equal(await provider.resetPasswordWithToken("alice", t2.token, "brand new long pass"), "Success");
  assert.equal(await provider.resetPasswordWithToken("alice", t2.token, "once more long pass"), "InvalidToken", "single use");
  assert.equal(await provider.validateUser("alice", "brand new long pass"), true);
  assert.equal(await provider.validateUser("alice", PW), false);
});

test("reset token expires, unlocks the account on success, and unknown users give the same answer as bad tokens", async () => {
  const { provider, clock } = make({ resetTokenLifetimeMinutes: 30, maxInvalidPasswordAttempts: 1 });
  await provider.createUser("alice", PW, "a@b.co");
  await provider.validateUser("alice", "bad one");
  assert.equal((await provider.getUser("alice")).isLockedOut, true);
  const t = await provider.createPasswordResetToken("alice");
  clock.advance(31 * 60_000);
  assert.equal(await provider.resetPasswordWithToken("alice", t.token, "brand new long pass"), "InvalidToken", "expired");
  const t2 = await provider.createPasswordResetToken("alice");
  assert.equal(await provider.resetPasswordWithToken("alice", t2.token, "brand new long pass"), "Success");
  assert.equal((await provider.getUser("alice")).isLockedOut, false, "a successful reset unlocks");
  assert.equal(await provider.createPasswordResetToken("nobody"), null);
  assert.equal(await provider.resetPasswordWithToken("nobody", "whatever", "brand new long pass"), "InvalidToken");
});

test("legacy resetPassword: needs the right answer, returns a strong NEW password, stored hashed, wrong answers lock", async () => {
  const { provider, userStore } = make({ maxInvalidPasswordAttempts: 2, passwordPolicy: new PasswordPolicy({ minRequiredLength: 10, minRequiredNonAlphanumericCharacters: 1, requireDigit: true, requireUppercase: true, requireLowercase: true }) });
  await provider.createUser("alice", "Initial#Pass1", "a@b.co", "Pet?", "rex1");
  assert.equal(await provider.resetPassword("alice", "wrong"), null);
  assert.equal(await provider.resetPassword("alice"), null, "answer is required when one is set");
  assert.equal((await provider.getUser("alice")).isLockedOut, true, "wrong answers count toward lockout");
  await provider.unlockUser("alice");
  const temp = await provider.resetPassword("alice", "REX1");
  assert.ok(temp && temp.length >= 12);
  assert.equal(new PasswordPolicy({ minRequiredLength: 10, minRequiredNonAlphanumericCharacters: 1, requireDigit: true, requireUppercase: true, requireLowercase: true }).isValid(temp), true);
  assert.ok(!JSON.stringify(await userStore.findByName("alice")).includes(temp));
  assert.equal(await provider.validateUser("alice", temp), true);
  assert.equal(await provider.validateUser("alice", "Initial#Pass1"), false);
  assert.equal(await provider.resetPassword("nobody", "x"), null);
});

// ------------------------------------------------------------------------------------------------ administration

test("administration: paging, LIKE search, e-mail lookup, update, delete, counts", async () => {
  const { provider, roleStore } = make();
  for (const n of ["alice", "alina", "bob", "carol", "dave"]) await provider.createUser(n, PW, `${n}@example.com`);
  const p1 = await provider.getAllUsers(0, 2), p2 = await provider.getAllUsers(1, 2), p3 = await provider.getAllUsers(2, 2);
  assert.deepEqual(p1.items.map((u) => u.userName), ["alice", "alina"]);
  assert.deepEqual(p2.items.map((u) => u.userName), ["bob", "carol"]);
  assert.deepEqual(p3.items.map((u) => u.userName), ["dave"]);
  assert.equal(p1.total, 5);
  assert.deepEqual((await provider.findUsersByName("ali%", 0, 10)).items.map((u) => u.userName), ["alice", "alina"]);
  assert.deepEqual((await provider.findUsersByEmail("b%", 0, 10)).items.map((u) => u.userName), ["bob"]);
  assert.equal(await provider.getUserNameByEmail("CAROL@example.com"), "carol");
  assert.equal(await provider.getUserNameByEmail("none@example.com"), null);

  assert.equal(await provider.updateUser({ userName: "bob", email: "bob2@example.com", comment: "vip" }), true);
  assert.equal((await provider.getUser("bob")).comment, "vip");
  assert.equal(await provider.updateUser({ userName: "bob", email: "alice@example.com" }), false, "duplicate e-mail rejected");
  assert.equal(await provider.updateUser({ userName: "bob", email: "not-mail" }), false);
  assert.equal(await provider.updateUser({ userName: "ghost" }), false);

  await roleStore.createRole("Users"); await roleStore.addUsersToRoles(["dave"], ["Users"]);
  assert.equal(await provider.deleteUser("dave"), true);
  assert.deepEqual(await roleStore.getUsersInRole("Users"), [], "deleting a user removes role memberships");
  assert.equal(await provider.deleteUser("dave"), false);
  assert.equal((await provider.getAllUsers(0, 100)).total, 4);
});

// ------------------------------------------------------------------------------------------------ roles

test("roles: loaded at sign-in for the synchronous API, refreshed on demand, async lookups for anyone", async () => {
  const { provider, roleStore } = make();
  await provider.createUser("alice", PW, "a@b.co");
  await provider.createUser("bob", PW, "b@b.co");
  const roles = new StoreRoleProvider(roleStore);
  await roles.createRole("Admins"); await roles.createRole("Users");
  await roles.addUsersToRoles(["alice"], ["Admins", "Users"]);
  assert.equal(provider.isInRole("Admins", "alice"), false, "not loaded into the sync cache yet");
  assert.equal(await provider.isInRoleAsync("alice", "admins"), true);
  assert.equal(provider.isInRole("ADMINS", "alice"), true, "now cached");
  await provider.login("alice", PW);
  assert.deepEqual(provider.getRolesForUser().sort(), ["Admins", "Users"]);
  assert.deepEqual(provider.getCurrentUser().roles.sort(), ["Admins", "Users"]);
  await roles.removeUsersFromRoles(["alice"], ["Admins"]);
  assert.equal(provider.isInRole("Admins"), true, "stale until refreshed");
  await provider.refreshRoles("alice");
  assert.equal(provider.isInRole("Admins"), false);
  assert.deepEqual(provider.getCurrentUser().roles, ["Users"]);
  assert.deepEqual(provider.getRolesForUser("bob"), []);
});

test("StoreRoleProvider behaves like the in-memory RoleProvider", async () => {
  const roles = new StoreRoleProvider(new InMemoryRoleStore());
  await roles.createRole("Admins");
  await assert.rejects(roles.createRole("admins"), /already exists/);
  await assert.rejects(roles.createRole("a,b"), /commas/);
  await assert.rejects(roles.createRole("  "), /empty/);
  await roles.addUsersToRoles(["Alice", "Bob"], ["Admins"]);
  assert.equal(await roles.isUserInRole("alice", "ADMINS"), true);
  assert.deepEqual(await roles.findUsersInRole("Admins", "ali"), ["alice"]);
  await assert.rejects(roles.deleteRole("Admins", true), /not empty/);
  assert.equal(await roles.deleteRole("Admins"), true);
  assert.equal(await roles.deleteRole("Admins"), false);
});

// ------------------------------------------------------------------------------------------------ audit

test("audit events are recorded and never contain passwords, answers or tokens", async () => {
  const { provider, audit } = make({ maxInvalidPasswordAttempts: 2 });
  const secrets = ["S3cret-Passphrase-123", "Another-Passphrase-456", "my-answer-789"];
  await provider.createUser("alice", secrets[0], "a@b.co", "Q?", secrets[2]);
  await provider.validateUser("alice", "bad one pass"); await provider.validateUser("alice", "bad two pass");
  await provider.unlockUser("alice");
  await provider.login("alice", secrets[0]);
  await provider.changePassword("alice", secrets[0], secrets[1]);
  const tok = await provider.createPasswordResetToken("alice");
  await provider.resetPasswordWithToken("alice", tok.token, "Third-Passphrase-000");
  await provider.logout();
  const types = new Set(audit.events.map((e) => e.type));
  for (const t of ["user.created", "login.failure", "login.locked-out", "user.unlocked", "login.success", "password.changed", "password.reset-requested", "password.reset", "logout"]) assert.ok(types.has(t), `audit has ${t}`);
  const dump = JSON.stringify(audit.events);
  for (const s of [...secrets, "bad one pass", "bad two pass", "Third-Passphrase-000", tok.token]) assert.ok(!dump.includes(s), `audit must not contain ${s.slice(0, 6)}...`);
  for (const e of audit.events) for (const k of Object.keys(e.detail ?? {})) assert.ok(!FORBIDDEN_AUDIT_KEYS.includes(k.toLowerCase()), `forbidden audit key ${k}`);
});

test("a failing audit sink never breaks authentication", async () => {
  const { provider } = make({ auditSink: { write: () => { throw new Error("sink down"); } } });
  assert.equal((await provider.createUser("alice", PW, "a@b.co")).status, "Success");
  assert.equal(await provider.validateUser("alice", PW), true);
  const { provider: p2 } = make({ auditSink: { write: () => Promise.reject(new Error("async sink down")) } });
  await p2.createUser("bob", PW, "b@b.co");
  assert.equal(await p2.validateUser("bob", PW), true);
});

// ------------------------------------------------------------------------------------------------ InMemoryAuthProvider

test("InMemoryAuthProvider hashes seeded users lazily, keeps sync roles, and has no built-in accounts", async () => {
  const p = new InMemoryAuthProvider({ hasher: fast(), users: [{ userName: "ann", password: "Passw0rd!", roles: ["Admins"], passwordQuestion: "Q?", passwordAnswer: "blue" }] });
  assert.equal(p.isInRole("admins", "ann"), true, "roles are available before anything is hashed");
  assert.equal(await p.validateUser("ann", "Passw0rd!"), true);
  assert.equal(await p.validateUser("ann", "passw0rd!"), false);
  assert.equal(await p.resetPassword("ann", "BLUE") !== null, true);
  const empty = new InMemoryAuthProvider({ hasher: fast() });
  assert.equal(await empty.getUser("admin"), null);
  assert.equal(await empty.validateUser("admin", "Password123!"), false);
  const created = await empty.createUser("new1", "abcd", "n@b.co");
  assert.equal(created.status, "Success");
  assert.deepEqual(created.user.roles, ["User"], "new accounts start in the User role");
});

// ------------------------------------------------------------------------------------------------ rate limiter, claims

test("sliding-window rate limiter allows N per window, reports retry time, slides, resets and bounds memory", () => {
  let now = 0;
  const rl = new SlidingWindowRateLimiter({ max: 3, windowMs: 1000, now: () => now, maxKeys: 3 });
  assert.deepEqual([rl.hit("a").allowed, rl.hit("a").allowed, rl.hit("a").allowed], [true, true, true]);
  const blocked = rl.hit("a");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 1000);
  assert.equal(rl.hit("b").allowed, true, "keys are independent");
  now = 1001;
  assert.equal(rl.hit("a").allowed, true, "the window slid");
  rl.reset("a");
  assert.equal(rl.hit("a").remaining, 2);
  for (const k of ["k1", "k2", "k3", "k4"]) rl.hit(k);
  assert.throws(() => new SlidingWindowRateLimiter({ max: 0, windowMs: 1 }));
});

test("claims on principals: roles count as role claims", () => {
  const p = new GenericPrincipal(new GenericIdentity("ann", "Test"), ["Admins"], [{ type: "department", value: "Finance" }, { type: "scope", value: "read" }]);
  assert.equal(principalHasClaim(p, "department"), true);
  assert.equal(principalHasClaim(p, "Department", "Finance"), true);
  assert.equal(principalHasClaim(p, "department", "HR"), false);
  assert.equal(principalHasClaim(p, "role", "admins"), true);
  assert.equal(principalHasClaim(p, "role", "Users"), false);
  assert.equal(principalHasClaim(new GenericPrincipal(new GenericIdentity("x")), "department"), false);
});

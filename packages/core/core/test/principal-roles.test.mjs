// FREE (MIT) security pieces: principals, basic roles, password policy, authorizeControl, CurrentPrincipal, Login postLogin hook.
import test from "node:test";
import assert from "node:assert/strict";
import {
  GenericIdentity, GenericPrincipal, AnonymousPrincipal,
  InMemoryRoleProvider, Roles,
  authorizeControl, PasswordPolicy,
  CurrentPrincipal, SecurityManager, InMemoryAuthProvider, LoginController, Pbkdf2PasswordHasher,
} from "../dist/index.js";

const alice = new GenericPrincipal(new GenericIdentity("Alice", "Forms"), ["Admins", "Users"]);
const bob = new GenericPrincipal(new GenericIdentity("Bob", "Forms"), ["Users"]);

test("principal: identity and case-insensitive roles", () => {
  assert.equal(alice.identity.isAuthenticated, true);
  assert.equal(alice.isInRole("admins"), true);
  assert.equal(bob.isInRole("Admins"), false);
  assert.equal(AnonymousPrincipal.identity.isAuthenticated, false);
  assert.equal(AnonymousPrincipal.isInRole("Users"), false);
});

test("InMemoryRoleProvider CRUD and error cases", async () => {
  const rp = new InMemoryRoleProvider();
  await rp.createRole("Admins");
  await assert.rejects(rp.createRole("admins"), /already exists/);
  await assert.rejects(rp.createRole("a,b"), /commas/);
  await rp.addUsersToRoles(["Alice", "Bob"], ["Admins"]);
  assert.equal(await rp.isUserInRole("alice", "ADMINS"), true);
  await assert.rejects(rp.addUsersToRoles(["Alice"], ["Admins"]), /already in role/);
  assert.deepEqual(await rp.getRolesForUser("Bob"), ["Admins"]);
  assert.deepEqual(await rp.findUsersInRole("Admins", "ali"), ["alice"]);
  await assert.rejects(rp.deleteRole("Admins", true), /not empty/);
  await rp.removeUsersFromRoles(["Alice", "Bob"], ["Admins"]);
  assert.equal(await rp.deleteRole("Admins", true), true);
  assert.equal(await rp.deleteRole("Admins"), false);
  await assert.rejects(rp.getUsersInRole("Nope"), /does not exist/);
});

test("Roles facade delegates to the active provider", async () => {
  const original = Roles.provider;
  try {
    Roles.setProvider(new InMemoryRoleProvider({ roles: { Ops: ["sam"] } }));
    assert.equal(await Roles.isUserInRole("sam", "ops"), true);
    await Roles.createRole("QA");
    await Roles.addUserToRole("sam", "QA");
    assert.deepEqual((await Roles.getRolesForUser("sam")).sort(), ["Ops", "QA"]);
  } finally { Roles.setProvider(original); }
});

test("authorizeControl (free role/user check)", () => {
  assert.equal(authorizeControl(alice, { roles: ["Admins"] }), true);
  assert.equal(authorizeControl(bob, { roles: ["Admins"] }), false);
  assert.equal(authorizeControl(bob, { users: ["bob"] }), true);
  assert.equal(authorizeControl(AnonymousPrincipal, { requireAuthenticated: true }), false);
  assert.equal(authorizeControl(bob, { requireAuthenticated: true }), true);
});

test("PasswordPolicy and InMemoryAuthProvider integration (default stays legacy)", async () => {
  const policy = new PasswordPolicy({ minRequiredLength: 8, minRequiredNonAlphanumericCharacters: 1, requireDigit: true, requireUppercase: true, requireLowercase: true });
  assert.equal(policy.isValid("Abcdef1!"), true);
  assert.equal(policy.validate("abc").length >= 4, true);
  assert.match(new PasswordPolicy({ strengthRegularExpression: "^[a-z]+!$", minRequiredNonAlphanumericCharacters: 0, minRequiredLength: 1 }).validate("ABC!")[0], /strength/);

  const strict = new InMemoryAuthProvider({ hasher: Pbkdf2PasswordHasher.forTesting(), passwordPolicy: policy });
  assert.equal((await strict.createUser("a", "weak", "a@x.com")).status, "InvalidPassword");
  assert.equal((await strict.createUser("a", "Abcdef1!", "a@x.com")).status, "Success");
  assert.equal(await strict.changePassword("a", "Abcdef1!", "weak"), false);
  assert.equal(await strict.changePassword("a", "Abcdef1!", "Zyxwvu9#"), true);

  const legacy = new InMemoryAuthProvider({ hasher: Pbkdf2PasswordHasher.forTesting() });
  assert.equal((await legacy.createUser("b", "abcd")).status, "Success");
});

test("CurrentPrincipal follows SecurityManager and supports an external override", async () => {
  const provider = new InMemoryAuthProvider({ hasher: Pbkdf2PasswordHasher.forTesting(), users: [{ userName: "Zed", password: "Passw0rd!", roles: ["Users"] }] });
  const original = SecurityManager.defaultProvider;
  SecurityManager.setProvider(provider);
  try {
    const seen = [];
    const off = CurrentPrincipal.subscribe((p) => seen.push(p.identity.name));
    assert.equal(CurrentPrincipal.current.identity.isAuthenticated, false);
    await provider.login("Zed", "Passw0rd!");
    assert.equal(CurrentPrincipal.current.identity.name, "Zed");
    assert.equal(CurrentPrincipal.current.isInRole("users"), true);
    CurrentPrincipal.set(new GenericPrincipal(new GenericIdentity("CORP\\sso", "Negotiate"), ["Domain Users"]));
    assert.equal(CurrentPrincipal.current.identity.authenticationType, "Negotiate");
    CurrentPrincipal.set(null);
    await provider.logout();
    assert.equal(CurrentPrincipal.current.identity.isAuthenticated, false);
    off();
    assert.ok(seen.includes("Zed") && seen.includes("CORP\\sso"));
  } finally { SecurityManager.setProvider(original); CurrentPrincipal.set(null); }
});

test("CurrentPrincipal sources: a paid package can supply a principal and is told about Membership sign-out", async () => {
  const provider = new InMemoryAuthProvider({ hasher: Pbkdf2PasswordHasher.forTesting(), users: [{ userName: "Kay", password: "Passw0rd!", roles: ["Users"] }] });
  const original = SecurityManager.defaultProvider;
  SecurityManager.setProvider(provider);
  let ticket = null; const told = []; let notify = () => {};
  const off = CurrentPrincipal.registerSource({
    resolve: () => (ticket ? new GenericPrincipal(new GenericIdentity(ticket, "Custom"), []) : null),
    onMembershipUserChanged: (u) => { told.push(u?.userName ?? null); if (u === null) ticket = null; },
    subscribe: (n) => { notify = n; return () => { notify = () => {}; }; },
  });
  try {
    assert.equal(CurrentPrincipal.current.identity.isAuthenticated, false);
    ticket = "restored"; notify();
    assert.equal(CurrentPrincipal.current.identity.name, "restored");
    assert.equal(CurrentPrincipal.current.identity.authenticationType, "Custom");
    await provider.login("Kay", "Passw0rd!");
    assert.equal(CurrentPrincipal.current.identity.authenticationType, "Membership"); // membership wins over sources
    await provider.logout();
    assert.deepEqual(told, ["Kay", null]);
    assert.equal(CurrentPrincipal.current.identity.isAuthenticated, false); // source told to clear
  } finally { off(); SecurityManager.setProvider(original); }
  ticket = "again";
  assert.equal(CurrentPrincipal.current.identity.isAuthenticated, false); // unregistered source is ignored
});

test("LoginController runs the postLogin hook after sign-in, and not by default", async () => {
  const provider = new InMemoryAuthProvider({ hasher: Pbkdf2PasswordHasher.forTesting(), users: [{ userName: "Amy", password: "Passw0rd!", roles: ["Users"] }] });
  const calls = [];
  const login = new LoginController({
    provider, userName: "Amy", password: "Passw0rd!", rememberMeSet: true, returnUrl: "/reports", destinationPageUrl: "/home",
    postLogin: async (user, ctx) => { calls.push([user.userName, ctx.rememberMe, ctx.returnUrl, ctx.destinationPageUrl]); },
  });
  assert.equal(await login.login(), true);
  assert.deepEqual(calls, [["Amy", true, "/reports", "/home"]]);

  const plain = new LoginController({ provider, userName: "Amy", password: "Passw0rd!" });
  assert.equal(await plain.login(), true); // no hook: nothing else happens
  assert.equal(calls.length, 1);
});

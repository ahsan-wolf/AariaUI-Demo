import test from "node:test";
import assert from "node:assert/strict";
import {
  InMemoryAuthProvider,
  SecurityManager,
  LoginController,
  LoginViewController,
  LoginStatusController,
  LoginNameController,
  ChangePasswordController,
  PasswordRecoveryController,
  CreateUserWizardController,
} from "../dist/index.js";

function createIsolatedProvider() {
  return new InMemoryAuthProvider({
    name: "TestAuthProvider",
    maxInvalidPasswordAttempts: 3,
    users: [
      {
        userName: "Alice",
        password: "Secret123!",
        email: "alice@example.com",
        roles: ["Administrators", "Managers"],
        passwordQuestion: "Favorite city?",
        passwordAnswer: "Tokyo",
      },
      {
        userName: "Bob",
        password: "PasswordBob!",
        email: "bob@example.com",
        roles: ["Users"],
        passwordQuestion: "First pet?",
        passwordAnswer: "Rex",
      },
    ],
  });
}

// -------------------------------------------------------------
// 1. InMemoryAuthProvider & SecurityManager Tests
// -------------------------------------------------------------

test("InMemoryAuthProvider validates credentials and handles lockouts", async () => {
  const provider = createIsolatedProvider();

  // Success
  const valid = await provider.validateUser("Alice", "Secret123!");
  assert.equal(valid, true);

  // Wrong password
  const invalid1 = await provider.validateUser("Alice", "wrong1");
  assert.equal(invalid1, false);

  const invalid2 = await provider.validateUser("Alice", "wrong2");
  assert.equal(invalid2, false);

  const invalid3 = await provider.validateUser("Alice", "wrong3");
  assert.equal(invalid3, false);

  // User should now be locked out
  const user = await provider.getUser("Alice");
  assert.equal(user?.isLockedOut, true);

  // Even correct password fails when locked out
  const lockedAttempt = await provider.validateUser("Alice", "Secret123!");
  assert.equal(lockedAttempt, false);

  // Unlock user
  const unlocked = await provider.unlockUser("Alice");
  assert.equal(unlocked, true);

  const unlockedAttempt = await provider.validateUser("Alice", "Secret123!");
  assert.equal(unlockedAttempt, true);
});

test("InMemoryAuthProvider createUser, changePassword, and resetPassword", async () => {
  const provider = createIsolatedProvider();

  // Create User
  const result = await provider.createUser(
    "Charlie",
    "CharliePass1!",
    "charlie@example.com",
    "Favorite food?",
    "Pizza"
  );
  assert.equal(result.status, "Success");
  assert.equal(result.user?.userName, "Charlie");

  // Duplicate user name
  const dupResult = await provider.createUser("Charlie", "AnotherPass1!");
  assert.equal(dupResult.status, "DuplicateUserName");

  // Duplicate email
  const dupEmail = await provider.createUser("David", "DavidPass1!", "charlie@example.com");
  assert.equal(dupEmail.status, "DuplicateEmail");

  // Change password
  const changeFail = await provider.changePassword("Charlie", "WrongPass!", "NewPass123!");
  assert.equal(changeFail, false);

  const changeOk = await provider.changePassword("Charlie", "CharliePass1!", "NewPass123!");
  assert.equal(changeOk, true);

  const testLogin = await provider.validateUser("Charlie", "NewPass123!");
  assert.equal(testLogin, true);

  // Reset password
  const question = await provider.getPasswordQuestion("Charlie");
  assert.equal(question, "Favorite food?");

  const resetFail = await provider.resetPassword("Charlie", "Burger");
  assert.equal(resetFail, null);

  const tempPass = await provider.resetPassword("Charlie", "Pizza");
  assert.ok(tempPass && tempPass.startsWith("Temp#"));

  const loginWithTemp = await provider.validateUser("Charlie", tempPass);
  assert.equal(loginWithTemp, true);
});

test("InMemoryAuthProvider login, logout, and roles", async () => {
  const provider = createIsolatedProvider();
  assert.equal(provider.getCurrentUser(), null);

  const loginOk = await provider.login("Bob", "PasswordBob!");
  assert.equal(loginOk, true);

  const current = provider.getCurrentUser();
  assert.equal(current?.userName, "Bob");
  assert.equal(provider.isInRole("Users"), true);
  assert.equal(provider.isInRole("Administrators"), false);

  const roles = provider.getRolesForUser("Alice");
  assert.deepEqual(roles, ["Administrators", "Managers"]);

  await provider.logout();
  assert.equal(provider.getCurrentUser(), null);
});

// -------------------------------------------------------------
// 2. LoginController Tests
// -------------------------------------------------------------

test("LoginController validation and successful login workflow", async () => {
  const provider = createIsolatedProvider();
  const login = new LoginController({ provider });

  let loggingInFired = false;
  let loggedInUser = null;

  login.loggingIn.subscribe((_, e) => {
    loggingInFired = true;
    assert.equal(e.userName, "Alice");
  });

  login.loggedIn.subscribe((_, e) => {
    loggedInUser = e.userName;
  });

  login.setUserName("Alice");
  login.setPassword("Secret123!");

  const success = await login.login();
  assert.equal(success, true);
  assert.equal(loggingInFired, true);
  assert.equal(loggedInUser, "Alice");
  assert.equal(login.isLoggedIn, true);
  assert.equal(login.password, ""); // Cleared for security
});

test("LoginController handles invalid credentials and cancellation", async () => {
  const provider = createIsolatedProvider();
  const login = new LoginController({ provider });

  let errorEventFired = false;
  login.loginError.subscribe((_, e) => {
    errorEventFired = true;
    assert.equal(e.userName, "Bob");
  });

  login.setUserName("Bob");
  login.setPassword("BadPassword");

  const success = await login.login();
  assert.equal(success, false);
  assert.equal(errorEventFired, true);
  assert.ok(login.failureMessage?.includes("not successful"));

  // Cancellable event
  login.setPassword("PasswordBob!");
  const unsub = login.loggingIn.subscribe((_, e) => {
    e.cancel = true;
  });

  const cancelledSuccess = await login.login();
  assert.equal(cancelledSuccess, false);
  assert.equal(login.isLoggedIn, false);
  unsub();
});

// -------------------------------------------------------------
// 3. LoginViewController Tests
// -------------------------------------------------------------

test("LoginViewController switches between Anonymous, RoleGroup, and LoggedIn views", async () => {
  const provider = createIsolatedProvider();
  SecurityManager.setProvider(provider);

  const loginView = new LoginViewController({
    provider,
    anonymousTemplate: "<div>Please Sign In</div>",
    loggedInTemplate: "<div>Standard Member Area</div>",
    roleGroups: [
      { roles: ["Administrators"], contentTemplate: "<div>Admin Control Panel</div>" },
      { roles: ["Managers"], contentTemplate: "<div>Manager Dashboard</div>" },
    ],
  });

  // Initially anonymous
  let activeView = loginView.resolveActiveView();
  assert.equal(activeView.type, "Anonymous");
  assert.equal(activeView.template, "<div>Please Sign In</div>");

  // Login as Bob (in "Users" role, not Admin or Manager)
  await provider.login("Bob", "PasswordBob!");
  activeView = loginView.resolveActiveView();
  assert.equal(activeView.type, "LoggedIn");
  assert.equal(activeView.template, "<div>Standard Member Area</div>");

  // Login as Alice (in "Administrators" and "Managers")
  await provider.login("Alice", "Secret123!");
  activeView = loginView.resolveActiveView();
  assert.equal(activeView.type, "RoleGroup");
  assert.equal(activeView.matchedRole, "Administrators");
  assert.equal(activeView.template, "<div>Admin Control Panel</div>");

  await provider.logout();
  activeView = loginView.resolveActiveView();
  assert.equal(activeView.type, "Anonymous");

  loginView.dispose();
});

// -------------------------------------------------------------
// 4. LoginStatusController & LoginNameController Tests
// -------------------------------------------------------------

test("LoginStatusController dynamic text, logout, and events", async () => {
  const provider = createIsolatedProvider();
  SecurityManager.setProvider(provider);

  const status = new LoginStatusController({
    provider,
    loginText: "Sign In",
    logoutText: "Sign Out",
    loginPageUrl: "/auth/login",
    logoutPageUrl: "/auth/goodbye",
  });

  assert.equal(status.text, "Sign In");
  assert.equal(status.targetUrl, "/auth/login");

  await provider.login("Bob", "PasswordBob!");
  assert.equal(status.text, "Sign Out");
  assert.equal(status.targetUrl, "/auth/goodbye");

  let loggedOutFired = false;
  status.loggedOut.subscribe(() => {
    loggedOutFired = true;
  });

  const logoutResult = await status.logout();
  assert.equal(logoutResult, true);
  assert.equal(loggedOutFired, true);
  assert.equal(status.isLoggedIn, false);
  assert.equal(status.text, "Sign In");

  status.dispose();
});

test("LoginNameController formats user greeting", async () => {
  const provider = createIsolatedProvider();
  SecurityManager.setProvider(provider);

  const nameCtrl = new LoginNameController({
    provider,
    formatString: "Hello, {0}!",
  });

  assert.equal(nameCtrl.formattedText, "");

  await provider.login("Alice", "Secret123!");
  assert.equal(nameCtrl.userName, "Alice");
  assert.equal(nameCtrl.formattedText, "Hello, Alice!");

  await provider.logout();
  assert.equal(nameCtrl.formattedText, "");

  nameCtrl.dispose();
});

// -------------------------------------------------------------
// 5. ChangePasswordController Tests
// -------------------------------------------------------------

test("ChangePasswordController validation, events, and view transition", async () => {
  const provider = createIsolatedProvider();
  const ctrl = new ChangePasswordController({
    provider,
    userName: "Bob",
    newPasswordRegularExpression: "^[A-Za-z0-9!]{6,}$",
  });

  ctrl.setCurrentPassword("PasswordBob!");
  ctrl.setNewPassword("Short");
  ctrl.setConfirmNewPassword("Different");

  const valid = ctrl.validate();
  assert.equal(valid, false);
  assert.ok(ctrl.validationErrors.length >= 2);

  // Correct new password and confirmation
  ctrl.setNewPassword("BobNewPass2026!");
  ctrl.setConfirmNewPassword("BobNewPass2026!");
  assert.equal(ctrl.validate(), true);

  let changedFired = false;
  ctrl.changedPassword.subscribe(() => {
    changedFired = true;
  });

  const success = await ctrl.changePassword();
  assert.equal(success, true);
  assert.equal(changedFired, true);
  assert.equal(ctrl.activeView, "Success");
  assert.equal(ctrl.isSuccess, true);

  // Validate the provider has the new password
  const checkLogin = await provider.validateUser("Bob", "BobNewPass2026!");
  assert.equal(checkLogin, true);

  // Reset view
  ctrl.reset();
  assert.equal(ctrl.activeView, "ChangePassword");
});

// -------------------------------------------------------------
// 6. PasswordRecoveryController Tests
// -------------------------------------------------------------

test("PasswordRecoveryController 3-step recovery lifecycle", async () => {
  const provider = createIsolatedProvider();
  const recovery = new PasswordRecoveryController({ provider });

  assert.equal(recovery.currentStep, "UserName");

  // Non-existent user
  recovery.setUserName("NonExistent");
  const step1Fail = await recovery.submitUserName();
  assert.equal(step1Fail, false);
  assert.ok(recovery.failureMessage?.includes("unable to access"));

  // Valid user
  recovery.setUserName("Alice");
  const step1Ok = await recovery.submitUserName();
  assert.equal(step1Ok, true);
  assert.equal(recovery.currentStep, "Question");
  assert.equal(recovery.question, "Favorite city?");

  // Wrong answer
  recovery.setAnswer("Paris");
  const step2Fail = await recovery.submitAnswer();
  assert.equal(step2Fail, false);
  assert.ok(recovery.failureMessage?.includes("could not be verified"));

  // Correct answer
  let mailSent = false;
  let newGeneratedPass = undefined;

  recovery.sendingMail.subscribe((_, e) => {
    mailSent = true;
    newGeneratedPass = e.newPassword;
    assert.equal(e.userName, "Alice");
    assert.equal(e.recipientEmail, "alice@example.com");
  });

  recovery.setAnswer("Tokyo");
  const step2Ok = await recovery.submitAnswer();
  assert.equal(step2Ok, true);
  assert.equal(recovery.currentStep, "Success");
  assert.equal(recovery.isComplete, true);
  assert.equal(mailSent, true);
  assert.ok(newGeneratedPass && newGeneratedPass.startsWith("Temp#"));

  // Check login with newly generated password
  const loginOk = await provider.validateUser("Alice", newGeneratedPass);
  assert.equal(loginOk, true);
});

// -------------------------------------------------------------
// 7. CreateUserWizardController Tests
// -------------------------------------------------------------

test("CreateUserWizardController registration workflow and validation", async () => {
  const provider = createIsolatedProvider();
  const wizard = new CreateUserWizardController({ provider });

  assert.equal(wizard.activeStep, "CreateUser");

  wizard.setUserName("Grace");
  wizard.setPassword("GracePass1!");
  wizard.setConfirmPassword("MismatchPass!");
  wizard.setEmail("grace@example.com");

  assert.equal(wizard.validate(), false);
  assert.ok(wizard.validationErrors.some((e) => e.includes("must match")));

  wizard.setConfirmPassword("GracePass1!");
  assert.equal(wizard.validate(), true);

  let createdEventFired = false;
  wizard.createdUser.subscribe((_, user) => {
    createdEventFired = true;
    assert.equal(user.userName, "Grace");
    assert.equal(user.email, "grace@example.com");
  });

  const created = await wizard.createUser();
  assert.equal(created, true);
  assert.equal(createdEventFired, true);
  assert.equal(wizard.activeStep, "Complete");
  assert.equal(wizard.isComplete, true);

  // User can now log in
  const canLogin = await provider.validateUser("Grace", "GracePass1!");
  assert.equal(canLogin, true);

  // Duplicate error when trying again
  wizard.reset();
  assert.equal(wizard.activeStep, "CreateUser");
  wizard.setUserName("Grace");
  wizard.setPassword("AnotherPass!");
  wizard.setConfirmPassword("AnotherPass!");
  wizard.setEmail("another@example.com");

  const dupResult = await wizard.createUser();
  assert.equal(dupResult, false);
  assert.ok(wizard.failureMessage?.includes("different user name"));
});

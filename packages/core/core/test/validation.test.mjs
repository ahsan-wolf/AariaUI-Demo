import test from "node:test";
import assert from "node:assert/strict";
import {
  ValidatorManager,
  RequiredFieldValidatorController,
  CompareValidatorController,
  RangeValidatorController,
  RegularExpressionValidatorController,
  CustomValidatorController,
  ValidationSummaryController,
} from "../dist/index.js";

test.beforeEach(() => {
  ValidatorManager.clear();
});

test("RequiredFieldValidator validates empty and populated values", async () => {
  let formValue = "";
  ValidatorManager.registerValueAccessor("txtName", () => formValue);

  const validator = new RequiredFieldValidatorController({
    id: "rfvName",
    controlToValidate: "txtName",
    errorMessage: "Name is required."
  });

  // Empty value should fail
  formValue = "";
  assert.equal(await validator.validate(), false);
  assert.equal(validator.isValid, false);

  // Whitespace should fail
  formValue = "   ";
  assert.equal(await validator.validate(), false);
  assert.equal(validator.isValid, false);

  // Populated value should pass
  formValue = "John Doe";
  assert.equal(await validator.validate(), true);
  assert.equal(validator.isValid, true);
});

test("RequiredFieldValidator respects initialValue", async () => {
  let country = "--Select--";
  ValidatorManager.registerValueAccessor("ddlCountry", () => country);

  const validator = new RequiredFieldValidatorController({
    id: "rfvCountry",
    controlToValidate: "ddlCountry",
    initialValue: "--Select--",
    errorMessage: "Please select a country."
  });

  // Matching initialValue fails
  country = "--Select--";
  assert.equal(await validator.validate(), false);
  assert.equal(validator.isValid, false);

  // Selection passes
  country = "United States";
  assert.equal(await validator.validate(), true);
  assert.equal(validator.isValid, true);
});

test("RequiredFieldValidator handles boolean/checkbox", async () => {
  let termsAccepted = false;
  ValidatorManager.registerValueAccessor("chkTerms", () => termsAccepted);

  const validator = new RequiredFieldValidatorController({
    id: "rfvTerms",
    controlToValidate: "chkTerms",
    errorMessage: "You must accept the terms."
  });

  assert.equal(await validator.validate(), false);
  termsAccepted = true;
  assert.equal(await validator.validate(), true);
});

test("RequiredFieldValidator emits validating and validated events", async () => {
  ValidatorManager.registerValueAccessor("txt1", () => "test");
  const validator = new RequiredFieldValidatorController({
    id: "rfv1",
    controlToValidate: "txt1"
  });

  let validatingFired = false;
  let validatedArgs = null;

  validator.validating.subscribe(() => { validatingFired = true; });
  validator.validated.subscribe((_s, e) => { validatedArgs = e; });

  await validator.validate();
  assert.equal(validatingFired, true);
  assert.notEqual(validatedArgs, null);
  assert.equal(validatedArgs.isValid, true);
  assert.equal(validatedArgs.value, "test");
});

test("CompareValidator compares against static value", async () => {
  let age = "25";
  ValidatorManager.registerValueAccessor("txtAge", () => age);

  const validator = new CompareValidatorController({
    id: "cvAge",
    controlToValidate: "txtAge",
    valueToCompare: "18",
    operator: "GreaterThanEqual",
    type: "Integer"
  });

  assert.equal(await validator.validate(), true);

  age = "15";
  assert.equal(await validator.validate(), false);

  // Empty value passes CompareValidator (handled by RequiredFieldValidator)
  age = "";
  assert.equal(await validator.validate(), true);
});

test("CompareValidator compares between two controls", async () => {
  let pwd1 = "Secret123";
  let pwd2 = "Secret123";
  ValidatorManager.registerValueAccessor("txtPwd1", () => pwd1);
  ValidatorManager.registerValueAccessor("txtPwd2", () => pwd2);

  const validator = new CompareValidatorController({
    id: "cvPwd",
    controlToValidate: "txtPwd2",
    controlToCompare: "txtPwd1",
    operator: "Equal",
    type: "String"
  });

  assert.equal(await validator.validate(), true);

  pwd2 = "Different";
  assert.equal(await validator.validate(), false);
});

test("CompareValidator handles DataTypeCheck and Currency/Date types", async () => {
  let val = "$1,250.50";
  ValidatorManager.registerValueAccessor("txtAmount", () => val);

  const validator = new CompareValidatorController({
    id: "cvAmount",
    controlToValidate: "txtAmount",
    operator: "DataTypeCheck",
    type: "Currency"
  });

  assert.equal(await validator.validate(), true);

  val = "not-a-currency";
  assert.equal(await validator.validate(), false);

  // Date comparison
  let dateVal = "2026-06-15";
  ValidatorManager.registerValueAccessor("txtDate", () => dateVal);
  const dateValidator = new CompareValidatorController({
    id: "cvDate",
    controlToValidate: "txtDate",
    valueToCompare: "2026-01-01",
    operator: "GreaterThan",
    type: "Date"
  });
  assert.equal(await dateValidator.validate(), true);

  dateVal = "2025-12-31";
  assert.equal(await dateValidator.validate(), false);
});

test("RangeValidator validates numeric, date, and string ranges", async () => {
  let score = "75";
  ValidatorManager.registerValueAccessor("txtScore", () => score);

  const validator = new RangeValidatorController({
    id: "rvScore",
    controlToValidate: "txtScore",
    minimumValue: 0,
    maximumValue: 100,
    type: "Integer"
  });

  assert.equal(await validator.validate(), true);

  score = "105";
  assert.equal(await validator.validate(), false);

  score = "-5";
  assert.equal(await validator.validate(), false);

  // Empty value passes RangeValidator
  score = "";
  assert.equal(await validator.validate(), true);

  // String range test
  let letter = "G";
  ValidatorManager.registerValueAccessor("txtLetter", () => letter);
  const strValidator = new RangeValidatorController({
    id: "rvLetter",
    controlToValidate: "txtLetter",
    minimumValue: "A",
    maximumValue: "M",
    type: "String"
  });
  assert.equal(await strValidator.validate(), true);
  letter = "Z";
  assert.equal(await strValidator.validate(), false);
});

test("RegularExpressionValidator enforces pattern with implicit anchoring", async () => {
  let email = "user@example.com";
  ValidatorManager.registerValueAccessor("txtEmail", () => email);

  const validator = new RegularExpressionValidatorController({
    id: "revEmail",
    controlToValidate: "txtEmail",
    validationExpression: "\\w+([-+.']\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*",
    errorMessage: "Invalid email address."
  });

  assert.equal(await validator.validate(), true);

  email = "invalid-email";
  assert.equal(await validator.validate(), false);

  // Partial match should fail because of implicit anchoring
  email = "prefix user@example.com suffix";
  assert.equal(await validator.validate(), false);

  // Empty string passes RegexValidator
  email = "";
  assert.equal(await validator.validate(), true);
});

test("CustomValidator supports synchronous client functions", async () => {
  let num = "4";
  ValidatorManager.registerValueAccessor("txtEven", () => num);

  const validator = new CustomValidatorController({
    id: "cvEven",
    controlToValidate: "txtEven",
    clientValidationFunction: (_source, args) => {
      const n = parseInt(args.value, 10);
      return !isNaN(n) && n % 2 === 0;
    }
  });

  assert.equal(await validator.validate(), true);

  num = "7";
  assert.equal(await validator.validate(), false);

  // By default, empty text passes CustomValidator without invoking callback
  num = "";
  assert.equal(await validator.validate(), true);
});

test("CustomValidator with validateEmptyText validates empty text", async () => {
  let val = "";
  ValidatorManager.registerValueAccessor("txtVal", () => val);

  let invoked = false;
  const validator = new CustomValidatorController({
    id: "cvEmpty",
    controlToValidate: "txtVal",
    validateEmptyText: true,
    clientValidationFunction: (_source, args) => {
      invoked = true;
      return args.value.length > 0;
    }
  });

  assert.equal(await validator.validate(), false);
  assert.equal(invoked, true);
});

test("CustomValidator supports asynchronous server validation", async () => {
  let username = "existing_user";
  ValidatorManager.registerValueAccessor("txtUser", () => username);

  const validator = new CustomValidatorController({
    id: "cvUser",
    controlToValidate: "txtUser",
    serverValidate: async (_source, args) => {
      // Simulate remote async call
      await new Promise((r) => setTimeout(r, 10));
      return args.value !== "existing_user";
    }
  });

  assert.equal(await validator.validate(), false);

  username = "new_unique_user";
  assert.equal(await validator.validate(), true);
});

test("ValidatorManager scopes validation by ValidationGroup", async () => {
  let val1 = "";
  let val2 = "";
  ValidatorManager.registerValueAccessor("ctl1", () => val1);
  ValidatorManager.registerValueAccessor("ctl2", () => val2);

  const vGroupA = new RequiredFieldValidatorController({
    id: "vA",
    controlToValidate: "ctl1",
    validationGroup: "GroupA",
    errorMessage: "GroupA Error"
  });

  const vGroupB = new RequiredFieldValidatorController({
    id: "vB",
    controlToValidate: "ctl2",
    validationGroup: "GroupB",
    errorMessage: "GroupB Error"
  });

  // Validating GroupA only evaluates vGroupA
  assert.equal(await ValidatorManager.validate("GroupA"), false);
  assert.equal(vGroupA.isValid, false);
  assert.equal(vGroupB.isValid, true); // GroupB was not validated
  assert.equal(ValidatorManager.isValid("GroupA"), false);
  assert.equal(ValidatorManager.isValid("GroupB"), true);

  // Fix GroupA and validate
  val1 = "valid-a";
  assert.equal(await ValidatorManager.validate("GroupA"), true);
  assert.equal(vGroupA.isValid, true);

  // GroupB should fail when validated
  assert.equal(await ValidatorManager.validate("GroupB"), false);
  assert.equal(vGroupB.isValid, false);
});

test("ValidationSummary collects and formats errors", async () => {
  let f1 = "";
  let f2 = "";
  ValidatorManager.registerValueAccessor("c1", () => f1);
  ValidatorManager.registerValueAccessor("c2", () => f2);

  new RequiredFieldValidatorController({
    id: "v1",
    controlToValidate: "c1",
    errorMessage: "First name is required.",
    validationGroup: "Checkout"
  });

  new RequiredFieldValidatorController({
    id: "v2",
    controlToValidate: "c2",
    errorMessage: "Last name is required.",
    validationGroup: "Checkout"
  });

  const summary = new ValidationSummaryController({
    id: "sum1",
    validationGroup: "Checkout",
    headerText: "Please correct the following errors:",
    displayMode: "BulletList"
  });

  await ValidatorManager.validate("Checkout");

  const errors = summary.getErrorMessages();
  assert.equal(errors.length, 2);
  assert.equal(errors[0], "First name is required.");
  assert.equal(errors[1], "Last name is required.");

  const formattedBullet = summary.getFormattedErrors();
  assert.match(formattedBullet, /Please correct the following errors:/);
  assert.match(formattedBullet, /• First name is required\./);
  assert.match(formattedBullet, /• Last name is required\./);

  // Test List display mode
  summary.displayMode = "List";
  const formattedList = summary.getFormattedErrors();
  assert.equal(
    formattedList,
    "Please correct the following errors:\nFirst name is required.\nLast name is required."
  );

  // Test SingleParagraph display mode
  summary.displayMode = "SingleParagraph";
  const formattedPara = summary.getFormattedErrors();
  assert.equal(
    formattedPara,
    "Please correct the following errors:\nFirst name is required. Last name is required."
  );

  // Once fixed, summary returns empty string
  f1 = "Jane";
  f2 = "Doe";
  await ValidatorManager.validate("Checkout");
  assert.equal(summary.getErrorMessages().length, 0);
  assert.equal(summary.getFormattedErrors(), "");
});

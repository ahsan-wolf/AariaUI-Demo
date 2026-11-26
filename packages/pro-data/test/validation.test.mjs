import test from "node:test";
import assert from "node:assert/strict";
import { ValidatorManager, RequiredFieldValidatorController, CompareValidatorController, RangeValidatorController, RegularExpressionValidatorController, CustomValidatorController, ValidationSummaryController } from "@wf-controls/core";

test.beforeEach(() => {
  ValidatorManager.clear();
});
import "./_license.mjs"; // activates a Pro license so the controls run unrestricted
import { GridViewController, RepeaterController, DataListController, ObjectDataSource, AccessDataSource, XmlDataSource } from "../dist/index.js";

test("GridViewController integrates with ValidatorManager on updateRow", async () => {
  let editInput = "";
  ValidatorManager.registerValueAccessor("txtActorName", () => editInput);

  new RequiredFieldValidatorController({
    id: "rfvActor",
    controlToValidate: "txtActorName",
    validationGroup: "GridEditGroup",
    errorMessage: "Actor name cannot be empty."
  });

  const grid = new GridViewController({
    id: "grid1",
    dataKeyField: "actorId",
    causesValidation: true,
    validationGroup: "GridEditGroup",
    columns: [
      { type: "bound", key: "actorId", dataField: "actorId", headerText: "ID" },
      { type: "bound", key: "name", dataField: "name", headerText: "Name" }
    ]
  });

  await grid.dataBind([
    { actorId: 1, name: "Actor One" },
    { actorId: 2, name: "Actor Two" }
  ]);

  await grid.beginEdit(0);

  // Attempt update with invalid data (editInput is "")
  editInput = "";
  const updateFailed = await grid.updateRow(0, { name: "" });
  assert.equal(updateFailed, false);
  // Row should retain original value and remain in edit mode
  assert.equal(grid.dataSource[0].name, "Actor One");
  assert.equal(grid.options.editIndex, 0);

  // Now provide valid input and attempt update
  editInput = "Actor Updated";
  const updateSucceeded = await grid.updateRow(0, { name: "Actor Updated" });
  assert.equal(updateSucceeded, true);
  assert.equal(grid.dataSource[0].name, "Actor Updated");
  assert.equal(grid.options.editIndex, -1);
});

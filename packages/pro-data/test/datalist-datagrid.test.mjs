import test from "node:test";
import assert from "node:assert/strict";
import { DataGridController, DataTable, SqlDataSource } from "@wf-controls/core";

const sampleProducts = [
  { id: 1, name: "Studio Display", category: "Hardware", price: 1599 },
  { id: 2, name: "Mechanical Keyboard", category: "Hardware", price: 149 },
  { id: 3, name: "Developer IDE", category: "Software", price: 299 },
  { id: 4, name: "Noise Cancelling Headphones", category: "Electronics", price: 349 },
  { id: 5, name: "Cloud VM Hosting", category: "Software", price: 89 },
  { id: 6, name: "Ergonomic Office Chair", category: "Hardware", price: 499 }
];

// -------------------------------------------------------------
// 1. DataListController Tests
// -------------------------------------------------------------
import "./_license.mjs"; // activates a Pro license so the controls run unrestricted
import { GridViewController, RepeaterController, DataListController, ObjectDataSource, AccessDataSource, XmlDataSource } from "../dist/index.js";

test("DataListController computes 2D layout matrix horizontally", async () => {
  const dataList = new DataListController({
    id: "dlHorizontal",
    repeatColumns: 3,
    repeatDirection: "Horizontal",
    repeatLayout: "Table"
  });

  await dataList.dataBind(sampleProducts);

  assert.equal(dataList.itemCount, 6);
  const matrix = dataList.getLayoutMatrix();

  // 6 items with 3 columns = 2 rows
  assert.equal(matrix.length, 2);
  assert.equal(matrix[0]?.length, 3);
  assert.equal(matrix[1]?.length, 3);

  // Horizontal layout: left-to-right, then top-to-bottom
  assert.equal(matrix[0]?.[0]?.dataItem.name, "Studio Display");
  assert.equal(matrix[0]?.[1]?.dataItem.name, "Mechanical Keyboard");
  assert.equal(matrix[0]?.[2]?.dataItem.name, "Developer IDE");
  assert.equal(matrix[1]?.[0]?.dataItem.name, "Noise Cancelling Headphones");
  assert.equal(matrix[1]?.[1]?.dataItem.name, "Cloud VM Hosting");
  assert.equal(matrix[1]?.[2]?.dataItem.name, "Ergonomic Office Chair");
});

test("DataListController computes 2D layout matrix vertically", async () => {
  const dataList = new DataListController({
    id: "dlVertical",
    repeatColumns: 3,
    repeatDirection: "Vertical"
  });

  await dataList.dataBind(sampleProducts);

  const matrix = dataList.getLayoutMatrix();
  // 6 items with 3 columns = 2 rows
  assert.equal(matrix.length, 2);

  // Vertical layout: top-to-bottom column 1, then column 2, then column 3
  // Col 0: items 0, 1
  assert.equal(matrix[0]?.[0]?.dataItem.name, "Studio Display");
  assert.equal(matrix[1]?.[0]?.dataItem.name, "Mechanical Keyboard");
  // Col 1: items 2, 3
  assert.equal(matrix[0]?.[1]?.dataItem.name, "Developer IDE");
  assert.equal(matrix[1]?.[1]?.dataItem.name, "Noise Cancelling Headphones");
  // Col 2: items 4, 5
  assert.equal(matrix[0]?.[2]?.dataItem.name, "Cloud VM Hosting");
  assert.equal(matrix[1]?.[2]?.dataItem.name, "Ergonomic Office Chair");
});

test("DataListController item types: Item, AlternatingItem, SelectedItem, EditItem", async () => {
  const dataList = new DataListController({
    id: "dlTypes",
    dataKeyField: "id"
  });

  await dataList.dataBind(sampleProducts);

  // Initially: index 0 is Item, index 1 is AlternatingItem
  assert.equal(dataList.items[0]?.itemType, "Item");
  assert.equal(dataList.items[1]?.itemType, "AlternatingItem");

  // Select item index 1
  let selectedFired = false;
  dataList.selectedIndexChanged.subscribe((_s, e) => {
    selectedFired = true;
    assert.equal(e.itemIndex, 1);
  });
  await dataList.selectItem(1);
  assert.equal(selectedFired, true);
  assert.equal(dataList.selectedIndex, 1);
  assert.equal(dataList.items[1]?.itemType, "SelectedItem");

  // Begin edit item index 0
  await dataList.beginEdit(0);
  assert.equal(dataList.editIndex, 0);
  assert.equal(dataList.items[0]?.itemType, "EditItem");

  // Cancel edit
  await dataList.cancelEdit();
  assert.equal(dataList.editIndex, -1);
  assert.equal(dataList.items[0]?.itemType, "Item");
});

test("DataListController in-place editing, updating, and deleting", async () => {
  const dataList = new DataListController({
    id: "dlCrud",
    dataKeyField: "id"
  });

  await dataList.dataBind([
    { id: 1, name: "Item One" },
    { id: 2, name: "Item Two" }
  ]);

  // Edit and update
  await dataList.beginEdit(0);
  const updated = await dataList.updateItem(0, { name: "Item One Updated" });
  assert.equal(updated, true);
  assert.equal(dataList.editIndex, -1);
  assert.equal(dataList.items[0]?.dataItem.name, "Item One Updated");

  // Delete
  const deleted = await dataList.deleteItem(0);
  assert.equal(deleted, true);
  assert.equal(dataList.itemCount, 1);
  assert.equal(dataList.items[0]?.dataItem.name, "Item Two");
});

test("DataListController dispatches commands via executeCommand", async () => {
  const dataList = new DataListController({
    id: "dlCmds",
    dataKeyField: "id"
  });

  await dataList.dataBind([
    { id: 1, name: "Product A" },
    { id: 2, name: "Product B" }
  ]);

  let commandFired = "";
  dataList.itemCommand.subscribe((_s, e) => {
    commandFired = e.commandName;
  });

  await dataList.executeCommand(0, "Edit");
  assert.equal(commandFired, "Edit");
  assert.equal(dataList.editIndex, 0);

  await dataList.executeCommand(0, "Cancel");
  assert.equal(commandFired, "Cancel");
  assert.equal(dataList.editIndex, -1);

  await dataList.executeCommand(1, "Select");
  assert.equal(commandFired, "Select");
  assert.equal(dataList.selectedIndex, 1);
});

// -------------------------------------------------------------
// 2. DataGridController Tests
// -------------------------------------------------------------

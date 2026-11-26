import test from "node:test";
import assert from "node:assert/strict";
import {
  DataGridController,
  DataTable,
  SqlDataSource
} from "../dist/index.js";

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

test("DataGridController auto-generates columns from DataTable", async () => {
  const table = new DataTable("Employees");
  table.columns.add("empId", "number");
  table.columns.add("empName", "string");
  table.columns.add("department", "string");

  table.rows.add({ empId: 101, empName: "Alice", department: "Engineering" });
  table.rows.add({ empId: 102, empName: "Bob", department: "Marketing" });

  const grid = new DataGridController({
    id: "dgAuto",
    autoGenerateColumns: true
  });

  await grid.dataBind(table);

  assert.equal(grid.columns.length, 3);
  assert.equal(grid.columns[0]?.key, "empId");
  assert.equal(grid.columns[1]?.key, "empName");
  assert.equal(grid.columns[2]?.key, "department");
  assert.equal(grid.totalRecords, 2);
});

test("DataGridController auto-generates columns from plain objects", async () => {
  const grid = new DataGridController({
    id: "dgObj",
    autoGenerateColumns: true
  });

  await grid.dataBind([
    { sku: "SKU-1", title: "Monitor", price: 300 }
  ]);

  assert.equal(grid.columns.length, 3);
  assert.equal(grid.columns[0]?.key, "sku");
  assert.equal(grid.columns[1]?.key, "title");
  assert.equal(grid.columns[2]?.key, "price");
});

test("DataGridController paging lifecycle and visibleItems", async () => {
  const grid = new DataGridController({
    id: "dgPaging",
    allowPaging: true,
    pageSize: 2
  });

  await grid.dataBind(sampleProducts);

  assert.equal(grid.totalRecords, 6);
  assert.equal(grid.pageCount, 3);
  assert.equal(grid.currentPageIndex, 0);

  // Page 0 has items 0, 1
  assert.equal(grid.visibleItems.length, 2);
  assert.equal(grid.visibleItems[0]?.name, "Studio Display");
  assert.equal(grid.visibleItems[1]?.name, "Mechanical Keyboard");

  // Change to page 1
  let pageChangedFired = false;
  grid.pageIndexChanged.subscribe((_s, e) => {
    pageChangedFired = true;
    assert.equal(e.newPageIndex, 1);
  });

  const paged = await grid.changePage(1);
  assert.equal(paged, true);
  assert.equal(pageChangedFired, true);
  assert.equal(grid.currentPageIndex, 1);

  // Page 1 has items 2, 3
  assert.equal(grid.visibleItems.length, 2);
  assert.equal(grid.visibleItems[0]?.name, "Developer IDE");
  assert.equal(grid.visibleItems[1]?.name, "Noise Cancelling Headphones");
});

test("DataGridController sorting with ascending/descending toggle", async () => {
  const grid = new DataGridController({
    id: "dgSort",
    allowSorting: true,
    columns: [
      { type: "bound", key: "name", dataField: "name", headerText: "Product Name" },
      { type: "bound", key: "price", dataField: "price", headerText: "Price" }
    ]
  });

  await grid.dataBind(sampleProducts);

  // Sort by price ascending
  await grid.sort("price");
  assert.equal(grid.visibleItems[0]?.name, "Cloud VM Hosting"); // Price 89 is lowest

  // Sort by price again -> flips to descending
  await grid.sort("price");
  assert.equal(grid.visibleItems[0]?.name, "Studio Display"); // Price 1599 is highest
});

test("DataGridController in-place editing, select, and command dispatching", async () => {
  const grid = new DataGridController({
    id: "dgCommands",
    dataKeyField: "id"
  });

  await grid.dataBind([
    { id: 1, name: "Product A", price: 100 },
    { id: 2, name: "Product B", price: 200 }
  ]);

  // Edit command
  await grid.executeCommand(0, "Edit");
  assert.equal(grid.editItemIndex, 0);

  // Update
  await grid.updateItem(0, { name: "Product A Modified", price: 150 });
  assert.equal(grid.editItemIndex, -1);
  assert.equal(grid.visibleItems[0]?.name, "Product A Modified");

  // Select command
  await grid.executeCommand(1, "Select");
  assert.equal(grid.selectedItemIndex, 1);

  // Delete
  await grid.deleteItem(0);
  assert.equal(grid.totalRecords, 1);
  assert.equal(grid.visibleItems[0]?.name, "Product B");
});

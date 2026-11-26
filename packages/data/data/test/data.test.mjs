import test from "node:test";
import assert from "node:assert/strict";
import {
  DataTable,
  DataColumn,
  DataRow,
  DataView,
  DataSet,
  DataRelation,
} from "../dist/index.js";

test("DataColumn validates constraints and auto-increment", () => {
  const col = new DataColumn({
    columnName: "Id",
    dataType: "number",
    autoIncrement: true,
    autoIncrementSeed: 10,
    autoIncrementStep: 5,
  });

  assert.equal(col.getNextAutoIncrementValue(), 10);
  assert.equal(col.getNextAutoIncrementValue(), 15);
  assert.equal(col.getNextAutoIncrementValue(), 20);

  const strCol = new DataColumn({
    columnName: "Code",
    dataType: "string",
    allowDBNull: false,
    maxLength: 5,
  });

  assert.equal(strCol.coerceAndValidate("ABC"), "ABC");
  assert.throws(() => strCol.coerceAndValidate("TOOLONGSTRING"));
  assert.throws(() => strCol.coerceAndValidate(null));
});

test("DataTable and DataRow state lifecycle (Added -> AcceptChanges -> Modified -> RejectChanges)", () => {
  const table = new DataTable("Employees");
  table.columns.add("Id", "number");
  table.columns.add("Name", "string");
  table.columns.add("Salary", "number");

  const row = table.newRow();
  assert.equal(row.rowState, "Detached");

  row.setItem("Id", 1);
  row.setItem("Name", "Alice");
  row.setItem("Salary", 75000);
  table.rows.add(row);

  assert.equal(row.rowState, "Added");
  assert.equal(table.rows.count, 1);

  // Accept changes -> transitions to Unchanged
  table.acceptChanges();
  assert.equal(row.rowState, "Unchanged");
  assert.equal(row.item("Name", "Original"), "Alice");
  assert.equal(row.item("Name", "Current"), "Alice");

  // Modify row
  row.setItem("Salary", 80000);
  assert.equal(row.rowState, "Modified");
  assert.equal(row.item("Salary", "Current"), 80000);
  assert.equal(row.item("Salary", "Original"), 75000);

  // Reject changes -> reverts to Original
  row.rejectChanges();
  assert.equal(row.rowState, "Unchanged");
  assert.equal(row.item("Salary"), 75000);
});

test("DataRow in-place editing (beginEdit, cancelEdit, endEdit)", () => {
  const table = new DataTable("Products");
  table.columns.add("Id", "number");
  table.columns.add("Title", "string");

  const row = table.rows.add({ Id: 101, Title: "Keyboard" });
  table.acceptChanges();

  // Begin Edit and Cancel
  row.beginEdit();
  row.setItem("Title", "Mechanical Keyboard");
  assert.equal(row.item("Title", "Proposed"), "Mechanical Keyboard");
  assert.equal(row.item("Title", "Current"), "Keyboard");
  row.cancelEdit();
  assert.equal(row.item("Title"), "Keyboard");
  assert.equal(row.rowState, "Unchanged");

  // Begin Edit and EndEdit
  row.beginEdit();
  row.setItem("Title", "Wireless Mouse");
  row.endEdit();
  assert.equal(row.item("Title"), "Wireless Mouse");
  assert.equal(row.rowState, "Modified");
});

test("DataRow delete lifecycle and table removal upon acceptChanges", () => {
  const table = new DataTable("Users");
  table.columns.add("Id", "number");
  table.columns.add("Username", "string");

  const row = table.rows.add({ Id: 1, Username: "admin" });
  table.acceptChanges();
  assert.equal(table.rows.count, 1);

  row.delete();
  assert.equal(row.rowState, "Deleted");
  assert.equal(table.rows.count, 0); // Active rows count excludes deleted
  assert.equal(table.rows.totalCount, 1);

  // Reject deletion
  row.rejectChanges();
  assert.equal(row.rowState, "Unchanged");
  assert.equal(table.rows.count, 1);

  // Re-delete and Accept
  row.delete();
  table.acceptChanges();
  assert.equal(table.rows.totalCount, 0);
  assert.equal(row.rowState, "Detached");
});

test("DataTable.select queries with expressions and sorting", () => {
  const table = new DataTable("Orders");
  table.columns.add("OrderId", "number");
  table.columns.add("Customer", "string");
  table.columns.add("Amount", "number");

  table.rows.add({ OrderId: 1, Customer: "Alice", Amount: 250 });
  table.rows.add({ OrderId: 2, Customer: "Bob", Amount: 50 });
  table.rows.add({ OrderId: 3, Customer: "Charlie", Amount: 500 });
  table.rows.add({ OrderId: 4, Customer: "Alice", Amount: 120 });
  table.acceptChanges();

  // Numeric filter expression
  const highOrders = table.select("Amount >= 200", "Amount DESC");
  assert.equal(highOrders.length, 2);
  assert.equal(highOrders[0].item("Customer"), "Charlie");
  assert.equal(highOrders[1].item("Customer"), "Alice");

  // AND filter expression
  const aliceHigh = table.select("Customer = 'Alice' AND Amount > 200");
  assert.equal(aliceHigh.length, 1);
  assert.equal(aliceHigh[0].item("OrderId"), 1);

  // LIKE expression
  const cCustomers = table.select("Customer LIKE 'C%'");
  assert.equal(cCustomers.length, 1);
  assert.equal(cCustomers[0].item("Customer"), "Charlie");

  // Custom function filter
  const smallOrders = table.select((r) => r.item("Amount") < 100);
  assert.equal(smallOrders.length, 1);
  assert.equal(smallOrders[0].item("Customer"), "Bob");
});

test("DataTable clone, copy, and find with PrimaryKey", () => {
  const table = new DataTable("Customers");
  const idCol = table.columns.add("Id", "number");
  table.columns.add("Name", "string");
  table.primaryKey = [idCol];

  table.rows.add({ Id: 10, Name: "Customer 10" });
  table.rows.add({ Id: 20, Name: "Customer 20" });
  table.acceptChanges();

  // Find by primary key
  const found = table.find(20);
  assert.ok(found);
  assert.equal(found.item("Name"), "Customer 20");
  assert.equal(table.find(999), undefined);

  // Clone (schema only)
  const cloned = table.clone();
  assert.equal(cloned.columns.count, 2);
  assert.equal(cloned.rows.count, 0);
  assert.equal(cloned.primaryKey.length, 1);

  // Copy (schema + data)
  const copied = table.copy();
  assert.equal(copied.rows.count, 2);
  assert.equal(copied.find(10)?.item("Name"), "Customer 10");
});

test("DataView filtering, sorting, searching, and toTable projection", () => {
  const table = new DataTable("Students");
  table.columns.add("Id", "number");
  table.columns.add("Name", "string");
  table.columns.add("Grade", "number");

  table.rows.add({ Id: 1, Name: "David", Grade: 85 });
  table.rows.add({ Id: 2, Name: "Eva", Grade: 92 });
  table.rows.add({ Id: 3, Name: "Frank", Grade: 78 });
  table.rows.add({ Id: 4, Name: "Grace", Grade: 95 });
  table.acceptChanges();

  const view = new DataView(table);
  view.rowFilter = "Grade >= 85";
  view.sort = "Grade DESC";

  assert.equal(view.count, 3);
  assert.equal(view.get(0)?.item("Name"), "Grace");
  assert.equal(view.get(1)?.item("Name"), "Eva");
  assert.equal(view.get(2)?.item("Name"), "David");

  // find index on sorted view
  const evaIndex = view.find(92);
  assert.equal(evaIndex, 1);

  // toTable projection with distinct and subset columns
  const projectedTable = view.toTable("HonorRoll", false, ["Name", "Grade"]);
  assert.equal(projectedTable.columns.count, 2);
  assert.equal(projectedTable.rows.count, 3);
  assert.equal(projectedTable.rows.get(0)?.item("Name"), "Grace");
});

test("DataSet relations between Parent and Child tables", () => {
  const ds = new DataSet("Store");
  const categories = ds.tables.add("Categories");
  categories.columns.add("CategoryId", "number");
  categories.columns.add("CategoryName", "string");

  const products = ds.tables.add("Products");
  products.columns.add("ProductId", "number");
  products.columns.add("CategoryId", "number");
  products.columns.add("ProductName", "string");

  const cat1 = categories.rows.add({ CategoryId: 1, CategoryName: "Electronics" });
  const cat2 = categories.rows.add({ CategoryId: 2, CategoryName: "Books" });

  const p1 = products.rows.add({ ProductId: 10, CategoryId: 1, ProductName: "Laptop" });
  const p2 = products.rows.add({ ProductId: 11, CategoryId: 1, ProductName: "Smartphone" });
  const p3 = products.rows.add({ ProductId: 20, CategoryId: 2, ProductName: "Novel" });
  ds.acceptChanges();

  const relation = new DataRelation(
    "Category_Products",
    categories,
    products,
    "CategoryId",
    "CategoryId"
  );
  ds.relations.push(relation);

  const electronicsProds = relation.getChildRows(cat1);
  assert.equal(electronicsProds.length, 2);
  assert.equal(electronicsProds[0].item("ProductName"), "Laptop");
  assert.equal(electronicsProds[1].item("ProductName"), "Smartphone");

  const parentCat = relation.getParentRow(p3);
  assert.ok(parentCat);
  assert.equal(parentCat.item("CategoryName"), "Books");
});

test("DataSet JSON and XML serialization and deserialization", () => {
  const ds = new DataSet("Company");
  const depts = ds.tables.add("Departments");
  depts.columns.add("DeptId", "number");
  depts.columns.add("DeptName", "string");

  depts.rows.add({ DeptId: 1, DeptName: "R&D" });
  depts.rows.add({ DeptId: 2, DeptName: "Marketing" });
  ds.acceptChanges();

  // JSON round-trip
  const jsonStr = ds.toJson();
  const dsFromJson = DataSet.fromJson(jsonStr);
  assert.equal(dsFromJson.dataSetName, "Company");
  assert.equal(dsFromJson.tables.count, 1);
  assert.equal(dsFromJson.tables.get("Departments")?.rows.count, 2);
  assert.equal(dsFromJson.tables.get("Departments")?.rows.get(0)?.item("DeptName"), "R&D");

  // XML round-trip
  const xmlStr = ds.toXml();
  assert.ok(xmlStr.includes("<DeptName>R&amp;D</DeptName>"));
  const dsFromXml = DataSet.fromXml(xmlStr, "Company");
  assert.equal(dsFromXml.tables.get("Departments")?.rows.count, 2);
  assert.equal(dsFromXml.tables.get("Departments")?.rows.get(0)?.item("DeptName"), "R&D");
});


import test from "node:test";
import assert from "node:assert/strict";
import { GridViewController, RepeaterController } from "../dist/index.js";
const actors = [
  { actorId: 2, firstName: "Beta" },
  { actorId: 1, firstName: "Alpha" },
  { actorId: 3, firstName: "Gamma" }
];
test("GridView binds, pages, sorts and deletes", async () => {
  const grid = new GridViewController({ id: "g", dataKeyField: "actorId", allowPaging: true, allowSorting: true, pageSize: 2, columns: [] });
  await grid.dataBind(actors);
  assert.equal(grid.pageCount, 2);
  assert.equal(grid.visibleRows.length, 2);
  await grid.sort("firstName", "asc");
  assert.equal(grid.dataSource[0].firstName, "Alpha");
  await grid.deleteRow(0);
  assert.equal(grid.totalRecords, 2);
});
test("GridView cancellable delete is honored", async () => {
  const grid = new GridViewController({ id: "g", dataKeyField: "actorId", columns: [] });
  await grid.dataBind(actors);
  grid.rowDeleting.subscribe((_s, e) => { e.cancel = true; });
  assert.equal(await grid.deleteRow(0), false);
  assert.equal(grid.totalRecords, 3);
});
test("Repeater dispatches item command", async () => {
  const repeater = new RepeaterController({ id: "r", dataKeyField: "actorId" });
  await repeater.dataBind(actors);
  let command = "";
  repeater.itemCommand.subscribe((_s, e) => { command = e.commandName; });
  await repeater.executeCommand(0, "Edit", 2);
  assert.equal(command, "Edit");
});
test("Repeater select command updates the current item", async () => {
  const repeater = new RepeaterController({ id: "r", dataKeyField: "actorId" });
  await repeater.dataBind(actors);
  let selected = -1;
  repeater.currentItemIndexChanged.subscribe((_s, e) => { selected = e.itemIndex; });
  await repeater.executeCommand(1, "Select", 1);
  assert.equal(repeater.currentItemIndex, 1);
  assert.equal(selected, 1);
});
test("Repeater edit lifecycle updates and cancels", async () => {
  const repeater = new RepeaterController({ id: "r", dataKeyField: "actorId" });
  await repeater.dataBind(actors);
  assert.equal(await repeater.beginEdit(0), true);
  assert.equal(repeater.editItemIndex, 0);
  assert.equal(await repeater.updateItem(0, { firstName: "Edited" }), true);
  assert.equal(repeater.items[0].firstName, "Edited");
  assert.equal(repeater.editItemIndex, -1);
  await repeater.beginEdit(1);
  assert.equal(await repeater.cancelEdit(), true);
  assert.equal(repeater.editItemIndex, -1);
});
test("Repeater edit command enters edit mode", async () => {
  const repeater = new RepeaterController({ id: "r", dataKeyField: "actorId" });
  await repeater.dataBind(actors);
  await repeater.executeCommand(0, "Edit");
  assert.equal(repeater.editItemIndex, 0);
});

test("GridView bound directly to a DataTable can sort, update and delete locally", async () => {
  const { DataTable, GridViewController } = await import("../dist/index.js");
  const t = new DataTable("T");
  t.columns.add("Id", "number"); t.columns.add("Name", "string");
  t.rows.add({ Id: 1, Name: "b" }); t.rows.add({ Id: 2, Name: "a" });
  const g = new GridViewController({ id: "g", dataKeyField: "Id", allowSorting: true, dataSource: t, columns: [{ type: "bound", key: "Name", dataField: "Name", headerText: "N" }] });
  await g.dataBind();
  await g.sort("Name", "asc");
  assert.deepEqual(g.visibleRows.map((r) => r.Id), [2, 1]);
  assert.equal(await g.updateRow(0, { Name: "z" }), true);
  assert.equal(await g.deleteRow(1), true);
  assert.equal(g.totalRecords, 1);
});

test("GridView supports server-side paging when select returns { items, total }", async () => {
  const { GridViewController, ObjectDataSource } = await import("../dist/index.js");
  const all = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `N${i + 1}` }));
  const ods = new ObjectDataSource({ id: "o", typeInstance: { list: async (_p, a) => ({ items: all.slice(a.startRowIndex, a.startRowIndex + a.maximumRows), total: all.length }) }, selectMethod: "list" });
  const g = new GridViewController({ id: "g", dataKeyField: "id", allowPaging: true, pageSize: 10, dataSource: ods, columns: [{ type: "bound", key: "name", dataField: "name", headerText: "N" }] });
  await g.dataBind();
  assert.equal(g.pageCount, 3);
  assert.equal(g.totalRecords, 25);
  assert.deepEqual(g.visibleRows.map((r) => r.id), Array.from({ length: 10 }, (_, i) => i + 1));
  await g.changePage(2);
  assert.equal(g.options.pageIndex, 2);
  assert.deepEqual(g.visibleRows.map((r) => r.id), [21, 22, 23, 24, 25]);
  await g.selectRow(22);                       // absolute index
  assert.equal(g.options.selectedIndex, 22);
  assert.equal(g.getDataKey(g.visibleRows[2]), 23);
});

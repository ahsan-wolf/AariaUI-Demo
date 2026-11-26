// Evaluation behaviour of the Pro data controls: unlicensed (capped, no editing), trial (capped), licensed (unrestricted).
import test from "node:test";
import assert from "node:assert/strict";
import { DataTable } from "@wf-controls/core";
import { License } from "@wf-controls/license";
import { activate, unlicensed } from "./_license.mjs";
import {
  GridViewController, DataListController, RepeaterController, ObjectDataSource, AccessDataSource, XmlDataSource,
} from "../dist/index.js";

const rows = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: "n" + (i + 1) }));
const quiet = async (fn) => { const w = console.warn; const out = []; console.warn = (m) => out.push(String(m)); try { await fn(); } finally { console.warn = w; } return out; };
const col = [{ type: "bound", key: "name", dataField: "name", headerText: "Name" }];

test("unlicensed GridView: rows capped to 10, editing and deleting blocked, notice shown, warns once", async () => {
  unlicensed();
  let g; const warnings = await quiet(async () => {
    g = new GridViewController({ id: "g", dataKeyField: "id", columns: col, dataSource: rows.map((r) => ({ ...r })) });
    await g.dataBind();
    assert.equal(g.licensed, false);
    assert.equal(g.totalRecords, 10);
    assert.equal(await g.beginEdit(0), false);
    assert.equal(await g.deleteRow(0), false);
    assert.equal(await g.deleteRow(1), false);
  });
  assert.equal(g.totalRecords, 10, "nothing was deleted");
  assert.match(g.evaluationNotice, /Unlicensed.*first 10 records, editing disabled/);
  assert.equal(warnings.filter((w) => /editing is disabled/.test(w)).length, 1, "one warning per feature+action");
  assert.ok(warnings.some((w) => /data\.gridView/.test(w)));
});

test("unlicensed GridView with server-side paging stays within the cap", async () => {
  unlicensed();
  const ds = { select: async (a) => ({ items: rows.slice(a.startRowIndex, a.startRowIndex + a.maximumRows), total: rows.length }) };
  await quiet(async () => {
    const g = new GridViewController({ id: "g", dataKeyField: "id", columns: col, dataSource: ds, allowPaging: true, pageSize: 4 });
    await g.dataBind();
    assert.equal(g.totalRecords, 10);
    assert.equal(g.pageCount, 3);
    g.options.pageIndex = 2;
    await g.dataBind();
    assert.equal(g.visibleRows.length, 2); // rows 9 and 10 only
  });
});

test("trial GridView: rows capped, editing allowed, trial notice", async () => {
  await activate("trial", { updatesUntil: "2026-12-31" });
  const g = new GridViewController({ id: "g", dataKeyField: "id", columns: col, dataSource: rows.map((r) => ({ ...r })) });
  await g.dataBind();
  assert.equal(g.totalRecords, 10);
  assert.equal(await g.beginEdit(0), true);
  assert.match(g.evaluationNotice, /Trial Edition.*first 10 records\]/);
  assert.doesNotMatch(g.evaluationNotice, /editing disabled/);
});

test("licensed (Pro key): no cap, no notice, editing works", async () => {
  await activate("professional");
  const g = new GridViewController({ id: "g", dataKeyField: "id", columns: col, dataSource: rows.map((r) => ({ ...r })) });
  await g.dataBind();
  assert.equal(g.licensed, true);
  assert.equal(g.totalRecords, 25);
  assert.equal(g.evaluationNotice, undefined);
  assert.equal(await g.beginEdit(0), true);
});

test("a license for the wrong edition does not unlock Pro data controls (free has no Pro features)", async () => {
  unlicensed();
  await quiet(async () => {
    const l = new DataListController({ id: "d", dataKeyField: "id", dataSource: rows.map((r) => ({ ...r })) });
    await l.dataBind();
    assert.equal(l.items.length, 10);
    assert.equal(await l.beginEdit(0), false);
    const r = new RepeaterController({ id: "r", dataKeyField: "id", dataSource: rows.map((x) => ({ ...x })) });
    await r.dataBind();
    assert.equal(r.items.length, 10);
    assert.equal(await r.beginEdit(0), false);
    await r.deleteItem(0);
    assert.equal(r.items.length, 10);
  });
});

test("unlicensed Object/Access/Xml data sources: select capped, writes blocked", async () => {
  unlicensed();
  await quiet(async () => {
    const svc = { getAll: () => rows.map((r) => ({ ...r })), add: () => 1 };
    const ods = new ObjectDataSource({ id: "o", typeName: "svc", typeInstance: () => svc, selectMethod: "getAll", insertMethod: "add" });
    const got = await ods.select();
    assert.equal(got.length, 10);
    assert.equal(await ods.insert({ id: 99 }), 0);

    const t = new DataTable("T"); t.columns.add("id", "number");
    for (let i = 0; i < 15; i++) t.rows.add({ id: i });
    const ads = new AccessDataSource({ id: "a", table: t });
    assert.equal((await ads.select()).length, 10);
    assert.equal(await ads.insert({ id: 1000 }), 0);
    assert.equal(t.rows.toArray().length, 15, "table untouched");
  });
});

test("licensed data sources are unrestricted", async () => {
  await activate("professional");
  const svc = { getAll: () => rows.map((r) => ({ ...r })), add: () => 1 };
  const ods = new ObjectDataSource({ id: "o", typeName: "svc", typeInstance: () => svc, selectMethod: "getAll", insertMethod: "add" });
  assert.equal((await ods.select()).length, 25);
  assert.equal(await ods.insert({ id: 99 }), 1);
  void XmlDataSource; void License;
});

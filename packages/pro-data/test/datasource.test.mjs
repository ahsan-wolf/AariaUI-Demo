import test from "node:test";
import assert from "node:assert/strict";
import { Parameter, ControlParameter, QueryStringParameter, SessionParameter, FormParameter, ParameterCollection, SqlDataSource, SiteMapDataSource, DataTable } from "@wf-controls/core";
import "./_license.mjs"; // activates a Pro license so the controls run unrestricted
import { GridViewController, RepeaterController, DataListController, ObjectDataSource, AccessDataSource, XmlDataSource } from "../dist/index.js";

test("ObjectDataSource invokes service methods with reflection and paging", async () => {
  class ProductService {
    constructor() {
      this.items = [
        { id: 101, name: "Keyboard" },
        { id: 102, name: "Mouse" },
        { id: 103, name: "Monitor" }
      ];
    }

    async getProducts(params, args) {
      let result = [...this.items];
      if (params.search) {
        result = result.filter((i) => i.name.toLowerCase().includes(String(params.search).toLowerCase()));
      }
      return result;
    }

    async addProduct(values) {
      this.items.push({ id: 104, name: String(values.name) });
      return 1;
    }

    async updateProduct(values, keys) {
      const target = this.items.find((i) => i.id === keys.id);
      if (target) {
        Object.assign(target, values);
        return 1;
      }
      return 0;
    }

    async removeProduct(keys) {
      const idx = this.items.findIndex((i) => i.id === keys.id);
      if (idx >= 0) {
        this.items.splice(idx, 1);
        return 1;
      }
      return 0;
    }
  }

  const service = new ProductService();
  const ods = new ObjectDataSource({
    id: "Ods1",
    typeInstance: service,
    selectMethod: "getProducts",
    insertMethod: "addProduct",
    updateMethod: "updateProduct",
    deleteMethod: "removeProduct",
    selectParameters: [new Parameter("search", "Mou")]
  });

  const items = await ods.select();
  assert.equal(items.length, 1);
  assert.equal(items[0]?.name, "Mouse");

  await ods.insert({ name: "Webcam" });
  await ods.update({ id: 101 }, { name: "Mechanical Keyboard" });
  await ods.delete({ id: 102 });

  ods.selectParameters.get("search").value = "";
  const all = await ods.select();
  assert.equal(all.length, 3);
  assert.equal(all.find((i) => i.id === 101)?.name, "Mechanical Keyboard");
  assert.equal(all.find((i) => i.id === 102), undefined);
});

test("AccessDataSource binds to DataTable and executes CRUD operations", async () => {
  const table = new DataTable("Customers");
  table.columns.add("id", "number");
  table.columns.add("name", "string");
  table.rows.add({ id: 1, name: "Alice" });
  table.rows.add({ id: 2, name: "Bob" });
  table.acceptChanges();

  const accessDs = new AccessDataSource({
    id: "Access1",
    table
  });

  const initial = await accessDs.select();
  assert.equal(initial.length, 2);

  await accessDs.insert({ id: 3, name: "Charlie" });
  assert.equal(table.rows.count, 3);

  await accessDs.update({ id: 2 }, { name: "Robert" });
  assert.equal(table.rows.toArray()[1]?.item("name"), "Robert");

  await accessDs.delete({ id: 1 });
  assert.equal(table.rows.count, 2);
});

test("XmlDataSource parses XML and selects nodes", async () => {
  const xml = `
    <catalog>
      <book id="bk101">
        <title>ASP.NET Architecture</title>
        <price>44.95</price>
      </book>
      <book id="bk102">
        <title>TypeScript Deep Dive</title>
        <price>39.95</price>
      </book>
    </catalog>
  `;

  const xmlDs = new XmlDataSource({
    id: "XmlSource1",
    data: xml,
    xPath: "book"
  });

  const books = await xmlDs.select();
  assert.equal(books.length, 2);
  assert.equal(books[0]?.id, "bk101");
  assert.equal(books[0]?.title, "ASP.NET Architecture");
  assert.equal(books[1]?.id, "bk102");
});

test("GridViewController binds to SqlDataSource and automatically updates and deletes", async () => {
  const store = [
    { orderId: 1, customer: "Alice", total: 100 },
    { orderId: 2, customer: "Bob", total: 200 }
  ];

  const sqlDs = new SqlDataSource({
    id: "OrdersDs",
    selectCommand: "SELECT * FROM Orders",
    deleteCommand: "DELETE FROM Orders",
    updateCommand: "UPDATE Orders",
    handler: async (cmd, params, op) => {
      if (op === "select") return [...store];
      if (op === "update") {
        const item = store.find((o) => o.orderId === params.orderId);
        if (item) Object.assign(item, params);
        return 1;
      }
      if (op === "delete") {
        const idx = store.findIndex((o) => o.orderId === params.orderId);
        if (idx >= 0) store.splice(idx, 1);
        return 1;
      }
      return 0;
    }
  });

  const grid = new GridViewController({
    id: "gridOrders",
    dataKeyField: "orderId",
    dataSource: sqlDs,
    columns: [
      { type: "bound", key: "orderId", dataField: "orderId", headerText: "Order ID" },
      { type: "bound", key: "customer", dataField: "customer", headerText: "Customer" },
      { type: "bound", key: "total", dataField: "total", headerText: "Total" }
    ]
  });

  await grid.dataBind();
  assert.equal(grid.totalRecords, 2);
  assert.equal(grid.visibleRows[0]?.customer, "Alice");

  await grid.updateRow(0, { customer: "Alice Smith" });
  assert.equal(store[0]?.customer, "Alice Smith");

  await grid.deleteRow(1);
  assert.equal(grid.totalRecords, 1);
  assert.equal(store.length, 1);
});

test("RepeaterController binds directly to DataTable", async () => {
  const table = new DataTable("Users");
  table.columns.add("userId", "number");
  table.columns.add("userName", "string");
  table.rows.add({ userId: 1, userName: "Admin" });
  table.rows.add({ userId: 2, userName: "Guest" });
  table.acceptChanges();

  const repeater = new RepeaterController({
    id: "repUsers",
    dataKeyField: "userId",
    dataSource: table
  });

  await repeater.dataBind();
  assert.equal(repeater.itemCount, 2);
  assert.equal(repeater.items[0]?.userName, "Admin");
  assert.equal(repeater.items[1]?.userName, "Guest");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  Parameter,
  ControlParameter,
  QueryStringParameter,
  SessionParameter,
  FormParameter,
  ParameterCollection,
  SqlDataSource,
  SiteMapDataSource,
  DataTable
} from "../dist/index.js";

test("Parameter coerces types and respects default values", () => {
  const pInt = new Parameter({ name: "age", type: "Int32", defaultValue: 25 });
  assert.equal(pInt.getValue(), 25);
  pInt.value = "42";
  assert.equal(pInt.getValue(), 42);

  const pBool = new Parameter({ name: "active", type: "Boolean" });
  pBool.value = "true";
  assert.equal(pBool.getValue(), true);
  pBool.value = "0";
  assert.equal(pBool.getValue(), false);

  const pDate = new Parameter({ name: "created", type: "DateTime" });
  pDate.value = "2026-01-15T00:00:00Z";
  assert.ok(pDate.getValue() instanceof Date);
});

test("Control, QueryString, Session, and Form parameters evaluate dynamically", () => {
  const ctrlParam = new ControlParameter({
    name: "dept",
    controlId: "ddlDept",
    propertyName: "value"
  });

  const qsParam = new QueryStringParameter({
    name: "q",
    queryStringField: "search"
  });

  const sessionParam = new SessionParameter({
    name: "user",
    sessionField: "currentUser"
  });

  const formParam = new FormParameter({
    name: "email",
    formField: "userEmail"
  });

  const collection = new ParameterCollection([
    ctrlParam,
    qsParam,
    sessionParam,
    formParam
  ]);

  const context = {
    controls: {
      ddlDept: { value: "Engineering" }
    },
    queryString: "?search=webforms&page=2",
    session: {
      currentUser: "admin"
    },
    form: {
      userEmail: "admin@example.com"
    }
  };

  const evaluated = collection.evaluate(context);
  assert.deepEqual(evaluated, {
    dept: "Engineering",
    q: "webforms",
    user: "admin",
    email: "admin@example.com"
  });
});

test("SqlDataSource executes select, insert, update, and delete with events", async () => {
  const mockDb = [
    { id: 1, name: "Alpha", category: "Hardware" },
    { id: 2, name: "Beta", category: "Software" }
  ];

  const sqlDs = new SqlDataSource({
    id: "SqlSource1",
    selectCommand: "SELECT * FROM Products WHERE category = {cat}",
    insertCommand: "INSERT INTO Products",
    updateCommand: "UPDATE Products",
    deleteCommand: "DELETE FROM Products WHERE id = {id}",
    selectParameters: [new Parameter("cat", "Hardware")],
    handler: async (cmd, params, op) => {
      if (op === "select") {
        return mockDb.filter((p) => p.category === params.cat);
      }
      if (op === "insert") {
        mockDb.push({ id: mockDb.length + 1, name: String(params.name), category: String(params.category) });
        return 1;
      }
      if (op === "update") {
        const item = mockDb.find((p) => p.id === params.id);
        if (item) {
          Object.assign(item, params);
          return 1;
        }
        return 0;
      }
      if (op === "delete") {
        const idx = mockDb.findIndex((p) => p.id === params.id);
        if (idx >= 0) {
          mockDb.splice(idx, 1);
          return 1;
        }
        return 0;
      }
      return 0;
    }
  });

  let selectingFired = false;
  sqlDs.selecting.subscribe((_s, e) => {
    selectingFired = true;
    assert.equal(e.parameters.cat, "Hardware");
  });

  const selected = await sqlDs.select();
  assert.ok(selectingFired);
  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.name, "Alpha");

  // Insert
  await sqlDs.insert({ name: "Gamma", category: "Hardware" });
  assert.equal(mockDb.length, 3);

  // Update
  await sqlDs.update({ id: 1 }, { name: "Alpha Modified" });
  assert.equal(mockDb.find((p) => p.id === 1)?.name, "Alpha Modified");

  // Delete
  await sqlDs.delete({ id: 2 });
  assert.equal(mockDb.length, 2);
  assert.equal(mockDb.find((p) => p.id === 2), undefined);
});

test("SqlDataSource cancellable events prevent execution", async () => {
  let executed = false;
  const sqlDs = new SqlDataSource({
    id: "SqlSource2",
    selectCommand: "SELECT",
    handler: async () => {
      executed = true;
      return [];
    }
  });

  sqlDs.selecting.subscribe((_s, e) => {
    e.cancel = true;
  });

  const result = await sqlDs.select();
  assert.equal(executed, false);
  assert.deepEqual(result, []);
});

test("SiteMapDataSource provides hierarchical navigation and breadcrumbs", async () => {
  const siteMap = {
    title: "Home",
    url: "/home",
    childNodes: [
      {
        title: "Products",
        url: "/products",
        childNodes: [
          { title: "Laptops", url: "/products/laptops" },
          { title: "Phones", url: "/products/phones" }
        ]
      },
      {
        title: "About Us",
        url: "/about"
      }
    ]
  };

  const sitemapDs = new SiteMapDataSource({
    id: "SiteMap1",
    siteMap
  });

  const nodes = await sitemapDs.select();
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0]?.title, "Home");

  const crumbs = sitemapDs.getBreadcrumbs("/products/laptops");
  assert.equal(crumbs.length, 3);
  assert.equal(crumbs[0]?.title, "Home");
  assert.equal(crumbs[1]?.title, "Products");
  assert.equal(crumbs[2]?.title, "Laptops");
});

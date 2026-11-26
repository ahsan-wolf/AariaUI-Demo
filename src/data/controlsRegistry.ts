import { ControlDefinition } from '../types/gallery';
import { editionControls } from './controlsRegistryEditions';

const baseControls: ControlDefinition[] = [
  {
    id: 'data-table',
    docs: { areaId: 'data-library', entryId: 'datatable' },
    name: 'DataTable & DataView',
    category: 'ADO.NET Data Core',
    aspEquivalent: 'System.Data.DataTable / DataView',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/data',
    tagline: 'In-memory tables with a typed schema, row states, filtering, sorting and change tracking.',
    description:
      'The zero-dependency ADO.NET core of the framework (@wf-controls/data). A DataTable holds typed DataColumns and DataRows with Added / Modified / Deleted / Unchanged states and Original / Current / Proposed versions; a DataView gives a filtered, sorted projection without copying. Every data control binds to them.',
    features: [
      'Typed columns: autoIncrement, allowDBNull, defaultValue, maxLength, readOnly',
      'Row states and versions with acceptChanges() / rejectChanges()',
      'find() by primary key, select() with filter and sort expressions or predicates',
      'DataView: rowFilter, sort, rowStateFilter, find / findRows, toTable()',
      'toObjects() / fromObjects() for JSON round trips',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'tableName', type: 'string', defaultValue: '\'Table1\'', description: 'Name of the table (used by DataSet and serialization)' },
      { name: 'columns', type: 'DataColumnCollection', defaultValue: '-', description: 'Schema: add(name, type) or add(new DataColumn({...}))' },
      { name: 'rows', type: 'DataRowCollection', defaultValue: '-', description: 'Rows: add({...}), remove, count, toArray()' },
      { name: 'primaryKey', type: 'DataColumn[]', defaultValue: '[]', description: 'Key columns used by find() (uniqueness is not enforced)' },
    ],
    events: [],
    methods: [
      { name: 'newRow', signature: 'newRow(): DataRow', returnType: 'DataRow', description: 'Creates a detached row (consumes an auto-increment value)' },
      { name: 'acceptChanges', signature: 'acceptChanges(): void', returnType: 'void', description: 'Commits all changes; deleted rows are physically removed' },
      { name: 'rejectChanges', signature: 'rejectChanges(): void', returnType: 'void', description: 'Rolls every row back to its original values' },
      { name: 'find', signature: 'find(primaryKeyValues: unknown | unknown[]): DataRow | undefined', returnType: 'DataRow | undefined', description: 'Looks a row up by primary key' },
      { name: 'select', signature: 'select(filter?: string | ((row: DataRow) => boolean), sort?: string): DataRow[]', returnType: 'DataRow[]', description: 'Filters and sorts rows with an expression or predicate' },
      { name: 'toObjects', signature: 'toObjects(): Record<string, unknown>[]', returnType: 'Record<string, unknown>[]', description: 'Plain objects for JSON / binding' },
    ],
    codeSamples: {
      react: `import { useMemo, useState } from "react";
import { DataTable, DataView } from "@wf-controls/core";
import { GridViewController } from "@wf-controls/pro-data";
import { WebFormsGridView } from "@wf-controls/pro-data-react";

export function ProductGrid({ table }: { table: DataTable }) {
  const [filter, setFilter] = useState("");

  // Bind a DataView (not the DataTable): the view owns filtering and sorting.
  const { view, grid } = useMemo(() => {
    const view = new DataView(table);
    const grid = new GridViewController<Record<string, unknown>>({
      id: "gvProducts", dataKeyField: "id", allowPaging: true, pageSize: 8,
      columns: [
        { type: "bound", key: "id", dataField: "id", headerText: "ID" },
        { type: "bound", key: "name", dataField: "name", headerText: "Name" },
        { type: "bound", key: "price", dataField: "price", headerText: "Price" },
      ],
      dataSource: view,
    });
    return { view, grid };
  }, [table]);

  // The data library has no change events: re-bind after the filter (or the table) changes.
  const apply = async (text: string) => {
    setFilter(text);
    view.rowFilter = text ? (row) => String(row.item("name")).toLowerCase().includes(text.toLowerCase()) : null;
    await grid.dataBind();
  };

  return (
    <>
      <input value={filter} onChange={(e) => void apply(e.target.value)} placeholder="Filter by name" />
      <WebFormsGridView controller={grid} />
    </>
  );
}`,
      angular: `// products.component.ts : bind a DataView to wf-grid-view through a GridViewController
import { Component, OnInit } from "@angular/core";
import { DataTable, DataView } from "@wf-controls/core";
import { GridViewController } from "@wf-controls/pro-data";
import { WebFormsGridViewComponent } from "@wf-controls/pro-data-angular";

@Component({ standalone: true, selector: "app-products", imports: [WebFormsGridViewComponent], templateUrl: "./products.component.html" })
export class ProductsComponent implements OnInit {
  table = new DataTable("Products");          // columns + rows as in the headless example
  view = new DataView(this.table);
  grid = new GridViewController<Record<string, unknown>>({
    id: "gvProducts", dataKeyField: "id", allowSorting: true,
    columns: [{ type: "bound", key: "name", dataField: "name", headerText: "Name", sortable: true }],
    dataSource: this.view,
  });

  async ngOnInit() { await this.grid.dataBind(); }

  async filter(text: string) {
    this.view.rowFilter = text ? (r) => String(r.item("name")).includes(text) : null;
    await this.grid.dataBind();               // re-bind: there are no table change events
  }
}
// products.component.html:  <input (input)="filter($any($event.target).value)" />  <wf-grid-view [controller]="grid" />`,
      jquery: `import { DataTable, DataView } from "@wf-controls/core";

const products = new DataTable("Products");
products.columns.add("id", "number");
products.columns.add("name", "string");
products.columns.add("price", "number");
products.rows.add({ id: 1, name: "Hammer", price: 12.5 });
products.rows.add({ id: 2, name: "Drill", price: 89 });
products.acceptChanges();                       // every row is now Unchanged

products.rows.get(0)!.setItem("price", 14);     // -> Modified, original value kept
console.log(products.rows.get(0)!.rowState);    // "Modified"

const view = new DataView(products);
view.rowFilter = "price > 20";                  // or a predicate: (row) => row.item("price") > 20
view.sort = "price DESC";
console.log(view.toObjects());                  // [{ id: 2, name: "Drill", price: 89 }]`,
    },
    migrationNotes:
      'System.Data.DataTable and DataView map almost line for line: Columns.Add -> columns.add, Rows.Add -> rows.add, DataTable.Select -> select, DefaultView.RowFilter -> new DataView(table).rowFilter. Differences: no change events, uniqueness / primary key are not enforced, and filters support only field op literal joined by AND / OR (use a predicate for anything richer).',
  },
  {
    id: 'data-set',
    docs: { areaId: 'data-library', entryId: 'dataset' },
    name: 'DataSet & DataRelation',
    category: 'ADO.NET Data Core',
    aspEquivalent: 'System.Data.DataSet / DataRelation',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/data',
    tagline: 'A container of tables with parent / child relations and JSON / XML serialization.',
    description:
      'DataSet groups several DataTables and DataRelations for master / detail data. getChildRows() / getParentRow() navigate a relation, acceptChanges() / rejectChanges() cascade to every table, and toJson() / toXml() serialize the set (with documented limits: column types and keys are not preserved).',
    features: [
      'tables collection with add / get by name',
      'DataRelation(name, parentTable, childTable, parentColumn(s), childColumn(s))',
      'getChildRows(parentRow) and getParentRow(childRow)',
      'acceptChanges / rejectChanges / clear / clone / copy for the whole set',
      'toJson / fromJson and toXml / fromXml',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'dataSetName', type: 'string', defaultValue: '\'NewDataSet\'', description: 'Name of the set (constructor argument, used in XML)' },
      { name: 'tables', type: 'DataTableCollection', defaultValue: '-', description: 'The tables of the set: add(table), get(name)' },
      { name: 'relations', type: 'DataRelation[]', defaultValue: '[]', description: 'Plain array of relations: push(new DataRelation(...))' },
    ],
    events: [],
    methods: [
      { name: 'acceptChanges', signature: 'acceptChanges(): void', returnType: 'void', description: 'Accepts changes in every table' },
      { name: 'rejectChanges', signature: 'rejectChanges(): void', returnType: 'void', description: 'Rejects changes in every table' },
      { name: 'toJson', signature: 'toJson(): string', returnType: 'string', description: 'Serializes tables (name, columns, rows); relations and row states are not included' },
      { name: 'fromJson', signature: 'static fromJson(jsonStr: string): DataSet', returnType: 'DataSet', description: 'Rebuilds a set from toJson() output' },
      { name: 'toXml', signature: 'toXml(): string', returnType: 'string', description: 'XML representation (dates are written with String(date))' },
      { name: 'getChildRows', signature: 'relation.getChildRows(parentRow: DataRow): DataRow[]', returnType: 'DataRow[]', description: 'Rows of the child table that match the parent row' },
    ],
    codeSamples: {
      react: `import { useMemo, useState } from "react";
import { DataRelation, DataSet, DataTable, DataView } from "@wf-controls/core";
import { GridViewController } from "@wf-controls/pro-data";
import { WebFormsGridView } from "@wf-controls/pro-data-react";

// Master / detail: selecting a customer rebinds the child grid with that customer's orders.
export function CustomerOrders({ ds, relation }: { ds: DataSet; relation: DataRelation }) {
  const customers = ds.tables.get("Customers")!;
  const orders = ds.tables.get("Orders")!;
  const [selectedId, setSelectedId] = useState<unknown>(undefined);

  const orderGrid = useMemo(() => new GridViewController<Record<string, unknown>>({
    id: "gvOrders", dataKeyField: "id", columns: [
      { type: "bound", key: "id", dataField: "id", headerText: "Order" },
      { type: "bound", key: "total", dataField: "total", headerText: "Total" },
    ],
  }), []);

  const select = async (id: unknown) => {
    setSelectedId(id);
    const parent = customers.find(id);
    const rows = parent ? relation.getChildRows(parent).map((r) => r.toObject()) : [];
    await orderGrid.dataBind(rows);
  };

  return (
    <>
      <ul>
        {customers.rows.toArray().map((c) => (
          <li key={String(c.item("id"))} onClick={() => void select(c.item("id"))}>{String(c.item("name"))}</li>
        ))}
      </ul>
      <h4>Orders of {String(selectedId ?? "…")}</h4>
      <WebFormsGridView controller={orderGrid} />
    </>
  );
}`,
      angular: `// master-detail.component.ts
import { Component } from "@angular/core";
import { DataRelation, DataSet, DataTable } from "@wf-controls/core";
import { GridViewController } from "@wf-controls/pro-data";

export class MasterDetailComponent {
  ds = new DataSet("Shop");
  customers = new DataTable("Customers");
  orders = new DataTable("Orders");
  relation = new DataRelation("CustomerOrders", this.customers, this.orders, "id", "customerId");
  orderGrid = new GridViewController<Record<string, unknown>>({
    id: "gvOrders", dataKeyField: "id",
    columns: [{ type: "bound", key: "total", dataField: "total", headerText: "Total" }],
  });

  constructor() {
    this.ds.tables.add(this.customers);
    this.ds.tables.add(this.orders);
    this.ds.relations.push(this.relation);
  }

  async selectCustomer(id: number) {
    const parent = this.customers.find(id);   // needs customers.primaryKey = [idColumn]
    await this.orderGrid.dataBind(parent ? this.relation.getChildRows(parent).map((r) => r.toObject()) : []);
  }
}`,
      jquery: `import { DataSet, DataTable, DataRelation } from "@wf-controls/core";

const ds = new DataSet("Shop");
const customers = new DataTable("Customers"); customers.columns.add("id", "number"); customers.columns.add("name", "string");
const orders = new DataTable("Orders"); orders.columns.add("id", "number"); orders.columns.add("customerId", "number"); orders.columns.add("total", "number");
ds.tables.add(customers); ds.tables.add(orders);

customers.rows.add({ id: 1, name: "Contoso" });
orders.rows.add({ id: 10, customerId: 1, total: 99 });
orders.rows.add({ id: 11, customerId: 1, total: 25 });

const rel = new DataRelation("CustomerOrders", customers, orders, "id", "customerId");  // columns by NAME
ds.relations.push(rel);                                                                   // plain array

const contoso = customers.select("id = 1")[0]!;
console.log(rel.getChildRows(contoso).map((r) => r.item("total")));                     // [ 99, 25 ]
const json = ds.toJson();                                                                  // tables + rows (no relations)`,
    },
    migrationNotes:
      'System.Data.DataSet maps directly: Tables.Add -> tables.add, Relations.Add -> relations.push(new DataRelation(...)) with column NAMES, GetChildRows -> relation.getChildRows(row). WriteXml / ReadXml become toXml / fromXml (regex based, every value comes back as a string).',
  },
  {
    id: 'data-binding',
    docs: { areaId: 'data-binding', entryId: 'the-binding-model' },
    name: 'Data Binding',
    category: 'ADO.NET Data Core',
    aspEquivalent: 'DataSource / DataBind() / DataSourceID',
    badge: 'New',
    edition: 'pro',
    package: '@wf-controls/pro-data',
    adapterPackages: { react: '@wf-controls/pro-data-react', angular: '@wf-controls/pro-data-angular' },
    featureId: 'data.gridView',
    tagline: 'Bind arrays, DataViews and data sources to GridView, Repeater, DataList and DataGrid, with the exact event pipeline.',
    description:
      'Every presentation controller binds with await controller.dataBind(source?). It copies the rows, raises dataBinding, then rowCreated / rowDataBound per row, then dataBound. Because the controllers bind a snapshot, edits must be written to the DataTable (inside rowUpdating / rowDeleting) and the control re-bound. The live demo below shows the event order, CRUD, row states and filtering.',
    features: [
      'Sources: array, DataView, data source controls (bind a DataView, not a raw DataTable, to GridView)',
      'Pipeline: dataBinding -> rowCreated -> rowDataBound -> dataBound -> stateChanged',
      'CRUD through cancellable events with persistence to the DataTable',
      'Filtering and sorting on the DataView, then re-bind',
      'Master / detail with DataRelation.getChildRows',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'dataSource', type: 'T[] | DataView | IDataSourceControl', defaultValue: '-', description: 'What the controller binds (option, or the argument of dataBind)' },
      { name: 'dataKeyField', type: 'keyof T', defaultValue: '-', description: 'Unique key field of a row (GridView, Repeater, DataList)' },
    ],
    events: [],
    methods: [
      { name: 'dataBind', signature: 'dataBind(data?: GridDataSource<T>): Promise<void>', returnType: 'Promise<void>', description: '(Re)binds; GridView and Repeater remember the argument, DataGrid and DataList do not' },
      { name: 'stateChanged', signature: 'stateChanged.subscribe((sender, { reason }) => ...)', returnType: '() => void', description: 'Raised after every state change: repaint here' },
    ],
    codeSamples: {
      react: `import { useEffect, useMemo } from "react";
import { DataTable, DataView } from "@wf-controls/core";
import { GridViewController } from "@wf-controls/pro-data";
import { WebFormsGridView } from "@wf-controls/pro-data-react";

export function BoundGrid({ table, onSave }: { table: DataTable; onSave: (id: unknown, values: object) => void }) {
  const grid = useMemo(() => {
    const g = new GridViewController<Record<string, unknown>>({
      id: "gv", dataKeyField: "id", dataSource: new DataView(table), allowPaging: true, pageSize: 5,
      columns: [{ type: "bound", key: "name", dataField: "name", headerText: "Name" }],
    });
    // The grid edits its own copy: write to the table here, veto with e.cancel = true.
    g.rowUpdating.subscribe((_g, e) => {
      const row = table.find(e.dataItem.id);
      if (!row) { e.cancel = true; return; }
      row.setValues(e.values as Record<string, unknown>);
      onSave(e.dataItem.id, e.values);
    });
    return g;
  }, [table]);

  useEffect(() => { void grid.dataBind(); }, [grid]);
  return <WebFormsGridView controller={grid} />;
}`,
      angular: `// bound-grid.component.ts
import { Component, OnInit } from "@angular/core";
import { DataTable, DataView } from "@wf-controls/core";
import { GridViewController } from "@wf-controls/pro-data";

export class BoundGridComponent implements OnInit {
  table = new DataTable("Items");
  grid = new GridViewController<Record<string, unknown>>({
    id: "gv", dataKeyField: "id", dataSource: new DataView(this.table),
    columns: [{ type: "bound", key: "name", dataField: "name", headerText: "Name" }],
  });

  async ngOnInit() {
    this.grid.rowDeleting.subscribe((_g, e) => {
      const row = this.table.find(e.dataItem.id);
      row ? row.delete() : (e.cancel = true);   // mark Deleted; call table.acceptChanges() to remove it
    });
    await this.grid.dataBind();
  }
}`,
      jquery: `import { DataTable, DataView } from "@wf-controls/core";
import { GridViewController } from "@wf-controls/pro-data";

const table = new DataTable("Items");
table.columns.add("id", "number");
table.columns.add("name", "string");
table.rows.add({ id: 1, name: "One" });
table.rows.add({ id: 2, name: "Two" });

const order = [];
const grid = new GridViewController({ id: "gv", dataKeyField: "id", columns: [], dataSource: new DataView(table) });
grid.dataBinding.subscribe(() => { order.push("dataBinding"); });
grid.rowCreated.subscribe(() => { order.push("rowCreated"); });
grid.rowDataBound.subscribe(() => { order.push("rowDataBound"); });
grid.dataBound.subscribe(() => { order.push("dataBound"); });
await grid.dataBind();
console.log(order.join(" > "));   // dataBinding > rowCreated > rowDataBound > rowCreated > rowDataBound > dataBound`,
    },
    migrationNotes:
      'GridView1.DataSource = table; GridView1.DataBind(); becomes await grid.dataBind(new DataView(table)). RowDataBound handlers port to grid.rowDataBound.subscribe. There is no ViewState or postback: after a save, call dataBind() again.',
  },
  {
    id: 'grid-view',
    docs: { areaId: 'data-controls', entryId: 'gridviewcontroller' },
    name: 'GridView',
    category: 'Data Controls',
    aspEquivalent: '<asp:GridView>',
    badge: 'Stable',
    edition: 'pro',
    package: '@wf-controls/pro-data',
    adapterPackages: { react: '@wf-controls/pro-data-react', angular: '@wf-controls/pro-data-angular' },
    featureId: 'data.gridView',
    tagline: 'Tabular data presentation with sorting, paging, inline editing, and row selection.',
    description:
      'The flagship enterprise data grid replicating classic ASP.NET GridView semantics. Powered by a headless controller, it supports client and server pagination, multi-column sorting, row command routing, inline editing, and row selection with zero ViewState bloat.',
    features: [
      'Declarative BoundField, TemplateField, and CommandField equivalents',
      'Client-side & REST server-side pagination with PageIndexChanging/PageIndexChanged',
      'Multi-column sorting with Sorting/Sorted cancellable events',
      'Inline edit mode with RowEditing, RowUpdating, and RowCancelingEdit',
      'Row selection and row command dispatching (executeCommand)',
      'Binds arrays, DataView (of an in-memory DataTable) or SqlDataSource / ObjectDataSource',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'dataSource', type: 'T[] | DataView | IDataSourceControl', defaultValue: '[]', description: 'Underlying data provider or array of records' },
      { name: 'dataKeyField', type: 'keyof T', defaultValue: '-', description: 'Field that uniquely identifies a row (required)' },
      { name: 'allowPaging', type: 'boolean', defaultValue: 'false', description: 'Enables interactive pagination controls' },
      { name: 'pageSize', type: 'number', defaultValue: '10', description: 'Number of rows displayed per page' },
      { name: 'allowSorting', type: 'boolean', defaultValue: 'false', description: 'Enables click-to-sort headers' },
          ],
    events: [
      { name: 'pageIndexChanging', arguments: 'GridViewPageEventArgs', cancellable: true, description: 'Fired before page changes; can be cancelled (e.cancel = true)' },
      { name: 'sorting', arguments: 'GridViewSortEventArgs', cancellable: true, description: 'Fired before sort expression is applied; cancellable' },
      { name: 'rowEditing', arguments: 'GridViewEditEventArgs', cancellable: true, description: 'Fired when a row enters inline edit mode' },
      { name: 'rowUpdating', arguments: 'GridViewUpdateEventArgs', cancellable: true, description: 'Fired when inline row changes are saved' },
      { name: 'rowCommand', arguments: 'GridViewCommandEventArgs', cancellable: false, description: 'Fired when any command button is clicked' },
    ],
    methods: [
      { name: 'dataBind', signature: 'dataBind(): Promise<void>', returnType: 'Promise<void>', description: 'Fetches data from provider and recalculates projection' },
      { name: 'changePage', signature: 'changePage(newPageIndex: number): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Navigates to a 0-based page (raises pageIndexChanging, cancellable)' },
      { name: 'sort', signature: 'sort(field: keyof T, direction?: "asc" | "desc"): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Sorts the bound rows (raises sorting, cancellable); toggles direction when omitted' },
    ],
    codeSamples: {
      react: `import { useEffect } from "react";
import { GridViewController } from "@wf-controls/pro-data";
import { WebFormsGridView } from "@wf-controls/pro-data-react";

interface Employee { id: number; name: string; role: string; salary: number }

const grid = new GridViewController<Employee>({
  id: "gvEmployees",
  dataKeyField: "id",
  allowPaging: true,
  pageSize: 5,
  allowSorting: true,
  columns: [
    { type: "bound", key: "id", dataField: "id", headerText: "ID", sortable: true },
    { type: "bound", key: "name", dataField: "name", headerText: "Name", sortable: true },
    { type: "bound", key: "role", dataField: "role", headerText: "Role", sortable: true },
    { type: "bound", key: "salary", dataField: "salary", headerText: "Salary", sortable: true },
  ],
});

// Cancellable events: persist the edit, or veto it with e.cancel = true.
grid.rowUpdating.subscribe((_g, e) => {
  if (!e.values.name) e.cancel = true;
});

export function EmployeeGrid({ employees }: { employees: Employee[] }) {
  useEffect(() => { void grid.dataBind(employees); }, [employees]);
  return <WebFormsGridView controller={grid} />;
}`,
      angular: `// employee-grid.component.ts
import { Component, OnInit } from "@angular/core";
import { GridViewController } from "@wf-controls/pro-data";
import { WebFormsGridViewComponent } from "@wf-controls/pro-data-angular";

@Component({
  standalone: true,
  selector: "app-employee-grid",
  imports: [WebFormsGridViewComponent],
  templateUrl: "./employee-grid.component.html", // <wf-grid-view [controller]="grid" />
})
export class EmployeeGridComponent implements OnInit {
  grid = new GridViewController<Employee>({
    id: "gvEmployees",
    dataKeyField: "id",
    allowPaging: true,
    pageSize: 5,
    allowSorting: true,
    columns: [
      { type: "bound", key: "id", dataField: "id", headerText: "ID", sortable: true },
      { type: "bound", key: "name", dataField: "name", headerText: "Name", sortable: true },
    ],
  });

  async ngOnInit() {
    this.grid.rowUpdating.subscribe((_g, e) => { /* persist; e.cancel = true to veto */ });
    await this.grid.dataBind(this.employees);
  }
}`,
      jquery: `// HTML / jQuery Plugin
$("#employeeGrid").wfGridView({
  dataSource: employeesData,
  dataKeyField: "id",
  allowPaging: true,
  pageSize: 5,
  allowSorting: true,
  columns: [
    { dataField: "id", headerText: "ID", sortable: true },
    { dataField: "name", headerText: "Name", sortable: true },
    { dataField: "role", headerText: "Role", sortable: true }
  ]
});`,
    },
    migrationNotes:
      'Direct 1:1 replacement for `<asp:GridView>`. In WebForms, postbacks refreshed the full page; in Aaira, all paging, sorting, and inline updates occur client-side or via REST promises with cancellable event handlers.',
  },
  {
    id: 'repeater',
    docs: { areaId: 'data-controls', entryId: 'repeatercontroller' },
    name: 'Repeater',
    category: 'Data Controls',
    aspEquivalent: '<asp:Repeater>',
    badge: 'Stable',
    edition: 'pro',
    package: '@wf-controls/pro-data',
    adapterPackages: { react: '@wf-controls/pro-data-react', angular: '@wf-controls/pro-data-angular' },
    featureId: 'data.repeater',
    tagline: 'Lightweight, completely custom templated repeater control.',
    description:
      'Renders completely customizable markup with zero enforced wrapper HTML. Faithful to classic ASP.NET Repeater with HeaderTemplate, ItemTemplate, AlternatingItemTemplate, SeparatorTemplate, and FooterTemplate.',
    features: [
      'Zero default markup or wrappers',
      'Item and AlternatingItem templating',
      'SeparatorTemplate support',
      'ItemDataBound and ItemCreated event lifecycles',
      'Command propagation via ItemCommand',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'dataSource', type: 'any[]', defaultValue: '[]', description: 'Array of data records to bind' },
      { name: 'itemTemplate', type: '(item: T, index: number) => ReactNode', defaultValue: '-', description: 'Renderer for data items' },
      { name: 'headerTemplate', type: '() => ReactNode', defaultValue: '-', description: 'Renderer for header block' },
      { name: 'footerTemplate', type: '() => ReactNode', defaultValue: '-', description: 'Renderer for footer block' },
    ],
    events: [
      { name: 'itemCreated', arguments: 'RepeaterItemEventArgs', cancellable: false, description: 'Fired when a repeater item is instantiated' },
      { name: 'itemDataBound', arguments: 'RepeaterItemEventArgs', cancellable: false, description: 'Fired when data is bound to an item' },
      { name: 'itemCommand', arguments: 'RepeaterCommandEventArgs', cancellable: false, description: 'Fired when a button command within an item is executed' },
    ],
    methods: [
      { name: 'dataBind', signature: 'dataBind(): Promise<void>', returnType: 'Promise<void>', description: 'Binds current data source to items collection' },
    ],
    codeSamples: {
      react: `import { useEffect } from "react";
import { RepeaterController } from "@wf-controls/pro-data";
import { WebFormsRepeater } from "@wf-controls/pro-data-react";

interface Order { orderId: number; total: number }

const repeater = new RepeaterController<Order>({ id: "rptOrders", dataKeyField: "orderId" });

export function Orders({ orders }: { orders: Order[] }) {
  useEffect(() => { void repeater.dataBind(orders); }, [orders]);
  return (
    <WebFormsRepeater
      controller={repeater}
      headerTemplate={() => <h3>Recent Orders</h3>}
      itemTemplate={(order) => (
        <div className="order-card" key={order.orderId}>
          <span>{order.orderId}</span> - <strong>{order.total}</strong>
        </div>
      )}
      emptyTemplate={() => <p>No orders yet.</p>}
    />
  );
}`,
      angular: `<!-- orders.component.html : wf-repeater takes the controller and an #itemTemplate (optional #editItemTemplate) -->
<wf-repeater [controller]="repeater">
  <ng-template #itemTemplate let-order let-i="index" let-command="command">
    <div class="order-card">{{ order.orderId }} - {{ order.total }}</div>
  </ng-template>
</wf-repeater>

<!-- orders.component.ts -->
<!-- repeater = new RepeaterController<Order>({ id: "rptOrders", dataKeyField: "orderId" });
     async ngOnInit() { await this.repeater.dataBind(this.orders); } -->`,
      jquery: `$("#orderList").wfRepeater({
  dataSource: orders,
  itemTemplate: function(order) {
    return "<div class='order-card'>" + order.orderId + " - $" + order.total + "</div>";
  }
});`,
    },
    migrationNotes:
      'Drop-in replacement for `<asp:Repeater>`. `<ItemTemplate>` converts directly to React render props or Angular `<ng-template wfItem>`.',
  },
  {
    id: 'data-list',
    docs: { areaId: 'data-controls', entryId: 'datalistcontroller' },
    name: 'DataList',
    category: 'Data Controls',
    aspEquivalent: '<asp:DataList>',
    badge: 'Stable',
    edition: 'pro',
    package: '@wf-controls/pro-data',
    adapterPackages: { react: '@wf-controls/pro-data-react', angular: '@wf-controls/pro-data-angular' },
    featureId: 'data.dataList',
    tagline: 'Flow and table layout grid repeater with horizontal/vertical repeat columns.',
    description:
      'Implements multi-column layout repeaters with computed layout matrix (getLayoutMatrix), repeatColumns, repeatDirection (Horizontal/Vertical), and repeatLayout (Table/Flow). Supports EditItemTemplate and SelectedItemTemplate.',
    features: [
      'Configurable repeatColumns (e.g., 3-column or 4-column matrix)',
      'Horizontal or Vertical filling directions',
      'Table or Flow (flex/grid) rendering layouts',
      'Selection and Edit mode item switching',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'repeatColumns', type: 'number', defaultValue: '1', description: 'Number of columns across the repeat grid' },
      { name: 'repeatDirection', type: '"Horizontal" | "Vertical"', defaultValue: '"Vertical"', description: 'Direction cells are filled' },
      { name: 'repeatLayout', type: '"Table" | "Flow"', defaultValue: '"Table"', description: 'HTML table or CSS flex/grid layout' },
    ],
    events: [
      { name: 'editCommand', arguments: 'DataListCommandEventArgs', cancellable: false, description: 'Fired when Edit command is clicked' },
      { name: 'cancelCommand', arguments: 'DataListCommandEventArgs', cancellable: false, description: 'Fired when Cancel is clicked' },
    ],
    methods: [
      { name: 'getLayoutMatrix', signature: 'getLayoutMatrix(): (DataListItem<T> | null)[][]', returnType: '(DataListItem<T> | null)[][]', description: 'Returns the 2D layout of items for repeatColumns / repeatDirection (null pads empty cells)' },
    ],
    codeSamples: {
      react: `import { useEffect } from "react";
import { DataListController } from "@wf-controls/pro-data";
import { WebFormsDataList } from "@wf-controls/pro-data-react";

interface Product { id: number; name: string; price: number }

const list = new DataListController<Product>({
  id: "dlProducts",
  dataKeyField: "id",
  repeatColumns: 3,
  repeatDirection: "Horizontal",
});

export function Products({ products }: { products: Product[] }) {
  useEffect(() => { void list.dataBind(products); }, [products]);
  return (
    <WebFormsDataList
      controller={list}
      itemTemplate={(p) => (
        <div className="product-tile">
          <h4>{p.name}</h4>
          <p>{p.price}</p>
        </div>
      )}
    />
  );
}`,
      angular: `// product-list.component.ts
import { Component, OnInit } from "@angular/core";
import { DataListController } from "@wf-controls/pro-data";
import { WebFormsDataListComponent } from "@wf-controls/pro-data-angular";

interface Product { id: number; name: string; price: number }

@Component({
  selector: "app-product-list",
  standalone: true,
  imports: [WebFormsDataListComponent],
  template: \`
    <wf-data-list [controller]="list">
      <ng-template #itemTemplate let-p>
        <div class="product-tile"><h4>{{ p.name }}</h4><p>{{ p.price }}</p></div>
      </ng-template>
      <ng-template #emptyTemplate><em>No products.</em></ng-template>
    </wf-data-list>\`,
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  list = new DataListController<Product>({ id: "dlProducts", dataKeyField: "id", repeatColumns: 3, repeatDirection: "Horizontal" });
  async ngOnInit() { await this.list.dataBind(this.products); }
}`,
      jquery: `$("#productList").wfDataList({
  dataSource: products,
  repeatColumns: 3,
  repeatDirection: "Horizontal",
  itemTemplate: (p) => "<div class='product-tile'>" + p.name + "</div>"
});`,
    },
    migrationNotes: 'Replaces `<asp:DataList>` with full repeat direction and matrix support without obsolete HTML table formatting hacks.',
  },
  {
    id: 'menu',
    docs: { areaId: 'navigation', entryId: 'menu' },
    name: 'Menu',
    category: 'Navigation',
    aspEquivalent: '<asp:Menu>',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    adapterPackages: { react: '@wf-controls/react', angular: '@wf-controls/angular' },
    tagline: 'Hierarchical navigation menu with static and dynamic flyout levels.',
    description:
      'Implements multi-level navigation hierarchies supporting horizontal and vertical orientations, static display depth, and dynamic hover/click flyout menus. Seamlessly binds to SiteMapDataSource.',
    features: [
      'Horizontal and Vertical orientation support',
      'StaticDisplayLevels and MaximumDynamicDisplayLevels',
      'Binds to hierarchical SiteMapDataSource or JSON objects',
      'Keyboard navigation (Arrow keys, Escape, Enter)',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'orientation', type: '"Horizontal" | "Vertical"', defaultValue: '"Horizontal"', description: 'Menu layout direction' },
      { name: 'staticDisplayLevels', type: 'number', defaultValue: '1', description: 'Number of levels shown statically without flyout' },
      { name: 'items', type: 'MenuItem[]', defaultValue: '[]', description: 'Hierarchical array of menu items' },
    ],
    events: [
      { name: 'menuItemClick', arguments: 'MenuEventArgs', cancellable: true, description: 'Fired when a menu item is clicked' },
    ],
    methods: [
      { name: 'findItem', signature: 'findItem(valuePath: string): MenuItem | undefined', returnType: 'MenuItem | undefined', description: 'Locates menu item by value path' },
    ],
    codeSamples: {
      react: `import { NavigationMenu } from "@wf-controls/react";

// Props-driven: top-level items only (no flyouts yet), orientation is lower-case.
<NavigationMenu
  items={[
    { text: "Home", navigateUrl: "/" },
    { text: "Reports", navigateUrl: "/reports" },
  ]}
  orientation="horizontal"
  onItemClick={(item) => console.log("Navigating to", item.navigateUrl)}
/>`,
      angular: `// main-nav.component.ts
import { Component, OnInit } from "@angular/core";
import { MenuController } from "@wf-controls/core";
import { WebFormsMenuComponent } from "@wf-controls/angular";

@Component({
  selector: "app-main-nav",
  standalone: true,
  imports: [WebFormsMenuComponent],
  // Flyouts open on hover, click and arrow keys; itemClick fires after menuItemClick was not cancelled.
  template: \`<wf-menu [controller]="menu" (itemClick)="onPick($event)" />\`,
})
export class MainNavComponent implements OnInit {
  menu = new MenuController({
    id: "mainNav",
    orientation: "Horizontal",
    items: [
      { text: "Home", navigateUrl: "/" },
      { text: "Reports", navigateUrl: "/reports", childItems: [{ text: "Sales", navigateUrl: "/reports/sales" }] },
    ],
  });
  async ngOnInit() { await this.menu.dataBind(); }
  onPick(item: { text: string }) { console.log("Picked", item.text); }
}`,
      jquery: `$("#mainNav").wfMenu({ items: siteMapItems, orientation: "Horizontal" });`,
    },
    migrationNotes: 'Modern replacement for `<asp:Menu>` with clean responsive CSS flyouts instead of legacy iframe shims.',
  },
  {
    id: 'tree-view',
    docs: { areaId: 'navigation', entryId: 'treeview' },
    name: 'TreeView',
    category: 'Navigation',
    aspEquivalent: '<asp:TreeView>',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    adapterPackages: { react: '@wf-controls/react', angular: '@wf-controls/angular' },
    tagline: 'Collapsible hierarchical tree with checkboxes, expand/collapse, and node selection.',
    description:
      'Rich hierarchical tree view supporting expand/collapse state machines, tri-state checkboxes, deep node filtering, and full keyboard accessibility. Binds to SiteMapDataSource or nested objects.',
    features: [
      'Expand/collapse with animate transition',
      'ShowCheckBoxes (None, Root, Parent, Leaf, All)',
      'SelectedNode tracking and SelectedNodeChanged event',
      'Binds directly to SiteMapDataSource',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'showCheckBoxes', type: '"None" | "All" | "Leaf"', defaultValue: '"None"', description: 'Enables node selection checkboxes' },
      { name: 'expandDepth', type: 'number', defaultValue: '-1', description: 'Initial depth to expand nodes automatically' },
    ],
    events: [
      { name: 'selectedNodeChanged', arguments: 'TreeNodeEventArgs', cancellable: false, description: 'Fired when user clicks a node' },
      { name: 'nodeCheckChanged', arguments: 'TreeNodeEventArgs', cancellable: false, description: 'Fired when checkbox state changes' },
    ],
    methods: [
      { name: 'expandAll', signature: 'expandAll(): void', returnType: 'void', description: 'Expands all tree nodes' },
      { name: 'collapseAll', signature: 'collapseAll(): void', returnType: 'void', description: 'Collapses all tree nodes' },
    ],
    codeSamples: {
      react: `import { TreeView } from "@wf-controls/react";

// Props-driven: nodes are { text, value?, navigateUrl?, expanded?, children? }
<TreeView
  nodes={[
    { text: "Dashboard", expanded: true, children: [{ text: "Analytics Overview" }, { text: "Reports" }] },
    { text: "Settings" },
  ]}
  onNodeClick={(node) => setSelected(node.text)}
  onNodeToggle={(node, expanded) => console.log(node.text, expanded)}
/>`,
      angular: `// site-tree.component.ts
import { Component, OnInit } from "@angular/core";
import { TreeViewController } from "@wf-controls/core";
import { WebFormsTreeViewComponent } from "@wf-controls/angular";

@Component({
  selector: "app-site-tree",
  standalone: true,
  imports: [WebFormsTreeViewComponent],
  template: \`<wf-tree-view [controller]="tree" ariaLabel="Site tree" />\`,
})
export class SiteTreeComponent implements OnInit {
  tree = new TreeViewController({
    id: "tvSite",
    nodes: [{ text: "Dashboard", childNodes: [{ text: "Analytics Overview" }] }],
  });
  async ngOnInit() { await this.tree.dataBind(); }
}`,
      jquery: `$("#categoryTree").wfTreeView({ nodes: siteHierarchy, showCheckBoxes: "All" });`,
    },
    migrationNotes: 'Replaces `<asp:TreeView>` without images or postback form submits.',
  },
  {
    id: 'validator-manager',
    docs: { areaId: 'validation', entryId: 'validatormanager' },
    name: 'ValidatorManager',
    category: 'Input & Validation',
    aspEquivalent: 'Page_IsValid & Validators',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    tagline: 'Central validation coordinator simulating ASP.NET Page_IsValid and ValidationGroups.',
    description:
      'Coordinating brain for form validation across client and asynchronous server callbacks. Groups validators into ValidationGroups, validates individual controls, and simulates Page_IsValid with zero DOM dependencies.',
    features: [
      'ValidationGroup isolation',
      'Synchronous client and asynchronous server validation',
      'Integrates with RequiredFieldValidator, CompareValidator, RangeValidator, RegexValidator, and CustomValidator',
      'ValidationSummary aggregation in BulletList, List, or SingleParagraph formats',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'validationGroup', type: 'string', defaultValue: '""', description: 'Validation group to scope evaluation' },
    ],
    events: [
      { name: 'validationComplete', arguments: 'ValidationResult', cancellable: false, description: 'Fired when all validators finish evaluation' },
    ],
    methods: [
      { name: 'validate', signature: 'validate(group?: string): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Evaluates all validators in group and returns isValid' },
      { name: 'isValid', signature: 'isValid(group?: string): boolean', returnType: 'boolean', description: 'Returns boolean state of Page_IsValid' },
    ],
    codeSamples: {
      react: `import { RequiredFieldValidatorController, ValidatorManager } from "@wf-controls/core";

// ValidatorManager is STATIC: validators register themselves when constructed.
// The value of "email" is read from the element whose id is "email" (or from registerValueAccessor).
new RequiredFieldValidatorController({
  id: "rfvEmail",
  controlToValidate: "email",
  errorMessage: "Email is required.",
  validationGroup: "Checkout",
});

const isValid = await ValidatorManager.validate("Checkout");
const messages = ValidatorManager.getInvalidValidators("Checkout").map((v) => v.errorMessage);`,
      angular: `import { RequiredFieldValidatorController, ValidatorManager } from "@wf-controls/core";

// Same headless API in Angular (there is no validator component): create validators once, validate on submit.
ngOnInit() {
  new RequiredFieldValidatorController({ id: "rfvEmail", controlToValidate: "email", errorMessage: "Email is required.", validationGroup: "Checkout" });
}

async submit() {
  if (!(await ValidatorManager.validate("Checkout"))) return;
  // ... save
}`,
      jquery: `$.validatorManager.validate('Checkout');`,
    },
    migrationNotes: 'Direct modern simulation of classic ASP.NET WebForms client validation script (`WebUIValidation.js`).',
  },
  {
    id: 'modal-popup',
    docs: { areaId: 'behaviors', entryId: 'modalbehavior' },
    name: 'ModalPopup',
    category: 'AJAX & Behaviors',
    aspEquivalent: '<ajaxToolkit:ModalPopupExtender>',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    adapterPackages: { react: '@wf-controls/react', angular: '@wf-controls/angular' },
    tagline: 'AjaxControlToolkit modal dialog with OK/Cancel lifecycle and backdrop blur.',
    description:
      'Faithfully replicates AjaxControlToolkit ModalPopupExtender lifecycle. Provides OkControlId, CancelControlId, OnOk, OnCancel, and cancellable showing/hiding events with zero DOM coupling.',
    features: [
      'Ok and Cancel lifecycle routing',
      'Cancellable showing and hiding events (e.cancel = true)',
      'Esc key dismissal and backdrop click support',
      'React TSX presentation adapter <WebFormsModal />',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'isOpen', type: 'boolean', defaultValue: 'false', description: 'Visibility state of modal' },
      { name: 'title', type: 'string', defaultValue: '""', description: 'Modal dialog title' },
    ],
    events: [
      { name: 'showing', arguments: 'CancelEventArgs', cancellable: true, description: 'Fired before modal displays' },
      { name: 'ok', arguments: 'EventArgs', cancellable: false, description: 'Fired when OK button is clicked' },
      { name: 'cancel', arguments: 'EventArgs', cancellable: false, description: 'Fired when Cancel button is clicked' },
    ],
    methods: [
      { name: 'show', signature: 'show(): boolean', returnType: 'boolean', description: 'Opens the modal dialog' },
      { name: 'hide', signature: 'hide(): boolean', returnType: 'boolean', description: 'Closes the modal dialog' },
    ],
    codeSamples: {
      react: `import { useState } from "react";
import { WebFormsModal } from "@wf-controls/react";

export function ConfirmOrder() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Submit order</button>
      <WebFormsModal
        isOpen={open}
        title="Confirm Order Submission"
        okText="Confirm"
        cancelText="Cancel"
        onOk={() => { /* submitOrder(); */ setOpen(false); }}
        onClose={() => setOpen(false)}
      >
        <p>Are you sure you want to process this order for $12,450?</p>
      </WebFormsModal>
    </>
  );
}`,
      angular: `// confirm-order.component.ts
import { Component } from "@angular/core";
import { ModalBehavior } from "@wf-controls/core";
import { WebFormsModalComponent } from "@wf-controls/angular";

@Component({
  selector: "app-confirm-order",
  standalone: true,
  imports: [WebFormsModalComponent],
  // Renders only while the behavior is open; Escape and backdrop click call handleCancel().
  template: \`
    <button type="button" (click)="modal.show()">Submit order</button>
    <wf-modal [behavior]="modal" title="Confirm Order Submission" okText="Confirm" cancelText="Cancel">
      <p>Are you sure you want to process this order for $12,450?</p>
    </wf-modal>\`,
})
export class ConfirmOrderComponent {
  modal = new ModalBehavior({ id: "mpeConfirm", onOk: () => { /* submitOrder(); */ }, onCancel: () => {} });
}`,
      jquery: `$("#orderDialog").wfModal({ okControlId: "btnOk", cancelControlId: "btnCancel" });`,
    },
    migrationNotes: 'Replaces `<ajaxToolkit:ModalPopupExtender>` without legacy Sys.Application AJAX script engine dependencies.',
  },
  {
    id: 'tabs',
    docs: { areaId: 'behaviors', entryId: 'tabscontroller' },
    name: 'Tabs',
    category: 'AJAX & Behaviors',
    aspEquivalent: '<ajaxToolkit:TabContainer>',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    adapterPackages: { react: '@wf-controls/react', angular: '@wf-controls/angular' },
    tagline: 'AjaxControlToolkit TabContainer with keyboard navigation and disabled tabs.',
    description:
      'TabsController keeps the active index and the tab list; <WebFormsTabs /> renders accessible tablist markup (role="tab", arrow keys, Home/End) that the `tb-` style sheets theme.',
    features: [
      'activeTabChanged event',
      'Disabled and hidden tabs are skipped by the keyboard',
      'Five themes via @wf-controls/styles (tb-modern, tb-dark, ...)',
      'React <WebFormsTabs /> and Angular <wf-tabs>',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'activeTabIndex', type: 'number', defaultValue: '0', description: 'Index of the open tab' },
      { name: 'tabs', type: 'TabItem[]', description: 'id, headerText, enabled, visible' },
    ],
    events: [
      { name: 'activeTabChanged', arguments: '{ activeIndex: number }', cancellable: false, description: 'Raised after the active tab changes' },
    ],
    methods: [
      { name: 'setActiveTab', signature: 'setActiveTab(index: number): void', returnType: 'void', description: 'Opens a tab' },
    ],
    codeSamples: {
      react: `import { TabsController } from "@wf-controls/core";
import { WebFormsTabs } from "@wf-controls/react";

const controller = new TabsController({
  tabs: [{ id: "overview", headerText: "Overview" }, { id: "orders", headerText: "Orders" }],
});
<WebFormsTabs
  controller={controller}
  className="tb-modern"
  tabs={[
    { id: "overview", headerText: "Overview", content: <p>Summary</p> },
    { id: "orders", headerText: "Orders", content: <p>42 open orders</p> },
  ]}
/>`,
      angular: `<wf-tabs [controller]="tabs" cssClass="tb-modern"></wf-tabs>
// tabs = new TabsController({ tabs: [{ id: "overview", headerText: "Overview" }] });
// Panel content: see the Angular book (volume 3, chapter 10).`,
      jquery: `// No plugin is shipped: use TabsController from @wf-controls/core and wrap it yourself.
const tabs = new TabsController({ tabs: [{ id: "a", headerText: "A" }] });
tabs.activeTabChanged.subscribe((_s, e) => showPanel(e.activeIndex));`,
    },
    migrationNotes: 'Replaces `<ajaxToolkit:TabContainer>` / `TabPanel`; server postbacks become the activeTabChanged event.',
  },
  {
    id: 'breadcrumb',
    docs: { areaId: 'navigation', entryId: 'sitemappath' },
    name: 'Breadcrumb (SiteMapPath)',
    category: 'Navigation',
    aspEquivalent: '<asp:SiteMapPath>',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    adapterPackages: { react: '@wf-controls/react', angular: '@wf-controls/angular' },
    tagline: 'Breadcrumb trail resolved from a site map.',
    description:
      'SiteMapPathController resolves the path to the current node from a SiteMapDataSource; <Breadcrumb /> renders the kit span markup themed by the `nv-` sheets.',
    features: [
      'Path resolved from a SiteMapDataSource',
      'pathDirection, parentLevelsDisplayed, renderCurrentNodeAsLink',
      'Five themes (nv-modern, nv-dark, ...)',
      'React <Breadcrumb /> and Angular <wf-breadcrumb>',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'pathSeparator', type: 'string', defaultValue: '" > "', description: 'Separator glyph' },
      { name: 'renderCurrentNodeAsLink', type: 'boolean', defaultValue: 'false', description: 'Make the last crumb a link' },
    ],
    events: [
      { name: 'itemClick', arguments: 'BreadcrumbItem', cancellable: false, description: 'A crumb was clicked (adapter callback)' },
    ],
    methods: [
      { name: 'dataBind', signature: 'dataBind(currentUrl: string): Promise<SiteMapPathItem[]>', returnType: 'Promise<SiteMapPathItem[]>', description: 'Resolves the crumbs for a page' },
    ],
    codeSamples: {
      react: `const path = new SiteMapPathController({ id: "path", siteMapProvider: siteMap });
const items = await path.dataBind("/products/hardware");
<Breadcrumb
  className="nv-modern"
  items={items.map((i) => ({ text: i.text, ...(i.isLink ? { url: i.url } : {}) }))}
/>`,
      angular: `<wf-breadcrumb [controller]="path" [currentUrl]="url" cssClass="nv-modern"
               (itemClick)="go($event)"></wf-breadcrumb>`,
      jquery: `// No plugin is shipped: call path.dataBind(url) and render the items yourself.
const items = await path.dataBind(location.pathname);`,
    },
    migrationNotes: 'Replaces `<asp:SiteMapPath>`; the provider is a SiteMapDataSource, not web.sitemap.',
  },
  {
    id: 'login',
    docs: { areaId: 'security', entryId: 'logincontroller' },
    name: 'Login & Account',
    category: 'Login & Security',
    aspEquivalent: '<asp:Login> / LoginView / LoginStatus / LoginName',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    adapterPackages: { react: '@wf-controls/react', angular: '@wf-controls/angular' },
    tagline: 'Sign-in form, status link, user name and role-based content on one membership provider.',
    description:
      'LoginController, LoginStatusController, LoginNameController and LoginViewController share an IMembershipProvider through SecurityManager. The React adapters emit the markup the `lg-` sheets target.',
    features: [
      'Cancellable loggingIn / loggingOut events',
      'Role-based LoginView templates',
      'ChangePassword, PasswordRecovery and CreateUserWizard adapters too',
      'Five themes (lg-modern, lg-dark, ...)',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'displayRememberMe', type: 'boolean', defaultValue: 'true', description: 'Show the Remember me checkbox' },
    ],
    events: [
      { name: 'loggingIn', arguments: 'CancelEventArgs', cancellable: true, description: 'Before the provider is called' },
      { name: 'loggedIn', arguments: 'IUser', cancellable: false, description: 'Sign-in succeeded' },
    ],
    methods: [
      { name: 'login', signature: 'login(): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Signs in with the current user name and password' },
    ],
    codeSamples: {
      react: `SecurityManager.setProvider(new InMemoryAuthProvider({ users: [...] })); // demo provider only
const login = new LoginController({ displayRememberMe: true });
<WebFormsLogin controller={login} className="lg-modern" onLoggedIn={(u) => go(u)} />`,
      angular: `<wf-login [controller]="login" cssClass="lg-modern" (loggedIn)="go($event)"></wf-login>`,
      jquery: `// No plugin is shipped: drive LoginController from your own form.
login.setUserName(name); login.setPassword(pw); await login.login();`,
    },
    migrationNotes: 'The in-memory provider keeps plain-text passwords: implement IMembershipProvider against your server.',
  },

];

/** Every control shown in the gallery: the original set plus the edition-aware additions (data sources, DualList, SqlWhereBuilder, auth, ...). */
export const controlsRegistry: ControlDefinition[] = [...baseControls, ...editionControls];

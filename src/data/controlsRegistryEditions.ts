// Edition-aware additions to the controls registry: the controls that the original gallery did not list.
// Free: DataGrid, SqlDataSource, Calendar.  Pro: ObjectDataSource, DualList.  Enterprise: SqlWhereBuilder, Authentication & Authorization.
// Every member below was read from the package source (packages/*/src); docs links point at the generated API docs.
import { ControlDefinition } from '../types/gallery';

const PRO_NOTE = `// Pro package: needs a license key. Without one it runs in evaluation mode (first 10 rows, editing blocked).
// npm install @wf-controls/pro-data @wf-controls/license
import { License } from "@wf-controls/license";
License.configure({ publicKeys: [PUBLIC_KEY_JWK] });
await License.activate(token);`;

export const editionControls: ControlDefinition[] = [
  // ------------------------------------------------------------------------------------------------ FREE
  {
    id: 'data-grid',
    docs: { areaId: 'data-controls', entryId: 'datagridcontroller' },
    name: 'DataGrid',
    category: 'Data Controls',
    aspEquivalent: 'System.Web.UI.WebControls.DataGrid',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    tagline: 'The classic command-oriented grid: Edit / Update / Cancel / Delete commands, paging and sorting. Free and MIT.',
    description:
      'DataGridController is the ASP.NET DataGrid-style controller and is part of the free core. It binds arrays, a DataTable, a DataView or any data source, can auto-generate columns, and raises the DataGrid event set (itemCommand, editCommand, updateCommand, cancelCommand, deleteCommand, sortCommand, pageIndexChanged). There is no React or Angular component for it: you render the state yourself. For a ready-made component use the Pro GridView.',
    features: [
      'Auto-generated or explicit bound / button / hyperlink / template columns',
      'Paging and sorting with cancellable events',
      'In-place edit, update, cancel and delete commands',
      'Binds arrays, DataTable, DataView or a data source',
      'Headless: you render the table with your own template',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'id', type: 'string', defaultValue: '-', description: 'Control id (required)' },
      { name: 'dataKeyField', type: 'keyof T', defaultValue: '-', description: 'Field that identifies a row' },
      { name: 'dataSource', type: 'T[] | DataTable | DataView | IDataSourceControl', defaultValue: '-', description: 'What to bind' },
      { name: 'autoGenerateColumns', type: 'boolean', defaultValue: 'true', description: 'Build bound columns from the first row' },
      { name: 'columns', type: 'DataGridColumn<T>[]', defaultValue: '[]', description: 'Bound, button, hyperlink or template columns' },
      { name: 'allowPaging / pageSize', type: 'boolean / number', defaultValue: 'false / 10', description: 'Paging switch and page size' },
      { name: 'allowSorting', type: 'boolean', defaultValue: 'false', description: 'Enables sortCommand' },
      { name: 'emptyText', type: 'string', defaultValue: '-', description: 'Shown when there are no rows' },
    ],
    events: [
      { name: 'itemCommand', arguments: 'DataGridCommandEventArgs<T>', cancellable: false, description: 'Any command (also Edit/Update/Cancel/Delete)' },
      { name: 'editCommand', arguments: 'DataGridCancelableCommandEventArgs<T>', cancellable: true, description: 'Before a row enters edit mode' },
      { name: 'updateCommand', arguments: 'DataGridUpdateCommandEventArgs<T>', cancellable: true, description: 'Before values are applied' },
      { name: 'cancelCommand', arguments: 'DataGridCancelableCommandEventArgs<T>', cancellable: true, description: 'Before edit mode is left' },
      { name: 'deleteCommand', arguments: 'DataGridCancelableCommandEventArgs<T>', cancellable: true, description: 'Before a row is removed' },
      { name: 'sortCommand', arguments: 'DataGridSortEventArgs', cancellable: true, description: 'Before sorting' },
      { name: 'pageIndexChanged', arguments: 'DataGridPageEventArgs', cancellable: true, description: 'Before the page changes' },
    ],
    methods: [
      { name: 'dataBind', signature: 'dataBind(source?): Promise<void>', returnType: 'Promise<void>', description: 'Binds (or re-binds) the data source' },
      { name: 'changePage', signature: 'changePage(newPageIndex: number): Promise<boolean>', returnType: 'Promise<boolean>', description: 'false if a handler cancelled' },
      { name: 'sort', signature: 'sort(sortExpression: string, direction?): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Sorts and re-binds' },
      { name: 'beginEdit / cancelEdit', signature: 'beginEdit(itemIndex): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Enter / leave edit mode' },
      { name: 'updateItem', signature: 'updateItem(itemIndex, values): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Apply edited values' },
      { name: 'deleteItem', signature: 'deleteItem(itemIndex): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Remove a row' },
      { name: 'executeCommand', signature: 'executeCommand(itemIndex, commandName, arg?): Promise<void>', returnType: 'Promise<void>', description: 'Routes a command like the ASP.NET ItemCommand' },
    ],
    codeSamples: {
      react: `// Free: @wf-controls/core only. There is no <DataGrid> component: re-render when stateChanged fires.
import { useEffect, useMemo, useState } from "react";
import { DataGridController } from "@wf-controls/core";

export function PeopleGrid() {
  const grid = useMemo(() => new DataGridController<{ id: number; name: string }>({
    id: "dgPeople", dataKeyField: "id", autoGenerateColumns: true, allowPaging: true, pageSize: 5,
    dataSource: [{ id: 1, name: "Ann" }, { id: 2, name: "Bob" }],
  }), []);
  const [, tick] = useState(0);
  useEffect(() => {
    void grid.dataBind();
    return grid.stateChanged.subscribe(() => tick((n) => n + 1));
  }, [grid]);
  return <table><tbody>{grid.visibleItems.map((r) => <tr key={r.id}><td>{r.name}</td></tr>)}</tbody></table>;
}`,
      angular: `// Free: bridge the controller to a signal with the viewModel helper from @wf-controls/angular.
import { Component } from "@angular/core";
import { DataGridController } from "@wf-controls/core";
import { viewModel } from "@wf-controls/angular";

@Component({ standalone: true, selector: "app-people", template: \`
  <table><tbody>@for (r of vm().rows; track r.id) { <tr><td>{{ r.name }}</td></tr> }</tbody></table>\` })
export class PeopleComponent {
  grid = new DataGridController<{ id: number; name: string }>({ id: "dg", dataKeyField: "id", dataSource: [{ id: 1, name: "Ann" }] });
  vm = viewModel(this.grid, (g) => ({ rows: [...g.visibleItems] }));
  constructor() { void this.grid.dataBind(); }
}`,
      jquery: `// Plain JS: @wf-controls/core directly.
import { DataGridController } from "@wf-controls/core";
const grid = new DataGridController({ id: "dg", dataKeyField: "id", autoGenerateColumns: true, dataSource: people });
grid.stateChanged.subscribe(() => render(grid.visibleItems));
await grid.dataBind();`,
    },
    migrationNotes: '<asp:DataGrid> maps to DataGridController. It is free. The newer <asp:GridView> maps to the Pro GridViewController, which also has React and Angular components.',
  },

  {
    id: 'sql-data-source',
    docs: { areaId: 'data-sources', entryId: 'sqldatasource' },
    name: 'SqlDataSource',
    category: 'Data Sources',
    aspEquivalent: 'System.Web.UI.WebControls.SqlDataSource',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    tagline: 'Command text plus parameters, handed to a handler you write (your REST API). Free and MIT.',
    description:
      'In the browser there is no database, so SqlDataSource keeps the classic shape (SelectCommand, InsertCommand, UpdateCommand, DeleteCommand and parameter collections) and calls a handler with the command text and the evaluated parameters. The handler is your REST / RPC / GraphQL call. Events (selecting, selected, inserting, ...) can cancel a command, and the data source plugs into DataGrid and the Pro GridView, with server-side paging when select returns { items, total }.',
    features: [
      'SelectCommand / InsertCommand / UpdateCommand / DeleteCommand with parameter collections',
      'Parameter, ControlParameter, QueryStringParameter, SessionParameter, FormParameter',
      'Cancellable selecting / inserting / updating / deleting events and exception handling on the "-ed" events',
      'Server-side paging and sorting through select arguments',
      'Your handler decides how to call the server',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'id', type: 'string', defaultValue: '-', description: 'Control id' },
      { name: 'connectionString', type: 'string', defaultValue: '-', description: 'Passed through; a REST handler may use it as a base URL' },
      { name: 'selectCommand / insertCommand / updateCommand / deleteCommand', type: 'string', defaultValue: '-', description: 'Command text sent to the handler' },
      { name: 'selectCommandType', type: '"Text" | "StoredProcedure"', defaultValue: '"Text"', description: 'Kind of select command' },
      { name: 'selectParameters / insertParameters / updateParameters / deleteParameters', type: 'Parameter[]', defaultValue: '[]', description: 'Evaluated on each call' },
      { name: 'handler', type: 'SqlCommandHandler', defaultValue: '-', description: '(command, parameters, operation) => Promise<unknown>' },
    ],
    events: [
      { name: 'selecting', arguments: 'DataSourceSelectingEventArgs', cancellable: true, description: 'Before the select command runs' },
      { name: 'selected', arguments: 'DataSourceSelectedEventArgs', cancellable: false, description: 'After select; carries data and totalRowCount' },
      { name: 'inserting / updating / deleting', arguments: 'DataSource*ingEventArgs', cancellable: true, description: 'Before a write command runs' },
      { name: 'inserted / updated / deleted', arguments: 'DataSource*edEventArgs', cancellable: false, description: 'After a write; affectedRows, exception, exceptionHandled' },
    ],
    methods: [
      { name: 'select', signature: 'select(args?: DataSourceSelectArguments): Promise<unknown>', returnType: 'Promise<unknown>', description: 'Runs the select command' },
      { name: 'insert', signature: 'insert(values): Promise<number>', returnType: 'Promise<number>', description: 'Affected rows' },
      { name: 'update', signature: 'update(keys, values, oldValues?): Promise<number>', returnType: 'Promise<number>', description: 'Affected rows' },
      { name: 'delete', signature: 'delete(keys, oldValues?): Promise<number>', returnType: 'Promise<number>', description: 'Affected rows' },
    ],
    codeSamples: {
      react: `// Free: SqlDataSource lives in @wf-controls/core. Binding it to the Pro GridView needs @wf-controls/pro-data.
import { SqlDataSource, ControlParameter } from "@wf-controls/core";

const ds = new SqlDataSource({
  id: "sqlEmployees",
  selectCommand: "SELECT * FROM Employees WHERE Department = @department",
  selectParameters: [new ControlParameter({ name: "department", controlId: "ddlDepartment", defaultValue: "" })],
  handler: async (command, parameters, operation) => {
    const res = await fetch("/api/employees?op=" + operation, { method: "POST", body: JSON.stringify({ command, parameters }) });
    return res.json();   // rows, or { items, total } for server-side paging
  },
});
ds.parameterContext = { controls: { ddlDepartment: () => department } };
const rows = await ds.select();`,
      angular: `// Free. Same controller in an Angular service; use HttpClient inside the handler.
import { Injectable } from "@angular/core";
import { SqlDataSource } from "@wf-controls/core";

@Injectable({ providedIn: "root" })
export class EmployeesSource {
  readonly ds = new SqlDataSource({ id: "sql", selectCommand: "SELECT * FROM Employees",
    handler: async (_c, _p, op) => (await fetch("/api/employees?op=" + op)).json() });
}`,
      jquery: `// Plain JS.
import { SqlDataSource } from "@wf-controls/core";
const ds = new SqlDataSource({ id: "sql", selectCommand: "SELECT * FROM Employees", handler: async () => (await fetch("/api/employees")).json() });
ds.updating.subscribe((_s, e) => { if (!e.values.name) e.cancel = true; });`,
    },
    migrationNotes: '<asp:SqlDataSource> maps to SqlDataSource. Replace the connection string with a handler that calls your API. SelectParameters keep working through the Parameter family.',
  },

  {
    id: 'calendar',
    docs: { areaId: 'specialized', entryId: 'calendarcontroller' },
    name: 'Calendar',
    category: 'Specialized',
    aspEquivalent: 'System.Web.UI.WebControls.Calendar',
    badge: 'Stable',
    edition: 'free',
    package: '@wf-controls/core',
    tagline: 'A 6x7 month matrix with day, week and month selection and a DayRender hook. Free and MIT.',
    description:
      'CalendarController computes the month matrix (leading and trailing days, first day of week), the selection state and raises dayRender for every cell so you can add classes or markup. There is no component: you draw the table. The styles package does not cover the Calendar.',
    features: [
      'Selection modes: None, Day, DayWeek, DayWeekMonth',
      'dayRender hook: cssClass, cellText, customMarkup, isSelectable',
      'Next / previous month, set visible date, select day / week / month',
      'firstDayOfWeek, title and header options',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'visibleDate', type: 'Date', defaultValue: 'current month', description: 'Month being shown' },
      { name: 'selectedDate / selectedDates', type: 'Date / Date[]', defaultValue: '-', description: 'Current selection' },
      { name: 'selectionMode', type: '"None" | "Day" | "DayWeek" | "DayWeekMonth"', defaultValue: '"Day"', description: 'What a click selects' },
      { name: 'firstDayOfWeek', type: 'number', defaultValue: '0', description: '0 = Sunday, 1 = Monday' },
      { name: 'showNextPrevMonth / showTitle / showDayHeader / showGridLines', type: 'boolean', defaultValue: 'true', description: 'Layout switches' },
    ],
    events: [
      { name: 'dayRender', arguments: 'DayRenderEventArgs', cancellable: false, description: 'Per cell: set cssClass, cellText, customMarkup, isSelectable' },
      { name: 'selectionChanged', arguments: 'SelectionChangedEventArgs', cancellable: false, description: 'After the selection changed' },
      { name: 'visibleMonthChanged', arguments: 'MonthChangedEventArgs', cancellable: false, description: 'After next / previous / setVisibleDate' },
    ],
    methods: [
      { name: 'getDaysMatrix', signature: 'getDaysMatrix(): Promise<CalendarDay[][]>', returnType: 'Promise<CalendarDay[][]>', description: 'The 6x7 matrix (raises dayRender)' },
      { name: 'nextMonth / prevMonth', signature: 'nextMonth(): Promise<void>', returnType: 'Promise<void>', description: 'Change the visible month' },
      { name: 'selectDate / selectWeek / selectMonth', signature: 'selectDate(date: Date): Promise<boolean>', returnType: 'Promise<boolean>', description: 'false when not allowed by the mode or dayRender' },
      { name: 'clearSelection / isDateSelected', signature: 'clearSelection(): Promise<void>', returnType: 'Promise<void>', description: 'Selection helpers' },
    ],
    codeSamples: {
      react: `// Free: @wf-controls/core. Draw the matrix yourself.
import { useEffect, useMemo, useState } from "react";
import { CalendarController, type CalendarDay } from "@wf-controls/core";

export function MiniCalendar() {
  const cal = useMemo(() => new CalendarController({ selectionMode: "Day", firstDayOfWeek: 1 }), []);
  const [weeks, setWeeks] = useState<CalendarDay[][]>([]);
  useEffect(() => {
    const refresh = async () => setWeeks(await cal.getDaysMatrix());
    void refresh();
    return cal.stateChanged.subscribe(() => void refresh());
  }, [cal]);
  return <table>{weeks.map((w, i) => <tr key={i}>{w.map((d) => <td key={+d.date} onClick={() => void cal.selectDate(d.date)}>{d.date.getDate()}</td>)}</tr>)}</table>;
}`,
      angular: `// Free: the controller plus a template.
cal = new CalendarController({ selectionMode: "Day" });
weeks = signal<CalendarDay[][]>([]);
constructor() { this.cal.stateChanged.subscribe(async () => this.weeks.set(await this.cal.getDaysMatrix())); void this.cal.setVisibleDate(new Date()); }`,
      jquery: `// Plain JS.
import { CalendarController } from "@wf-controls/core";
const cal = new CalendarController({ selectionMode: "DayWeek" });
cal.dayRender.subscribe((_s, e) => { if (e.day.date.getDay() === 0) e.cssClass = "weekend"; });
const weeks = await cal.getDaysMatrix();`,
    },
    migrationNotes: '<asp:Calendar> maps to CalendarController: OnDayRender becomes dayRender, OnSelectionChanged becomes selectionChanged, OnVisibleMonthChanged becomes visibleMonthChanged.',
  },

  // ------------------------------------------------------------------------------------------------ PRO
  {
    id: 'object-data-source',
    docs: { areaId: 'data-sources', entryId: 'objectdatasource' },
    name: 'ObjectDataSource',
    category: 'Data Sources',
    aspEquivalent: 'System.Web.UI.WebControls.ObjectDataSource',
    badge: 'Stable',
    edition: 'pro',
    package: '@wf-controls/pro-data',
    featureId: 'datasource.object',
    tagline: 'Binds a controller to methods of your own service object (Select / Insert / Update / Delete methods). Pro.',
    description:
      'ObjectDataSource calls methods by name on an object you supply (TypeName / typeInstance), maps parameters to arguments and supports paging arguments (startRowIndex, maximumRows, sortExpression). It is part of the Pro package @wf-controls/pro-data. Without a license key select returns only the first 10 rows and insert / update / delete are blocked.',
    features: [
      'SelectMethod / InsertMethod / UpdateMethod / DeleteMethod by name',
      'Parameter collections mapped to method arguments',
      'EnablePaging with configurable parameter names',
      'Same events as every data source (selecting, selected, inserting, ...)',
      'Evaluation mode without a key: 10 rows, writes blocked',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'typeInstance', type: 'ObjectInstanceResolver', defaultValue: '-', description: 'Returns the service object' },
      { name: 'typeName', type: 'string', defaultValue: '-', description: 'Descriptive type name (ASP.NET TypeName)' },
      { name: 'selectMethod', type: 'string', defaultValue: '-', description: 'Method called by select (required)' },
      { name: 'insertMethod / updateMethod / deleteMethod', type: 'string', defaultValue: '-', description: 'Write methods' },
      { name: 'enablePaging', type: 'boolean', defaultValue: 'false', description: 'Pass paging arguments to the select method' },
      { name: 'startRowIndexParameterName / maximumRowsParameterName / sortParameterName', type: 'string', defaultValue: '-', description: 'Names of the paging arguments' },
    ],
    events: [
      { name: 'selecting / inserting / updating / deleting', arguments: 'DataSource*ingEventArgs', cancellable: true, description: 'Before a method is invoked' },
      { name: 'selected / inserted / updated / deleted', arguments: 'DataSource*edEventArgs', cancellable: false, description: 'After the call' },
    ],
    methods: [
      { name: 'select', signature: 'select(args?): Promise<unknown>', returnType: 'Promise<unknown>', description: 'Invokes the select method' },
      { name: 'insert / update / delete', signature: 'insert(values): Promise<number>', returnType: 'Promise<number>', description: 'Invokes the write methods; 0 when unlicensed' },
    ],
    codeSamples: {
      react: `${PRO_NOTE}

import { ObjectDataSource } from "@wf-controls/pro-data";

const service = { getAll: () => fetch("/api/people").then((r) => r.json()), add: (p: object) => fetch("/api/people", { method: "POST", body: JSON.stringify(p) }) };
const ds = new ObjectDataSource({ id: "odsPeople", typeInstance: () => service, selectMethod: "getAll", insertMethod: "add" });
const rows = await ds.select();`,
      angular: `// Pro: @wf-controls/pro-data (activate the license once at start-up, see the React tab).
import { ObjectDataSource } from "@wf-controls/pro-data";
readonly people = new ObjectDataSource({ id: "ods", typeInstance: () => this.api, selectMethod: "list" });`,
      jquery: `// Pro: import from @wf-controls/pro-data (add it and @wf-controls/license to your import map).
import { ObjectDataSource } from "@wf-controls/pro-data";
const ds = new ObjectDataSource({ id: "ods", typeInstance: () => api, selectMethod: "list" });`,
    },
    migrationNotes: '<asp:ObjectDataSource> maps to ObjectDataSource (Pro). TypeName becomes typeInstance (a resolver function). Pro license required for unrestricted use.',
  },

  {
    id: 'dual-list',
    name: 'DualList',
    category: 'Specialized',
    aspEquivalent: 'Dual list box / picker (no ASP.NET equivalent)',
    badge: 'New',
    edition: 'pro',
    package: '@wf-controls/pro-extras',
    adapterPackages: { react: '@wf-controls/pro-extras-react', angular: '@wf-controls/pro-extras-angular' },
    featureId: 'extras.dualList',
    tagline: 'Two lists: highlight items, then move them across one, many or all. Pro.',
    description:
      'DualListController holds the Available and Selected boxes, the highlighted values and raises itemsMoved. React (WebFormsDualList), Angular (wf-dual-list) and plain DOM (mountDualList) renderers are included. Without a license key it shows an "Unlicensed" label; in a trial at most 3 items can be moved into Selected and the control locks if the watermark is removed.',
    features: [
      'Available and Selected boxes with highlight, move and move-all',
      'itemsMoved event with direction and items',
      'React, Angular and plain DOM renderers',
      'Trial caps: 3 selected items; tamper lock on the trial watermark',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'id', type: 'string', defaultValue: 'generated', description: 'Control id' },
      { name: 'available / selected', type: 'DualListItem[]', defaultValue: '[]', description: 'Items { value, text } in each box' },
      { name: 'availableLabel / selectedLabel', type: 'string', defaultValue: '"Available" / "Selected"', description: 'Box captions' },
      { name: 'selectedValues', type: 'string[]', defaultValue: '-', description: 'Read-only: values in the Selected box' },
      { name: 'licensed / trial', type: 'boolean', defaultValue: '-', description: 'Read-only: license state at construction' },
    ],
    events: [
      { name: 'itemsMoved', arguments: 'DualListMovedEventArgs', cancellable: false, description: '{ direction: "toSelected" | "toAvailable", items }' },
      { name: 'stateChanged', arguments: 'DualListState', cancellable: false, description: 'After any change' },
    ],
    methods: [
      { name: 'highlight', signature: 'highlight(box, values): Promise<void>', returnType: 'Promise<void>', description: 'Mark items in "available" or "selected"' },
      { name: 'move', signature: 'move(direction, values): Promise<DualListItem[]>', returnType: 'Promise<DualListItem[]>', description: 'Items actually moved (capped in a trial)' },
      { name: 'setItems', signature: 'setItems(available, selected?): Promise<void>', returnType: 'Promise<void>', description: 'Replace both lists' },
      { name: 'getState', signature: 'getState(): DualListState', returnType: 'DualListState', description: 'Snapshot' },
    ],
    codeSamples: {
      react: `${PRO_NOTE.replace('@wf-controls/pro-data', '@wf-controls/pro-extras @wf-controls/pro-extras-react')}

import { DualListController } from "@wf-controls/pro-extras";
import { WebFormsDualList } from "@wf-controls/pro-extras-react";

const list = new DualListController({ available: [{ value: "a", text: "Alpha" }, { value: "b", text: "Beta" }] });
list.itemsMoved.subscribe((_s, e) => console.log(e.direction, e.items));
// <WebFormsDualList controller={list} />`,
      angular: `import { DualListController } from "@wf-controls/pro-extras";
import { WebFormsDualListComponent } from "@wf-controls/pro-extras-angular";
// template: <wf-dual-list [controller]="list" />
list = new DualListController({ available: [{ value: "a", text: "Alpha" }] });`,
      jquery: `import { DualListController, mountDualList } from "@wf-controls/pro-extras";
const list = new DualListController({ available: [{ value: "a", text: "Alpha" }] });
const unmount = mountDualList(document.getElementById("host"), list);`,
    },
    migrationNotes: 'No ASP.NET equivalent; it replaces the common "two ListBoxes and two buttons" pattern. Pro license required to remove the watermark and the trial caps.',
  },

  // ------------------------------------------------------------------------------------------------ ENTERPRISE
  {
    id: 'sql-where-builder',
    name: 'SqlWhereBuilder',
    category: 'Specialized',
    aspEquivalent: 'Dynamic filter / query builder (no ASP.NET equivalent)',
    badge: 'New',
    edition: 'enterprise',
    package: '@wf-controls/enterprise-extras',
    adapterPackages: { react: '@wf-controls/enterprise-extras-react', angular: '@wf-controls/enterprise-extras-angular' },
    featureId: 'extras.sqlWhereBuilder',
    tagline: 'Field / operator / value rows that produce a parameterized WHERE clause. Enterprise.',
    description:
      'SqlWhereBuilderController keeps a list of conditions and builds a parameterized WHERE clause: values are never concatenated into the SQL text, they are returned as parameters. It is an Enterprise control in @wf-controls/enterprise-extras. In evaluation mode it caps the number of conditions (2 in a trial) and shows a watermark.',
    features: [
      'Typed fields (string, number, date, boolean) with matching operators',
      'AND / OR combinator',
      'toWhereClause(): { sql, parameters } with bracket-quoted names and @p0, @p1 ... parameters',
      'React, Angular and plain DOM renderers',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'id', type: 'string', defaultValue: 'generated', description: 'Control id' },
      { name: 'fields', type: 'WhereField[]', defaultValue: '[]', description: '{ name, label?, type? }' },
      { name: 'conditions', type: 'WhereCondition[]', defaultValue: '[]', description: 'Initial rows { field, operator, value }' },
      { name: 'combinator', type: '"AND" | "OR"', defaultValue: '"AND"', description: 'How rows are combined' },
    ],
    events: [
      { name: 'stateChanged', arguments: 'readonly WhereCondition[]', cancellable: false, description: 'After conditions change' },
    ],
    methods: [
      { name: 'addCondition', signature: 'addCondition(partial?): Promise<WhereCondition | null>', returnType: 'Promise<WhereCondition | null>', description: 'null when the evaluation cap is reached' },
      { name: 'updateCondition / removeCondition / clear', signature: 'updateCondition(id, changes): Promise<boolean>', returnType: 'Promise<boolean>', description: 'Edit rows' },
      { name: 'operatorsFor', signature: 'operatorsFor(fieldName): readonly WhereOperator[]', returnType: 'WhereOperator[]', description: 'Operators valid for the field type' },
      { name: 'toWhereClause', signature: 'toWhereClause(): WhereClause', returnType: '{ sql, parameters }', description: 'Parameterized WHERE clause' },
    ],
    codeSamples: {
      react: `// Enterprise: needs an Enterprise license key.
// npm install @wf-controls/enterprise-extras @wf-controls/enterprise-extras-react @wf-controls/license
import { SqlWhereBuilderController } from "@wf-controls/enterprise-extras";
import { WebFormsSqlWhereBuilder } from "@wf-controls/enterprise-extras-react";

const builder = new SqlWhereBuilderController({
  fields: [{ name: "Name", type: "string" }, { name: "Salary", type: "number" }],
  conditions: [{ field: "Salary", operator: "greaterThan", value: "100000" }],
});
const { sql, parameters } = builder.toWhereClause();   // "[Salary] > @p0", { p0: 100000 }
// <WebFormsSqlWhereBuilder controller={builder} />`,
      angular: `import { SqlWhereBuilderController } from "@wf-controls/enterprise-extras";
import { WebFormsSqlWhereBuilderComponent } from "@wf-controls/enterprise-extras-angular";
// template: <wf-sql-where-builder [controller]="builder" />`,
      jquery: `import { SqlWhereBuilderController, mountSqlWhereBuilder } from "@wf-controls/enterprise-extras";
const builder = new SqlWhereBuilderController({ fields: [{ name: "Name", type: "string" }] });
mountSqlWhereBuilder(document.getElementById("host"), builder);`,
    },
    migrationNotes: 'No ASP.NET equivalent. Replaces hand-built filter UIs; always send the returned parameters to the server, never splice values into the SQL.',
  },

  {
    id: 'auth-authorization',
    docs: { areaId: 'security', entryId: 'authentication-and-authorization-free-in-core-forms-url-authorization-in-enterprise-security' },
    name: 'Authentication & Authorization',
    category: 'Login & Security',
    aspEquivalent: 'FormsAuthentication, IPrincipal, <authorization> / <location>, Roles',
    badge: 'New',
    edition: 'enterprise',
    package: '@wf-controls/enterprise-security',
    adapterPackages: { react: '@wf-controls/enterprise-security-react', angular: '@wf-controls/enterprise-security-angular' },
    featureId: 'security.auth',
    tagline: 'Forms tickets with ReturnUrl, <authorization> rules, Windows / SSO / JWT identities and route guards. Enterprise.',
    description:
      'The free core already has Membership, principals, basic roles and PasswordPolicy. The Enterprise package adds FormsAuthentication (ticket, sliding expiry, Remember me, a safe ReturnUrl redirect), UrlAuthorization (allow / deny rules with * ? @, roles, verbs and <location> overrides), identities reported by a server (Windows, Kerberos, SSO, JWT) and a REST membership provider, plus React (usePrincipal, AuthorizeView, RequireAuth) and Angular (WebFormsAuthService, *wfAuthorize, canActivatePath) helpers. Client-side checks are UX only: enforce the same rules on the server. Without a license key tickets last 5 minutes and are never persistent.',
    features: [
      'FormsAuthentication: ticket, sliding expiration, persistent ticket, cancellable authenticating event',
      'ReturnUrl redirect that only accepts same-site relative paths (open-redirect guard)',
      'UrlAuthorization: first match wins, most specific <location> first, roles, users, verbs',
      'CurrentPrincipal (HttpContext.User) restored from the ticket after a reload',
      'Windows / SSO / JWT identities reported by your server (JWT decoded, not verified)',
    ],
    supportedFrameworks: ['react', 'angular', 'jquery'],
    props: [
      { name: 'loginUrl / defaultUrl', type: 'string', defaultValue: '"/login" / "/"', description: 'FormsAuthentication.configure()' },
      { name: 'timeoutMinutes / slidingExpiration', type: 'number / boolean', defaultValue: '30 / true', description: 'Session lifetime; renewed after half has elapsed' },
      { name: 'persistentTimeoutMinutes', type: 'number', defaultValue: '43200', description: 'Remember me lifetime (30 days)' },
      { name: 'returnUrlParameter / cookieName', type: 'string', defaultValue: '"ReturnUrl" / ".WFAUTH"', description: 'Query parameter and storage key' },
      { name: 'storage', type: 'IAuthStorage', defaultValue: 'memory', description: 'Where the ticket lives (pass a sessionStorage adapter)' },
    ],
    events: [
      { name: 'authenticating', arguments: 'FormsAuthEventArgs', cancellable: true, description: 'Before a ticket is issued' },
      { name: 'authenticated', arguments: 'FormsAuthenticationTicket', cancellable: false, description: 'After the ticket is stored' },
      { name: 'signedOut', arguments: 'FormsSignedOutEventArgs', cancellable: false, description: 'After sign-out' },
    ],
    methods: [
      { name: 'setAuthCookie', signature: 'setAuthCookie(user, persistent?, userData?, roles?): Promise<boolean>', returnType: 'Promise<boolean>', description: 'false when a handler cancelled' },
      { name: 'redirectFromLoginPage', signature: 'redirectFromLoginPage(user, persistent?, returnUrl?, roles?): Promise<string | null>', returnType: 'Promise<string | null>', description: 'Issue ticket, then onRedirect(ReturnUrl or defaultUrl)' },
      { name: 'redirectToLoginPage', signature: 'redirectToLoginPage(currentUrl?): string', returnType: 'string', description: '/login?ReturnUrl=...' },
      { name: 'getTicket / signOut', signature: 'getTicket(): FormsAuthenticationTicket | null', returnType: 'FormsAuthenticationTicket | null', description: 'Read or clear the session' },
      { name: 'UrlAuthorization.checkUrlAccess', signature: 'checkUrlAccess(path, principal, verb?): boolean', returnType: 'boolean', description: 'allow / deny decision for a path' },
    ],
    codeSamples: {
      react: `// Enterprise: npm install @wf-controls/enterprise-security @wf-controls/enterprise-security-react @wf-controls/license
import { FormsAuthentication } from "@wf-controls/enterprise-security";
import { RequireAuth, AuthorizeView, usePrincipal } from "@wf-controls/enterprise-security-react";

FormsAuthentication.configure({ loginUrl: "/login", defaultUrl: "/home" });
FormsAuthentication.storage = { get: (k) => sessionStorage.getItem(k), set: (k, v) => sessionStorage.setItem(k, v), remove: (k) => sessionStorage.removeItem(k) };

const authorization = { rules: [{ action: "allow", users: ["*"] }],
  locations: [{ path: "/admin", rules: [{ action: "allow", roles: ["Admins"] }, { action: "deny", users: ["*"] }] }] };

<RequireAuth authorization={authorization} path="/admin" fallback={<p>Access denied</p>}><AdminPage /></RequireAuth>
<AuthorizeView roles={["Admins"]}><DeleteButton /></AuthorizeView>`,
      angular: `import { WebFormsAuthService, WfAuthorizeDirective, canActivatePath } from "@wf-controls/enterprise-security-angular";
// template: <button *wfAuthorize="{ roles: ['Admins'] }">Delete</button>
export const authGuard: CanActivateFn = (_r, state) =>
  canActivatePath(inject(WebFormsAuthService), state.url, authorization) || inject(Router).createUrlTree(["/login"], { queryParams: { ReturnUrl: state.url } });`,
      jquery: `import { CurrentPrincipal } from "@wf-controls/core";
import { FormsAuthentication, UrlAuthorization } from "@wf-controls/enterprise-security";
const authz = new UrlAuthorization(authorization);
if (!authz.checkUrlAccess("/admin", CurrentPrincipal.current)) FormsAuthentication.redirectToLoginPage("/admin");`,
    },
    migrationNotes: 'FormsAuthentication.SetAuthCookie / RedirectFromLoginPage map to the same names; web.config <authorization> and <location> map to AuthorizationConfig. Windows / Kerberos authentication happens on your server: call a "who am I" endpoint and pass the result to OidcPrincipalFactory.fromWindowsIdentity.',
  },
];

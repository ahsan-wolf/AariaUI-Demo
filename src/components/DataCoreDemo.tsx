import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DataColumn, DataRelation, DataSet, DataTable, DataView, type DataRow } from '@wf-controls/core';
import { GridViewController } from '@wf-controls/pro-data';
import { CodeSnippetViewer } from './CodeSnippetViewer';

/**
 * Live, interactive demos of the in-memory ADO.NET layer and of data binding.
 * The data library has no change events, so every mutation below bumps a counter and re-renders: the same
 * "re-bind after you change the data" pattern the documentation describes.
 */
export type DataCoreMode = 'table' | 'set' | 'binding';

interface Product { id: number; name: string; category: string; price: number; stock: number }

const SEED: Omit<Product, 'id'>[] = [
  { name: 'Hammer', category: 'Tools', price: 12.5, stock: 40 },
  { name: 'Cordless drill', category: 'Tools', price: 89, stock: 12 },
  { name: 'Safety goggles', category: 'Safety', price: 7.25, stock: 120 },
  { name: 'Work gloves', category: 'Safety', price: 15, stock: 75 },
  { name: 'Tape measure', category: 'Tools', price: 9.9, stock: 60 },
  { name: 'Ladder 6ft', category: 'Equipment', price: 64, stock: 8 },
  { name: 'Paint roller', category: 'Equipment', price: 11.2, stock: 33 },
];
const EXTRA_NAMES = ['Wrench', 'Screwdriver set', 'Level', 'Utility knife', 'Extension cord', 'Hard hat'];

function createProductTable(): DataTable {
  const t = new DataTable('Products');
  const id = t.columns.add(new DataColumn({ columnName: 'id', dataType: 'number', autoIncrement: true }));
  t.columns.add('name', 'string');
  t.columns.add('category', 'string');
  t.columns.add('price', 'number');
  t.columns.add('stock', 'number');
  t.primaryKey = [id];
  for (const p of SEED) t.rows.add(p);
  t.acceptChanges();
  return t;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function useRefresh(): () => void {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  return bump;
}

// ---------------------------------------------------------------------------------------------------------------------
// Mode 1: DataTable + DataView
// ---------------------------------------------------------------------------------------------------------------------
const TableDemo: React.FC = () => {
  const table = useRef<DataTable>(createProductTable()).current;
  const view = useMemo(() => new DataView(table), [table]);
  const refresh = useRefresh();
  const [filter, setFilter] = useState('price > 10');
  const [sort, setSort] = useState('price DESC');
  const [error, setError] = useState('');
  const nextName = useRef(0);

  const guard = (action: () => void) => {
    try { action(); setError(''); } catch (e) { setError(msg(e)); }
    refresh();
  };

  view.rowFilter = filter.trim() || null;
  view.sort = sort || null;
  let viewRows: Record<string, unknown>[] = [];
  let viewError = '';
  try { viewRows = view.toObjects(); } catch (e) { viewError = msg(e); }

  const allRows = table.rows.toArray(true); // true: include rows marked Deleted

  const snippet = [
    'const view = new DataView(table);',
    `view.rowFilter = ${filter.trim() ? JSON.stringify(filter.trim()) : 'null'};`,
    `view.sort = ${sort ? JSON.stringify(sort) : 'null'};`,
    viewError ? `// error: ${viewError}` : `view.toObjects();   // ${viewRows.length} row(s)`,
  ].join('\n');

  return (
    <div className="aa-dc">
      <div className="aa-dc-row">
        <section className="aa-dc-panel" style={{ flexBasis: '520px' }}>
          <h4>DataTable &ldquo;Products&rdquo; <small>{table.rows.count} rows &bull; {table.rows.totalCount} incl. deleted</small></h4>
          <div className="aa-dc-body">
            <div className="aa-dc-toolbar">
              <button className="aa-dc-btn primary" onClick={() => guard(() => {
                const name = EXTRA_NAMES[nextName.current++ % EXTRA_NAMES.length]!;
                table.rows.add({ name, category: 'Tools', price: Math.round(Math.random() * 90 + 5), stock: Math.round(Math.random() * 50) });
              })}>+ rows.add()</button>
              <button className="aa-dc-btn" onClick={() => guard(() => table.acceptChanges())}>acceptChanges()</button>
              <button className="aa-dc-btn" onClick={() => guard(() => table.rejectChanges())}>rejectChanges()</button>
            </div>
            <table className="aa-dc-table">
              <thead><tr><th>id</th><th>name</th><th>price</th><th>stock</th><th>rowState</th><th /></tr></thead>
              <tbody>
                {allRows.map((row) => <ProductRow key={String(row.item('id'))} row={row} guard={guard} />)}
              </tbody>
            </table>
            <p className="aa-dc-hint">
              Edit a cell: the row becomes <b>Modified</b> and keeps its <code>Original</code> value. <code>delete()</code> only
              marks a row <b>Deleted</b>; <code>acceptChanges()</code> removes it for good.
            </p>
            {error && <p className="aa-dc-error">{error}</p>}
          </div>
        </section>

        <section className="aa-dc-panel">
          <h4>DataView <small>{viewError ? 'error' : `${viewRows.length} row(s)`}</small></h4>
          <div className="aa-dc-body">
            <div className="aa-dc-toolbar">
              <input className="wide" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="rowFilter, e.g. price > 10 AND category = 'Tools'" aria-label="Row filter expression" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort expression">
                <option value="">no sort</option>
                <option value="price DESC">price DESC</option>
                <option value="price ASC">price ASC</option>
                <option value="name ASC">name ASC</option>
                <option value="category ASC, price DESC">category ASC, price DESC</option>
              </select>
            </div>
            {viewError ? <p className="aa-dc-error">{viewError}</p> : (
              <table className="aa-dc-table">
                <thead><tr><th>id</th><th>name</th><th>category</th><th>price</th></tr></thead>
                <tbody>
                  {viewRows.map((r) => (
                    <tr key={String(r.id)}><td>{String(r.id)}</td><td>{String(r.name)}</td><td>{String(r.category)}</td><td>{String(r.price)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="aa-dc-hint">Filter grammar: <code>field op literal</code> joined by <code>AND</code> / <code>OR</code>. For anything richer assign a predicate function.</p>
          </div>
        </section>
      </div>

      <CodeSnippetViewer code={snippet} language="typescript" title="What this view is doing" />
    </div>
  );
};

const ProductRow: React.FC<{ row: DataRow; guard: (a: () => void) => void }> = ({ row, guard }) => {
  const deleted = row.rowState === 'Deleted';
  const edited = (col: string) => !deleted && row.hasVersion('Original') && row.item(col, 'Original') !== row.item(col);
  const cell = (col: 'name' | 'price' | 'stock') => (
    <td>
      <input
        value={String(row.item(col) ?? '')}
        disabled={deleted}
        aria-label={`${col} of row ${String(row.item('id'))}`}
        onChange={(e) => guard(() => row.setItem(col, col === 'name' ? e.target.value : e.target.value === '' ? null : Number(e.target.value)))}
      />
      {edited(col) && <span className="aa-dc-orig">was {String(row.item(col, 'Original'))}</span>}
    </td>
  );
  return (
    <tr className={deleted ? 'deleted' : ''}>
      <td>{String(row.item('id'))}</td>
      {cell('name')}{cell('price')}{cell('stock')}
      <td><span className={`aa-dc-state ${row.rowState}`}>{row.rowState}</span></td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {!deleted && <button className="aa-dc-btn danger" onClick={() => guard(() => row.delete())}>delete()</button>}
        {(deleted || row.rowState === 'Modified') && <button className="aa-dc-btn" onClick={() => guard(() => row.rejectChanges())}>undo</button>}
      </td>
    </tr>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Mode 2: DataSet + DataRelation (master / detail) and serialization
// ---------------------------------------------------------------------------------------------------------------------
function createShop() {
  const ds = new DataSet('Shop');
  const customers = new DataTable('Customers');
  customers.columns.add(new DataColumn({ columnName: 'id', dataType: 'number', autoIncrement: true }));
  customers.columns.add('name', 'string');
  customers.columns.add('city', 'string');
  customers.primaryKey = [customers.columns.get('id')!];
  const orders = new DataTable('Orders');
  orders.columns.add(new DataColumn({ columnName: 'id', dataType: 'number', autoIncrement: true }));
  orders.columns.add('customerId', 'number');
  orders.columns.add('item', 'string');
  orders.columns.add('total', 'number');
  ds.tables.add(customers);
  ds.tables.add(orders);
  for (const c of [{ name: 'Contoso', city: 'Seattle' }, { name: 'Fabrikam', city: 'Lahore' }, { name: 'Northwind', city: 'London' }]) customers.rows.add(c);
  for (const o of [
    { customerId: 1, item: 'Standing desk', total: 480 }, { customerId: 1, item: 'Monitor arm', total: 95 },
    { customerId: 2, item: 'Server rack', total: 1250 }, { customerId: 3, item: 'Keyboard', total: 60 }, { customerId: 3, item: 'Headset', total: 140 },
  ]) orders.rows.add(o);
  const relation = new DataRelation('CustomerOrders', customers, orders, 'id', 'customerId');
  ds.relations.push(relation);
  ds.acceptChanges();
  return { ds, customers, orders, relation };
}

const SetDemo: React.FC = () => {
  const shop = useRef(createShop()).current;
  const refresh = useRefresh();
  const [selected, setSelected] = useState(1);
  const [format, setFormat] = useState<'json' | 'xml'>('json');
  const [error, setError] = useState('');

  const parent = shop.customers.find(selected);
  const children = parent ? shop.relation.getChildRows(parent) : [];
  let serialized = '';
  try { serialized = format === 'json' ? JSON.stringify(JSON.parse(shop.ds.toJson()), null, 2) : shop.ds.toXml(); } catch (e) { serialized = msg(e); }

  const mutate = (action: () => void) => {
    try { action(); setError(''); } catch (e) { setError(msg(e)); }
    refresh();
  };

  return (
    <div className="aa-dc">
      <div className="aa-dc-row">
        <section className="aa-dc-panel">
          <h4>Customers <small>parent table</small></h4>
          <div className="aa-dc-body">
            <table className="aa-dc-table">
              <thead><tr><th>id</th><th>name</th><th>city</th></tr></thead>
              <tbody>
                {shop.customers.rows.toArray().map((c) => (
                  <tr key={String(c.item('id'))} className={c.item('id') === selected ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => setSelected(c.item('id') as number)}>
                    <td>{String(c.item('id'))}</td><td>{String(c.item('name'))}</td><td>{String(c.item('city'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="aa-dc-hint">Click a customer: <code>relation.getChildRows(parentRow)</code> returns the matching Orders.</p>
          </div>
        </section>

        <section className="aa-dc-panel">
          <h4>Orders of {parent ? String(parent.item('name')) : '…'} <small>child rows: {children.length}</small></h4>
          <div className="aa-dc-body">
            <div className="aa-dc-toolbar">
              <button className="aa-dc-btn primary" onClick={() => mutate(() => shop.orders.rows.add({ customerId: selected, item: 'New item', total: Math.round(Math.random() * 300 + 20) }))}>+ add order</button>
              <button className="aa-dc-btn" onClick={() => mutate(() => shop.ds.acceptChanges())}>ds.acceptChanges()</button>
              <button className="aa-dc-btn" onClick={() => mutate(() => shop.ds.rejectChanges())}>ds.rejectChanges()</button>
            </div>
            <table className="aa-dc-table">
              <thead><tr><th>id</th><th>item</th><th>total</th><th>state</th><th /></tr></thead>
              <tbody>
                {children.map((o) => (
                  <tr key={String(o.item('id'))}>
                    <td>{String(o.item('id'))}</td><td>{String(o.item('item'))}</td><td>{String(o.item('total'))}</td>
                    <td><span className={`aa-dc-state ${o.rowState}`}>{o.rowState}</span></td>
                    <td><button className="aa-dc-btn danger" onClick={() => mutate(() => o.delete())}>delete()</button></td>
                  </tr>
                ))}
                {children.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--aa-text-muted)' }}>No orders.</td></tr>}
              </tbody>
            </table>
            {error && <p className="aa-dc-error">{error}</p>}
          </div>
        </section>
      </div>

      <section className="aa-dc-panel">
        <h4>Serialization <small>toJson / toXml</small></h4>
        <div className="aa-dc-body">
          <div className="aa-dc-toolbar">
            <button className={`aa-dc-btn ${format === 'json' ? 'primary' : ''}`} onClick={() => setFormat('json')}>ds.toJson()</button>
            <button className={`aa-dc-btn ${format === 'xml' ? 'primary' : ''}`} onClick={() => setFormat('xml')}>ds.toXml()</button>
          </div>
          <pre className="aa-dc-code">{serialized}</pre>
          <p className="aa-dc-hint">Serialization keeps table names, columns and rows. Relations, keys, auto-increment settings and row states are <b>not</b> included.</p>
        </div>
      </section>

      <CodeSnippetViewer
        language="typescript"
        title="The relation behind this demo"
        code={`const rel = new DataRelation("CustomerOrders", customers, orders, "id", "customerId"); // columns by NAME
ds.relations.push(rel);                                                                  // relations is a plain array

const parent = customers.find(${selected});            // needs customers.primaryKey
const orders = rel.getChildRows(parent);                  // -> ${children.length} DataRow(s)`}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Mode 3: data binding with a live event log
// ---------------------------------------------------------------------------------------------------------------------
interface LogEntry { name: string; count: number; cancelled?: boolean; note?: string; open?: boolean }

/** The controller raises rowCreated then rowDataBound for EACH row; the log folds that pair into one counted line. */
const ROW_PAIR = 'rowCreated → rowDataBound (per row)';

const BindingDemo: React.FC = () => {
  const table = useRef<DataTable>(createProductTable()).current;
  const view = useMemo(() => new DataView(table), [table]);
  const refresh = useRefresh();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [persist, setPersist] = useState(true);
  const [blockDelete, setBlockDelete] = useState(false);
  const [editing, setEditing] = useState<{ index: number; price: string } | null>(null);
  // handlers read the latest toggles through refs, so the controller is created once
  const flags = useRef({ persist, blockDelete });
  flags.current = { persist, blockDelete };

  const push = (name: string, extra: Partial<LogEntry> = {}) =>
    setLog((prev) => {
      const last = prev[prev.length - 1];
      if (name === 'rowCreated') {
        if (last && last.name === ROW_PAIR && last.open === false) return [...prev.slice(0, -1), { ...last, count: last.count + 1, open: true }];
        return [...prev, { name: ROW_PAIR, count: 1, open: true }].slice(-60);
      }
      if (name === 'rowDataBound') {
        return last && last.name === ROW_PAIR ? [...prev.slice(0, -1), { ...last, open: false }] : prev;
      }
      if (last && last.name === name && !extra.cancelled && !last.cancelled) return [...prev.slice(0, -1), { ...last, count: last.count + 1 }];
      return [...prev, { name, count: 1, ...extra }].slice(-60);
    });

  const grid = useMemo(() => {
    const g = new GridViewController<Product>({
      id: 'gvProducts',
      dataKeyField: 'id',
      allowPaging: true,
      pageSize: 4,
      allowSorting: true,
      columns: [
        { type: 'bound', key: 'id', dataField: 'id', headerText: 'ID', sortable: true },
        { type: 'bound', key: 'name', dataField: 'name', headerText: 'Name', sortable: true },
        { type: 'bound', key: 'price', dataField: 'price', headerText: 'Price', sortable: true },
        { type: 'bound', key: 'stock', dataField: 'stock', headerText: 'Stock', sortable: true },
        { type: 'template', key: 'actions', headerText: '' },
      ],
      dataSource: view,
    });
    g.dataBinding.subscribe(() => push('dataBinding'));
    g.rowCreated.subscribe(() => push('rowCreated'));
    g.rowDataBound.subscribe(() => push('rowDataBound'));
    g.dataBound.subscribe(() => push('dataBound'));
    g.rowEditing.subscribe(() => push('rowEditing'));
    g.rowUpdating.subscribe((_s, e) => {
      push('rowUpdating', { note: flags.current.persist ? 'writing to the DataTable' : 'NOT persisted' });
      if (flags.current.persist) table.find(e.dataItem.id)?.setValues(e.values as Record<string, unknown>);
    });
    g.rowUpdated.subscribe(() => push('rowUpdated'));
    g.rowCancelingEdit.subscribe(() => push('rowCancelingEdit'));
    g.rowDeleting.subscribe((_s, e) => {
      if (flags.current.blockDelete) { e.cancel = true; push('rowDeleting', { cancelled: true, note: 'e.cancel = true' }); return; }
      push('rowDeleting', { note: 'marking the DataRow Deleted' });
      table.find(e.dataItem.id)?.delete();
    });
    g.rowDeleted.subscribe(() => push('rowDeleted'));
    g.pageIndexChanging.subscribe(() => push('pageIndexChanging'));
    g.pageIndexChanged.subscribe(() => push('pageIndexChanged'));
    g.sorting.subscribe((_s, e) => { push('sorting', { note: e.sortExpression }); });
    g.sorted.subscribe((_s, e) => { view.sort = `${e.sortExpression} ${e.direction.toUpperCase()}`; push('sorted', { note: `view.sort = "${view.sort}"` }); });
    g.stateChanged.subscribe((_s, e) => { push(`stateChanged`, { note: e.reason }); refresh(); });
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, view]);

  useEffect(() => { void grid.dataBind(); }, [grid]);

  const rows = grid.visibleRows;
  const sort = grid.currentSort;

  return (
    <div className="aa-dc">
      <div className="aa-dc-row">
        <section className="aa-dc-panel" style={{ flexBasis: '480px' }}>
          <h4>GridViewController <small>bound to new DataView(table)</small></h4>
          <div className="aa-dc-body">
            <table className="aa-dc-table">
              <thead>
                <tr>
                  {grid.options.columns.map((c) => c.type === 'bound'
                    ? <th key={c.key} style={{ cursor: 'pointer' }} onClick={() => void grid.sort(c.dataField)}>
                        {c.headerText}{sort?.field === c.dataField ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                      </th>
                    : <th key={c.key} />)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const abs = grid.getAbsoluteRowIndex(i);
                  const isEdit = grid.options.editIndex === abs;
                  return (
                    <tr key={r.id} className={isEdit ? 'sel' : ''}>
                      <td>{r.id}</td><td>{r.name}</td>
                      <td>{isEdit && editing ? <input value={editing.price} onChange={(e) => setEditing({ index: abs, price: e.target.value })} aria-label="price" /> : r.price}</td>
                      <td>{r.stock}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isEdit ? (
                          <>
                            <button className="aa-dc-btn primary" onClick={() => { void grid.updateRow(abs, { price: Number(editing?.price) }).then(() => { setEditing(null); return grid.dataBind(); }); }}>update</button>
                            <button className="aa-dc-btn" onClick={() => { void grid.executeCommand(abs, 'Cancel'); setEditing(null); }}>cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="aa-dc-btn" onClick={() => { void grid.executeCommand(abs, 'Edit').then(() => { if (grid.options.editIndex === abs) setEditing({ index: abs, price: String(r.price) }); }); }}>Edit</button>
                            <button className="aa-dc-btn danger" onClick={() => void grid.executeCommand(abs, 'Delete')}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="aa-dc-toolbar" style={{ marginTop: 10 }}>
              <button className="aa-dc-btn" disabled={grid.options.pageIndex === 0} onClick={() => void grid.changePage(grid.options.pageIndex - 1)}>‹ prev</button>
              <span className="aa-dc-hint" style={{ margin: 0 }}>page {grid.options.pageIndex + 1} / {Math.max(1, grid.pageCount)}</span>
              <button className="aa-dc-btn" disabled={grid.options.pageIndex >= grid.pageCount - 1} onClick={() => void grid.changePage(grid.options.pageIndex + 1)}>next ›</button>
              <button className="aa-dc-btn" onClick={() => void grid.dataBind()}>dataBind()</button>
            </div>
            <div className="aa-dc-toolbar">
              <label className="aa-dc-hint" style={{ margin: 0 }}><input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} /> persist edits to the DataTable in <code>rowUpdating</code></label>
            </div>
            <div className="aa-dc-toolbar">
              <label className="aa-dc-hint" style={{ margin: 0 }}><input type="checkbox" checked={blockDelete} onChange={(e) => setBlockDelete(e.target.checked)} /> cancel deletes (<code>e.cancel = true</code>)</label>
            </div>
            <p className="aa-dc-hint">
              Turn persistence off, edit a price, then press <code>dataBind()</code>: the grid edited its own <b>copy</b>, so the table value comes back.
            </p>
          </div>
        </section>

        <section className="aa-dc-panel">
          <h4>Event log <small>raise order</small></h4>
          <div className="aa-dc-body">
            <div className="aa-dc-toolbar"><button className="aa-dc-btn" onClick={() => setLog([])}>clear</button><button className="aa-dc-btn" onClick={() => { setLog([]); void grid.dataBind(); }}>clear + dataBind()</button></div>
            <ol className="aa-dc-log" aria-label="Event log">
              {log.map((l, i) => (
                <li key={i} className={l.cancelled ? 'cancel' : ''}><b>{l.name}</b>{l.count > 1 ? ` ×${l.count}` : ''}{l.note ? <span style={{ color: 'var(--aa-text-muted)' }}> &mdash; {l.note}</span> : null}</li>
              ))}
              {log.length === 0 && <li>Interact with the grid to see events.</li>}
            </ol>
          </div>
        </section>
      </div>

      <section className="aa-dc-panel">
        <h4>DataTable &ldquo;Products&rdquo; <small>source of truth &bull; {table.rows.count} rows</small></h4>
        <div className="aa-dc-body">
          <table className="aa-dc-table">
            <thead><tr><th>id</th><th>name</th><th>price</th><th>stock</th><th>rowState</th></tr></thead>
            <tbody>
              {table.rows.toArray(true).map((r) => (
                <tr key={String(r.item('id'))} className={r.rowState === 'Deleted' ? 'deleted' : ''}>
                  <td>{String(r.item('id'))}</td><td>{String(r.item('name'))}</td>
                  <td>{String(r.item('price'))}{r.rowState === 'Modified' && r.item('price', 'Original') !== r.item('price') && <span className="aa-dc-orig">was {String(r.item('price', 'Original'))}</span>}</td>
                  <td>{String(r.item('stock'))}</td><td><span className={`aa-dc-state ${r.rowState}`}>{r.rowState}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="aa-dc-toolbar" style={{ marginTop: 10 }}>
            <button className="aa-dc-btn" onClick={() => { table.acceptChanges(); void grid.dataBind(); }}>table.acceptChanges() + re-bind</button>
            <button className="aa-dc-btn" onClick={() => { table.rejectChanges(); void grid.dataBind(); }}>table.rejectChanges() + re-bind</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export const DataCoreDemo: React.FC<{ mode: DataCoreMode }> = ({ mode }) => {
  // Remount (fresh data) when the mode changes
  return <div key={mode}>{mode === 'table' ? <TableDemo /> : mode === 'set' ? <SetDemo /> : <BindingDemo />}</div>;
};

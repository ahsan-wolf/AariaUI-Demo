import React, { useState } from 'react';
import { mockOrders, Order } from '../data/mockData';

interface EditableOrder extends Order {
  isFlagged?: boolean;
}

export const RepeaterDemo: React.FC = () => {
  // 1- DataBinding State
  const [orders, setOrders] = useState<EditableOrder[]>(
    mockOrders.map((o) => ({ ...o, isFlagged: false }))
  );
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // 2- EditItemTemplate State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EditableOrder>>({});

  // 3- Sorting State
  const [sortField, setSortField] = useState<'orderId' | 'customer' | 'total' | 'orderDate'>('orderDate');
  const [sortAsc, setSortAsc] = useState(false);

  // 4- Paging State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(4);

  // Binding Expressions toggle
  const [showExpressions, setShowExpressions] = useState<boolean>(false);

  // Live Event Logger
  const [logs, setLogs] = useState<Array<{ id: string; time: string; event: string; detail: string }>>([
    {
      id: '1',
      time: new Date().toLocaleTimeString(),
      event: 'ItemDataBound',
      detail: `Repeater initialized and bound to ${mockOrders.length} customer order records.`,
    },
  ]);

  const addLog = (event: string, detail: string) => {
    setLogs((prev) => [
      { id: Math.random().toString(36).substring(2, 8), time: new Date().toLocaleTimeString(), event, detail },
      ...prev.slice(0, 19),
    ]);
  };

  // Filter
  const filteredOrders = orders.filter((o) =>
    statusFilter === 'All' ? true : o.status === statusFilter
  );

  // 3- Sort
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  // 4- Paging
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const pagedOrders = sortedOrders.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // 2- Edit Item Handlers
  const handleStartEdit = (ord: EditableOrder) => {
    setEditingOrderId(ord.orderId);
    setEditForm({ ...ord });
    addLog('ItemCommand', `Command: "Edit" on Order ${ord.orderId}. Activating EditItemTemplate.`);
  };

  const handleCancelEdit = () => {
    addLog('ItemCommand', `Command: "Cancel" on Order ${editingOrderId}.`);
    setEditingOrderId(null);
    setEditForm({});
  };

  const handleUpdate = () => {
    if (!editingOrderId) return;
    setOrders((prev) =>
      prev.map((o) => (o.orderId === editingOrderId ? { ...o, ...(editForm as EditableOrder) } : o))
    );
    addLog(
      'ItemCommand',
      `Command: "Update" on Order ${editingOrderId}. Updated customer: ${editForm.customer}, Total: $${editForm.total}, Status: ${editForm.status}`
    );
    setEditingOrderId(null);
    setEditForm({});
  };

  const handleDelete = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    addLog('ItemCommand', `Command: "Delete" on Order ${orderId}. Record removed from in-memory collection.`);
  };

  // 5- RowCommand / ItemCommand actions
  const handleCustomCommand = (commandName: string, orderId: string) => {
    if (commandName === 'Approve') {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: 'Shipped' } : o))
      );
      addLog('ItemCommand', `CommandName="Approve" executed for ${orderId}. Status updated to "Shipped".`);
    } else if (commandName === 'Reject') {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: 'Cancelled' } : o))
      );
      addLog('ItemCommand', `CommandName="Reject" executed for ${orderId}. Status marked "Cancelled".`);
    } else if (commandName === 'Flag') {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, isFlagged: !o.isFlagged } : o))
      );
      const isNowFlagged = !orders.find((o) => o.orderId === orderId)?.isFlagged;
      addLog('ItemCommand', `CommandName="Flag" toggled for ${orderId}. Flagged: ${isNowFlagged}`);
    }
  };

  const handleSort = (field: 'orderId' | 'customer' | 'total' | 'orderDate') => {
    const nextAsc = sortField === field ? !sortAsc : true;
    setSortField(field);
    setSortAsc(nextAsc);
    addLog('Sort', `Repeater sorted by ${field} ${nextAsc ? 'ASC' : 'DESC'}`);
  };

  // Summary calculations for FooterTemplate
  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* DevExpress-style Top Bar */}
      <div className="dx-demo-bar">
        <div className="dx-mode-group">
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-secondary)', marginRight: '6px' }}>
            Filter Status:
          </span>
          {['All', 'Shipped', 'Processing', 'Cancelled'].map((st) => (
            <button
              key={st}
              className={`dx-mode-pill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(0);
                addLog('Filtering', `Filtered by status: "${st}"`);
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`dx-action-btn ${showExpressions ? 'active' : ''}`}
            onClick={() => setShowExpressions(!showExpressions)}
          >
            {showExpressions ? 'Hide' : 'Show'} &lt;%# Eval %&gt; Expressions
          </button>
          <button
            className="dx-action-btn"
            onClick={() => {
              setOrders(mockOrders.map((o) => ({ ...o, isFlagged: false })));
              addLog('DataBind', 'Repeater reset to initial orders.');
            }}
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* Sorting bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--aa-bg-surface)',
          border: '1px solid var(--aa-border-subtle)',
          borderRadius: '8px',
          padding: '10px 16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-secondary)' }}>Sort By:</span>
          <button
            className={`aa-pager-btn ${sortField === 'customer' ? 'active' : ''}`}
            onClick={() => handleSort('customer')}
          >
            Customer {sortField === 'customer' ? (sortAsc ? '▲' : '▼') : ''}
          </button>
          <button
            className={`aa-pager-btn ${sortField === 'total' ? 'active' : ''}`}
            onClick={() => handleSort('total')}
          >
            Order Total {sortField === 'total' ? (sortAsc ? '▲' : '▼') : ''}
          </button>
          <button
            className={`aa-pager-btn ${sortField === 'orderDate' ? 'active' : ''}`}
            onClick={() => handleSort('orderDate')}
          >
            Date {sortField === 'orderDate' ? (sortAsc ? '▲' : '▼') : ''}
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--aa-text-muted)' }}>
          Showing <strong>{pagedOrders.length}</strong> of <strong>{filteredOrders.length}</strong> matching orders
        </div>
      </div>

      {/* REPEATER CONTAINER WITH ALL CLASSIC TEMPLATES */}
      <div
        style={{
          background: 'var(--aa-bg-surface)',
          border: '1px solid var(--aa-border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* &lt;HeaderTemplate&gt; */}
        <div
          style={{
            background: 'var(--aa-bg-subtle)',
            borderBottom: '1px solid var(--aa-border-subtle)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>📦</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--aa-text-primary)' }}>
                &lt;HeaderTemplate&gt; Enterprise Customer Orders Feed
              </h4>
              <div style={{ fontSize: '11px', color: 'var(--aa-text-muted)' }}>
                Demonstrating ItemTemplate, AlternatingItemTemplate, SeparatorTemplate &amp; EditItemTemplate
              </div>
            </div>
          </div>
          <span className="badge-chip enterprise" style={{ fontSize: '11px' }}>
            {filteredOrders.length} Active Records
          </span>
        </div>

        {/* ITEMS & ALTERNATING ITEMS */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {pagedOrders.map((ord, idx) => {
            const isAlternating = idx % 2 === 1;
            const isEditing = editingOrderId === ord.orderId;

            // 2- EDIT ITEM TEMPLATE
            if (isEditing) {
              return (
                <div
                  key={ord.orderId}
                  style={{
                    background: 'var(--aa-brand-primary-light)',
                    border: '2px solid var(--aa-brand-primary)',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--aa-brand-primary)' }}>
                      &lt;EditItemTemplate&gt; Editing {ord.orderId}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--aa-text-muted)' }}>
                      In-place Record Editor
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)', display: 'block', marginBottom: '4px' }}>
                        Customer Name:
                      </label>
                      <input
                        type="text"
                        className="aa-edit-input"
                        value={editForm.customer || ''}
                        onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)', display: 'block', marginBottom: '4px' }}>
                        Total ($):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="aa-edit-input"
                        value={editForm.total ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, total: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)', display: 'block', marginBottom: '4px' }}>
                        Items Count:
                      </label>
                      <input
                        type="number"
                        className="aa-edit-input"
                        value={editForm.itemsCount ?? 1}
                        onChange={(e) => setEditForm({ ...editForm, itemsCount: parseInt(e.target.value, 10) || 1 })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)', display: 'block', marginBottom: '4px' }}>
                        Status:
                      </label>
                      <select
                        className="aa-edit-select"
                        value={editForm.status || 'Processing'}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Order['status'] })}
                      >
                        <option value="Shipped">Shipped</option>
                        <option value="Processing">Processing</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button className="btn-cancel-inline" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                    <button className="btn-save-inline" onClick={handleUpdate}>
                      Save &amp; Update
                    </button>
                  </div>
                </div>
              );
            }

            // ITEM TEMPLATE vs ALTERNATING ITEM TEMPLATE
            return (
              <React.Fragment key={ord.orderId}>
                <div
                  style={{
                    padding: '16px 20px',
                    background: isAlternating ? 'var(--aa-bg-subtle)' : 'var(--aa-bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => handleCustomCommand('Flag', ord.orderId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        filter: ord.isFlagged ? 'none' : 'grayscale(100%) opacity(40%)',
                      }}
                      title="ItemCommand: Toggle Flag"
                    >
                      🚩
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--aa-text-primary)', fontSize: '15px' }}>
                          {ord.customer}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--aa-font-mono)', color: 'var(--aa-text-muted)' }}>
                          {ord.orderId}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--aa-text-muted)' }}>
                          ({isAlternating ? 'AlternatingItemTemplate' : 'ItemTemplate'})
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--aa-text-secondary)', marginTop: '2px' }}>
                        Ordered on {ord.orderDate} &bull; {ord.itemsCount} line items
                      </div>

                      {/* 6- BINDING EXPRESSIONS VIEWER */}
                      {showExpressions && (
                        <div className="sql-query-preview" style={{ marginTop: '6px', fontSize: '10px' }}>
                          {'<%# Eval("Customer") %> => "' + ord.customer + '" | <%# String.Format("{0:C}", Eval("Total")) %> => $' + ord.total.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--aa-font-mono)', color: 'var(--aa-brand-primary)' }}>
                        ${ord.total.toFixed(2)}
                      </div>
                      <span className={`badge-chip ${ord.status === 'Shipped' ? 'enterprise' : 'new'}`}>
                        {ord.status}
                      </span>
                    </div>

                    {/* 5- ITEMCOMMAND BUTTONS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className="aa-pager-btn"
                        onClick={() => handleStartEdit(ord)}
                        style={{ fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button
                        className="dx-action-btn"
                        onClick={() => handleCustomCommand('Approve', ord.orderId)}
                        title="CommandName='Approve'"
                      >
                        ✓ Ship
                      </button>
                      <button
                        className="dx-action-btn delete"
                        onClick={() => handleDelete(ord.orderId)}
                        title="CommandName='Delete'"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* &lt;SeparatorTemplate&gt; */}
                {idx < pagedOrders.length - 1 && (
                  <div
                    style={{
                      height: '1px',
                      background: 'var(--aa-border-subtle)',
                      margin: '0 20px',
                      opacity: 0.7,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* &lt;FooterTemplate&gt; */}
        <div
          style={{
            background: 'var(--aa-bg-subtle)',
            borderTop: '1px solid var(--aa-border-subtle)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
          }}
        >
          <div>
            <strong style={{ color: 'var(--aa-text-primary)' }}>&lt;FooterTemplate&gt;</strong>: Total Aggregate Value for Visible Filter
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span>Orders: <strong>{filteredOrders.length}</strong></span>
            <span style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 800, color: 'var(--aa-brand-primary)', fontSize: '15px' }}>
              Sum: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 4- PAGING CONTROLS */}
      <div className="aa-pager">
        <span>
          Page <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong>
        </span>
        <div className="aa-pager-buttons">
          <button
            className="aa-pager-btn"
            disabled={currentPage === 0}
            onClick={() => {
              setCurrentPage((p) => Math.max(0, p - 1));
              addLog('PageIndexChanging', `Navigated to Page ${currentPage}`);
            }}
          >
            &larr; Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`aa-pager-btn ${currentPage === i ? 'active' : ''}`}
              onClick={() => {
                setCurrentPage(i);
                addLog('PageIndexChanging', `Navigated to Page ${i + 1}`);
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="aa-pager-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
              addLog('PageIndexChanging', `Navigated to Page ${currentPage + 2}`);
            }}
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* EVENT LOGGER */}
      <div className="dx-event-logger">
        <div className="dx-event-logger-header">
          <span>&lt;asp:Repeater&gt; Real-Time Event Dispatcher</span>
          <span>{logs.length} Events Logged</span>
        </div>
        <div className="dx-log-list">
          {logs.map((log) => (
            <div key={log.id} className="dx-log-item">
              <span className="dx-log-time">[{log.time}]</span>
              <span className="dx-log-event">{log.event}:</span>
              <span>{log.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

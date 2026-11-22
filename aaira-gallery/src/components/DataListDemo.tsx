import React, { useState } from 'react';
import { IconSliders, IconCheck } from './Icons';

interface ProductItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  icon: string;
}

const initialProducts: ProductItem[] = [
  { id: 101, name: 'Chai Herbal Tea', category: 'Beverages', price: 18.0, stock: 39, rating: 4.8, icon: '🍵' },
  { id: 102, name: 'Chang Artisan Soda', category: 'Beverages', price: 19.0, stock: 17, rating: 4.5, icon: '🥤' },
  { id: 103, name: 'Aniseed Syrup', category: 'Condiments', price: 10.0, stock: 13, rating: 4.2, icon: '🍯' },
  { id: 104, name: 'Chef Anton Cajun Mix', category: 'Condiments', price: 22.0, stock: 53, rating: 4.9, icon: '🌶️' },
  { id: 105, name: 'Grandma Boysenberry Spread', category: 'Condiments', price: 25.0, stock: 120, rating: 4.7, icon: '🍓' },
  { id: 106, name: 'Uncle Bob Organic Dried Pears', category: 'Produce', price: 30.0, stock: 15, rating: 4.6, icon: '🍐' },
  { id: 107, name: 'Northwoods Cranberry Sauce', category: 'Condiments', price: 40.0, stock: 6, rating: 4.3, icon: '🍒' },
  { id: 108, name: 'Mishi Kobe Niku Beef', category: 'Meat/Poultry', price: 97.0, stock: 29, rating: 5.0, icon: '🥩' },
  { id: 109, name: 'Ikura Red Caviar', category: 'Seafood', price: 31.0, stock: 31, rating: 4.9, icon: '🍣' },
  { id: 110, name: 'Queso Cabrales Cheese', category: 'Dairy Products', price: 21.0, stock: 22, rating: 4.4, icon: '🧀' },
  { id: 111, name: 'Queso Manchego La Pastora', category: 'Dairy Products', price: 38.0, stock: 86, rating: 4.8, icon: '🧀' },
  { id: 112, name: 'Konbu Dried Seaweed', category: 'Seafood', price: 6.0, stock: 24, rating: 4.1, icon: '🌿' },
];

export const DataListDemo: React.FC = () => {
  // 1- DataBinding State
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(101);

  // 2- EditItemTemplate State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductItem>>({});

  // 3- Sorting State
  const [sortField, setSortField] = useState<'name' | 'price' | 'stock'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // 4- Paging State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6);

  // DataList Layout Settings
  const [repeatColumns, setRepeatColumns] = useState<number>(3);
  const [repeatDirection, setRepeatDirection] = useState<'Horizontal' | 'Vertical'>('Horizontal');
  const [showExpressions, setShowExpressions] = useState<boolean>(false);

  // Event Logs
  const [logs, setLogs] = useState<Array<{ id: string; time: string; event: string; detail: string }>>([
    {
      id: '1',
      time: new Date().toLocaleTimeString(),
      event: 'DataBound',
      detail: `DataList bound to ${initialProducts.length} Northwind products.`,
    },
  ]);

  const addLog = (event: string, detail: string) => {
    setLogs((prev) => [
      { id: Math.random().toString(36).substring(2, 8), time: new Date().toLocaleTimeString(), event, detail },
      ...prev.slice(0, 19),
    ]);
  };

  // Sort logic
  const sorted = [...products].sort((a, b) => {
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

  // Paging logic
  const totalPages = Math.ceil(sorted.length / pageSize);
  const pagedItems = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // Layout Matrix calculation (classic ASP.NET DataList layout engine)
  const getMatrixItems = () => {
    if (repeatDirection === 'Horizontal') {
      return pagedItems;
    }
    // Vertical layout transposition
    const cols = repeatColumns;
    const rows = Math.ceil(pagedItems.length / cols);
    const matrix: ProductItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = c * rows + r;
        if (idx < pagedItems.length) {
          matrix.push(pagedItems[idx]!);
        }
      }
    }
    return matrix;
  };

  // Actions
  const handleStartEdit = (p: ProductItem) => {
    setEditingId(p.id);
    setEditForm({ ...p });
    addLog('EditCommand', `Entering EditItemTemplate for Product #${p.id} (${p.name})`);
  };

  const handleCancelEdit = () => {
    addLog('CancelCommand', `Cancelled inline edit for Product #${editingId}`);
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdate = () => {
    if (!editingId) return;
    setProducts((prev) =>
      prev.map((item) => (item.id === editingId ? { ...item, ...(editForm as ProductItem) } : item))
    );
    addLog('UpdateCommand', `Saved changes to Product #${editingId}: $${editForm.price}, Stock: ${editForm.stock}`);
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: number) => {
    const item = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addLog('DeleteCommand', `Deleted Product #${id} (${item?.name}) from in-memory collection.`);
    if (selectedProductId === id) setSelectedProductId(null);
  };

  // 5- RowCommand / ItemCommand actions
  const handleItemCommand = (commandName: string, product: ProductItem) => {
    if (commandName === 'Select') {
      setSelectedProductId(product.id);
      addLog('ItemCommand', `Command: "Select" on Product #${product.id} (${product.name}). SelectedItemTemplate activated.`);
    } else if (commandName === 'Discount') {
      const discountedPrice = Math.max(1, Number((product.price * 0.85).toFixed(2)));
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, price: discountedPrice } : p))
      );
      addLog('ItemCommand', `Command: "Discount" applied 15% discount to #${product.id}. New Price: $${discountedPrice.toFixed(2)}`);
    } else if (commandName === 'Restock') {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: p.stock + 10 } : p))
      );
      addLog('ItemCommand', `Command: "Restock" added +10 units to Product #${product.id}. Stock: ${product.stock + 10}`);
    }
  };

  const handleSortChange = (field: 'name' | 'price' | 'stock') => {
    const nextAsc = sortField === field ? !sortAsc : true;
    setSortField(field);
    setSortAsc(nextAsc);
    addLog('SortCommand', `Sorting DataList by "${field}" (${nextAsc ? 'ASC' : 'DESC'})`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* DevExpress-style Configuration Bar */}
      <div className="dx-demo-bar">
        <div className="dx-mode-group">
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-secondary)', marginRight: '6px' }}>
            Columns:
          </span>
          {[2, 3, 4].map((cols) => (
            <button
              key={cols}
              className={`dx-mode-pill ${repeatColumns === cols ? 'active' : ''}`}
              onClick={() => setRepeatColumns(cols)}
            >
              {cols} Cols
            </button>
          ))}

          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-secondary)', marginLeft: '12px', marginRight: '6px' }}>
            Direction:
          </span>
          {(['Horizontal', 'Vertical'] as const).map((dir) => (
            <button
              key={dir}
              className={`dx-mode-pill ${repeatDirection === dir ? 'active' : ''}`}
              onClick={() => setRepeatDirection(dir)}
            >
              {dir}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`dx-action-btn ${showExpressions ? 'active' : ''}`}
            onClick={() => setShowExpressions(!showExpressions)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>{showExpressions ? 'Hide' : 'Show'} Binding Expressions &lt;%# Eval %&gt;</span>
          </button>
          <button
            className="dx-action-btn"
            onClick={() => {
              setProducts(initialProducts);
              addLog('DataBind', 'Reset DataList to initial 12 products.');
            }}
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* Toolbar: Sorting & Paging Bar */}
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
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-secondary)' }}>Sort By:</span>
          <button
            className={`aa-pager-btn ${sortField === 'name' ? 'active' : ''}`}
            onClick={() => handleSortChange('name')}
          >
            Product Name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
          </button>
          <button
            className={`aa-pager-btn ${sortField === 'price' ? 'active' : ''}`}
            onClick={() => handleSortChange('price')}
          >
            Unit Price {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
          </button>
          <button
            className={`aa-pager-btn ${sortField === 'stock' ? 'active' : ''}`}
            onClick={() => handleSortChange('stock')}
          >
            Stock {sortField === 'stock' ? (sortAsc ? '▲' : '▼') : ''}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--aa-text-secondary)' }}>
          <span>Page Size:</span>
          {[6, 9, 12].map((s) => (
            <button
              key={s}
              className={`aa-pager-btn ${pageSize === s ? 'active' : ''}`}
              onClick={() => {
                setPageSize(s);
                setCurrentPage(0);
                addLog('PageIndexChanging', `Changed PageSize to ${s}`);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* DataList Grid Matrix Canvas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${repeatColumns}, minmax(0, 1fr))`,
          gap: '16px',
        }}
      >
        {getMatrixItems().map((item) => {
          const isSelected = selectedProductId === item.id;
          const isEditing = editingId === item.id;

          // 2- EDIT ITEM TEMPLATE
          if (isEditing) {
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--aa-bg-surface)',
                  border: '2px solid var(--aa-brand-primary)',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--aa-border-subtle)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--aa-brand-primary)' }}>
                    &lt;EditItemTemplate&gt; Product #{item.id}
                  </span>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Product Name:
                  </label>
                  <input
                    type="text"
                    className="aa-edit-input"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Price ($):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      className="aa-edit-input"
                      value={editForm.price ?? 0}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Stock Units:
                    </label>
                    <input
                      type="number"
                      className="aa-edit-input"
                      value={editForm.stock ?? 0}
                      onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Category:
                  </label>
                  <select
                    className="aa-edit-select"
                    value={editForm.category || 'Beverages'}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option value="Beverages">Beverages</option>
                    <option value="Condiments">Condiments</option>
                    <option value="Produce">Produce</option>
                    <option value="Meat/Poultry">Meat/Poultry</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Dairy Products">Dairy Products</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button className="btn-save-inline" style={{ flex: 1 }} onClick={handleUpdate}>
                    Update
                  </button>
                  <button className="btn-cancel-inline" style={{ flex: 1 }} onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          // ITEM TEMPLATE & SELECTED ITEM TEMPLATE
          return (
            <div
              key={item.id}
              style={{
                background: isSelected ? 'var(--aa-brand-primary-light)' : 'var(--aa-bg-surface)',
                border: isSelected ? '2px solid var(--aa-brand-primary)' : '1px solid var(--aa-border-subtle)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--aa-font-mono)', color: 'var(--aa-text-muted)' }}>
                    #{item.id}
                  </span>
                  <span className="badge-chip enterprise">{item.category}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                  <span style={{ fontSize: '28px' }}>{item.icon}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--aa-text-primary)' }}>
                      {item.name}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>
                      ★ {item.rating.toFixed(1)} / 5.0
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '12px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--aa-font-mono)', color: 'var(--aa-brand-primary)' }}>
                    ${item.price.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: item.stock < 15 ? '#ef4444' : 'var(--aa-text-secondary)' }}>
                    Stock: <strong>{item.stock}</strong> units
                  </div>
                </div>

                {/* 6- BINDING EXPRESSIONS VIEWER */}
                {showExpressions && (
                  <div className="sql-query-preview" style={{ marginTop: '10px', fontSize: '10px' }}>
                    {'<%# Eval("ProductName") %> => "' + item.name + '"'}<br />
                    {'<%# String.Format("{0:C}", Eval("UnitPrice")) %> => $' + item.price.toFixed(2)}
                  </div>
                )}
              </div>

              {/* 5- ITEMCOMMAND BUTTONS & ACTIONS */}
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--aa-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="aa-pager-btn"
                    style={{ flex: 1, fontSize: '12px' }}
                    onClick={() => handleItemCommand('Select', item)}
                  >
                    {isSelected ? '✓ Selected' : 'Select'}
                  </button>
                  <button
                    className="aa-pager-btn"
                    style={{ flex: 1, fontSize: '12px' }}
                    onClick={() => handleStartEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="dx-action-btn delete"
                    style={{ padding: '4px 8px' }}
                    onClick={() => handleDelete(item.id)}
                    title="Delete item"
                  >
                    🗑️
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="dx-action-btn"
                    style={{ flex: 1, fontSize: '11px', textAlign: 'center' }}
                    onClick={() => handleItemCommand('Discount', item)}
                  >
                    🏷️ Apply -15%
                  </button>
                  <button
                    className="dx-action-btn"
                    style={{ flex: 1, fontSize: '11px', textAlign: 'center' }}
                    onClick={() => handleItemCommand('Restock', item)}
                  >
                    📦 +10 Stock
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4- PAGING CONTROLS */}
      <div className="aa-pager">
        <span>
          Showing Page <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong> ({products.length} total products)
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

      {/* LIVE EVENT LOGGER */}
      <div className="dx-event-logger">
        <div className="dx-event-logger-header">
          <span>&lt;asp:DataList&gt; Real-Time Event Dispatcher</span>
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

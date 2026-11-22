import React, { useState, useEffect } from 'react';
import { mockEmployees, Employee } from '../data/mockData';
import { IconDatabase, IconSliders, IconCheck } from './Icons';

interface LogEntry {
  id: string;
  time: string;
  eventName: string;
  details: string;
}

export interface GridViewDemoProps {
  initialMode?: 'template' | 'sqlds' | 'servermode';
}

export const GridViewDemo: React.FC<GridViewDemoProps> = ({ initialMode = 'template' }) => {
  // Mode Selection: Mode 1 (EditItemTemplate), Mode 2 (SqlDataSource), Mode 3 (DevExpress Server Mode)
  const [dataMode, setDataMode] = useState<'template' | 'sqlds' | 'servermode'>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setDataMode(initialMode);
    }
  }, [initialMode]);

  // Data Store
  const [data, setData] = useState<Employee[]>(mockEmployees);
  const [filterDepartment, setFilterDepartment] = useState<string>('All');

  // Paging & Sorting
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<keyof Employee>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Selection & Edit State
  const [selectedRowId, setSelectedRowId] = useState<number | null>(101);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});

  // Server Mode (DevExpress 300,000 records simulation)
  const totalServerRecords = 300000;
  const [serverTimeMs, setServerTimeMs] = useState(14);
  const [serverCommand, setServerCommand] = useState('Init (Page 1)');
  const [isServerLoading, setIsServerLoading] = useState(false);

  // Event Logger
  const [eventLogs, setEventLogs] = useState<LogEntry[]>([
    {
      id: '1',
      time: new Date().toLocaleTimeString(),
      eventName: 'DataBound',
      details: 'Grid successfully bound to DataSource. 8 records loaded.',
    },
  ]);

  const addLog = (eventName: string, details: string) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      eventName,
      details,
    };
    setEventLogs((prev) => [newEntry, ...prev.slice(0, 24)]);
  };

  // Filter Data (SqlDataSource simulation)
  const filteredData = data.filter((emp) =>
    filterDepartment === 'All' ? true : emp.department === filterDepartment
  );

  // Sort Data
  const sortedData = [...filteredData].sort((a, b) => {
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

  // Paging Data
  const totalPages = dataMode === 'servermode'
    ? Math.ceil(totalServerRecords / pageSize)
    : Math.max(1, Math.ceil(sortedData.length / pageSize));

  const pagedRows = dataMode === 'servermode'
    ? sortedData.slice(0, pageSize) // Server returns window of pageSize
    : sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // DevExpress Server Mode simulated query
  const simulateServerRequest = (commandName: string) => {
    setIsServerLoading(true);
    setServerCommand(commandName);
    const start = performance.now();
    setTimeout(() => {
      const elapsed = Math.round(performance.now() - start + 6);
      setServerTimeMs(elapsed);
      setIsServerLoading(false);
      addLog('ServerCallback', `${commandName} executed in ${elapsed}ms against 300,000 records.`);
    }, 120);
  };

  // Sorting Handler
  const handleSort = (field: keyof Employee) => {
    const newDir = sortField === field ? !sortAsc : true;
    setSortField(field);
    setSortAsc(newDir);
    addLog('Sorting', `Column '${String(field)}' sorted ${newDir ? 'ASC' : 'DESC'}`);
    if (dataMode === 'servermode') {
      simulateServerRequest(`Sort: ${String(field)} ${newDir ? 'ASC' : 'DESC'}`);
    }
  };

  // Paging Handler
  const handlePageChange = (newPage: number) => {
    addLog('PageIndexChanging', `Navigating to page ${newPage + 1} of ${totalPages}`);
    setCurrentPage(newPage);
    addLog('PageIndexChanged', `Current page is now ${newPage + 1}`);
    if (dataMode === 'servermode') {
      simulateServerRequest(`Page ${newPage + 1}`);
    }
  };

  // Inline Editing Handlers
  const handleStartEdit = (emp: Employee) => {
    addLog('RowEditing', `Entering EditItemTemplate for row #${emp.id} (${emp.name})`);
    setEditingId(emp.id);
    setEditFormData({
      name: emp.name,
      role: emp.role,
      department: emp.department,
      salary: emp.salary,
      status: emp.status,
    });
  };

  const handleSaveEdit = (id: number) => {
    addLog('RowUpdating', `Committing updated values for row #${id}: ${JSON.stringify(editFormData)}`);
    setData((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...editFormData } as Employee : emp))
    );
    setEditingId(null);
    addLog('RowUpdated', `Row #${id} successfully committed to DataSource.`);
    if (dataMode === 'sqlds') {
      addLog('SqlDataSource', `Executed UPDATE Employees SET Name='${editFormData.name}', Salary=${editFormData.salary} WHERE Id=${id}`);
    }
  };

  const handleCancelEdit = () => {
    addLog('RowCancelingEdit', `Inline edit cancelled for row #${editingId}`);
    setEditingId(null);
  };

  // Delete Handler
  const handleDeleteRow = (emp: Employee) => {
    addLog('RowDeleting', `Prompting confirmation to delete row #${emp.id} (${emp.name})`);
    if (window.confirm(`Are you sure you want to delete employee #${emp.id} (${emp.name})?`)) {
      setData((prev) => prev.filter((item) => item.id !== emp.id));
      addLog('RowDeleted', `Row #${emp.id} deleted from DataSource.`);
      if (dataMode === 'sqlds') {
        addLog('SqlDataSource', `Executed DELETE FROM Employees WHERE Id=${emp.id}`);
      }
    } else {
      addLog('RowDeleting', `Delete operation cancelled by user (e.cancel = true).`);
    }
  };

  // Custom RowCommand Handler
  const handleCustomCommand = (emp: Employee, commandName: string) => {
    addLog('RowCommand', `Fired command '${commandName}' for row #${emp.id} (${emp.name})`);
    if (commandName === 'GiveRaise') {
      const updatedSalary = Math.round(emp.salary * 1.1);
      setData((prev) =>
        prev.map((item) => (item.id === emp.id ? { ...item, salary: updatedSalary } : item))
      );
      addLog('RowUpdated', `Salary for ${emp.name} raised 10% to $${updatedSalary.toLocaleString()}.`);
    } else if (commandName === 'Select') {
      setSelectedRowId(emp.id);
      addLog('SelectedIndexChanged', `Selected row index changed to #${emp.id}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* DevExpress-Inspired Mode Switcher Bar */}
      <div className="dx-demo-bar">
        <div className="dx-mode-group">
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--aa-text-primary)' }}>
            Data Binding Mode:
          </span>
          <button
            className={`dx-mode-pill ${dataMode === 'template' ? 'active' : ''}`}
            onClick={() => {
              setDataMode('template');
              setCurrentPage(0);
              addLog('ModeChanged', 'Switched to Mode 1: EditItemTemplate & Inline Editing');
            }}
          >
            <span>Mode 1: EditItemTemplate &amp; Inline Editing</span>
          </button>
          <button
            className={`dx-mode-pill ${dataMode === 'sqlds' ? 'active' : ''}`}
            onClick={() => {
              setDataMode('sqlds');
              setCurrentPage(0);
              addLog('ModeChanged', 'Switched to Mode 2: SqlDataSource Parameterized CRUD');
            }}
          >
            <span>Mode 2: SqlDataSource CRUD</span>
          </button>
          <button
            className={`dx-mode-pill ${dataMode === 'servermode' ? 'active' : ''}`}
            onClick={() => {
              setDataMode('servermode');
              setCurrentPage(0);
              simulateServerRequest('Init (Page 1)');
              addLog('ModeChanged', 'Switched to Mode 3: DevExpress Server Mode (300,000 Records)');
            }}
          >
            <IconDatabase size={14} />
            <span>Mode 3: Server Mode (300k Records)</span>
          </button>
        </div>

        {dataMode === 'sqlds' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--aa-text-secondary)' }}>
              @Department Parameter:
            </span>
            <select
              className="aa-edit-select"
              style={{ width: '140px' }}
              value={filterDepartment}
              onChange={(e) => {
                setFilterDepartment(e.target.value);
                setCurrentPage(0);
                addLog('SqlDataSource', `Param @Department set to '${e.target.value}'. Query re-executed.`);
              }}
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Security">Security</option>
            </select>
          </div>
        )}
      </div>

      {/* DevExpress Large Database Server Mode Status Banner */}
      {dataMode === 'servermode' && (
        <div className="server-metrics-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--aa-brand-accent)' }}>
              DevExpress Server Mode Engine
            </span>
            <span className="metric-pill">Total Database Rows: 300,000</span>
            <span className="metric-pill">
              Execution Time: {isServerLoading ? 'Executing...' : `${serverTimeMs}ms`}
            </span>
            <span className="metric-pill">Current Command: {serverCommand}</span>
          </div>
          <div className="sql-query-preview" style={{ width: '100%' }}>
            Generated SQL: SELECT * FROM LargeOrders ORDER BY {String(sortField)} {sortAsc ? 'ASC' : 'DESC'} OFFSET {currentPage * pageSize} ROWS FETCH NEXT {pageSize} ROWS ONLY;
          </div>
        </div>
      )}

      {/* SqlDataSource Live SQL Query Display */}
      {dataMode === 'sqlds' && (
        <div className="sql-query-preview">
          SqlDataSource.SelectCommand: SELECT Id, Name, Role, Department, Salary, Status FROM Employees {filterDepartment !== 'All' ? `WHERE Department = '${filterDepartment}'` : ''} ORDER BY {String(sortField)} {sortAsc ? 'ASC' : 'DESC'}
        </div>
      )}

      {/* The Core GridView Table with Real EditItemTemplate */}
      <div className="aa-table-wrapper">
        <table className="aa-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ width: '70px' }}>
                ID {sortField === 'id' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('name')}>
                Employee Name (BoundField) {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('role')}>
                Role (TemplateField) {sortField === 'role' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('department')}>
                Department {sortField === 'department' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('salary')}>
                Salary (Binding Expression) {sortField === 'salary' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th>Status</th>
              <th style={{ width: '220px' }}>CommandField (Actions)</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((emp) => {
              const isEditing = editingId === emp.id;

              return (
                <tr
                  key={emp.id}
                  className={`${selectedRowId === emp.id ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
                  onClick={() => !isEditing && handleCustomCommand(emp, 'Select')}
                  style={{ cursor: isEditing ? 'default' : 'pointer' }}
                >
                  {/* ID Column */}
                  <td style={{ fontWeight: 600 }}>#{emp.id}</td>

                  {/* Employee Name Column (BoundField with EditItemTemplate) */}
                  <td>
                    {isEditing ? (
                      <input
                        className="aa-edit-input"
                        value={editFormData.name ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        autoFocus
                      />
                    ) : (
                      <span style={{ fontWeight: 600, color: 'var(--aa-brand-primary)' }}>
                        {emp.name}
                      </span>
                    )}
                  </td>

                  {/* Role Column (TemplateField with Select in EditItemTemplate) */}
                  <td>
                    {isEditing ? (
                      <select
                        className="aa-edit-select"
                        value={editFormData.role ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      >
                        <option value="Principal Architect">Principal Architect</option>
                        <option value="Senior Frontend Lead">Senior Frontend Lead</option>
                        <option value="Product VP">Product VP</option>
                        <option value="DevOps Specialist">DevOps Specialist</option>
                        <option value="UX Design Director">UX Design Director</option>
                        <option value="Backend Engineer">Backend Engineer</option>
                        <option value="Security Engineer">Security Engineer</option>
                        <option value="QA Automation Lead">QA Automation Lead</option>
                      </select>
                    ) : (
                      emp.role
                    )}
                  </td>

                  {/* Department Column */}
                  <td>
                    {isEditing ? (
                      <input
                        className="aa-edit-input"
                        value={editFormData.department ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      />
                    ) : (
                      emp.department
                    )}
                  </td>

                  {/* Salary Column (Binding Expression format: <%# Eval("Salary", "{0:C}") %>) */}
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="aa-edit-input"
                        value={editFormData.salary ?? 0}
                        onChange={(e) => setEditFormData({ ...editFormData, salary: Number(e.target.value) })}
                      />
                    ) : (
                      <span style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 600 }}>
                        ${emp.salary.toLocaleString()}
                      </span>
                    )}
                  </td>

                  {/* Status Column */}
                  <td>
                    {isEditing ? (
                      <select
                        className="aa-edit-select"
                        value={editFormData.status ?? 'Active'}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            status: e.target.value as 'Active' | 'On Leave' | 'Terminated',
                          })
                        }
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    ) : (
                      <span
                        className={`badge-chip ${
                          emp.status === 'Active'
                            ? 'enterprise'
                            : emp.status === 'On Leave'
                            ? 'new'
                            : 'ai'
                        }`}
                      >
                        {emp.status}
                      </span>
                    )}
                  </td>

                  {/* CommandField Column (Edit, Update, Cancel, Delete, Custom Command) */}
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-save-inline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(emp.id);
                          }}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className="btn-cancel-inline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="dx-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(emp);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dx-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(emp);
                          }}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          className="dx-action-btn"
                          title="Custom RowCommand button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomCommand(emp, 'GiveRaise');
                          }}
                        >
                          +10%
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pager */}
        <div className="aa-pager">
          <span>
            {dataMode === 'servermode'
              ? `Showing Page ${currentPage + 1} of ${totalPages.toLocaleString()} (300,000 Total Records in DB)`
              : `Showing ${currentPage * pageSize + 1} - ${Math.min(
                  (currentPage + 1) * pageSize,
                  sortedData.length
                )} of ${sortedData.length} records`}
          </span>

          <div className="aa-pager-buttons">
            <button
              className="aa-pager-btn"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              &larr; Prev
            </button>

            {(dataMode === 'servermode' ? [0, 1, 2, 3, 4] : Array.from({ length: totalPages }, (_, i) => i)).map(
              (i) => (
                <button
                  key={i}
                  className={`aa-pager-btn ${currentPage === i ? 'active' : ''}`}
                  onClick={() => handlePageChange(i)}
                >
                  {i + 1}
                </button>
              )
            )}

            {dataMode === 'servermode' && (
              <span style={{ padding: '0 6px', color: 'var(--aa-text-muted)' }}>
                ... {totalPages.toLocaleString()}
              </span>
            )}

            <button
              className="aa-pager-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* DevExpress-Style Real-time Event Monitor */}
      <div className="dx-event-logger">
        <div className="dx-event-logger-header">
          <span>WebForms Lifecycle &amp; Command Event Inspector</span>
          <button
            onClick={() => setEventLogs([])}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Clear Log
          </button>
        </div>
        <div className="dx-log-list">
          {eventLogs.map((log) => (
            <div key={log.id} className="dx-log-item">
              <span className="dx-log-time">[{log.time}]</span>
              <span className="dx-log-event">{log.eventName}:</span>
              <span>{log.details}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

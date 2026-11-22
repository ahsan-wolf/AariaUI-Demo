import React, { useState } from 'react';
import { mockEmployees, Employee } from '../data/mockData';
import { IconSparkles, IconCheck, IconZap, IconFilter } from '../components/Icons';

export const AiDemoCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grid' | 'form'>('grid');

  // AI Grid State
  const [prompt, setPrompt] = useState('Show active engineers');
  const [appliedFilterDesc, setAppliedFilterDesc] = useState('Filtered by: status = "Active" AND role contains "Engineer"');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(() =>
    mockEmployees.filter((e) => e.status === 'Active' && e.role.toLowerCase().includes('engineer'))
  );

  // AI Form State
  const [formPrompt, setFormPrompt] = useState('Customer Onboarding Form');
  const [generatedFields, setGeneratedFields] = useState<
    { name: string; label: string; type: string; validator: string; required: boolean }[]
  >([
    { name: 'companyName', label: 'Company Name', type: 'text', validator: 'RequiredFieldValidator', required: true },
    { name: 'contactEmail', label: 'Primary Contact Email', type: 'email', validator: 'RegularExpressionValidator (Email)', required: true },
    { name: 'annualRevenue', label: 'Estimated Annual Revenue ($)', type: 'number', validator: 'RangeValidator (1000 - 50000000)', required: false },
    { name: 'tier', label: 'Subscription Plan', type: 'select', validator: 'RequiredFieldValidator', required: true },
  ]);

  const runAiGridFilter = (query: string) => {
    setPrompt(query);
    const q = query.toLowerCase();

    let result = [...mockEmployees];
    const explanations: string[] = [];

    if (q.includes('active')) {
      result = result.filter((e) => e.status === 'Active');
      explanations.push('status = "Active"');
    }
    if (q.includes('leave')) {
      result = result.filter((e) => e.status === 'On Leave');
      explanations.push('status = "On Leave"');
    }
    if (q.includes('engineer')) {
      result = result.filter((e) => e.role.toLowerCase().includes('engineer') || e.department.toLowerCase().includes('engineering'));
      explanations.push('role/dept matches "Engineer"');
    }
    if (q.includes('140k') || q.includes('140000') || q.includes('140,000')) {
      result = result.filter((e) => e.salary > 140000);
      explanations.push('salary > $140,000');
    }
    if (q.includes('150k') || q.includes('150000')) {
      result = result.filter((e) => e.salary > 150000);
      explanations.push('salary > $150,000');
    }
    if (q.includes('product')) {
      result = result.filter((e) => e.department.toLowerCase().includes('product'));
      explanations.push('department = "Product"');
    }
    if (q.includes('architect')) {
      result = result.filter((e) => e.role.toLowerCase().includes('architect'));
      explanations.push('role = "Architect"');
    }

    if (explanations.length === 0) {
      explanations.push(`Fuzzy search keyword: "${query}"`);
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }

    setFilteredEmployees(result);
    setAppliedFilterDesc(`AI Parsed: ${explanations.join(' AND ')} (${result.length} matches)`);
  };

  const handleGenerateForm = (presetName: string) => {
    setFormPrompt(presetName);
    if (presetName.includes('Vendor')) {
      setGeneratedFields([
        { name: 'vendorName', label: 'Vendor Legal Business Name', type: 'text', validator: 'RequiredFieldValidator', required: true },
        { name: 'taxId', label: 'Tax Identification Number (EIN)', type: 'text', validator: 'RegularExpressionValidator (XX-XXXXXXX)', required: true },
        { name: 'paymentTerms', label: 'Payment Terms (Net 30/60)', type: 'select', validator: 'RequiredFieldValidator', required: true },
        { name: 'insuranceExpiry', label: 'Liability Insurance Expiry Date', type: 'date', validator: 'RangeValidator (Future date)', required: true },
      ]);
    } else if (presetName.includes('Employee')) {
      setGeneratedFields([
        { name: 'fullName', label: 'Employee Legal Full Name', type: 'text', validator: 'RequiredFieldValidator', required: true },
        { name: 'ssn', label: 'Social Security Number', type: 'password', validator: 'RegularExpressionValidator (XXX-XX-XXXX)', required: true },
        { name: 'startingSalary', label: 'Base Annual Salary', type: 'number', validator: 'RangeValidator (30000 - 500000)', required: true },
        { name: 'department', label: 'Department Assignment', type: 'select', validator: 'RequiredFieldValidator', required: true },
      ]);
    } else {
      setGeneratedFields([
        { name: 'companyName', label: 'Company Name', type: 'text', validator: 'RequiredFieldValidator', required: true },
        { name: 'contactEmail', label: 'Primary Contact Email', type: 'email', validator: 'RegularExpressionValidator (Email)', required: true },
        { name: 'annualRevenue', label: 'Estimated Annual Revenue ($)', type: 'number', validator: 'RangeValidator (1000 - 50000000)', required: false },
        { name: 'tier', label: 'Subscription Plan', type: 'select', validator: 'RequiredFieldValidator', required: true },
      ]);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>
          <IconSparkles size={14} />
          <span>Generative AI Controls Studio</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--aa-text-primary)' }}>
          AI Controls Demo Center
        </h1>
        <p style={{ color: 'var(--aa-text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          Experience next-generation conversational enterprise controls. Natural language grid queries and instant form schema synthesis running on top of Aaira headless controllers.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="detail-tabs-bar">
        <button
          className={`detail-tab ${activeTab === 'grid' ? 'active' : ''}`}
          onClick={() => setActiveTab('grid')}
        >
          <IconFilter size={15} />
          <span>AI Grid (Natural Language Filtering)</span>
        </button>
        <button
          className={`detail-tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          <IconZap size={15} />
          <span>AI Form Synthesis &amp; Validation</span>
        </button>
      </div>

      {activeTab === 'grid' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* AI Search Bar */}
          <div style={{ background: 'var(--aa-bg-surface)', border: '1px solid var(--aa-border-strong)', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--aa-shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IconSparkles size={20} style={{ color: '#a855f7', flexShrink: 0 }} />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runAiGridFilter(prompt);
                }}
                placeholder="Ask anything (e.g. 'Show active engineers', 'Salary > 140k', 'Product department')..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  fontSize: '15px',
                  color: 'var(--aa-text-primary)',
                  outline: 'none',
                }}
              />
              <button
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
                onClick={() => runAiGridFilter(prompt)}
              >
                Apply AI Query
              </button>
            </div>

            {/* Suggestions Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--aa-text-muted)', fontWeight: 600 }}>Try queries:</span>
              {[
                'Show active engineers',
                'Salary greater than 140k',
                'Product department',
                'Principal Architect',
                'Employees on leave',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="aa-pager-btn"
                  style={{ height: 'auto', padding: '4px 10px', fontSize: '11px' }}
                  onClick={() => runAiGridFilter(suggestion)}
                >
                  &ldquo;{suggestion}&rdquo;
                </button>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.08)', padding: '6px 12px', borderRadius: '6px' }}>
              {appliedFilterDesc}
            </div>
          </div>

          {/* Filtered Grid View */}
          <div className="aa-table-wrapper">
            <table className="aa-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--aa-text-muted)' }}>
                      No records matched this natural language query.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 600 }}>#{emp.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--aa-brand-primary)' }}>{emp.name}</td>
                      <td>{emp.role}</td>
                      <td>{emp.department}</td>
                      <td style={{ fontFamily: 'var(--aa-font-mono)' }}>${emp.salary.toLocaleString()}</td>
                      <td>
                        <span className={`badge-chip ${emp.status === 'Active' ? 'enterprise' : 'new'}`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-muted)' }}>Generate Preset:</span>
            {['Customer Onboarding Form', 'Vendor Registration Form', 'New Employee Form'].map((f) => (
              <button
                key={f}
                className="aa-pager-btn"
                style={{ height: 'auto', padding: '6px 12px', fontSize: '12px' }}
                onClick={() => handleGenerateForm(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--aa-bg-surface)', border: '1px solid var(--aa-border-subtle)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Synthesized Form: {formPrompt}
            </h3>
            <p style={{ color: 'var(--aa-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Aaira Form Synthesis automatically maps fields to ValidatorManager with RequiredField, Compare, and RegularExpression validators.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); alert("Form submitted successfully! Validated by Aaira ValidatorManager."); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {generatedFields.map((field) => (
                  <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-primary)' }}>
                      {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--aa-border-strong)',
                          background: 'var(--aa-bg-subtle)',
                          color: 'var(--aa-text-primary)',
                          outline: 'none',
                        }}
                      >
                        <option>Enterprise Tier ($2,500/mo)</option>
                        <option>Business Tier ($950/mo)</option>
                        <option>Standard Tier ($350/mo)</option>
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={`Enter ${field.label}...`}
                        required={field.required}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--aa-border-strong)',
                          background: 'var(--aa-bg-subtle)',
                          color: 'var(--aa-text-primary)',
                          outline: 'none',
                        }}
                      />
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--aa-brand-accent)', fontFamily: 'var(--aa-font-mono)' }}>
                      Attached: {field.validator}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary">
                  Reset
                </button>
                <button type="submit" className="btn-primary">
                  Validate &amp; Submit Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

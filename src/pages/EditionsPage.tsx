import React, { useEffect, useMemo, useState } from 'react';
import { License } from '@wf-controls/license';
import { GridViewController } from '@wf-controls/pro-data';
import { WebFormsGridView } from '@wf-controls/pro-data-react';
import { activateDemoLicense, activateDemoTrial, deactivateDemoLicense } from '../demo-license';
import { EDITIONS, EVALUATION_TABLE, TIER_TABLE, ACTIVATE_SNIPPET } from '../data/editions';
import { controlsRegistry } from '../data/controlsRegistry';
import { CodeSnippetViewer } from '../components/CodeSnippetViewer';
import { EditionChip } from '../components/EditionChip';

type Mode = 'unlicensed' | 'trial' | 'licensed';

interface Person { id: number; name: string; department: string; salary: number }
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Security', 'Quality'];
const PEOPLE: Person[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Employee ${String(i + 1).padStart(2, '0')}`,
  department: DEPARTMENTS[i % DEPARTMENTS.length]!,
  salary: 90000 + (i % 7) * 7500,
}));

const COLUMNS = [
  { type: 'bound' as const, key: 'id', dataField: 'id' as const, headerText: 'ID' },
  { type: 'bound' as const, key: 'name', dataField: 'name' as const, headerText: 'Name' },
  { type: 'bound' as const, key: 'department', dataField: 'department' as const, headerText: 'Department' },
  { type: 'bound' as const, key: 'salary', dataField: 'salary' as const, headerText: 'Salary' },
];

async function applyMode(mode: Mode): Promise<void> {
  if (mode === 'unlicensed') deactivateDemoLicense();
  else if (mode === 'trial') await activateDemoTrial();
  else await activateDemoLicense('professional');
}

/** Tier table, evaluation limits and a live demo of the three license states using the real Pro GridView. */
export const EditionsPage: React.FC<{ onSelectControl: (id: string) => void }> = ({ onSelectControl }) => {
  const [mode, setMode] = useState<Mode>('licensed');
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);
  const [attempt, setAttempt] = useState<string>('');

  // Apply the license state, then rebuild the grid (controllers read the license when they are created and bound).
  useEffect(() => {
    let alive = true;
    setReady(false);
    void applyMode(mode).then(() => {
      if (!alive) return;
      setVersion((v) => v + 1);
      setAttempt('');
      setReady(true);
    });
    return () => { alive = false; };
  }, [mode]);

  // Leaving the page restores the unrestricted demo license so the other gallery pages show full data.
  useEffect(() => () => { void activateDemoLicense(); }, []);

  const grid = useMemo(() => {
    if (!ready) return null;
    const g = new GridViewController<Person>({
      id: 'gvEditionsDemo', dataKeyField: 'id', columns: COLUMNS, dataSource: PEOPLE.map((p) => ({ ...p })),
    });
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, version]);

  const [, force] = useState(0);
  useEffect(() => {
    if (!grid) return;
    // Subscribe first, then bind: binding raises stateChanged, which re-renders the grid with its rows.
    const off = grid.stateChanged.subscribe(() => { force((n) => n + 1); });
    void grid.dataBind();
    return off;
  }, [grid]);

  const tryEdit = async () => {
    if (!grid) return;
    const ok = await grid.beginEdit(0);
    setAttempt(`beginEdit(0) returned ${ok}${ok ? '' : ' (blocked: "data.gridView" is not licensed)'}`);
    if (ok) await grid.cancelEdit();
  };
  const tryDelete = async () => {
    if (!grid) return;
    const before = grid.totalRecords;
    const ok = await grid.deleteRow(0);
    setAttempt(`deleteRow(0) returned ${ok}; rows ${before} -> ${grid.totalRecords}${ok ? '' : ' (blocked)'}`);
  };

  const proControls = controlsRegistry.filter((c) => c.edition === 'pro');
  const entControls = controlsRegistry.filter((c) => c.edition === 'enterprise');
  const link = (c: { id: string; name: string }, i: number) => (
    <span key={c.id}>{i > 0 && ', '}<a href="#" onClick={(e) => { e.preventDefault(); onSelectControl(c.id); }}>{c.name}</a></span>
  );

  return (
    <div className="editions-page" data-testid="editions-page">
      <h1 className="detail-title">Editions &amp; Licensing</h1>
      <p style={{ color: 'var(--aa-text-secondary)', lineHeight: 1.6 }}>
        One codebase, three editions. The <EditionChip edition="free" /> packages are MIT on public npm. <EditionChip edition="pro" /> and{' '}
        <EditionChip edition="enterprise" /> code ships only in separate packages on a private registry and is unlocked by a signed license key.
        Without a key the paid controls still run, in <strong>evaluation mode</strong>.
      </p>

      <h2 style={{ fontSize: '18px', marginTop: '24px' }}>What is in each edition</h2>
      <table data-testid="tier-table">
        <thead><tr><th>Area</th><th>Free (MIT)</th><th>Pro</th><th>Enterprise</th></tr></thead>
        <tbody>
          {TIER_TABLE.map((r) => (
            <tr key={r.area}><td><strong>{r.area}</strong></td><td>{r.free}</td><td>{r.pro}</td><td>{r.enterprise}</td></tr>
          ))}
          <tr>
            <td><strong>Packages</strong></td>
            <td>{EDITIONS.free.packages.map((p) => <div key={p}><code>{p}</code></div>)}</td>
            <td>{EDITIONS.pro.packages.map((p) => <div key={p}><code>{p}</code></div>)}</td>
            <td>{EDITIONS.enterprise.packages.map((p) => <div key={p}><code>{p}</code></div>)}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: '13px', color: 'var(--aa-text-secondary)' }}>
        Pro controls: {proControls.map(link)}. Enterprise controls: {entControls.map(link)}.
      </p>

      <h2 style={{ fontSize: '18px', marginTop: '24px' }}>Evaluation mode: unlicensed, trial and licensed</h2>
      <table data-testid="evaluation-table">
        <thead><tr><th>Behaviour</th><th>Unlicensed</th><th>Trial (signed token)</th><th>Licensed</th></tr></thead>
        <tbody>
          {EVALUATION_TABLE.map((r) => (
            <tr key={r.aspect}><td>{r.aspect}</td><td>{r.unlicensed}</td><td>{r.trial}</td><td>{r.licensed}</td></tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: '18px', marginTop: '24px' }}>Try it: the real Pro GridView in each state</h2>
      <p style={{ color: 'var(--aa-text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
        This grid is <code>GridViewController</code> from <code>@wf-controls/pro-data</code> bound to 25 rows. Each button below signs a
        throw-away license in your browser (<code>demo-license.ts</code>, demo only) and rebuilds the grid. The demo license is restored when you leave this page.
      </p>

      <div className="eval-switch" role="group" aria-label="License state">
        {(['unlicensed', 'trial', 'licensed'] as const).map((m) => (
          <button key={m} className={mode === m ? 'active' : ''} data-mode={m} onClick={() => setMode(m)}>
            {m === 'unlicensed' ? 'Unlicensed' : m === 'trial' ? 'Trial' : 'Licensed (Pro)'}
          </button>
        ))}
      </div>

      <div className="eval-status" data-testid="eval-status">
        <span><strong>License:</strong> <span data-testid="eval-edition">{ready ? `${License.edition}${License.isTrial ? ' (trial)' : ''}` : '...'}</span></span>
        <span><strong>Rows shown:</strong> <span data-testid="eval-rows">{grid ? grid.totalRecords : '...'}</span> of {PEOPLE.length}</span>
        <span><strong>Pro key active:</strong> <span data-testid="eval-licensed">{grid ? String(grid.licensed) : '...'}</span></span>
      </div>

      {grid ? <WebFormsGridView controller={grid} /> : <p>Applying license...</p>}

      <p style={{ marginTop: '10px' }}>
        <button className="btn-secondary" data-testid="try-edit" onClick={() => void tryEdit()}>Try to edit row 1</button>{' '}
        <button className="btn-secondary" data-testid="try-delete" onClick={() => void tryDelete()}>Try to delete row 1</button>{' '}
        <span data-testid="eval-attempt" style={{ fontSize: '13px', color: 'var(--aa-text-secondary)' }}>{attempt}</span>
      </p>

      <h2 style={{ fontSize: '18px', marginTop: '24px' }}>Activating a license in your app</h2>
      <CodeSnippetViewer code={ACTIVATE_SNIPPET} language="typescript" title="Activate a license (once, at start-up)" />
      <p style={{ fontSize: '13px', color: 'var(--aa-text-secondary)', lineHeight: 1.6 }}>
        Client-side limits deter casual sharing; they cannot stop a determined developer. The real restriction is the package split: paid code is
        published only to the private registry. The 1.x packages (<code>@wf-controls/*@1.0.0</code>) stay MIT and contain every control. Full details:{' '}
        <code>docs/EDITIONS.md</code>.
      </p>
    </div>
  );
};

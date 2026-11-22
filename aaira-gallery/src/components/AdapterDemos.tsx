import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  InMemoryAuthProvider,
  LoginController,
  LoginNameController,
  LoginStatusController,
  LoginViewController,
  RangeValidatorController,
  RegularExpressionValidatorController,
  RequiredFieldValidatorController,
  SecurityManager,
  SiteMapDataSource,
  SiteMapPathController,
  TabsController,
  ValidationSummaryController,
  ValidatorManager,
  type BaseValidatorController,
} from '@wf-controls/core';
import {
  Breadcrumb,
  WebFormsLogin,
  WebFormsLoginName,
  WebFormsLoginStatus,
  WebFormsLoginView,
  WebFormsTabs,
  type BreadcrumbItem,
  type TabDefinition,
} from '@wf-controls/react';

/**
 * Live demos built on the real @wf-controls/core controllers and @wf-controls/react adapters
 * (Tabs, Breadcrumb, the Login family and the validation framework).
 * Theme sheets (`tb-`, `nv-`, `lg-`, `vl-`) come from @wf-controls/styles, imported once by StyleSheetsPage.
 */

const THEMES = ['modern', 'dark', 'classic', 'minimal', 'corporate'] as const;
type ThemeName = (typeof THEMES)[number];

const panel: React.CSSProperties = {
  background: 'var(--aa-bg-surface)',
  border: '1px solid var(--aa-border-subtle)',
  borderRadius: 10,
  padding: 16,
  color: 'var(--aa-text-primary)',
};

const note: React.CSSProperties = { fontSize: 12, color: 'var(--aa-text-muted)', marginTop: 8 };

function ThemePicker({ value, onChange }: { value: ThemeName; onChange: (t: ThemeName) => void }) {
  return (
    <label style={{ fontSize: 13, display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontWeight: 600 }}>Style Sheets theme:</span>
      <select value={value} onChange={(e) => onChange(e.target.value as ThemeName)}>
        {THEMES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Light-weight event inspector shared by the demos. */
function EventLog({ lines }: { lines: string[] }) {
  return (
    <div className="dx-event-logger" style={{ marginTop: 16 }}>
      <div className="dx-event-logger-header">
        <span>Event Inspector</span>
      </div>
      <div style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 12, minHeight: 44 }}>
        {lines.length === 0 ? <span style={{ opacity: 0.6 }}>Interact with the control to see events.</span> : null}
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function useLog(): [string[], (msg: string) => void] {
  const [lines, setLines] = useState<string[]>([]);
  const add = (msg: string) =>
    setLines((prev) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...prev].slice(0, 6));
  return [lines, add];
}

/* ------------------------------------------------------------------ Tabs */

export function TabsDemo() {
  const [theme, setTheme] = useState<ThemeName>('dark');
  const [log, addLog] = useLog();
  const controller = useMemo(
    () =>
      new TabsController({
        tabs: [
          { id: 'overview', headerText: 'Overview' },
          { id: 'orders', headerText: 'Orders' },
          { id: 'billing', headerText: 'Billing' },
          { id: 'archive', headerText: 'Archive (disabled)', enabled: false },
        ],
      }),
    [],
  );

  useEffect(
    () => controller.activeTabChanged.subscribe((_s, e) => addLog(`ActiveTabChanged: index ${e.activeIndex}`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controller],
  );

  const tabs: TabDefinition[] = [
    { id: 'overview', headerText: 'Overview', content: <p>Account summary and recent activity.</p> },
    { id: 'orders', headerText: 'Orders', content: <p>42 open orders. Use the arrow keys to move between tabs.</p> },
    { id: 'billing', headerText: 'Billing', content: <p>Next invoice: 1 December.</p> },
    { id: 'archive', headerText: 'Archive (disabled)', enabled: false, content: <p>Not reachable.</p> },
  ];

  return (
    <div style={panel}>
      <ThemePicker value={theme} onChange={setTheme} />
      <WebFormsTabs controller={controller} tabs={tabs} className={`tb-${theme}`} />
      <p style={note}>
        Real <code>TabsController</code> + <code>&lt;WebFormsTabs /&gt;</code>. Keyboard: Left/Right, Home, End. The
        disabled tab is skipped.
      </p>
      <EventLog lines={log} />
    </div>
  );
}

/* ------------------------------------------------------------ Breadcrumb */

const SITE_MAP = {
  title: 'Home',
  url: '/',
  childNodes: [
    {
      title: 'Products',
      url: '/products',
      childNodes: [
        { title: 'Hardware', url: '/products/hardware', childNodes: [{ title: 'Keyboards', url: '/products/hardware/keyboards' }] },
        { title: 'Software', url: '/products/software' },
      ],
    },
    { title: 'Support', url: '/support', childNodes: [{ title: 'Contact', url: '/support/contact' }] },
  ],
};

const PAGES = ['/', '/products', '/products/hardware', '/products/hardware/keyboards', '/products/software', '/support/contact'];

export function BreadcrumbDemo() {
  const [theme, setTheme] = useState<ThemeName>('dark');
  const [current, setCurrent] = useState('/products/hardware/keyboards');
  const [crumbs, setCrumbs] = useState<BreadcrumbItem[]>([]);
  const [log, addLog] = useLog();

  const path = useMemo(
    () => new SiteMapPathController({ id: 'demoPath', siteMapProvider: new SiteMapDataSource({ id: 'demoMap', siteMap: SITE_MAP }) }),
    [],
  );

  useEffect(() => {
    let alive = true;
    void path.dataBind(current).then((items) => {
      if (alive) setCrumbs(items.map((i) => ({ text: i.text, ...(i.isLink ? { url: i.url } : {}) })));
    });
    return () => {
      alive = false;
    };
  }, [path, current]);

  return (
    <div style={panel}>
      <ThemePicker value={theme} onChange={setTheme} />
      <Breadcrumb
        items={crumbs}
        className={`nv-${theme}`}
        onItemClick={(item) => {
          const url = (item as BreadcrumbItem).url;
          if (url) {
            addLog(`ItemClick: ${url}`);
            setCurrent(url);
          }
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Current page:</span>
        {PAGES.map((p) => (
          <button key={p} className={`dx-mode-pill ${p === current ? 'active' : ''}`} onClick={() => setCurrent(p)}>
            {p}
          </button>
        ))}
      </div>
      <p style={note}>
        <code>SiteMapPathController</code> resolves the path from a <code>SiteMapDataSource</code>; the last crumb is
        the current page.
      </p>
      <EventLog lines={log} />
    </div>
  );
}

/* ----------------------------------------------------------- Login family */

let providerInstalled = false;
function installDemoProvider() {
  if (providerInstalled) return;
  providerInstalled = true;
  SecurityManager.setProvider(
    new InMemoryAuthProvider({
      users: [
        { userName: 'admin', password: 'Password123!', email: 'admin@example.com', roles: ['Administrators', 'Users'] },
        { userName: 'sam', password: 'Password123!', email: 'sam@example.com', roles: ['Users'] },
      ],
    }),
  );
}

function useCurrentUserRepaint() {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => SecurityManager.currentUserChanged.subscribe(() => bump()), []);
}

export function LoginDemo() {
  installDemoProvider();
  const [theme, setTheme] = useState<ThemeName>('dark');
  const [log, addLog] = useLog();
  useCurrentUserRepaint();

  const login = useMemo(() => new LoginController({ displayRememberMe: true }), []);
  const [status, setStatus] = useState<LoginStatusController | null>(null);
  const [name, setName] = useState<LoginNameController | null>(null);
  const [view, setView] = useState<LoginViewController<React.ReactNode> | null>(null);

  // These three subscribe in their constructors: create them in an effect and dispose on unmount (StrictMode safe).
  useEffect(() => {
    const s = new LoginStatusController({ loginText: 'Log in', logoutText: 'Log out' });
    const n = new LoginNameController({ formatString: 'Signed in as {0}' });
    const v = new LoginViewController<React.ReactNode>({
      anonymousTemplate: <p>Anonymous: please sign in (try admin / Password123!).</p>,
      roleGroups: [{ roles: ['Administrators'], contentTemplate: <p><b>Admin panel:</b> manage users.</p> }],
      loggedInTemplate: <p>Welcome back. Nothing special for your role.</p>,
    });
    setStatus(s);
    setName(n);
    setView(v);
    return () => {
      s.dispose();
      n.dispose();
      v.dispose();
    };
  }, []);

  const user = SecurityManager.defaultProvider.getCurrentUser();

  return (
    <div style={panel}>
      <ThemePicker value={theme} onChange={setTheme} />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        {name && <WebFormsLoginName controller={name} className={`lg-${theme}`} />}
        {status && <WebFormsLoginStatus controller={status} className={`lg-${theme}`} onLoggedOut={() => addLog('LoggedOut')} />}
      </div>
      {!user && (
        <WebFormsLogin
          controller={login}
          className={`lg-${theme}`}
          onLoggedIn={(u) => addLog(`LoggedIn: ${u.userName}`)}
        />
      )}
      <div style={{ marginTop: 12 }}>{view && <WebFormsLoginView controller={view} className={`lg-${theme}`} />}</div>
      <p style={note}>
        Demo accounts: <code>admin</code> and <code>sam</code>, password <code>Password123!</code>. The in-memory
        provider stores plain-text passwords: for demos only. Role views are cosmetic, never security.
      </p>
      <EventLog lines={log} />
    </div>
  );
}

/* ------------------------------------------------------------ Validation */

const GROUP = 'galleryEmployee';

export function ValidationDemo() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const latest = useRef({ name, email, salary });
  latest.current = { name, email, salary };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [log, addLog] = useLog();
  const kit = useRef<{ validators: BaseValidatorController[]; summary: ValidationSummaryController } | null>(null);

  // Validators register in their constructors: create in an effect and dispose on unmount.
  useEffect(() => {
    const validators: BaseValidatorController[] = [
      new RequiredFieldValidatorController({ id: 'gReqName', controlToValidate: 'gName', errorMessage: 'Name is required.', validationGroup: GROUP }),
      new RegularExpressionValidatorController({
        id: 'gReEmail',
        controlToValidate: 'gEmail',
        validationExpression: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
        errorMessage: 'E-mail is not valid.',
        validationGroup: GROUP,
      }),
      // type must be set: the default "String" would compare "9" > "100" as text
      new RangeValidatorController({
        id: 'gRngSalary',
        controlToValidate: 'gSalary',
        minimumValue: 1,
        maximumValue: 500000,
        type: 'Integer',
        errorMessage: 'Salary must be between 1 and 500000.',
        validationGroup: GROUP,
      }),
    ];
    const sum = new ValidationSummaryController({ id: 'gSum', validationGroup: GROUP, headerText: 'Please fix:', displayMode: 'BulletList' });
    kit.current = { validators, summary: sum };
    const offs = (['gName', 'gEmail', 'gSalary'] as const).map((id) =>
      ValidatorManager.registerValueAccessor(id, () => {
        const v = latest.current;
        return id === 'gName' ? v.name : id === 'gEmail' ? v.email : v.salary;
      }),
    );
    return () => {
      offs.forEach((off) => off());
      validators.forEach((v) => v.dispose());
      kit.current = null;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await ValidatorManager.validate(GROUP);
    const k = kit.current;
    const next: Record<string, string> = {};
    if (k && !ok) {
      for (const v of k.validators) {
        if (!v.isValid) next[v.controlToValidate] = v.errorMessage;
      }
    }
    setErrors(next);
    setSummary(ok || !k ? [] : k.summary.getErrorMessages());
    setSaved(ok);
    addLog(`Page_IsValid = ${ok} (group "${GROUP}")`);
  };

  const field = (label: string, id: string, value: string, set: (v: string) => void) => (
    <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        className={errors[id] ? 'is-invalid' : ''}
        aria-invalid={errors[id] ? true : undefined}
        style={{ padding: '6px 8px' }}
      />
      {errors[id] && <span className="vl-dark" role="alert">{errors[id]}</span>}
    </label>
  );

  return (
    <div style={panel}>
      <form onSubmit={(e) => void submit(e)} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        {field('Name', 'gName', name, setName)}
        {field('E-mail', 'gEmail', email, setEmail)}
        {field('Salary', 'gSalary', salary, setSalary)}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn-primary">Validate &amp; Save</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setName('');
              setEmail('');
              setSalary('');
              setErrors({});
              setSummary([]);
              setSaved(false);
            }}
          >
            Reset
          </button>
        </div>
        {summary.length > 0 && (
          <div className="vl-dark" role="alert">
            <b>Please fix:</b>
            <ul>{summary.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}
        {saved && <p style={{ color: 'var(--aa-status-success, #16a34a)', fontWeight: 600 }}>Valid: ready to save.</p>}
      </form>
      <p style={note}>
        Real <code>RequiredFieldValidator</code>, <code>RegularExpressionValidator</code>, <code>RangeValidator</code>{' '}
        and <code>ValidationSummary</code>, run through <code>ValidatorManager.validate(group)</code>.
      </p>
      <EventLog lines={log} />
    </div>
  );
}

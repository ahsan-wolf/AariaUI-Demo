// Single source of truth for the Free / Pro / Enterprise model shown in the gallery.
// Mirrors docs/EDITIONS.md and FEATURES in packages/license/src/index.ts (scripts/check-registry-links.mjs verifies
// that every control's `edition` agrees with FEATURES).
import type { Edition } from '../types/gallery';

export interface EditionInfo {
  id: Edition;
  label: string;
  license: string;
  registry: string;
  summary: string;
  packages: string[];
  /** Example install command. */
  install: string;
}

export const EDITIONS: Record<Exclude<Edition, 'demo'>, EditionInfo> = {
  free: {
    id: 'free',
    label: 'Free',
    license: 'MIT',
    registry: 'public npm',
    summary: 'Headless core, validation, navigation, tabs, modal, login (membership), DataGrid, SqlDataSource, behaviors, Calendar, Xml, AdRotator, modern theme.',
    packages: ['@wf-controls/data', '@wf-controls/core', '@wf-controls/styles', '@wf-controls/react', '@wf-controls/angular', '@wf-controls/license'],
    install: 'npm install @wf-controls/core @wf-controls/react',
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    license: 'Commercial (signed key)',
    registry: 'private registry',
    summary: 'Free, plus GridView, DataList, Repeater, the Object / Access / Xml data sources and DualList.',
    packages: ['@wf-controls/pro-data', '@wf-controls/pro-data-react', '@wf-controls/pro-data-angular', '@wf-controls/pro-extras', '@wf-controls/pro-extras-react', '@wf-controls/pro-extras-angular'],
    install: 'npm install @wf-controls/pro-data @wf-controls/pro-data-react @wf-controls/license',
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    license: 'Commercial (signed key)',
    registry: 'private registry',
    summary: 'Pro, plus Authentication & Authorization (Forms authentication, URL authorization, Windows/SSO/JWT identities) and SqlWhereBuilder.',
    packages: ['@wf-controls/enterprise-security', '@wf-controls/enterprise-security-react', '@wf-controls/enterprise-security-angular', '@wf-controls/enterprise-extras', '@wf-controls/enterprise-extras-react', '@wf-controls/enterprise-extras-angular'],
    install: 'npm install @wf-controls/enterprise-security @wf-controls/enterprise-security-react @wf-controls/license',
  },
};

export const EDITION_LABEL: Record<Edition, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise', demo: 'Gallery demo' };

/** The tier table: one row per area. */
export const TIER_TABLE: { area: string; free: string; pro: string; enterprise: string }[] = [
  { area: 'Data layer', free: 'ADO.NET layer (DataSet, DataTable, DataView), DataGrid, SqlDataSource, SiteMapDataSource, Parameters', pro: 'GridView, DataList, Repeater, ObjectDataSource, AccessDataSource, XmlDataSource (+ React / Angular adapters)', enterprise: 'all of Pro' },
  { area: 'UI controls', free: 'Validation, Navigation (Menu, TreeView, SiteMapPath), Tabs, Modal, behaviors, Calendar, Xml, AdRotator, modern theme', pro: 'DualList', enterprise: 'SqlWhereBuilder' },
  { area: 'Security', free: 'Login family (membership), principals, basic roles, PasswordPolicy', pro: 'all of Free', enterprise: 'FormsAuthentication, UrlAuthorization, Windows / SSO / JWT identities, REST membership provider' },
];

/** What happens without a license key (evaluation mode) versus a trial and a license. */
export const EVALUATION_TABLE: { aspect: string; unlicensed: string; trial: string; licensed: string }[] = [
  { aspect: 'Rows shown (Pro data controls)', unlicensed: 'first 10', trial: 'first 10', licensed: 'all' },
  { aspect: 'Edit, update, delete, add', unlicensed: 'blocked', trial: 'allowed', licensed: 'allowed' },
  { aspect: 'Notice / watermark', unlicensed: 'yes (red)', trial: 'yes (trial)', licensed: 'none' },
  { aspect: 'Enterprise sessions (Forms ticket)', unlicensed: '5 minutes, not persistent', trial: '5 minutes, not persistent', licensed: 'as configured' },
  { aspect: 'Console', unlicensed: 'one warning per feature', trial: '-', licensed: '-' },
];

/** Standard activation snippet shown next to Pro / Enterprise code samples. */
export const ACTIVATE_SNIPPET = `import { License } from "@wf-controls/license";

License.configure({ publicKeys: [PUBLIC_KEY_JWK] });   // the vendor's PUBLIC key, once at start-up
await License.activate(token);                         // your license token`;

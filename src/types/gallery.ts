/** The `jquery` key is kept for compatibility; in the UI it is labelled "Plain JS" (there is no jQuery package: the samples use `@wf-controls/core` directly). */
export type Framework = 'react' | 'angular' | 'jquery';

/** Which product edition a control ships in. `demo` = gallery-only demo, not a published package. */
export type Edition = 'free' | 'pro' | 'enterprise' | 'demo';
export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'normal' | 'comfortable';

export type ControlCategory =
  | 'Data Controls'
  | 'ADO.NET Data Core'
  | 'Data Sources'
  | 'Input & Validation'
  | 'Navigation'
  | 'AJAX & Behaviors'
  | 'Login & Security'
  | 'Specialized';

export interface PropItem {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export interface EventItem {
  name: string;
  arguments: string;
  cancellable: boolean;
  description: string;
}

export interface MethodItem {
  name: string;
  signature: string;
  returnType: string;
  description: string;
}

export interface ControlDefinition {
  id: string;
  name: string;
  category: ControlCategory;
  aspEquivalent: string;
  badge?: 'Stable' | 'New';
  /** Free (MIT) / Pro / Enterprise (signed license, private registry) / demo. See data/editions.ts and docs/EDITIONS.md. */
  edition: Edition;
  /** Package that provides the controller, e.g. `@wf-controls/pro-data`. */
  package: string;
  /** Adapter packages that render it, when they differ from `package`. */
  adapterPackages?: { react?: string; angular?: string };
  /** License feature id (FEATURES in @wf-controls/license) that gates it, for Pro/Enterprise controls. */
  featureId?: string;
  tagline: string;
  description: string;
  features: string[];
  supportedFrameworks: Framework[];
  props: PropItem[];
  events: EventItem[];
  methods: MethodItem[];
  codeSamples: {
    react: string;
    angular: string;
    jquery: string;
  };
  migrationNotes: string;
  /** Where the accurate, generated API reference for this control lives (src/data/apiDocs). */
  docs?: { areaId: string; entryId: string };
}

export interface NavRoute {
  page: 'home' | 'controls' | 'migration' | 'docs' | 'api' | 'styles' | 'editions';
  controlId?: string;
}

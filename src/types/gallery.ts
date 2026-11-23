export type Framework = 'react' | 'angular' | 'jquery';
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
  badge?: 'Stable' | 'Enterprise' | 'AI' | 'New';
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
  page: 'home' | 'controls' | 'migration' | 'docs' | 'api' | 'styles';
  controlId?: string;
}

/** Feature registry: optional packages (extras, pro, enterprise) announce what they add. No license logic here. */

export interface FeatureInfo {
  /** Stable id, e.g. "extras.dualList". */
  id: string;
  /** Package that provides it. */
  package: string;
  description?: string | undefined;
}

const registry = new Map<string, FeatureInfo>();

export function registerFeature(info: FeatureInfo): void {
  registry.set(info.id, info);
}

export function isFeatureRegistered(id: string): boolean {
  return registry.has(id);
}

export function listFeatures(): readonly FeatureInfo[] {
  return [...registry.values()];
}

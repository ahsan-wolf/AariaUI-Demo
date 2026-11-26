/** Feature registry: optional packages (extras, pro, enterprise) announce what they add. No license logic here. */
export interface FeatureInfo {
    /** Stable id, e.g. "extras.dualList". */
    id: string;
    /** Package that provides it. */
    package: string;
    description?: string | undefined;
}
export declare function registerFeature(info: FeatureInfo): void;
export declare function isFeatureRegistered(id: string): boolean;
export declare function listFeatures(): readonly FeatureInfo[];

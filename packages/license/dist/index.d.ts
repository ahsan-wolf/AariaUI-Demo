/** Offline license verification (WebCrypto) and feature gating. Token format: AAIRA-<h>.<p>.<sig> (License Studio). */
export type Edition = "free" | "pro" | "enterprise";
export type Alg = "EdDSA" | "ES256" | "PS256";
export interface LicensePayload {
    v: number;
    id: string;
    customer: string;
    tier: string;
    seats: number;
    apps?: string[];
    issued: string;
    updatesUntil: string;
    /** Extra feature ids granted on top of the tier (custom bundles). Unknown ids are ignored. */
    features?: string[];
    /** Stable customer id (for support and revocation lists). */
    customerId?: string;
}
/** Feature id -> lowest edition that includes it. See docs/EDITIONS.md for the tier map. */
export declare const FEATURES: {
    readonly "core.basic": "free";
    readonly "styles.theme.modern": "free";
    readonly "data.gridView": "pro";
    readonly "data.dataList": "pro";
    readonly "data.repeater": "pro";
    readonly "datasource.object": "pro";
    readonly "datasource.access": "pro";
    readonly "datasource.xml": "pro";
    readonly "extras.dualList": "pro";
    readonly "styles.themes.all": "pro";
    readonly "validation.async": "pro";
    readonly "extras.sqlWhereBuilder": "enterprise";
    readonly "security.auth": "enterprise";
    readonly "security.sso": "enterprise";
    readonly "security.rbac": "enterprise";
    readonly "styles.themeBuilder": "enterprise";
    readonly "migration.engine": "enterprise";
};
export type FeatureId = keyof typeof FEATURES;
export declare function editionForTier(tier: string): Edition;
export type Reason = "none" | "malformed" | "unsupported-algorithm" | "no-public-key" | "bad-signature" | "expired" | "wrong-application" | "release-not-covered" | "unsigned-trial-disabled";
export interface LicenseState {
    valid: boolean;
    edition: Edition;
    reason: Reason;
    license?: LicensePayload;
    trial: boolean;
}
export declare class LicenseError extends Error {
    readonly feature: string;
    readonly required: Edition;
    constructor(feature: string, required: Edition, current: Edition);
}
export interface ActivateOptions {
    releaseDate?: string | Date;
    appName?: string;
    now?: Date;
}
export interface TrialOptions {
    edition?: Edition;
    days?: number;
    maxRows?: number;
    maxConditions?: number;
    maxSelectedItems?: number;
    customer?: string;
}
/** Rows shown by data controls in evaluation mode (unlicensed or trial) unless a trial sets `maxRows`. */
export declare const EVAL_MAX_ROWS = 10;
export declare const UNLICENSED_WATERMARK_TEXT = "WebForms-TS-Controls - Unlicensed: evaluation limits apply";
export declare const TRIAL_WATERMARK_TEXT = "WebForms-TS-Controls Trial Edition - For Evaluation Only";
/** Release date of this build; bump on each release. */
export declare const RELEASE_DATE = "2026-11-20";
export declare class LicenseManager {
    private keys;
    /** Dev/test only. Production builds never accept an unsigned trial: use a signed trial token. */
    allowUnsignedTrial: boolean;
    private state;
    private warned;
    configure(o: {
        publicKeys: JsonWebKey[];
        replace?: boolean;
    }): void;
    /** Never throws; failures leave the free edition active. */
    activate(token: string, o?: ActivateOptions): Promise<LicenseState>;
    reset(): void;
    private trialOptions?;
    get isTrial(): boolean;
    get watermarkText(): string | undefined;
    /** Watermark for one feature: trial text, unlicensed text, or nothing when fully licensed. */
    watermarkFor(f: FeatureId): string | undefined;
    /** Row cap for data controls in trial mode (see `rowLimit()` for the per-feature answer, which includes unlicensed use). */
    get maxRows(): number | undefined;
    /**
     * True when a paid control must run with evaluation limits: the feature is not licensed, or the license is a trial.
     * Controls use it to cap rows, disable editing and show the watermark.
     */
    evaluation(f: FeatureId): boolean;
    /** Row cap for one feature: `undefined` when fully licensed. */
    rowLimit(f: FeatureId): number | undefined;
    get maxConditions(): number | undefined;
    get maxSelectedItems(): number | undefined;
    /**
     * Dev/test helper: an UNSIGNED trial (unlocks the edition with trial limits). Disabled by default, so a user
     * cannot unlock a paid control from the console. Enable with `License.allowUnsignedTrial = true` in demos and tests.
     * Production trials are signed tokens: `License.activate(trialToken)`.
     */
    enableTrial(o?: TrialOptions): LicenseState;
    get current(): LicenseState;
    get edition(): Edition;
    has(f: FeatureId): boolean;
    assert(f: FeatureId): void;
    /** Soft gate: false when unlicensed; warns once per feature. */
    require(f: FeatureId, onUnlicensed?: (e: LicenseError) => void): boolean;
    verify(token: string, o?: ActivateOptions): Promise<LicenseState>;
}
/** Shared singleton for all paid packages. */
export declare const License: LicenseManager;
export declare const setLicenseKey: (t: string, o?: ActivateOptions) => Promise<LicenseState>;
export declare const enableTrial: (o?: TrialOptions) => LicenseState;
export declare const isTrial: () => boolean;
export declare const getWatermarkText: () => string | undefined;
export declare const getMaxRows: () => number | undefined;
export declare const getMaxConditions: () => number | undefined;
export declare const getMaxSelectedItems: () => number | undefined;
export declare const requireFeature: (f: FeatureId, cb?: (e: LicenseError) => void) => boolean;
export declare const assertFeature: (f: FeatureId) => void;

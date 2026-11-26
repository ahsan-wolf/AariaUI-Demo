import { type FeatureId } from "@wf-controls/license";
/** Rows allowed in evaluation mode, or `undefined` when fully licensed. */
export declare function rowLimit(feature: FeatureId): number | undefined;
/** Cap `rows` to the evaluation limit (a copy is returned only when something is cut). */
export declare function limitRows<T>(feature: FeatureId, rows: T[]): T[];
/** True (and warns once) when the feature is not licensed: editing, inserting and deleting are blocked. */
export declare function blockUnlicensed(feature: FeatureId, what: string): boolean;
/** Text for adapters to show next to the control, or `undefined` when fully licensed. */
export declare function evaluationNotice(feature: FeatureId): string | undefined;
/** Test helper: forget which warnings were printed. */
export declare function resetEvaluationWarnings(): void;
/**
 * Applies the evaluation rules to a data source instance: `select` is capped, writes return 0 when unlicensed.
 * Call it at the end of the data source constructor.
 */
export declare function gateDataSource(ds: object, feature: FeatureId): void;

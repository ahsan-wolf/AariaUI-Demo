import { License, type FeatureId } from "@wf-controls/license";

// Evaluation behaviour shared by the Pro data controls.
//   unlicensed: rows are capped, editing/commands are blocked, a watermark is shown, one console warning per feature.
//   trial:      rows are capped (License.maxRows), editing works, trial watermark is shown.
//   licensed:   no limits.

const warned = new Set<string>();

/** Rows allowed in evaluation mode, or `undefined` when fully licensed. */
export function rowLimit(feature: FeatureId): number | undefined {
  return License.rowLimit(feature);
}

/** Cap `rows` to the evaluation limit (a copy is returned only when something is cut). */
export function limitRows<T>(feature: FeatureId, rows: T[]): T[] {
  const cap = rowLimit(feature);
  if (cap === undefined || rows.length <= cap) return rows;
  warnOnce(feature + ":rows", `[wf-controls] Evaluation limit: ${feature} shows only the first ${cap} records. Activate a license to remove the limit.`);
  return rows.slice(0, cap);
}

/** True (and warns once) when the feature is not licensed: editing, inserting and deleting are blocked. */
export function blockUnlicensed(feature: FeatureId, what: string): boolean {
  if (License.has(feature)) return false;
  warnOnce(feature + ":" + what, `[wf-controls] ${what} is disabled: "${feature}" is not licensed (evaluation mode). Call License.activate(token).`);
  return true;
}

/** Text for adapters to show next to the control, or `undefined` when fully licensed. */
export function evaluationNotice(feature: FeatureId): string | undefined {
  const cap = rowLimit(feature);
  if (cap === undefined) return undefined;
  const mark = License.watermarkFor(feature) ?? "Evaluation";
  return License.has(feature) ? `${mark} [first ${cap} records]` : `${mark} [first ${cap} records, editing disabled]`;
}

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

/** Test helper: forget which warnings were printed. */
export function resetEvaluationWarnings(): void {
  warned.clear();
}

interface WritableSource {
  select(...args: never[]): Promise<unknown>;
  insert(...args: never[]): Promise<number>;
  update(...args: never[]): Promise<number>;
  delete(...args: never[]): Promise<number>;
}

/**
 * Applies the evaluation rules to a data source instance: `select` is capped, writes return 0 when unlicensed.
 * Call it at the end of the data source constructor.
 */
export function gateDataSource(ds: object, feature: FeatureId): void {
  const target = ds as WritableSource;
  const select = target.select.bind(ds) as (...a: unknown[]) => Promise<unknown>;
  (target as { select: unknown }).select = async (...args: unknown[]): Promise<unknown> => {
    const res = await select(...args);
    if (Array.isArray(res)) return limitRows(feature, res);
    if (res && typeof res === "object" && Array.isArray((res as { items?: unknown }).items)) {
      const r = res as { items: unknown[]; total?: number };
      const cap = rowLimit(feature);
      return cap === undefined ? res : { ...r, items: limitRows(feature, r.items), ...(typeof r.total === "number" ? { total: Math.min(r.total, cap) } : {}) };
    }
    return res;
  };
  for (const op of ["insert", "update", "delete"] as const) {
    const orig = target[op].bind(ds) as (...a: unknown[]) => Promise<number>;
    (target as unknown as Record<string, unknown>)[op] = async (...args: unknown[]): Promise<number> =>
      blockUnlicensed(feature, `${op}`) ? 0 : orig(...args);
  }
}

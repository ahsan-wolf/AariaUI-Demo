import { License } from "@wf-controls/license";
// Evaluation behaviour shared by the Pro data controls.
//   unlicensed: rows are capped, editing/commands are blocked, a watermark is shown, one console warning per feature.
//   trial:      rows are capped (License.maxRows), editing works, trial watermark is shown.
//   licensed:   no limits.
const warned = new Set();
/** Rows allowed in evaluation mode, or `undefined` when fully licensed. */
export function rowLimit(feature) {
    return License.rowLimit(feature);
}
/** Cap `rows` to the evaluation limit (a copy is returned only when something is cut). */
export function limitRows(feature, rows) {
    const cap = rowLimit(feature);
    if (cap === undefined || rows.length <= cap)
        return rows;
    warnOnce(feature + ":rows", `[wf-controls] Evaluation limit: ${feature} shows only the first ${cap} records. Activate a license to remove the limit.`);
    return rows.slice(0, cap);
}
/** True (and warns once) when the feature is not licensed: editing, inserting and deleting are blocked. */
export function blockUnlicensed(feature, what) {
    if (License.has(feature))
        return false;
    warnOnce(feature + ":" + what, `[wf-controls] ${what} is disabled: "${feature}" is not licensed (evaluation mode). Call License.activate(token).`);
    return true;
}
/** Text for adapters to show next to the control, or `undefined` when fully licensed. */
export function evaluationNotice(feature) {
    const cap = rowLimit(feature);
    if (cap === undefined)
        return undefined;
    const mark = License.watermarkFor(feature) ?? "Evaluation";
    return License.has(feature) ? `${mark} [first ${cap} records]` : `${mark} [first ${cap} records, editing disabled]`;
}
function warnOnce(key, message) {
    if (warned.has(key))
        return;
    warned.add(key);
    console.warn(message);
}
/** Test helper: forget which warnings were printed. */
export function resetEvaluationWarnings() {
    warned.clear();
}
/**
 * Applies the evaluation rules to a data source instance: `select` is capped, writes return 0 when unlicensed.
 * Call it at the end of the data source constructor.
 */
export function gateDataSource(ds, feature) {
    const target = ds;
    const select = target.select.bind(ds);
    target.select = async (...args) => {
        const res = await select(...args);
        if (Array.isArray(res))
            return limitRows(feature, res);
        if (res && typeof res === "object" && Array.isArray(res.items)) {
            const r = res;
            const cap = rowLimit(feature);
            return cap === undefined ? res : { ...r, items: limitRows(feature, r.items), ...(typeof r.total === "number" ? { total: Math.min(r.total, cap) } : {}) };
        }
        return res;
    };
    for (const op of ["insert", "update", "delete"]) {
        const orig = target[op].bind(ds);
        target[op] = async (...args) => blockUnlicensed(feature, `${op}`) ? 0 : orig(...args);
    }
}
//# sourceMappingURL=evaluation.js.map
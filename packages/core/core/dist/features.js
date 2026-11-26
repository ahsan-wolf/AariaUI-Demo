/** Feature registry: optional packages (extras, pro, enterprise) announce what they add. No license logic here. */
const registry = new Map();
export function registerFeature(info) {
    registry.set(info.id, info);
}
export function isFeatureRegistered(id) {
    return registry.has(id);
}
export function listFeatures() {
    return [...registry.values()];
}
//# sourceMappingURL=features.js.map
// @wf-controls/pro-data (PRO, commercial): GridView, DataList, Repeater and the Object/Access/Xml data sources.
// Without a license they run in evaluation mode: rows are capped, editing is disabled and a notice is shown.
export * from "./grid-view.js";
export * from "./repeater.js";
export * from "./data-list.js";
export * from "./object-data-source.js";
export * from "./access-data-source.js";
export * from "./xml-data-source.js";
export { EVAL_MAX_ROWS } from "@wf-controls/license";
import { registerFeature } from "@wf-controls/core";
registerFeature({ id: "data.gridView", package: "@wf-controls/pro-data", description: "GridView" });
registerFeature({ id: "data.dataList", package: "@wf-controls/pro-data", description: "DataList" });
registerFeature({ id: "data.repeater", package: "@wf-controls/pro-data", description: "Repeater" });
registerFeature({ id: "datasource.object", package: "@wf-controls/pro-data", description: "ObjectDataSource" });
registerFeature({ id: "datasource.access", package: "@wf-controls/pro-data", description: "AccessDataSource" });
registerFeature({ id: "datasource.xml", package: "@wf-controls/pro-data", description: "XmlDataSource" });
//# sourceMappingURL=index.js.map
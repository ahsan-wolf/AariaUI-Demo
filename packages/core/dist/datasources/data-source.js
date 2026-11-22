import { EventDispatcher } from "../events.js";
export class DataSourceControl {
    id;
    parameterContext;
    selecting = new EventDispatcher();
    selected = new EventDispatcher();
    inserting = new EventDispatcher();
    inserted = new EventDispatcher();
    updating = new EventDispatcher();
    updated = new EventDispatcher();
    deleting = new EventDispatcher();
    deleted = new EventDispatcher();
    constructor(id) {
        this.id = id;
    }
    evaluateParameters(params) {
        return params.evaluate(this.parameterContext);
    }
}
//# sourceMappingURL=data-source.js.map
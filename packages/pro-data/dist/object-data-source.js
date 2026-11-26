import { DataSourceControl } from "@wf-controls/core";
import { ParameterCollection } from "@wf-controls/core";
import { requireFeature } from "@wf-controls/license";
import { gateDataSource } from "./evaluation.js";
export class ObjectDataSource extends DataSourceControl {
    typeName;
    typeInstance;
    selectMethod;
    insertMethod;
    updateMethod;
    deleteMethod;
    selectParameters;
    insertParameters;
    updateParameters;
    deleteParameters;
    enablePaging;
    startRowIndexParameterName;
    maximumRowsParameterName;
    sortParameterName;
    constructor(options) {
        super(options.id);
        this.typeName = options.typeName;
        this.typeInstance = options.typeInstance;
        this.selectMethod = options.selectMethod;
        this.insertMethod = options.insertMethod;
        this.updateMethod = options.updateMethod;
        this.deleteMethod = options.deleteMethod;
        this.selectParameters =
            options.selectParameters instanceof ParameterCollection
                ? options.selectParameters
                : new ParameterCollection(options.selectParameters);
        this.insertParameters =
            options.insertParameters instanceof ParameterCollection
                ? options.insertParameters
                : new ParameterCollection(options.insertParameters);
        this.updateParameters =
            options.updateParameters instanceof ParameterCollection
                ? options.updateParameters
                : new ParameterCollection(options.updateParameters);
        this.deleteParameters =
            options.deleteParameters instanceof ParameterCollection
                ? options.deleteParameters
                : new ParameterCollection(options.deleteParameters);
        this.enablePaging = options.enablePaging ?? false;
        this.startRowIndexParameterName = options.startRowIndexParameterName ?? "startRowIndex";
        this.maximumRowsParameterName = options.maximumRowsParameterName ?? "maximumRows";
        this.sortParameterName = options.sortParameterName ?? "sortExpression";
        requireFeature("datasource.object");
        gateDataSource(this, "datasource.object");
    }
    async getInstance() {
        if (!this.typeInstance) {
            throw new Error(`ObjectDataSource '${this.id}' has no typeInstance configured.`);
        }
        const inst = typeof this.typeInstance === "function"
            ? await this.typeInstance()
            : this.typeInstance;
        return inst;
    }
    async select(selectArgs = {}) {
        const parameters = this.evaluateParameters(this.selectParameters);
        if (this.enablePaging) {
            if (selectArgs.startRowIndex !== undefined) {
                parameters[this.startRowIndexParameterName] = selectArgs.startRowIndex;
            }
            if (selectArgs.maximumRows !== undefined) {
                parameters[this.maximumRowsParameterName] = selectArgs.maximumRows;
            }
        }
        if (selectArgs.sortExpression && this.sortParameterName) {
            parameters[this.sortParameterName] = selectArgs.sortExpression;
        }
        const selectingArgs = {
            arguments: selectArgs,
            parameters,
            cancel: false
        };
        await this.selecting.emit(this, selectingArgs);
        if (selectingArgs.cancel) {
            return [];
        }
        const instance = await this.getInstance();
        const method = instance[this.selectMethod];
        if (typeof method !== "function") {
            throw new Error(`Method '${this.selectMethod}' not found on typeInstance for ObjectDataSource '${this.id}'.`);
        }
        const data = await method.call(instance, selectingArgs.parameters, selectArgs);
        let totalRowCount;
        if (Array.isArray(data)) {
            totalRowCount = data.length;
        }
        else if (data && typeof data === "object" && "total" in data) {
            totalRowCount = Number(data.total);
        }
        await this.selected.emit(this, { data, totalRowCount });
        return data;
    }
    async insert(values) {
        if (!this.insertMethod) {
            throw new Error(`ObjectDataSource '${this.id}' has no insertMethod configured.`);
        }
        const parameters = {
            ...this.evaluateParameters(this.insertParameters),
            ...values
        };
        const insertingArgs = {
            values: parameters,
            cancel: false
        };
        await this.inserting.emit(this, insertingArgs);
        if (insertingArgs.cancel) {
            return 0;
        }
        let affectedRows = 0;
        let returnValue;
        let exception;
        try {
            const instance = await this.getInstance();
            const method = instance[this.insertMethod];
            if (typeof method !== "function") {
                throw new Error(`Method '${this.insertMethod}' not found on typeInstance for ObjectDataSource '${this.id}'.`);
            }
            returnValue = await method.call(instance, insertingArgs.values);
            affectedRows = typeof returnValue === "number" ? returnValue : 1;
        }
        catch (err) {
            exception = err instanceof Error ? err : new Error(String(err));
        }
        const insertedArgs = {
            affectedRows,
            returnValue,
            exception,
            exceptionHandled: false
        };
        await this.inserted.emit(this, insertedArgs);
        if (exception && !insertedArgs.exceptionHandled) {
            throw exception;
        }
        return affectedRows;
    }
    async update(keys, values, oldValues) {
        if (!this.updateMethod) {
            throw new Error(`ObjectDataSource '${this.id}' has no updateMethod configured.`);
        }
        const parameters = {
            ...this.evaluateParameters(this.updateParameters),
            ...oldValues,
            ...keys,
            ...values
        };
        const updatingArgs = {
            keys,
            values: parameters,
            oldValues,
            cancel: false
        };
        await this.updating.emit(this, updatingArgs);
        if (updatingArgs.cancel) {
            return 0;
        }
        let affectedRows = 0;
        let returnValue;
        let exception;
        try {
            const instance = await this.getInstance();
            const method = instance[this.updateMethod];
            if (typeof method !== "function") {
                throw new Error(`Method '${this.updateMethod}' not found on typeInstance for ObjectDataSource '${this.id}'.`);
            }
            returnValue = await method.call(instance, updatingArgs.values, keys, oldValues);
            affectedRows = typeof returnValue === "number" ? returnValue : 1;
        }
        catch (err) {
            exception = err instanceof Error ? err : new Error(String(err));
        }
        const updatedArgs = {
            affectedRows,
            returnValue,
            exception,
            exceptionHandled: false
        };
        await this.updated.emit(this, updatedArgs);
        if (exception && !updatedArgs.exceptionHandled) {
            throw exception;
        }
        return affectedRows;
    }
    async delete(keys, oldValues) {
        if (!this.deleteMethod) {
            throw new Error(`ObjectDataSource '${this.id}' has no deleteMethod configured.`);
        }
        const parameters = {
            ...this.evaluateParameters(this.deleteParameters),
            ...oldValues,
            ...keys
        };
        const deletingArgs = {
            keys,
            oldValues,
            cancel: false
        };
        await this.deleting.emit(this, deletingArgs);
        if (deletingArgs.cancel) {
            return 0;
        }
        let affectedRows = 0;
        let returnValue;
        let exception;
        try {
            const instance = await this.getInstance();
            const method = instance[this.deleteMethod];
            if (typeof method !== "function") {
                throw new Error(`Method '${this.deleteMethod}' not found on typeInstance for ObjectDataSource '${this.id}'.`);
            }
            returnValue = await method.call(instance, deletingArgs.keys, oldValues);
            affectedRows = typeof returnValue === "number" ? returnValue : 1;
        }
        catch (err) {
            exception = err instanceof Error ? err : new Error(String(err));
        }
        const deletedArgs = {
            affectedRows,
            returnValue,
            exception,
            exceptionHandled: false
        };
        await this.deleted.emit(this, deletedArgs);
        if (exception && !deletedArgs.exceptionHandled) {
            throw exception;
        }
        return affectedRows;
    }
}
//# sourceMappingURL=object-data-source.js.map
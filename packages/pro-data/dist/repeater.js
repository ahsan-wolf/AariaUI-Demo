import { EventDispatcher } from "@wf-controls/core";
import { DataTable, DataView } from "@wf-controls/core";
import { requireFeature } from "@wf-controls/license";
import { blockUnlicensed, evaluationNotice, limitRows } from "./evaluation.js";
function isDataSourceControl(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        !(obj instanceof DataTable) &&
        !(obj instanceof DataView) &&
        "select" in obj &&
        typeof obj.select === "function");
}
export class RepeaterController {
    options;
    /** False when "data.repeater" is not licensed: rows are capped and editing is disabled (evaluation mode). */
    licensed = requireFeature("data.repeater");
    get evaluationNotice() { return evaluationNotice("data.repeater"); }
    source = [];
    currentIndex = -1;
    resetDepth = 0;
    editIndex = -1;
    dataBinding = new EventDispatcher();
    dataBound = new EventDispatcher();
    itemCreated = new EventDispatcher();
    itemDataBound = new EventDispatcher();
    itemCommand = new EventDispatcher();
    currentItemIndexChanged = new EventDispatcher();
    itemEditing = new EventDispatcher();
    itemUpdating = new EventDispatcher();
    itemUpdated = new EventDispatcher();
    itemCancelingEdit = new EventDispatcher();
    onDrawItem = new EventDispatcher();
    onItemCloned = new EventDispatcher();
    onItemValueNeeded = new EventDispatcher();
    onItemValuePushed = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options) {
        this.options = options;
    }
    get items() {
        return this.source;
    }
    get currentItemIndex() {
        return this.currentIndex;
    }
    get editItemIndex() {
        return this.editIndex;
    }
    get itemCount() {
        return this.source.length;
    }
    get isResetting() {
        return this.resetDepth > 0;
    }
    getDataKey(item, index) {
        return this.options.dataKeyField ? item[this.options.dataKeyField] : index;
    }
    async dataBind(data) {
        if (data !== undefined) {
            this.options.dataSource = data;
        }
        const sourceToBind = this.options.dataSource;
        let items = [];
        if (sourceToBind) {
            if (Array.isArray(sourceToBind)) {
                items = [...sourceToBind];
            }
            else if (sourceToBind instanceof DataTable) {
                items = sourceToBind.rows.toArray().map((r) => r.toObject());
            }
            else if (sourceToBind instanceof DataView) {
                items = sourceToBind.toRows().map((r) => r.toObject());
            }
            else if (isDataSourceControl(sourceToBind)) {
                const res = await sourceToBind.select();
                if (Array.isArray(res)) {
                    items = [...res];
                }
                else if (res instanceof DataTable) {
                    items = res.rows.toArray().map((r) => r.toObject());
                }
                else if (res instanceof DataView) {
                    items = res.toRows().map((r) => r.toObject());
                }
                else if (res &&
                    typeof res === "object" &&
                    "items" in res) {
                    const arr = res.items;
                    if (Array.isArray(arr))
                        items = [...arr];
                }
            }
        }
        items = limitRows("data.repeater", items);
        await this.dataBinding.emit(this, { itemCount: items.length });
        this.source = items;
        await this.itemCreated.emit(this, { itemIndex: -1, itemType: "Header" });
        for (let i = 0; i < this.source.length; i++) {
            let dataItem = this.source[i];
            if (!dataItem)
                continue;
            if (this.options.virtualMode) {
                const valueArgs = {
                    itemIndex: i,
                    itemType: i % 2 === 0 ? "Item" : "AlternatingItem",
                    dataItem,
                    ...(this.options.dataMember === undefined
                        ? {}
                        : { dataMember: this.options.dataMember }),
                    value: dataItem
                };
                await this.onItemValueNeeded.emit(this, valueArgs);
                dataItem = valueArgs.value ?? dataItem;
            }
            const itemType = i % 2 === 0 ? "Item" : "AlternatingItem";
            const args = { itemIndex: i, itemType, dataItem };
            await this.itemCreated.emit(this, args);
            await this.itemDataBound.emit(this, args);
            await this.onItemCloned.emit(this, args);
            await this.onDrawItem.emit(this, args);
            if (i < this.source.length - 1)
                await this.itemCreated.emit(this, { itemIndex: i, itemType: "Separator" });
        }
        await this.itemCreated.emit(this, { itemIndex: this.source.length, itemType: "Footer" });
        await this.dataBound.emit(this, { itemCount: this.source.length });
        if (this.currentIndex >= this.source.length)
            this.currentIndex = -1;
        await this.stateChanged.emit(this, { reason: "dataBind" });
    }
    async setCurrentItemIndex(index) {
        if (index < -1 || index >= this.source.length)
            throw new RangeError(`Repeater item ${index} does not exist.`);
        this.currentIndex = index;
        await this.currentItemIndexChanged.emit(this, {
            itemIndex: index,
            itemType: index < 0 ? "Item" : index % 2 === 0 ? "Item" : "AlternatingItem",
            ...(index < 0 ? {} : { dataItem: this.source[index] })
        });
        await this.stateChanged.emit(this, { reason: "setCurrentItemIndex" });
    }
    async beginResetItemTemplate() {
        this.resetDepth++;
        await this.stateChanged.emit(this, { reason: "beginResetItemTemplate" });
    }
    async endResetItemTemplate() {
        if (this.resetDepth > 0)
            this.resetDepth--;
        await this.stateChanged.emit(this, { reason: "endResetItemTemplate" });
    }
    async addItem(item) {
        if (blockUnlicensed("data.repeater", "adding"))
            return;
        this.source.push(item);
        await this.onItemValuePushed.emit(this, {
            itemIndex: this.source.length - 1,
            itemType: "Item",
            dataItem: item,
            ...(this.options.dataMember === undefined
                ? {}
                : { dataMember: this.options.dataMember }),
            value: item
        });
        await this.stateChanged.emit(this, { reason: "addItem" });
    }
    async deleteItem(index) {
        if (blockUnlicensed("data.repeater", "deleting"))
            return;
        const item = this.source[index];
        if (!item)
            throw new RangeError(`Repeater item ${index} does not exist.`);
        this.source.splice(index, 1);
        if (this.currentIndex === index)
            this.currentIndex = -1;
        else if (this.currentIndex > index)
            this.currentIndex--;
        await this.stateChanged.emit(this, { reason: "deleteItem" });
    }
    async beginEdit(index) {
        if (blockUnlicensed("data.repeater", "editing"))
            return false;
        const dataItem = this.source[index];
        if (!dataItem)
            throw new RangeError(`Repeater item ${index} does not exist.`);
        const args = {
            itemIndex: index,
            itemType: index % 2 === 0 ? "Item" : "AlternatingItem",
            dataItem,
            cancel: false
        };
        await this.itemEditing.emit(this, args);
        if (args.cancel)
            return false;
        this.editIndex = index;
        await this.stateChanged.emit(this, { reason: "beginEdit" });
        return true;
    }
    async updateItem(index, values) {
        if (blockUnlicensed("data.repeater", "updating"))
            return false;
        const dataItem = this.source[index];
        if (!dataItem)
            throw new RangeError(`Repeater item ${index} does not exist.`);
        const args = {
            itemIndex: index,
            itemType: index % 2 === 0 ? "Item" : "AlternatingItem",
            dataItem,
            values,
            cancel: false
        };
        await this.itemUpdating.emit(this, args);
        if (args.cancel)
            return false;
        Object.assign(dataItem, values);
        this.editIndex = -1;
        await this.itemUpdated.emit(this, {
            itemIndex: index,
            itemType: args.itemType,
            dataItem
        });
        await this.stateChanged.emit(this, { reason: "updateItem" });
        return true;
    }
    async cancelEdit() {
        if (this.editIndex < 0)
            return false;
        const index = this.editIndex;
        const dataItem = this.source[index];
        if (!dataItem) {
            this.editIndex = -1;
            return false;
        }
        const args = {
            itemIndex: index,
            itemType: index % 2 === 0 ? "Item" : "AlternatingItem",
            dataItem,
            cancel: false
        };
        await this.itemCancelingEdit.emit(this, args);
        if (args.cancel)
            return false;
        this.editIndex = -1;
        await this.stateChanged.emit(this, { reason: "cancelEdit" });
        return true;
    }
    async executeCommand(itemIndex, commandName, commandArgument) {
        const dataItem = this.source[itemIndex];
        if (!dataItem)
            throw new RangeError(`Repeater item ${itemIndex} does not exist.`);
        await this.itemCommand.emit(this, {
            itemIndex,
            itemType: itemIndex % 2 === 0 ? "Item" : "AlternatingItem",
            dataItem,
            commandName,
            ...(commandArgument === undefined ? {} : { commandArgument })
        });
        switch (commandName.toLowerCase()) {
            case "select":
                await this.setCurrentItemIndex(itemIndex);
                break;
            case "edit":
                await this.beginEdit(itemIndex);
                break;
            case "cancel":
                await this.cancelEdit();
                break;
        }
    }
}
//# sourceMappingURL=repeater.js.map
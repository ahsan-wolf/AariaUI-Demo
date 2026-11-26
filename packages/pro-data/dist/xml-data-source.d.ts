import { DataSourceControl, DataSourceSelectArguments } from "@wf-controls/core";
export interface XmlDataSourceOptions {
    id: string;
    data?: string | undefined;
    dataFile?: string | undefined;
    xPath?: string | undefined;
}
export declare class XmlDataSource extends DataSourceControl {
    data?: string | undefined;
    dataFile?: string | undefined;
    xPath?: string | undefined;
    constructor(options: XmlDataSourceOptions);
    select(selectArgs?: DataSourceSelectArguments): Promise<Record<string, unknown>[]>;
    insert(): Promise<number>;
    update(): Promise<number>;
    delete(): Promise<number>;
    private parseXml;
    private elementToRecord;
    private fallbackParse;
}

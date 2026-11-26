import { CancelEventArgs, EventDispatcher } from "../events.js";
export interface XmlParsedNode {
    name: string;
    attributes: Record<string, string>;
    children: XmlParsedNode[];
    text?: string | undefined;
}
export interface XmlTransformEventArgs extends CancelEventArgs {
    xmlContent: string;
    transformContent?: string | undefined;
    transformParameters?: Record<string, unknown> | undefined;
}
export interface XmlTransformedEventArgs {
    output: string;
}
export interface XmlOptions {
    id?: string | undefined;
    documentContent?: string | undefined;
    documentSource?: string | undefined;
    transformContent?: string | undefined;
    transformSource?: string | undefined;
    transformParameters?: Record<string, unknown> | undefined;
    transformFunction?: ((root: XmlParsedNode, params?: Record<string, unknown> | undefined) => string) | undefined;
}
export interface XmlState {
    documentContent?: string | undefined;
    transformContent?: string | undefined;
    renderedOutput: string;
    hasError: boolean;
    errorMessage: string | null;
}
export declare class XmlController {
    readonly id: string;
    documentContent?: string | undefined;
    documentSource?: string | undefined;
    transformContent?: string | undefined;
    transformSource?: string | undefined;
    transformParameters?: Record<string, unknown> | undefined;
    transformFunction?: ((root: XmlParsedNode, params?: Record<string, unknown> | undefined) => string) | undefined;
    private _renderedOutput;
    private _hasError;
    private _errorMessage;
    readonly transforming: EventDispatcher<XmlController, XmlTransformEventArgs>;
    readonly transformed: EventDispatcher<XmlController, XmlTransformedEventArgs>;
    readonly stateChanged: EventDispatcher<XmlController, XmlState>;
    constructor(options?: XmlOptions);
    get renderedOutput(): string;
    get hasError(): boolean;
    get errorMessage(): string | null;
    loadXml(xml: string): void;
    loadXslt(xslt: string): void;
    setTransformParameters(params: Record<string, unknown>): void;
    transform(): Promise<string>;
    render(): Promise<string>;
    parseXml(xmlString: string): XmlParsedNode;
    private parseElement;
    private parseAttributes;
    private applyBasicXslt;
    private findChildren;
    private defaultHtmlRender;
    getState(): XmlState;
    private emitState;
}

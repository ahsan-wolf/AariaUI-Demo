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

export class XmlController {
  public readonly id: string;
  public documentContent?: string | undefined;
  public documentSource?: string | undefined;
  public transformContent?: string | undefined;
  public transformSource?: string | undefined;
  public transformParameters?: Record<string, unknown> | undefined;
  public transformFunction?: ((root: XmlParsedNode, params?: Record<string, unknown> | undefined) => string) | undefined;

  private _renderedOutput: string = "";
  private _hasError: boolean = false;
  private _errorMessage: string | null = null;

  public readonly transforming = new EventDispatcher<XmlController, XmlTransformEventArgs>();
  public readonly transformed = new EventDispatcher<XmlController, XmlTransformedEventArgs>();
  public readonly stateChanged = new EventDispatcher<XmlController, XmlState>();

  constructor(options: XmlOptions = {}) {
    this.id = options.id ?? `Xml_${Math.random().toString(36).substring(2, 9)}`;
    this.documentContent = options.documentContent;
    this.documentSource = options.documentSource;
    this.transformContent = options.transformContent;
    this.transformSource = options.transformSource;
    this.transformParameters = options.transformParameters ? { ...options.transformParameters } : undefined;
    this.transformFunction = options.transformFunction;
  }

  get renderedOutput(): string {
    return this._renderedOutput;
  }

  get hasError(): boolean {
    return this._hasError;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  loadXml(xml: string): void {
    this.documentContent = xml;
    this._hasError = false;
    this._errorMessage = null;
  }

  loadXslt(xslt: string): void {
    this.transformContent = xslt;
  }

  setTransformParameters(params: Record<string, unknown>): void {
    this.transformParameters = { ...params };
  }

  async transform(): Promise<string> {
    this._hasError = false;
    this._errorMessage = null;

    const xml = this.documentContent ?? "";
    if (!xml.trim()) {
      this._renderedOutput = "";
      this.emitState();
      return "";
    }

    const cancelArgs: XmlTransformEventArgs = {
      xmlContent: xml,
      transformContent: this.transformContent,
      transformParameters: this.transformParameters,
      cancel: false,
    };

    await this.transforming.emit(this, cancelArgs);
    if (cancelArgs.cancel) {
      return this._renderedOutput;
    }

    try {
      const parsedRoot = this.parseXml(xml);

      let resultHtml = "";
      if (this.transformFunction) {
        resultHtml = this.transformFunction(parsedRoot, this.transformParameters);
      } else if (this.transformContent) {
        resultHtml = this.applyBasicXslt(parsedRoot, this.transformContent, this.transformParameters);
      } else {
        resultHtml = this.defaultHtmlRender(parsedRoot);
      }

      this._renderedOutput = resultHtml;
      await this.transformed.emit(this, { output: resultHtml });
      this.emitState();
      return resultHtml;
    } catch (err: unknown) {
      this._hasError = true;
      this._errorMessage = err instanceof Error ? err.message : String(err);
      this._renderedOutput = `<div class="xml-error">Error transforming XML: ${this._errorMessage}</div>`;
      this.emitState();
      return this._renderedOutput;
    }
  }

  async render(): Promise<string> {
    return this.transform();
  }

  parseXml(xmlString: string): XmlParsedNode {
    const cleanXml = xmlString.replace(/<\?xml[^>]*\?>/gi, "").trim();
    if (!cleanXml) {
      throw new Error("Empty XML document");
    }

    const tagRegex = /<([a-zA-Z0-9_\-:]+)((?:\s+[a-zA-Z0-9_\-:]+(?:="[^"]*"|='[^']*')?)*)\s*(?:\/>|>([\s\S]*?)<\/\1>)/g;
    const match = tagRegex.exec(cleanXml);

    if (!match) {
      // Check if self-closing or single tag
      const singleMatch = /^<([a-zA-Z0-9_\-:]+)((?:\s+[a-zA-Z0-9_\-:]+(?:="[^"]*"|='[^']*')?)*)\s*\/>$/.exec(cleanXml);
      if (singleMatch && singleMatch[1]) {
        return {
          name: singleMatch[1],
          attributes: this.parseAttributes(singleMatch[2] ?? ""),
          children: [],
        };
      }
      throw new Error("Malformed XML: unable to parse root element.");
    }

    const tagName = match[1] ?? "root";
    const attrString = match[2] ?? "";
    const innerContent = match[3] ?? "";

    return this.parseElement(tagName, attrString, innerContent);
  }

  private parseElement(name: string, attrString: string, innerXml: string): XmlParsedNode {
    const attributes = this.parseAttributes(attrString);
    const children: XmlParsedNode[] = [];

    const childTagRegex = /<([a-zA-Z0-9_\-:]+)((?:\s+[a-zA-Z0-9_\-:]+(?:="[^"]*"|='[^']*')?)*)\s*(?:\/>|>([\s\S]*?)<\/\1>)/g;
    let lastIndex = 0;
    let childMatch: RegExpExecArray | null;
    let textAccumulator = "";

    while ((childMatch = childTagRegex.exec(innerXml)) !== null) {
      const textBefore = innerXml.substring(lastIndex, childMatch.index).trim();
      if (textBefore) {
        if (textBefore.includes("<")) {
          throw new Error(`Malformed XML: unexpected '<' or unclosed tag in element "${name}".`);
        }
        textAccumulator += textBefore;
      }

      const childName = childMatch[1] ?? "";
      const childAttrs = childMatch[2] ?? "";
      const childInner = childMatch[3] ?? "";

      children.push(this.parseElement(childName, childAttrs, childInner));
      lastIndex = childTagRegex.lastIndex;
    }

    const remainingText = innerXml.substring(lastIndex).trim();
    if (remainingText) {
      if (remainingText.includes("<")) {
        throw new Error(`Malformed XML: unexpected '<' or unclosed tag in element "${name}".`);
      }
      textAccumulator += remainingText;
    }

    const trimmedText = textAccumulator.trim();

    return {
      name,
      attributes,
      children,
      text: trimmedText.length > 0 ? trimmedText : undefined,
    };
  }

  private parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9_\-:]+)=["']([^"']*)["']/g;
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(attrString)) !== null) {
      if (m[1] && m[2] !== undefined) {
        attrs[m[1]] = m[2];
      }
    }
    return attrs;
  }

  private applyBasicXslt(root: XmlParsedNode, xslt: string, params?: Record<string, unknown> | undefined): string {
    // If xslt contains template matching, interpolate elements
    let template = xslt;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        template = template.replace(new RegExp(`\\$${key}`, "g"), String(value));
      }
    }

    // Match <xsl:for-each select="nodeName">...</xsl:for-each>
    const forEachRegex = /<xsl:for-each\s+select=["']([a-zA-Z0-9_\-:]+)["']>([\s\S]*?)<\/xsl:for-each>/gi;
    template = template.replace(forEachRegex, (_match: string, nodeName: string, innerTemplate: string) => {
      const targetNodes = this.findChildren(root, nodeName);
      return targetNodes
        .map((node) => {
          let itemHtml = innerTemplate;
          // Replace <xsl:value-of select="childNode|@attr"/>
          const valueOfRegex = /<xsl:value-of\s+select=["']([^"']+)["']\s*\/>/gi;
          itemHtml = itemHtml.replace(valueOfRegex, (_vMatch: string, selectPath: string) => {
            if (selectPath.startsWith("@")) {
              const attrName = selectPath.substring(1);
              return node.attributes[attrName] ?? "";
            }
            const child = node.children.find((c) => c.name.toLowerCase() === selectPath.toLowerCase());
            return child?.text ?? "";
          });
          return itemHtml;
        })
        .join("");
    });

    // Remove any remaining XSL wrapper tags
    template = template
      .replace(/<xsl:stylesheet[^>]*>/gi, "")
      .replace(/<\/xsl:stylesheet>/gi, "")
      .replace(/<xsl:template[^>]*>/gi, "")
      .replace(/<\/xsl:template>/gi, "")
      .trim();

    return template;
  }

  private findChildren(node: XmlParsedNode, name: string): XmlParsedNode[] {
    const results: XmlParsedNode[] = [];
    if (node.name.toLowerCase() === name.toLowerCase()) {
      results.push(node);
    }
    for (const child of node.children) {
      results.push(...this.findChildren(child, name));
    }
    return results;
  }

  private defaultHtmlRender(node: XmlParsedNode): string {
    const attrsStr = Object.entries(node.attributes)
      .map(([k, v]) => ` <span class="xml-attr-name">${k}</span>="<span class="xml-attr-value">${v}</span>"`)
      .join("");

    if (node.children.length === 0 && !node.text) {
      return `<div class="xml-node">&lt;<span class="xml-tag">${node.name}</span>${attrsStr}/&gt;</div>`;
    }

    let inner = "";
    if (node.text) {
      inner += `<span class="xml-text">${node.text}</span>`;
    }
    if (node.children.length > 0) {
      inner += `<div class="xml-children">${node.children.map((c) => this.defaultHtmlRender(c)).join("")}</div>`;
    }

    return `<div class="xml-node">&lt;<span class="xml-tag">${node.name}</span>${attrsStr}&gt;${inner}&lt;/<span class="xml-tag">${node.name}</span>&gt;</div>`;
  }

  getState(): XmlState {
    return {
      documentContent: this.documentContent,
      transformContent: this.transformContent,
      renderedOutput: this._renderedOutput,
      hasError: this._hasError,
      errorMessage: this._errorMessage,
    };
  }

  private emitState(): void {
    this.stateChanged.emit(this, this.getState());
  }
}

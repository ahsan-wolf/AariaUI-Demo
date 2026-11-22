import { EventDispatcher } from "../events.js";
export class XmlController {
    id;
    documentContent;
    documentSource;
    transformContent;
    transformSource;
    transformParameters;
    transformFunction;
    _renderedOutput = "";
    _hasError = false;
    _errorMessage = null;
    transforming = new EventDispatcher();
    transformed = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
        this.id = options.id ?? `Xml_${Math.random().toString(36).substring(2, 9)}`;
        this.documentContent = options.documentContent;
        this.documentSource = options.documentSource;
        this.transformContent = options.transformContent;
        this.transformSource = options.transformSource;
        this.transformParameters = options.transformParameters ? { ...options.transformParameters } : undefined;
        this.transformFunction = options.transformFunction;
    }
    get renderedOutput() {
        return this._renderedOutput;
    }
    get hasError() {
        return this._hasError;
    }
    get errorMessage() {
        return this._errorMessage;
    }
    loadXml(xml) {
        this.documentContent = xml;
        this._hasError = false;
        this._errorMessage = null;
    }
    loadXslt(xslt) {
        this.transformContent = xslt;
    }
    setTransformParameters(params) {
        this.transformParameters = { ...params };
    }
    async transform() {
        this._hasError = false;
        this._errorMessage = null;
        const xml = this.documentContent ?? "";
        if (!xml.trim()) {
            this._renderedOutput = "";
            this.emitState();
            return "";
        }
        const cancelArgs = {
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
            }
            else if (this.transformContent) {
                resultHtml = this.applyBasicXslt(parsedRoot, this.transformContent, this.transformParameters);
            }
            else {
                resultHtml = this.defaultHtmlRender(parsedRoot);
            }
            this._renderedOutput = resultHtml;
            await this.transformed.emit(this, { output: resultHtml });
            this.emitState();
            return resultHtml;
        }
        catch (err) {
            this._hasError = true;
            this._errorMessage = err instanceof Error ? err.message : String(err);
            this._renderedOutput = `<div class="xml-error">Error transforming XML: ${this._errorMessage}</div>`;
            this.emitState();
            return this._renderedOutput;
        }
    }
    async render() {
        return this.transform();
    }
    parseXml(xmlString) {
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
    parseElement(name, attrString, innerXml) {
        const attributes = this.parseAttributes(attrString);
        const children = [];
        const childTagRegex = /<([a-zA-Z0-9_\-:]+)((?:\s+[a-zA-Z0-9_\-:]+(?:="[^"]*"|='[^']*')?)*)\s*(?:\/>|>([\s\S]*?)<\/\1>)/g;
        let lastIndex = 0;
        let childMatch;
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
    parseAttributes(attrString) {
        const attrs = {};
        const attrRegex = /([a-zA-Z0-9_\-:]+)=["']([^"']*)["']/g;
        let m;
        while ((m = attrRegex.exec(attrString)) !== null) {
            if (m[1] && m[2] !== undefined) {
                attrs[m[1]] = m[2];
            }
        }
        return attrs;
    }
    applyBasicXslt(root, xslt, params) {
        // If xslt contains template matching, interpolate elements
        let template = xslt;
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                template = template.replace(new RegExp(`\\$${key}`, "g"), String(value));
            }
        }
        // Match <xsl:for-each select="nodeName">...</xsl:for-each>
        const forEachRegex = /<xsl:for-each\s+select=["']([a-zA-Z0-9_\-:]+)["']>([\s\S]*?)<\/xsl:for-each>/gi;
        template = template.replace(forEachRegex, (_match, nodeName, innerTemplate) => {
            const targetNodes = this.findChildren(root, nodeName);
            return targetNodes
                .map((node) => {
                let itemHtml = innerTemplate;
                // Replace <xsl:value-of select="childNode|@attr"/>
                const valueOfRegex = /<xsl:value-of\s+select=["']([^"']+)["']\s*\/>/gi;
                itemHtml = itemHtml.replace(valueOfRegex, (_vMatch, selectPath) => {
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
    findChildren(node, name) {
        const results = [];
        if (node.name.toLowerCase() === name.toLowerCase()) {
            results.push(node);
        }
        for (const child of node.children) {
            results.push(...this.findChildren(child, name));
        }
        return results;
    }
    defaultHtmlRender(node) {
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
    getState() {
        return {
            documentContent: this.documentContent,
            transformContent: this.transformContent,
            renderedOutput: this._renderedOutput,
            hasError: this._hasError,
            errorMessage: this._errorMessage,
        };
    }
    emitState() {
        this.stateChanged.emit(this, this.getState());
    }
}
//# sourceMappingURL=xml.js.map
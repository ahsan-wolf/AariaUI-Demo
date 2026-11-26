import { DataSourceControl, DataSourceSelectArguments } from "@wf-controls/core";
import { requireFeature } from "@wf-controls/license";
import { gateDataSource } from "./evaluation.js";

export interface XmlDataSourceOptions {
  id: string;
  data?: string | undefined;
  dataFile?: string | undefined;
  xPath?: string | undefined;
}

export class XmlDataSource extends DataSourceControl {
  data?: string | undefined;
  dataFile?: string | undefined;
  xPath?: string | undefined;

  constructor(options: XmlDataSourceOptions) {
    super(options.id);
    this.data = options.data;
    this.dataFile = options.dataFile;
    this.xPath = options.xPath;
    requireFeature("datasource.xml");
    gateDataSource(this, "datasource.xml");
  }

  override async select(selectArgs: DataSourceSelectArguments = {}): Promise<Record<string, unknown>[]> {
    const selectingArgs = {
      arguments: selectArgs,
      parameters: {},
      cancel: false
    };

    await this.selecting.emit(this, selectingArgs);
    if (selectingArgs.cancel) {
      return [];
    }

    let xmlText = this.data;
    if (!xmlText && this.dataFile) {
      if (typeof fetch === "function") {
        const res = await fetch(this.dataFile);
        xmlText = await res.text();
      }
    }

    if (!xmlText) {
      return [];
    }

    let items = this.parseXml(xmlText, this.xPath);

    const totalRowCount = items.length;
    if (selectArgs.startRowIndex !== undefined || selectArgs.maximumRows !== undefined) {
      const start = selectArgs.startRowIndex ?? 0;
      const count = selectArgs.maximumRows ?? items.length;
      items = items.slice(start, start + count);
    }

    await this.selected.emit(this, { data: items, totalRowCount });
    return items;
  }

  override async insert(): Promise<number> {
    throw new Error("XmlDataSource does not support insert operations directly.");
  }

  override async update(): Promise<number> {
    throw new Error("XmlDataSource does not support update operations directly.");
  }

  override async delete(): Promise<number> {
    throw new Error("XmlDataSource does not support delete operations directly.");
  }

  private parseXml(xml: string, xPath?: string | undefined): Record<string, unknown>[] {
    if (typeof DOMParser !== "undefined") {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        const nodeName = xPath ? xPath.replace(/^\/+/, "").split("/")[0] : null;

        let elements: Element[] = [];
        if (nodeName) {
          elements = Array.from(doc.getElementsByTagName(nodeName));
        } else {
          const root = doc.documentElement;
          if (root) {
            elements = Array.from(root.children);
          }
        }

        return elements.map((el) => this.elementToRecord(el));
      } catch {
        // Fallback to lightweight regex parser
      }
    }

    return this.fallbackParse(xml, xPath);
  }

  private elementToRecord(el: Element): Record<string, unknown> {
    const record: Record<string, unknown> = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes.item(i);
      if (attr) {
        record[attr.name] = attr.value;
      }
    }
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children.item(i);
      if (child) {
        record[child.tagName] = child.textContent?.trim() ?? "";
      }
    }
    if (Object.keys(record).length === 0 && el.textContent) {
      record["value"] = el.textContent.trim();
    }
    return record;
  }

  private fallbackParse(xml: string, xPath?: string | undefined): Record<string, unknown>[] {
    const targetTag = xPath ? xPath.replace(/^\/+/, "").split("/")[0] : null;
    const tagRegex = targetTag
      ? new RegExp(
          `<${targetTag}\\b([^>]*)>([\\s\\S]*?)<\\/${targetTag}>|<${targetTag}\\b([^>]*)\\/>`,
          "gi"
        )
      : /<([a-zA-Z0-9_-]+)\b([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_-]+)\b([^>]*)\/>/gi;

    const results: Record<string, unknown>[] = [];
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(xml)) !== null) {
      const record: Record<string, unknown> = {};
      const attrString = (match[1] || match[3] || match[5] || "");
      const bodyString = match[2] || "";

      const attrRegex = /([a-zA-Z0-9_-]+)=["']([^"']*)["']/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        const key = attrMatch[1];
        const val = attrMatch[2];
        if (key && val !== undefined) {
          record[key] = val;
        }
      }

      const childRegex = /<([a-zA-Z0-9_-]+)\b[^>]*>([^<]*)<\/\1>/g;
      let childMatch: RegExpExecArray | null;
      while ((childMatch = childRegex.exec(bodyString)) !== null) {
        const key = childMatch[1];
        const val = childMatch[2];
        if (key && val !== undefined) {
          record[key] = val.trim();
        }
      }

      if (Object.keys(record).length > 0) {
        results.push(record);
      }
    }

    return results;
  }
}


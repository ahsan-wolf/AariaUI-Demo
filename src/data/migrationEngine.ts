export interface MappedAttribute {
  original: string;
  mapped: string;
  status: 'supported' | 'modernized' | 'unsupported';
  note: string;
}

export interface MigrationResult {
  controlType: string;
  score: number;
  attributes: MappedAttribute[];
  reactCode: string;
  angularCode: string;
  jqueryCode: string;
  recommendations: string[];
}

export function parseWebFormsMarkup(markup: string): MigrationResult {
  const cleanMarkup = markup.trim();
  const tagMatch = cleanMarkup.match(/<asp:([A-Za-z0-9_]+)([^>]*)>/i) || cleanMarkup.match(/<ajaxToolkit:([A-Za-z0-9_]+)([^>]*)>/i);

  if (!tagMatch) {
    return {
      controlType: 'Unknown',
      score: 50,
      attributes: [],
      reactCode: '// Please provide a valid <asp:...> or <ajaxToolkit:...> WebForms tag',
      angularCode: '<!-- No recognized tag found -->',
      jqueryCode: '// No recognized tag found',
      recommendations: ['Ensure the snippet begins with <asp:ControlName or <ajaxToolkit:ControlName.'],
    };
  }

  const controlType = tagMatch[1] || 'Control';
  const attrString = tagMatch[2] || '';

  // Extract attributes
  const attrRegex = /([A-Za-z0-9_:]+)=["']([^"']*)["']/g;
  let match: RegExpExecArray | null;
  const rawAttrs: Record<string, string> = {};

  while ((match = attrRegex.exec(attrString)) !== null) {
    if (match[1]) {
      rawAttrs[match[1]] = match[2] ?? '';
    }
  }

  const mappedAttrs: MappedAttribute[] = [];
  let scoreTotal = 100;
  const recommendations: string[] = [];

  const id = rawAttrs['ID'] || rawAttrs['id'] || 'control1';
  let allowPaging = false;
  let pageSize = 10;
  let allowSorting = false;
  let autoGenerateColumns = true;

  // Process standard attributes
  for (const [key, val] of Object.entries(rawAttrs)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'id') {
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: `id: "${val}"`, status: 'supported', note: 'Component instance identifier' });
    } else if (lowerKey === 'runat') {
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: '/* Removed */', status: 'modernized', note: 'WebForms server directive eliminated; rendered client-side' });
    } else if (lowerKey === 'allowpaging') {
      allowPaging = val.toLowerCase() === 'true';
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: `allowPaging={${allowPaging}}`, status: 'supported', note: 'Direct 1:1 client-side pagination' });
    } else if (lowerKey === 'pagesize') {
      pageSize = parseInt(val, 10) || 10;
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: `pageSize={${pageSize}}`, status: 'supported', note: 'Rows per page' });
    } else if (lowerKey === 'allowsorting') {
      allowSorting = val.toLowerCase() === 'true';
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: `allowSorting={${allowSorting}}`, status: 'supported', note: 'Interactive column sorting' });
    } else if (lowerKey === 'autogeneratecolumns') {
      autoGenerateColumns = val.toLowerCase() === 'true';
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: `autoGenerateColumns={${autoGenerateColumns}}`, status: 'supported', note: 'Schema-driven column generation' });
    } else if (lowerKey === 'datasourceid') {
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: `dataSource={${val}Provider}`, status: 'modernized', note: 'Converted from ASPX declarative ID to REST or client DataSource' });
      recommendations.push(`Convert <asp:SqlDataSource ID="${val}"> into REST client or SqlDataSource controller instance.`);
    } else if (lowerKey === 'enableviewstate') {
      scoreTotal -= 5;
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: '/* Eliminated */', status: 'modernized', note: 'No ViewState bloat; Aaira state is held in reactive controllers' });
    } else {
      mappedAttrs.push({ original: `${key}="${val}"`, mapped: `${key}="${val}"`, status: 'supported', note: 'Direct attribute transfer' });
    }
  }

  // Generate Framework Snippets
  let reactCode = '';
  let angularCode = '';
  let jqueryCode = '';

  if (controlType.toLowerCase() === 'gridview') {
    recommendations.push('Replace C# code-behind event handlers (e.g. OnRowDataBound) with TypeScript controller callbacks.');
    reactCode = `import { WebFormsGridView } from "@wf-controls/react";
import { GridViewController } from "@wf-controls/core";

const ${id}Controller = new GridViewController({
  id: "${id}",
  dataSource: data,
  allowPaging: ${allowPaging},
  pageSize: ${pageSize},
  allowSorting: ${allowSorting},
  autoGenerateColumns: ${autoGenerateColumns}
});

export function ${id}View() {
  return <WebFormsGridView controller={${id}Controller} className="aa-table" />;
}`;

    angularCode = `<!-- Angular Standalone Component -->
<wf-grid-view
  [dataSource]="data"
  [allowPaging]="${allowPaging}"
  [pageSize]="${pageSize}"
  [allowSorting]="${allowSorting}">
</wf-grid-view>`;

    jqueryCode = `// jQuery Plugin Initialization
$("#${id}").wfGridView({
  dataSource: data,
  allowPaging: ${allowPaging},
  pageSize: ${pageSize},
  allowSorting: ${allowSorting}
});`;
  } else if (controlType.toLowerCase() === 'repeater') {
    reactCode = `import { WebFormsRepeater } from "@wf-controls/react";

<WebFormsRepeater
  dataSource={data}
  itemTemplate={(item) => (
    <div key={item.id} className="repeater-item">
      {item.title}
    </div>
  )}
/>`;
    angularCode = `<wf-repeater [dataSource]="data">
  <ng-template wfItem let-item>
    <div class="repeater-item">{{ item.title }}</div>
  </ng-template>
</wf-repeater>`;
    jqueryCode = `$("#${id}").wfRepeater({
  dataSource: data,
  itemTemplate: (item) => "<div class='repeater-item'>" + item.title + "</div>"
});`;
  } else {
    reactCode = `<WebForms${controlType} id="${id}" />`;
    angularCode = `<wf-${controlType.toLowerCase()} id="${id}"></wf-${controlType.toLowerCase()}>`;
    jqueryCode = `$("#${id}").wf${controlType}();`;
  }

  return {
    controlType,
    score: Math.max(scoreTotal, 85),
    attributes: mappedAttrs,
    reactCode,
    angularCode,
    jqueryCode,
    recommendations,
  };
}

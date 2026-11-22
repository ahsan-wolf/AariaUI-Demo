import { apiAreas } from '../data/apiDocs/manifest';

/** A location inside the API documentation: `#/api/<area>/<entry>/<tab>/<anchor>`. */
export interface ApiRoute {
  areaId: string;
  entryId: string;
  tabId?: string;
  anchor?: string;
}

export const DEFAULT_API_ROUTE: ApiRoute = { areaId: 'data-library', entryId: 'datatable' };

export function formatApiHash(route: ApiRoute): string {
  const parts = ['#', 'api', route.areaId, route.entryId];
  if (route.tabId) parts.push(route.tabId);
  if (route.tabId && route.anchor) parts.push(route.anchor);
  return parts.join('/');
}

/** Returns null when the hash is not an API route at all; an incomplete `#/api` resolves to the default page. */
export function parseApiHash(hash: string): ApiRoute | null {
  const m = /^#\/api(?:\/(.*))?$/.exec(hash);
  if (!m) return null;
  const [areaId, entryId, tabId, ...rest] = (m[1] ?? '').split('/').filter(Boolean);
  if (!areaId || !entryId) {
    // `#/api/<area>` alone: open the first entry of that area
    const area = apiAreas.find((a) => a.id === areaId);
    if (area?.entries[0]) return { areaId: area.id, entryId: area.entries[0].id };
    return { ...DEFAULT_API_ROUTE };
  }
  return { areaId, entryId, ...(tabId ? { tabId } : {}), ...(rest.length ? { anchor: rest.join('/') } : {}) };
}

export function findEntry(areaId: string, entryId: string) {
  const area = apiAreas.find((a) => a.id === areaId);
  const entry = area?.entries.find((e) => e.id === entryId);
  return area && entry ? { area, entry } : undefined;
}

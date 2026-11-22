export interface ApiTab { id: string; title: string }
export interface ApiEntry { id: string; title: string; kind: 'class' | 'topic'; summary: string; source: string; tabs: ApiTab[] }
export interface ApiArea { id: string; title: string; icon: string; entries: ApiEntry[] }
/** e = entry id, t = tab id, a = area id, n = display name, x = snippet, k = lower-case identifier tokens ("word" or "word*count") */
export interface ApiSearchRecord { e: string; t: string; a: string; n: string; x: string; k: string; p: number }

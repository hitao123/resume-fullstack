/**
 * The portable, untrusted-input boundary for minimal-v2. It deliberately has
 * no browser or React dependency so the editor and the renderer use identical
 * content, ordering and rich-text rules.
 */
export const SCHEMA_VERSION = 'minimal-v2' as const;
export const DOCUMENT_LIMITS = {
  maxCharacters: 30_000,
  maxEntries: 300,
  maxListDepth: 5,
  maxAvatarBytes: 2 * 1024 * 1024,
  maxPages: 20,
} as const;

export type Locale = 'en-US' | 'zh-CN';
export type Mark = 'bold' | 'italic';
export interface TextNode { type: 'text'; text: string; marks?: Mark[]; sourceId?: string }
export interface ParagraphNode { type: 'paragraph'; children: TextNode[]; sourceId?: string }
export interface ListNode { type: 'list'; ordered: boolean; items: DocumentNode[][]; sourceId?: string }
export type DocumentNode = ParagraphNode | ListNode;
export interface Contact { label: string; value: string; href?: string }
export interface DocumentEntry { sourceId: string; heading: string; meta?: string; nodes: DocumentNode[]; links?: Contact[] }
export interface DocumentSection { sourceId: string; key: string; title: string; entries: DocumentEntry[] }
export interface ResumeDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  locale: Locale;
  header: { fullName?: string; targetRole?: string; contacts: Contact[]; avatar?: { dataUrl: string; mimeType: string } };
  sections: DocumentSection[];
  statistics: { characters: number; entries: number };
}

export class DocumentLimitError extends Error {
  readonly code: 'DOCUMENT_TOO_LARGE' | 'TOO_MANY_ENTRIES' | 'LIST_TOO_DEEP';

  constructor(code: 'DOCUMENT_TOO_LARGE' | 'TOO_MANY_ENTRIES' | 'LIST_TOO_DEEP', message: string) {
    super(message);
    this.code = code;
  }
}

type AnyRecord = Record<string, unknown>;
const sectionDefaults = [
  ['summary', 0], ['workExperiences', 1], ['education', 2], ['skills', 3], ['projects', 4],
  ['certifications', 5], ['languages', 6], ['awards', 7], ['customSections', 8],
] as const;
const titles: Record<Locale, Record<string, string>> = {
  'en-US': { summary: 'Summary', workExperiences: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', languages: 'Languages', awards: 'Awards', customSections: 'Additional information', present: 'Present', expires: 'Expires' },
  'zh-CN': { summary: '个人简介', workExperiences: '工作经历', education: '教育背景', skills: '技能', projects: '项目经历', certifications: '证书', languages: '语言能力', awards: '奖项', customSections: '其他信息', present: '至今', expires: '有效期至' },
};

function string(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function number(value: unknown, fallback = 0): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
function record(value: unknown): AnyRecord { return value !== null && typeof value === 'object' ? value as AnyRecord : {}; }
function array(value: unknown): AnyRecord[] { return Array.isArray(value) ? value.map(record) : []; }

export function safeUrl(value: unknown): string | undefined {
  const input = string(value);
  if (!input || input.length > 2048) return undefined;
  try {
    const url = new URL(input);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch { return undefined; }
}

function date(value: unknown, locale: Locale): string {
  const source = string(value);
  if (!/^\d{4}-\d{2}(-\d{2})?(T.*)?$/.test(source)) return '';
  const match = /^(\d{4})-(\d{2})/.exec(source);
  if (!match) return '';
  const year = Number(match[1]); const month = Number(match[2]);
  if (month < 1 || month > 12) return '';
  return locale === 'zh-CN' ? `${year}年${month}月` : new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
}
function range(start: unknown, end: unknown, current: unknown, locale: Locale): string {
  const a = date(start, locale); const b = current === true ? titles[locale].present : date(end, locale);
  return a && b ? `${a} - ${b}` : a || b;
}

interface RawNode { name: string; children: Array<RawNode | string>; }
const allowed = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li']);
function parseHtml(input: string): RawNode {
  const root: RawNode = { name: 'root', children: [] }; const stack = [root];
  const token = /<\s*(\/?)\s*([a-zA-Z0-9]+)(?:\s[^>]*)?>/g; let cursor = 0; let match: RegExpExecArray | null;
  while ((match = token.exec(input))) {
    if (match.index > cursor) stack.at(-1)!.children.push(input.slice(cursor, match.index));
    cursor = token.lastIndex; const closing = match[1] === '/'; const name = match[2].toLowerCase();
    if (!allowed.has(name)) continue;
    if (closing) { for (let i = stack.length - 1; i > 0; i--) if (stack[i].name === name) { stack.length = i; break; } }
    else if (name === 'br') stack.at(-1)!.children.push({ name, children: [] });
    else { const child = { name, children: [] } as RawNode; stack.at(-1)!.children.push(child); stack.push(child); }
  }
  if (cursor < input.length) stack.at(-1)!.children.push(input.slice(cursor));
  return root;
}
function textNodes(nodes: Array<RawNode | string>, marks: Mark[] = []): TextNode[] {
  return nodes.flatMap((node) => {
    if (typeof node === 'string') {
      const text = decodeEntities(node);
      return text ? [{ type: 'text' as const, text, marks: marks.length ? marks : undefined }] : [];
    }
    if (node.name === 'br') return [{ type: 'text' as const, text: '\n', marks: marks.length ? marks : undefined }];
    if (node.name === 'strong' || node.name === 'b') return textNodes(node.children, [...marks, 'bold']);
    if (node.name === 'em' || node.name === 'i') return textNodes(node.children, [...marks, 'italic']);
    if (node.name === 'p' || node.name === 'li') return textNodes(node.children.filter((child) => typeof child === 'string' || !['ul', 'ol'].includes(child.name)), marks);
    return textNodes(node.children, marks);
  });
}

const namedEntities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    if (token[0] !== '#') return namedEntities[token.toLowerCase()] || entity;
    const codePoint = token[1].toLowerCase() === 'x' ? Number.parseInt(token.slice(2), 16) : Number.parseInt(token.slice(1), 10);
    return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  });
}
function blocks(nodes: Array<RawNode | string>, depth = 0): DocumentNode[] {
  const result: DocumentNode[] = []; let loose: Array<RawNode | string> = [];
  const flush = () => { const children = textNodes(loose); if (children.some((item) => item.text.trim())) result.push({ type: 'paragraph', children }); loose = []; };
  for (const node of nodes) {
    if (typeof node === 'string') { loose.push(node); continue; }
    if (node.name === 'p') { flush(); const children = textNodes(node.children); if (children.some((item) => item.text.trim())) result.push({ type: 'paragraph', children }); continue; }
    if (node.name === 'ul' || node.name === 'ol') {
      flush(); if (depth >= DOCUMENT_LIMITS.maxListDepth) throw new DocumentLimitError('LIST_TOO_DEEP', `Lists may not exceed ${DOCUMENT_LIMITS.maxListDepth} levels.`);
      const items = node.children.filter((child): child is RawNode => typeof child !== 'string' && child.name === 'li').map((li) => {
        const own = blocks(li.children.filter((child) => typeof child === 'string' || !['ul', 'ol'].includes(child.name)), depth + 1);
        const nested = li.children.filter((child): child is RawNode => typeof child !== 'string' && ['ul', 'ol'].includes(child.name)).flatMap((child) => blocks([child], depth + 1));
        return [...own, ...nested];
      });
      if (items.length) result.push({ type: 'list', ordered: node.name === 'ol', items });
      continue;
    }
    loose.push(node);
  }
  flush(); return result;
}

/** Converts the editor's restricted rich text into a non-HTML structured representation. */
export function richText(value: unknown): DocumentNode[] {
  const source = string(value); if (!source) return [];
  if (!/<[a-z][\s\S]*>/i.test(source)) return source.split(/\n{2,}/).map((part) => ({ type: 'paragraph', children: part.split('\n').flatMap((line, index) => index ? [{ type: 'text' as const, text: '\n' }, { type: 'text' as const, text: line }] : [{ type: 'text' as const, text: line }]) }));
  return blocks(parseHtml(source).children);
}
function hasContent(entry: DocumentEntry): boolean { return Boolean(entry.heading || entry.meta || entry.nodes.length || entry.links?.length); }
function link(label: string, value: unknown): Contact | undefined { const href = safeUrl(value); return href ? { label, value: href.replace(/^https?:\/\//, ''), href } : undefined; }
function controlledAvatar(value: unknown): { dataUrl: string; mimeType: string } | undefined {
  const dataUrl = string(value);
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,([a-z0-9+/=]+)$/i.exec(dataUrl);
  if (!match || Math.floor(match[2].length * 3 / 4) > DOCUMENT_LIMITS.maxAvatarBytes) return undefined;
  return { dataUrl, mimeType: match[1].toLowerCase() };
}
function entry(sourceId: string, heading: string, meta: string, content: unknown, links?: Array<Contact | undefined>): DocumentEntry {
  return { sourceId, heading, meta: meta || undefined, nodes: richText(content), links: links?.filter((item): item is Contact => Boolean(item)) };
}

/**
 * Normalizes all recipient-facing resume fields. Resume title/versionLabel are
 * management metadata and intentionally excluded. targetRole is a header line.
 */
export function normalizeResume(input: unknown, options: { locale?: string } = {}): ResumeDocument {
  const resume = record(input); const locale: Locale = options.locale?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'; const copy = titles[locale];
  const personal = record(resume.personalInfo); const contacts = [
    string(personal.email) ? { label: 'Email', value: string(personal.email), href: `mailto:${string(personal.email)}` } : undefined,
    string(personal.phone) ? { label: 'Phone', value: string(personal.phone), href: `tel:${string(personal.phone).replace(/[^+\d]/g, '')}` } : undefined,
    string(personal.location) ? { label: 'Location', value: string(personal.location) } : undefined,
    link('Website', personal.website), link('LinkedIn', personal.linkedin), link('GitHub', personal.github),
  ].filter((item): item is Contact => Boolean(item));
  const makeEntries: Record<string, () => DocumentEntry[]> = {
    summary: () => [entry('personal-summary', '', '', personal.summary)],
    workExperiences: () => array(resume.workExperiences).sort((a, b) => number(a.displayOrder) - number(b.displayOrder) || number(a.id) - number(b.id)).map((item) => entry(`work-${number(item.id)}`, [string(item.position), string(item.companyName)].filter(Boolean).join(' · '), [string(item.location), range(item.startDate, item.endDate, item.isCurrent, locale)].filter(Boolean).join(' · '), item.description)),
    education: () => array(resume.education).sort((a, b) => number(a.displayOrder) - number(b.displayOrder) || number(a.id) - number(b.id)).map((item) => entry(`education-${number(item.id)}`, [string(item.degree), string(item.fieldOfStudy)].filter(Boolean).join(', ') || string(item.institution), [string(item.institution), string(item.location), range(item.startDate, item.endDate, false, locale), string(item.gpa) ? `GPA: ${string(item.gpa)}` : ''].filter(Boolean).join(' · '), item.description)),
    skills: () => array(resume.skills).sort((a, b) => number(a.displayOrder) - number(b.displayOrder) || number(a.id) - number(b.id)).map((item) => entry(`skill-${number(item.id)}`, string(item.category) || string(item.name), string(item.category) ? [string(item.name), string(item.proficiencyLevel)].filter(Boolean).join(' · ') : string(item.proficiencyLevel), '')),
    projects: () => array(resume.projects).sort((a, b) => number(a.displayOrder) - number(b.displayOrder) || number(a.id) - number(b.id)).map((item) => entry(`project-${number(item.id)}`, string(item.name), [string(item.technologies), range(item.startDate, item.endDate, false, locale)].filter(Boolean).join(' · '), item.description, [link('Project', item.url), link('Repository', item.githubUrl)])),
    certifications: () => array(resume.certifications).sort((a, b) => number(a.displayOrder) - number(b.displayOrder) || number(a.id) - number(b.id)).map((item) => entry(`certification-${number(item.id)}`, string(item.name), [string(item.issuingOrganization), date(item.issueDate, locale), date(item.expiryDate, locale) ? `${copy.expires}: ${date(item.expiryDate, locale)}` : '', string(item.credentialId)].filter(Boolean).join(' · '), '', [link('Credential', item.credentialUrl)])),
    languages: () => array(resume.languages).sort((a, b) => number(a.displayOrder) - number(b.displayOrder) || number(a.id) - number(b.id)).map((item) => entry(`language-${number(item.id)}`, string(item.language), string(item.proficiency), '')),
    awards: () => array(resume.awards).sort((a, b) => number(a.displayOrder) - number(b.displayOrder) || number(a.id) - number(b.id)).map((item) => entry(`award-${number(item.id)}`, string(item.title), [string(item.issuer), date(item.issueDate, locale)].filter(Boolean).join(' · '), item.description)),
    customSections: () => array(resume.customSections).sort((a, b) => number(a.displayOrder) - number(b.displayOrder) || number(a.id) - number(b.id)).map((item) => entry(`custom-${number(item.id)}`, string(item.title), '', item.content)),
  };
  const configs = new Map(array(resume.sectionConfig).map((item) => [string(item.key), item]));
  const sections = sectionDefaults.map(([key, defaultOrder]) => { const config = configs.get(key); const entries = makeEntries[key]().filter(hasContent); return { key, order: config ? number(config.order, defaultOrder) : defaultOrder, visible: config ? config.visible !== false : true, section: { sourceId: key, key, title: copy[key], entries } }; }).filter((item) => item.visible && item.section.entries.length).sort((a, b) => a.order - b.order || a.section.key.localeCompare(b.section.key)).map((item) => item.section);
  const visibleText = [
    string(personal.fullName), string(resume.targetRole), ...contacts.map((item) => item.value),
    ...sections.flatMap((section) => section.entries.flatMap((item) => [item.heading, item.meta || '', ...(item.links || []).flatMap((link) => [link.label, link.value]), ...item.nodes.flatMap(function collect(node): string[] { return node.type === 'paragraph' ? node.children.map((child) => child.text) : node.items.flatMap((listItem) => listItem.flatMap(collect)); })])),
  ].join('');
  const entries = sections.reduce((total, section) => total + section.entries.length, 0);
  if (entries > DOCUMENT_LIMITS.maxEntries) throw new DocumentLimitError('TOO_MANY_ENTRIES', `A resume may contain at most ${DOCUMENT_LIMITS.maxEntries} entries.`);
  if ([...visibleText].length > DOCUMENT_LIMITS.maxCharacters) throw new DocumentLimitError('DOCUMENT_TOO_LARGE', `A resume may contain at most ${DOCUMENT_LIMITS.maxCharacters} Unicode characters.`);
  return { schemaVersion: SCHEMA_VERSION, locale, header: { fullName: string(personal.fullName) || undefined, targetRole: string(resume.targetRole) || undefined, contacts, avatar: personal.showAvatar === true ? controlledAvatar(personal.avatarDataUrl) : undefined }, sections, statistics: { characters: [...visibleText].length, entries } };
}

/** Shared fixed print stylesheet consumed by both the editor component and renderer. */
export const minimalCss = `@page{size:A4;margin:15mm}html,body{margin:0;padding:0}.minimal-document{box-sizing:border-box;color:#18212b;font-family:"Noto Sans","Noto Sans CJK SC","PingFang SC",Arial,sans-serif;font-size:10.5pt;line-height:1.5;overflow-wrap:anywhere;word-break:normal}.minimal-document *{box-sizing:border-box}.minimal-header{border-bottom:1px solid #cbd5df;padding-bottom:5mm;margin-bottom:6mm}.minimal-name{font-size:22pt;line-height:1.2;margin:0}.minimal-role{margin:1mm 0;color:#465565}.minimal-contacts{display:flex;flex-wrap:wrap;gap:1mm 3mm;font-size:9.5pt}.minimal-section{margin:0 0 5mm}.minimal-section-title{font-size:12pt;letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid #d7dee5;margin:0 0 2.5mm;padding-bottom:1mm;break-after:avoid}.minimal-entry{margin:0 0 3.2mm}.minimal-entry-short{break-inside:avoid}.minimal-entry-heading{font-weight:700;break-after:avoid}.minimal-entry-meta{color:#526271;font-size:9.5pt;margin-bottom:1mm;break-after:avoid}.minimal-entry p{margin:0 0 1.6mm;orphans:3;widows:3}.minimal-entry ul,.minimal-entry ol{margin:1mm 0 1.6mm;padding-left:5mm;orphans:3;widows:3}.minimal-entry li{break-inside:auto}.minimal-entry a{color:#183e66;text-decoration:underline;overflow-wrap:anywhere}.minimal-avatar{float:right;object-fit:cover;width:22mm;height:22mm;border-radius:50%;margin-left:5mm}@media screen{.minimal-document{width:210mm;min-height:297mm;margin:auto;background:#fff;padding:15mm;box-shadow:0 2px 16px #0002}.minimal-print-style{display:none}}`;

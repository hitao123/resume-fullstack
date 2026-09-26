import { DEFAULT_ACCENT, tint, type DocumentEntry, type DocumentNode, type DocumentSection, type LayoutDensity, type ResumeDocument, type TemplateKey, type TextNode } from './index.js';

/**
 * The single markup + stylesheet for every template. The editor preview and
 * the Chromium renderer both consume this output, so what the user sees is
 * exactly what gets paginated into the PDF.
 */
const MODERN_SIDEBAR_KEYS = new Set(['skills', 'languages', 'certifications']);
const SIDEBAR_WIDTH = '66mm';
const DENSITY_STYLES: Record<LayoutDensity, string> = {
  compact: '--rd-font-size:9.5pt;--rd-line-height:1.35;--rd-section-gap:4mm;--rd-entry-gap:2.4mm',
  balanced: '--rd-font-size:10.5pt;--rd-line-height:1.5;--rd-section-gap:5mm;--rd-entry-gap:3.2mm',
  spacious: '--rd-font-size:11pt;--rd-line-height:1.6;--rd-section-gap:6mm;--rd-entry-gap:4mm',
};

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!));
}
function inline(children: TextNode[]): string {
  return children.map((node) => {
    let text = escapeHtml(node.text).replace(/\n/g, '<br>');
    if (node.marks?.includes('bold')) text = `<strong>${text}</strong>`;
    if (node.marks?.includes('italic')) text = `<em>${text}</em>`;
    return text;
  }).join('');
}
function blocks(nodes: DocumentNode[]): string {
  return nodes.map((node) => node.type === 'paragraph'
    ? `<p>${inline(node.children)}</p>`
    : `<${node.ordered ? 'ol' : 'ul'}>${node.items.map((item) => `<li>${blocks(item)}</li>`).join('')}</${node.ordered ? 'ol' : 'ul'}>`).join('');
}
function entryHtml(entry: DocumentEntry): string {
  const links = entry.links?.length ? `<div class="rd-entry-meta">${entry.links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}: ${escapeHtml(link.value)}</a>`).join(' · ')}</div>` : '';
  return `<article class="rd-entry">${entry.heading ? `<div class="rd-entry-heading">${escapeHtml(entry.heading)}</div>` : ''}${entry.meta ? `<div class="rd-entry-meta">${escapeHtml(entry.meta)}</div>` : ''}${blocks(entry.nodes || [])}${links}</article>`;
}
function sectionHtml(section: DocumentSection): string {
  return `<section class="rd-section" data-section="${escapeHtml(section.key)}"><h2 class="rd-section-title">${escapeHtml(section.title)}</h2>${section.entries.map(entryHtml).join('')}</section>`;
}
function headerHtml(header: ResumeDocument['header']): string {
  const contacts = (header.contacts || []).map((item) => item.href ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.value)}</a>` : `<span>${escapeHtml(item.value)}</span>`).join('');
  return `<header class="rd-header">${header.avatar ? `<img class="rd-avatar" src="${escapeHtml(header.avatar.dataUrl)}" alt="">` : ''}${header.fullName ? `<h1 class="rd-name">${escapeHtml(header.fullName)}</h1>` : ''}${header.targetRole ? `<p class="rd-role">${escapeHtml(header.targetRole)}</p>` : ''}${contacts ? `<div class="rd-contacts">${contacts}</div>` : ''}</header>`;
}

function templateOf(document: Pick<ResumeDocument, 'template'>): TemplateKey {
  return document.template === 'modern' || document.template === 'classic' ? document.template : 'minimal';
}

export function documentBodyHtml(document: ResumeDocument): string {
  const template = templateOf(document);
  const accent = /^#[0-9a-f]{6}$/i.test(document.accent || '') ? document.accent : DEFAULT_ACCENT[template];
  const density = DENSITY_STYLES[document.layoutDensity] || DENSITY_STYLES.balanced;
  const style = `--rd-accent:${accent};--rd-accent-soft:${tint(accent, 0.9)};--rd-accent-line:${tint(accent, 0.6)};${density}`;
  const sections = document.sections || [];
  const body = template === 'modern'
    ? `<div class="rd-sidebar-bg" aria-hidden="true"></div><aside class="rd-sidebar">${headerHtml(document.header)}${sections.filter((section) => MODERN_SIDEBAR_KEYS.has(section.key)).map(sectionHtml).join('')}</aside><div class="rd-main">${sections.filter((section) => !MODERN_SIDEBAR_KEYS.has(section.key)).map(sectionHtml).join('')}</div>`
    : `${headerHtml(document.header)}${sections.map(sectionHtml).join('')}`;
  return `<main class="rd rd--${template}" data-template="${template}" style="${style}">${body}</main>`;
}

const baseCss = `html,body{margin:0;padding:0}.rd{box-sizing:border-box;color:#1f2933;font-family:"Noto Sans","Noto Sans CJK SC","PingFang SC",Arial,sans-serif;font-size:var(--rd-font-size,10.5pt);line-height:var(--rd-line-height,1.5);overflow-wrap:anywhere;word-break:normal;-webkit-print-color-adjust:exact;print-color-adjust:exact}.rd *{box-sizing:border-box}.rd-name{font-size:22pt;line-height:1.2;margin:0;font-weight:700}.rd-role{margin:1mm 0 0}.rd-contacts{display:flex;flex-wrap:wrap;gap:1mm 3mm;font-size:9.5pt;margin-top:1.5mm}.rd-contacts a{color:inherit;text-decoration:none}.rd-avatar{object-fit:cover;width:22mm;height:22mm;border-radius:50%}.rd-section{margin:0 0 var(--rd-section-gap,5mm)}.rd-section-title{margin:0 0 2.5mm;break-after:avoid}.rd-entry{margin:0 0 var(--rd-entry-gap,3.2mm)}.rd-entry-short{break-inside:avoid}.rd-entry-heading{font-weight:700;break-after:avoid}.rd-entry-meta{color:#526271;font-size:9.5pt;margin-bottom:1mm;break-after:avoid}.rd-entry p{margin:0 0 1.6mm;orphans:3;widows:3}.rd-entry ul,.rd-entry ol{margin:1mm 0 1.6mm;padding-left:5mm;orphans:3;widows:3}.rd-entry li{break-inside:auto}.rd-entry a{color:var(--rd-accent);text-decoration:underline;overflow-wrap:anywhere}.rd-sidebar-bg{display:none}@media screen{.rd{width:210mm;min-height:297mm;margin:auto;background:#fff;box-shadow:0 2px 16px #0002}}`;

const templateCss: Record<TemplateKey, string> = {
  minimal: `@page{size:A4;margin:15mm}@media screen{.rd--minimal{padding:15mm}}.rd--minimal .rd-header{border-bottom:1px solid #cbd5df;padding-bottom:5mm;margin-bottom:6mm}.rd--minimal .rd-avatar{float:right;margin-left:5mm}.rd--minimal .rd-role{color:#465565}.rd--minimal .rd-section-title{font-size:12pt;letter-spacing:.04em;text-transform:uppercase;color:var(--rd-accent);border-bottom:1px solid #d7dee5;padding-bottom:1mm}`,
  classic: `@page{size:A4;margin:14mm 16mm}@media screen{.rd--classic{padding:14mm 16mm}}.rd--classic .rd-header{text-align:center;padding-bottom:4mm;margin-bottom:5mm;border-bottom:1.5pt solid var(--rd-accent)}.rd--classic .rd-avatar{display:block;margin:0 auto 3mm}.rd--classic .rd-name{color:var(--rd-accent);font-size:24pt;letter-spacing:.08em}.rd--classic .rd-role{color:#3e4c59;font-size:11pt}.rd--classic .rd-contacts{justify-content:center;gap:1mm 0}.rd--classic .rd-contacts>*+*::before{content:"|";color:var(--rd-accent-line);margin:0 2.5mm}.rd--classic .rd-section-title{display:flex;align-items:center;gap:3mm;color:var(--rd-accent);font-size:12.5pt;letter-spacing:.06em}.rd--classic .rd-section-title::after{content:"";flex:1;border-top:1px solid var(--rd-accent-line)}.rd--classic .rd-entry-heading{color:#111827}`,
  // A fixed element repeats on every printed page, which gives the sidebar a
  // full-bleed background on each page; cloned padding re-applies the top and
  // bottom page margins to every fragment of both columns.
  modern: `@page{size:A4;margin:0}.rd--modern{display:grid;grid-template-columns:${SIDEBAR_WIDTH} minmax(0,1fr)}.rd--modern .rd-sidebar{position:relative;background:var(--rd-accent);color:#fff;padding:14mm 7mm 14mm 8mm;-webkit-box-decoration-break:clone;box-decoration-break:clone;min-width:0}.rd--modern .rd-main{padding:14mm 12mm 14mm 10mm;-webkit-box-decoration-break:clone;box-decoration-break:clone;min-width:0}.rd--modern .rd-header{margin-bottom:7mm}.rd--modern .rd-avatar{display:block;width:26mm;height:26mm;margin-bottom:4mm;border:2px solid rgba(255,255,255,.6)}.rd--modern .rd-name{color:#fff;font-size:20pt}.rd--modern .rd-role{color:rgba(255,255,255,.9)}.rd--modern .rd-contacts{flex-direction:column;flex-wrap:nowrap;gap:1.2mm;margin-top:4mm;font-size:9pt;color:rgba(255,255,255,.92);word-break:break-all}.rd--modern .rd-sidebar .rd-section-title{font-size:10.5pt;letter-spacing:.08em;text-transform:uppercase;color:#fff;border-bottom:1px solid rgba(255,255,255,.4);padding-bottom:1mm}.rd--modern .rd-sidebar .rd-entry-meta{color:rgba(255,255,255,.88)}.rd--modern .rd-sidebar .rd-entry a{color:#fff}.rd--modern .rd-main .rd-section-title{font-size:13pt;line-height:1.25;color:var(--rd-accent);border-left:1.2mm solid var(--rd-accent);padding-left:2.5mm}@media print{.rd--modern .rd-sidebar{background:transparent}.rd--modern .rd-sidebar-bg{display:block;position:fixed;top:0;bottom:0;left:0;width:${SIDEBAR_WIDTH};background:var(--rd-accent)}}`,
};

export function documentCss(template: TemplateKey): string {
  return baseCss + (templateCss[template] || templateCss.minimal);
}

export function documentHtml(document: ResumeDocument): string {
  const template = templateOf(document);
  return `<!doctype html><html lang="${escapeHtml(document.locale)}"><head><meta charset="utf-8"><style>${documentCss(template)}</style></head><body>${documentBodyHtml(document)}<script>window.__RESUME_READY__=false;Promise.all([document.fonts.ready,...Array.from(document.images).map(i=>i.decode())]).then(()=>window.__RESUME_READY__=true)</script></body></html>`;
}

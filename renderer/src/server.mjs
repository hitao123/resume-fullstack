import http from 'node:http';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { minimalCss, normalizeResume } from '@resume-studio/resume-document';

const PORT = Number(process.env.PORT || 3001);
const MAX_CONCURRENCY = 2;
const MAX_QUEUE = 16;
const RENDER_TIMEOUT_MS = 60_000;
const internalToken = process.env.RENDERER_INTERNAL_TOKEN || '';
let browser;
let active = 0;
const waiting = [];

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function renderInline(children) { return children.map((node) => { let text = escapeHtml(node.text).replace(/\n/g, '<br>'); if (node.marks?.includes('bold')) text = `<strong>${text}</strong>`; if (node.marks?.includes('italic')) text = `<em>${text}</em>`; return text; }).join(''); }
function renderBlocks(nodes) { return nodes.map((node) => node.type === 'paragraph'
  ? `<p>${renderInline(node.children)}</p>`
  : `<${node.ordered ? 'ol' : 'ul'}>${node.items.map((item) => `<li>${renderBlocks(item)}</li>`).join('')}</${node.ordered ? 'ol' : 'ul'}>`).join(''); }

export function documentHtml(document) {
  const contacts = document.header.contacts.map((item) => item.href ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.value)}</a>` : `<span>${escapeHtml(item.value)}</span>`).join('');
  const sections = document.sections.map((section) => `<section class="minimal-section"><h2 class="minimal-section-title">${escapeHtml(section.title)}</h2>${section.entries.map((entry) => `<article class="minimal-entry">${entry.heading ? `<div class="minimal-entry-heading">${escapeHtml(entry.heading)}</div>` : ''}${entry.meta ? `<div class="minimal-entry-meta">${escapeHtml(entry.meta)}</div>` : ''}${renderBlocks(entry.nodes)}${entry.links?.length ? `<div class="minimal-entry-meta">${entry.links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}: ${escapeHtml(link.value)}</a>`).join(' · ')}</div>` : ''}</article>`).join('')}</section>`).join('');
  return `<!doctype html><html lang="${document.locale}"><head><meta charset="utf-8"><style>${minimalCss}</style></head><body><main class="minimal-document"><header class="minimal-header">${document.header.avatar ? `<img class="minimal-avatar" src="${escapeHtml(document.header.avatar.dataUrl)}" alt="">` : ''}${document.header.fullName ? `<h1 class="minimal-name">${escapeHtml(document.header.fullName)}</h1>` : ''}${document.header.targetRole ? `<p class="minimal-role">${escapeHtml(document.header.targetRole)}</p>` : ''}${contacts ? `<div class="minimal-contacts">${contacts}</div>` : ''}</header>${sections}</main><script>window.__RESUME_READY__=false;Promise.all([document.fonts.ready,...Array.from(document.images).map(i=>i.decode())]).then(()=>window.__RESUME_READY__=true)</script></body></html>`;
}

async function getBrowser() {
  if (browser?.isConnected()) return browser;
  if (!existsSync(chromium.executablePath())) {
    throw Object.assign(new Error('The PDF renderer browser is not installed. Run npx playwright install chromium in renderer.'), { code: 'BROWSER_NOT_INSTALLED' });
  }
  browser = await chromium.launch({ headless: true });
  browser.on('disconnected', () => { browser = undefined; });
  return browser;
}

export async function shutdownRenderer() {
  if (!browser) return;
  const currentBrowser = browser;
  browser = undefined;
  await currentBrowser.close();
}

async function render({ snapshot, locale, templateVersion }) {
  if (templateVersion !== 'minimal-v2') throw Object.assign(new Error('Unsupported template version.'), { code: 'INVALID_TEMPLATE_VERSION' });
  let source;
  try { source = JSON.parse(snapshot); } catch { throw Object.assign(new Error('Snapshot is not valid JSON.'), { code: 'INVALID_SNAPSHOT' }); }
  let document;
  try { document = normalizeResume(source, { locale }); } catch (error) { throw Object.assign(error, { code: error.code || 'INVALID_DOCUMENT' }); }
  const currentBrowser = await getBrowser();
  const context = await currentBrowser.newContext({ locale: document.locale, timezoneId: 'UTC', javaScriptEnabled: true });
  const page = await context.newPage();
  try {
    await page.route('**/*', (route) => route.abort('blockedbyclient'));
    await page.setContent(documentHtml(document), { waitUntil: 'commit', timeout: RENDER_TIMEOUT_MS });
    await page.waitForFunction(() => window.__RESUME_READY__ === true, { timeout: RENDER_TIMEOUT_MS });
    const fontLoaded = await page.evaluate(() => document.fonts.status === 'loaded' && document.fonts.check('10.5pt "Noto Sans CJK SC"'));
    if (!fontLoaded) throw Object.assign(new Error('Required Noto Sans CJK SC font did not load.'), { code: 'FONT_LOAD_FAILED' });
    await page.evaluate(() => {
      const shortEntryHeight = 89 * 96 / 25.4;
      document.querySelectorAll('.minimal-entry').forEach((entry) => {
        entry.classList.toggle('minimal-entry-short', entry.getBoundingClientRect().height <= shortEntryHeight);
      });
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflow) throw Object.assign(new Error('Document has horizontal overflow.'), { code: 'HORIZONTAL_OVERFLOW' });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' }, timeout: RENDER_TIMEOUT_MS });
    const pageCount = Math.max(0, (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length);
    if (pageCount > 20) throw Object.assign(new Error('Document exceeds the 20 page limit.'), { code: 'PAGE_LIMIT_EXCEEDED' });
    return { pdf, pageCount };
  } finally { await context.close(); }
}

function enqueue(job) {
  if (waiting.length >= MAX_QUEUE) return Promise.reject(Object.assign(new Error('Renderer queue is full.'), { code: 'QUEUE_FULL' }));
  return new Promise((resolve, reject) => { waiting.push({ job, resolve, reject }); drain(); });
}
function drain() {
  while (active < MAX_CONCURRENCY && waiting.length) {
    const item = waiting.shift(); active += 1;
    Promise.race([render(item.job), new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('Renderer timed out.'), { code: 'RENDER_TIMEOUT' })), RENDER_TIMEOUT_MS))])
      .then(item.resolve, item.reject).finally(() => { active -= 1; drain(); });
  }
}
function json(res, status, body) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }

export function createServer() {
  return http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') { json(res, 200, { status: 'ok', active, queued: waiting.length }); return; }
    if (req.method !== 'POST' || req.url !== '/render') { json(res, 404, { code: 'NOT_FOUND', message: 'Not found.' }); return; }
    if (internalToken && req.headers['x-renderer-token'] !== internalToken) { json(res, 401, { code: 'UNAUTHORIZED', message: 'Invalid renderer token.' }); return; }
    let raw = ''; req.setEncoding('utf8');
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 2_000_000) req.destroy(); });
    req.on('end', async () => {
      try {
        const result = await enqueue(JSON.parse(raw));
        res.writeHead(200, { 'content-type': 'application/pdf', 'content-length': result.pdf.length, 'x-resume-pages': String(result.pageCount) }); res.end(result.pdf);
      } catch (error) { json(res, error.code === 'QUEUE_FULL' ? 429 : 422, { code: error.code || 'RENDER_FAILED', message: error.message || 'Renderer failed.' }); }
    });
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) createServer().listen(PORT, '0.0.0.0', () => console.log(`resume renderer listening on ${PORT}`));

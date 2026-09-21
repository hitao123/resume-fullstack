import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer, shutdownRenderer } from '../src/server.mjs';

const longParagraph = '跨页内容 English 中文 mixed text with a deliberately long unbroken-link https://example.com/' + 'path/'.repeat(80) + '。';
const snapshot = {
  id: 1, userId: 9, templateId: 3, targetRole: 'Senior Engineer',
  personalInfo: { fullName: '李雷', email: 'li@example.com', linkedin: 'https://linkedin.com/in/lilei', showAvatar: true, avatarDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLq8QAAAABJRU5ErkJggg==', summary: `<p>${longParagraph}</p><ol><li>first<ul><li>nested item</li></ul></li></ol>` },
  sectionConfig: [{ key: 'workExperiences', visible: true, order: 0 }, { key: 'summary', visible: true, order: 1 }],
  workExperiences: Array.from({ length: 28 }, (_, id) => ({ id, position: `Engineer ${id}`, companyName: 'Example Co', startDate: '2020-01-01', isCurrent: id === 0, displayOrder: id, description: `<p>${longParagraph}</p>` })),
};

test('renders a selectable, multi-page A4 PDF from a structured snapshot', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/render`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: JSON.stringify(snapshot), locale: 'zh-CN', templateVersion: 'minimal-v2' }) });
    const pdf = Buffer.from(await response.arrayBuffer());
    assert.equal(response.status, 200);
    assert.ok(pdf.subarray(0, 5).equals(Buffer.from('%PDF-')));
    assert.ok(Number(response.headers.get('x-resume-pages')) > 1);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await shutdownRenderer();
  }
});

test('returns an explicit limit error rather than truncating oversized content', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/render`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: JSON.stringify({ templateId: 3, personalInfo: { summary: '字'.repeat(30_100) } }), locale: 'zh-CN', templateVersion: 'minimal-v2' }) });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'DOCUMENT_TOO_LARGE');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await shutdownRenderer();
  }
});

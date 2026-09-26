import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer, documentHtml } from '../src/server.mjs';

test('serializes normalized content without executing markup', () => {
  const html = documentHtml({ locale: 'en-US', header: { fullName: '<img>', contacts: [{ value: 'x', href: 'https://example.com/?q=<x>' }] }, sections: [{ title: 'Experience', entries: [{ heading: 'Role', nodes: [{ type: 'paragraph', children: [{ type: 'text', text: '<script>', marks: ['bold'] }] }] }] }] });
  assert.match(html, /&lt;img&gt;/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>[^w]/);
});

async function postRender(body) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/render`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('accepts a snapshot carrying a maximum-size avatar', async () => {
  const avatar = `data:image/png;base64,${Buffer.alloc(2 * 1024 * 1024).toString('base64')}`;
  const snapshot = JSON.stringify({ personalInfo: { showAvatar: true, avatarDataUrl: avatar } });
  // An unsupported template version fails after the body is parsed, which proves the size gate let it through.
  const { status, body } = await postRender(JSON.stringify({ snapshot, locale: 'en-US', templateVersion: 'unsupported' }));
  assert.equal(status, 422);
  assert.equal(body.code, 'INVALID_TEMPLATE_VERSION');
});

test('rejects oversized requests with an explicit error instead of dropping the connection', async () => {
  const { status, body } = await postRender(JSON.stringify({ snapshot: 'x'.repeat(9 * 1024 * 1024) }));
  assert.equal(status, 413);
  assert.equal(body.code, 'PAYLOAD_TOO_LARGE');
});

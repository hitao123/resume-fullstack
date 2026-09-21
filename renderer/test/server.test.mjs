import assert from 'node:assert/strict';
import test from 'node:test';
import { documentHtml } from '../src/server.mjs';

test('serializes normalized content without executing markup', () => {
  const html = documentHtml({ locale: 'en-US', header: { fullName: '<img>', contacts: [{ value: 'x', href: 'https://example.com/?q=<x>' }] }, sections: [{ title: 'Experience', entries: [{ heading: 'Role', nodes: [{ type: 'paragraph', children: [{ type: 'text', text: '<script>', marks: ['bold'] }] }] }] }] });
  assert.match(html, /&lt;img&gt;/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>[^w]/);
});

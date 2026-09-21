import assert from 'node:assert/strict';
import test from 'node:test';
import { DocumentLimitError, normalizeResume, richText, safeUrl } from './index.js';

test('normalizes every supported section in configured order without management metadata', () => {
  const doc = normalizeResume({ title: 'Private draft', versionLabel: 'v4', targetRole: 'Staff Engineer', personalInfo: { fullName: '李雷', summary: '<p>Hello <strong>world</strong></p>', linkedin: 'https://linkedin.com/in/lei' }, sectionConfig: [{ key: 'projects', visible: true, order: 0 }], projects: [{ id: 2, name: 'Resume', url: 'https://example.com', displayOrder: 3 }] });
  assert.equal(doc.header.targetRole, 'Staff Engineer');
  assert.equal(doc.sections[0].key, 'projects');
  assert.equal(JSON.stringify(doc).includes('Private draft'), false);
  assert.equal(doc.sections.at(-1)?.key, 'summary');
  assert.equal(doc.sections[0].entries[0].links?.[0].href, 'https://example.com/');
});

test('drops unsafe URLs, preserves marks and nested list structure', () => {
  assert.equal(safeUrl('javascript:alert(1)'), undefined);
  const blocks = richText('<p>a <strong>b</strong></p><ol><li>one<ul><li>nested</li></ul></li></ol>');
  assert.equal(blocks[0].type, 'paragraph');
  assert.equal((blocks[0] as any).children[1].marks[0], 'bold');
  assert.equal(blocks[1].type, 'list');
  assert.equal(((blocks[1] as any).items[0][1] as any).type, 'list');
});

test('decodes HTML entities and preserves hard line breaks as document text', () => {
  const blocks = richText('<p>R&amp;D &lt;10<br>next</p>');
  assert.equal(blocks[0].type, 'paragraph');
  assert.equal((blocks[0] as any).children.map((child: { text: string }) => child.text).join(''), 'R&D <10\nnext');
});

test('rejects excessive entry counts explicitly', () => {
  assert.throws(() => normalizeResume({ skills: Array.from({ length: 301 }, (_, id) => ({ id, name: `s${id}` })) }), DocumentLimitError);
});

test('accepts the published 300-entry boundary and rejects excess Unicode text', () => {
  const boundary = normalizeResume({ skills: Array.from({ length: 300 }, (_, id) => ({ id, name: `s${id}` })) });
  assert.equal(boundary.statistics.entries, 300);
  assert.throws(() => normalizeResume({ personalInfo: { summary: '字'.repeat(30_100) } }), DocumentLimitError);
  assert.equal(normalizeResume({ personalInfo: { summary: '字'.repeat(29_900) } }).statistics.characters, 29_900);
});

test('maps every recipient-facing field and excludes management metadata', () => {
  const doc = normalizeResume({
    title: 'Do not render', versionLabel: 'private', targetRole: 'Lead',
    personalInfo: { fullName: 'Ada', email: 'ada@example.com', phone: '+1 555', location: 'Shanghai', website: 'https://ada.example', linkedin: 'https://linkedin.com/in/ada', github: 'https://github.com/ada', summary: 'Summary' },
    workExperiences: [{ id: 1, position: 'Engineer', companyName: 'Co', location: 'Remote', startDate: '2020-01-01', endDate: '2022-01-01', description: 'Work' }],
    education: [{ id: 2, institution: 'University', degree: 'BSc', fieldOfStudy: 'CS', location: 'City', startDate: '2016-01-01', endDate: '2020-01-01', gpa: '4.0', description: 'Education' }],
    skills: [{ id: 3, category: 'Languages', name: 'TypeScript', proficiencyLevel: 'Expert' }],
    projects: [{ id: 4, name: 'Project', technologies: 'Go', url: 'https://project.example', githubUrl: 'https://github.com/a/p', description: 'Project text' }],
    certifications: [{ id: 5, name: 'Certificate', issuingOrganization: 'Org', issueDate: '2024-01-01', expiryDate: '2025-01-01', credentialId: 'ABC', credentialUrl: 'https://cert.example' }],
    languages: [{ id: 6, language: 'English', proficiency: 'Native' }],
    awards: [{ id: 7, title: 'Award', issuer: 'Org', issueDate: '2023-01-01', description: 'Award text' }],
    customSections: [{ id: 8, title: 'Open source', content: 'Custom text' }],
  });
  assert.deepEqual(doc.sections.map((section) => section.key), ['summary', 'workExperiences', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards', 'customSections']);
  const text = JSON.stringify(doc);
  for (const value of ['Ada', 'University', 'TypeScript', 'Project', 'Certificate', 'Expires: Jan 2025', 'English', 'Award', 'Open source', 'https://cert.example/']) assert.ok(text.includes(value));
  assert.equal(text.includes('Do not render'), false);
  assert.equal(text.includes('private'), false);
});

test('renders only a bounded, controlled avatar data resource', () => {
  const doc = normalizeResume({ personalInfo: { showAvatar: true, avatarDataUrl: 'data:image/png;base64,aGVsbG8=' } });
  assert.equal(doc.header.avatar?.mimeType, 'image/png');
  assert.equal(normalizeResume({ personalInfo: { showAvatar: true, avatarDataUrl: 'https://example.com/avatar.png' } }).header.avatar, undefined);
});

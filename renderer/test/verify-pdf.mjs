import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createServer } from '../src/server.mjs';

const snapshot = {
  id: 1, userId: 1, templateId: 3, targetRole: 'Platform Engineer',
  personalInfo: { fullName: '李雷', email: 'li@example.com', summary: '<p>English and 中文 mixed text.</p><ol><li>ordered item<ul><li>nested item</li></ul></li></ol>' },
  workExperiences: Array.from({ length: 26 }, (_, id) => ({ id, position: `Role ${id}`, companyName: 'Example', startDate: '2020-01-01', isCurrent: id === 0, displayOrder: id, description: `<p>Sentinel-${id}-start ${'long content '.repeat(55)} Sentinel-${id}-end</p>` })),
};
const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/render`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: JSON.stringify(snapshot), locale: 'zh-CN', templateVersion: 'minimal-v2' }) });
  if (!response.ok) throw new Error(await response.text());
  const outputDir = new URL('../../tmp/pdfs/', import.meta.url);
  await mkdir(outputDir, { recursive: true });
  const pdfPath = new URL('minimal-v2-sample.pdf', outputDir);
  await writeFile(pdfPath, new Uint8Array(await response.arrayBuffer()));
  const path = pdfPath.pathname;
  const python = process.env.PDF_PYTHON || 'python3';
  const text = execFileSync(python, ['-c', 'from pypdf import PdfReader; import sys; pages=PdfReader(sys.argv[1]).pages; values=[page.extract_text() or "" for page in pages]; assert all(value.strip() for value in values), "blank page"; print("\\n".join(values))', path], { encoding: 'utf8' });
  if (!text.includes('Sentinel-0-start') || !text.includes('Sentinel-25-end') || !text.includes('李雷')) throw new Error('PDF text extraction missed required sentinels.');
  const pdftoppm = process.env.PDFTOPPM || 'pdftoppm';
  execFileSync(pdftoppm, ['-png', '-r', '120', path, new URL('minimal-v2-page', outputDir).pathname]);
  console.log(JSON.stringify({ pdf: path, pages: response.headers.get('x-resume-pages'), textVerified: true }));
} finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }

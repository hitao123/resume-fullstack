import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { documentBodyHtml, documentCss, normalizeResume, type ResumeDocument } from '../../../../packages/resume-document/src/index';
import type { Resume } from '@/types/resume.types';

interface PrintDocumentProps {
  resume: Resume;
  locale?: string;
  fitMode?: 'a4' | 'screen';
}

/**
 * Editor preview for every template. It injects the exact markup and
 * stylesheet the PDF renderer prints, so the preview and export cannot drift.
 */
export const PrintDocument = ({ resume, locale, fitMode = 'screen' }: PrintDocumentProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { normalized, previewError } = useMemo((): { normalized?: ResumeDocument; previewError?: string } => {
    try {
      return { normalized: normalizeResume(resume, { locale }) };
    } catch (error) {
      return { previewError: error instanceof Error ? error.message : 'The document cannot be previewed.' };
    }
  }, [resume, locale]);
  const html = useMemo(() => normalized ? documentBodyHtml(normalized) : '', [normalized]);

  // Keep genuinely short entries together, but allow long entries to paginate.
  // The classification uses the rendered height, never the number of nodes.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const shortEntryHeight = 89 * 96 / 25.4;
    root.querySelectorAll<HTMLElement>('.rd-entry').forEach((item) => {
      item.classList.toggle('rd-entry-short', item.offsetHeight <= shortEntryHeight);
    });
  }, [html]);

  useLayoutEffect(() => {
    const stage = rootRef.current?.parentElement;
    if (!stage || fitMode === 'a4') return;
    const fitPaper = () => {
      const style = getComputedStyle(stage);
      const available = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setScale(Math.min(1, Math.max(0.1, available / (210 * 96 / 25.4))));
    };
    fitPaper();
    const observer = new ResizeObserver(fitPaper);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [fitMode]);

  if (!normalized) return <div role="alert">{previewError}</div>;

  return (
    <div ref={rootRef} data-template-version={normalized.schemaVersion} style={{ zoom: fitMode === 'a4' ? 1 : scale }}>
      <style>{documentCss(normalized.template)}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default PrintDocument;

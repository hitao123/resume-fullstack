import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { minimalCss, normalizeResume, type DocumentNode, type ResumeDocument, type TextNode } from '../../../../packages/resume-document/src/index';
import type { Resume } from '@/types/resume.types';

interface MinimalDocumentProps {
  resume?: Resume;
  document?: ResumeDocument;
  locale?: string;
  className?: string;
  fitMode?: 'a4' | 'screen';
}

function inline(nodes: TextNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    let output: ReactNode = node.text;
    if (node.marks?.includes('bold')) output = <strong key={`bold-${index}`}>{output}</strong>;
    if (node.marks?.includes('italic')) output = <em key={`italic-${index}`}>{output}</em>;
    return <span key={`text-${index}`}>{output}</span>;
  });
}

function blocks(nodes: DocumentNode[], prefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${prefix}-${index}`;
    if (node.type === 'paragraph') return <p key={key}>{inline(node.children)}</p>;
    const List = node.ordered ? 'ol' : 'ul';
    return <List key={key}>{node.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{blocks(item, `${key}-${itemIndex}`)}</li>)}</List>;
  });
}

/** Fixed-width, print-native minimal-v2 document used for the editor's immediate preview. */
export const MinimalDocument = ({ resume, document, locale, className, fitMode = 'screen' }: MinimalDocumentProps) => {
  const rootRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  let normalized: ResumeDocument | undefined;
  let previewError: string | undefined;
  try {
    normalized = document ?? normalizeResume(resume, { locale });
  } catch (error) {
    previewError = error instanceof Error ? error.message : 'The document cannot be previewed.';
  }
  // Keep genuinely short entries together, but allow long entries to paginate.
  // The classification uses the rendered height, never the number of nodes.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const shortEntryHeight = 89 * 96 / 25.4;
    root.querySelectorAll<HTMLElement>('.minimal-entry').forEach((item) => {
      item.classList.toggle('minimal-entry-short', item.offsetHeight <= shortEntryHeight);
    });
  }, [normalized]);

  useLayoutEffect(() => {
    const stage = rootRef.current?.parentElement;
    if (!stage || fitMode === 'a4') {
      setScale(1);
      return;
    }
    const fitPaper = () => {
      const style = getComputedStyle(stage);
      const available = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setScale(Math.min(1, Math.max(0.1, available / (210 * 96 / 25.4))));
    };
    fitPaper();
    const observer = new ResizeObserver(fitPaper);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [fitMode, normalized]);

  if (!normalized) return <div className="minimal-document" role="alert"><style>{minimalCss}</style><p>{previewError}</p></div>;

  return (
    <article ref={rootRef} className={`minimal-document ${className || ''}`} data-template-version={normalized.schemaVersion} style={{ zoom: scale }}>
      <style>{minimalCss}</style>
      <header className="minimal-header">
        {normalized.header.avatar && <img className="minimal-avatar" src={normalized.header.avatar.dataUrl} alt="" />}
        {normalized.header.fullName && <h1 className="minimal-name">{normalized.header.fullName}</h1>}
        {normalized.header.targetRole && <p className="minimal-role">{normalized.header.targetRole}</p>}
        {normalized.header.contacts.length > 0 && <div className="minimal-contacts">
          {normalized.header.contacts.map((contact) => contact.href
            ? <a key={`${contact.label}-${contact.value}`} href={contact.href} rel="noreferrer">{contact.value}</a>
            : <span key={`${contact.label}-${contact.value}`}>{contact.value}</span>)}
        </div>}
      </header>
      {normalized.sections.map((section) => (
        <section key={section.sourceId} className="minimal-section">
          <h2 className="minimal-section-title">{section.title}</h2>
          {section.entries.map((entry) => (
            <article key={entry.sourceId} className="minimal-entry">
              {entry.heading && <div className="minimal-entry-heading">{entry.heading}</div>}
              {entry.meta && <div className="minimal-entry-meta">{entry.meta}</div>}
              {blocks(entry.nodes, entry.sourceId)}
              {entry.links?.length ? <div className="minimal-entry-meta">{entry.links.map((link) => <a key={link.href} href={link.href} rel="noreferrer">{link.label}: {link.value}</a>)}</div> : null}
            </article>
          ))}
        </section>
      ))}
    </article>
  );
};

export default MinimalDocument;

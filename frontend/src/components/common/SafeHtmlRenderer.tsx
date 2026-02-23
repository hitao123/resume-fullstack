import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li'];

function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

function plainTextToHtml(text: string): string {
  if (!text) return '';
  return text
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

function prepareHtml(content: string | undefined): string {
  if (!content) return '';
  if (isHtmlContent(content)) return sanitize(content);
  return plainTextToHtml(content);
}

interface SafeHtmlRendererProps {
  content: string | undefined;
  className?: string;
  style?: React.CSSProperties;
}

const SafeHtmlRenderer = ({ content, className, style }: SafeHtmlRendererProps) => {
  if (!content) return null;
  return (
    <div
      className={`safe-html-content ${className || ''}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: prepareHtml(content) }}
    />
  );
};

export default SafeHtmlRenderer;

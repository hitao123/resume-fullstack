import { Button, Space, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import SafeHtmlRenderer from '@/components/common/SafeHtmlRenderer';

interface AIResultPanelProps {
  content: string;
  isGenerating: boolean;
  error: string | null;
  onAccept: () => void;
  onDiscard: () => void;
}

const AIResultPanel: React.FC<AIResultPanelProps> = ({
  content,
  isGenerating,
  error,
  onAccept,
  onDiscard,
}) => {
  const { t } = useTranslation();

  if (!content && !isGenerating && !error) return null;

  return (
    <div
      style={{
        marginTop: 8,
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0',
          background: 'linear-gradient(135deg, #667eea10, #764ba210)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          color: '#666',
        }}
      >
        <span style={{ fontSize: 14 }}>&#10024;</span>
        {isGenerating ? t('ai.generating') : 'AI'}
        {isGenerating && <Spin size="small" />}
      </div>

      <div style={{ padding: 12, minHeight: 60, fontSize: 14, lineHeight: 1.6 }}>
        {error ? (
          <div style={{ color: '#ff4d4f' }}>{t('ai.error', { message: error })}</div>
        ) : content ? (
          <SafeHtmlRenderer content={content} style={{ color: '#333' }} />
        ) : (
          <div style={{ color: '#999' }}>{t('ai.generating')}</div>
        )}
      </div>

      {(content || error) && !isGenerating && (
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Space>
            <Button size="small" onClick={onDiscard}>
              {t('ai.discard')}
            </Button>
            {content && !error && (
              <Button size="small" type="primary" onClick={onAccept}>
                {t('ai.accept')}
              </Button>
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default AIResultPanel;

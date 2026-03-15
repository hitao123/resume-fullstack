import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

interface AIAssistantButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ onClick, loading, label }) => {
  const { t } = useTranslation();
  const text = label || t('ai.enhanceDescription');

  return (
    <Tooltip title={text}>
      <Button
        size="small"
        onClick={onClick}
        loading={loading}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: '#fff',
          fontSize: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {!loading && <span style={{ fontSize: 14 }}>&#10024;</span>}
        {text}
      </Button>
    </Tooltip>
  );
};

export default AIAssistantButton;

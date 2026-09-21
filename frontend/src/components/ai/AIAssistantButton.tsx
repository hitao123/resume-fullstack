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
          background: 'linear-gradient(135deg, #b98a2f 0%, #8a5a1d 100%)',
          border: 'none',
          color: '#fff',
          fontSize: 12,
          borderRadius: 8,
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

import { useTranslation } from 'react-i18next';

const features = [
  { icon: '🤖', key: 'ai' },
  { icon: '🎨', key: 'templates' },
  { icon: '👁', key: 'preview' },
  { icon: '📥', key: 'export' },
];

const FeatureShowcase = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--rs-ink)',
          margin: '0 0 20px',
          letterSpacing: '-0.01em',
        }}
      >
        {t('landing.features.title')}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 14,
        }}
      >
        {features.map((f) => (
          <div
            key={f.key}
            style={{
              background: 'rgba(255, 255, 255, 0.78)',
              border: '1px solid var(--rs-border)',
              borderRadius: 12,
              padding: '18px 16px',
              boxShadow: 'var(--rs-shadow-sm)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rs-ink)', marginBottom: 4 }}>
              {t(`landing.features.${f.key}.title`)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--rs-ink-soft)', lineHeight: 1.6 }}>
              {t(`landing.features.${f.key}.desc`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureShowcase;

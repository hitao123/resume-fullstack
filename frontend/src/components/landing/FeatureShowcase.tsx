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
      <h2 style={{ fontSize: 24, fontWeight: 600, color: '#fff', margin: '0 0 24px' }}>
        {t('landing.features.title')}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
      >
        {features.map((f) => (
          <div
            key={f.key}
            style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: '20px 16px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              {t(`landing.features.${f.key}.title`)}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              {t(`landing.features.${f.key}.desc`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureShowcase;

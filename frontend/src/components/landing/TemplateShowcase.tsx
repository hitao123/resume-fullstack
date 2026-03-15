import { useTranslation } from 'react-i18next';

const templates = [
  { key: 'classic', color: '#1a1a2e' },
  { key: 'modern', color: '#16213e' },
  { key: 'minimal', color: '#0f3460' },
];

const TemplateShowcase = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: '#fff', margin: '0 0 24px' }}>
        {t('landing.templates.title')}
      </h2>
      <div style={{ display: 'flex', gap: 16 }}>
        {templates.map((tpl) => (
          <div
            key={tpl.key}
            style={{
              flex: 1,
              borderRadius: 12,
              overflow: 'hidden',
              background: tpl.color,
              padding: 16,
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* CSS-simulated resume layout */}
            <div>
              <div
                style={{
                  width: '60%',
                  height: 10,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.4)',
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: '80%',
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.15)',
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  width: '70%',
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.15)',
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  width: '40%',
                  height: 8,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.3)',
                  marginBottom: 6,
                }}
              />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: `${90 - i * 10}%`,
                    height: 5,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.1)',
                    marginBottom: 3,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
              }}
            >
              {t(`landing.templates.${tpl.key}`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateShowcase;

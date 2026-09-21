import { useTranslation } from 'react-i18next';

const templates = [
  { key: 'classic', accent: '#44403c' },
  { key: 'modern', accent: '#9d6b21' },
  { key: 'minimal', accent: '#a8a29e' },
];

const row = (width: string, height: number, color: string, extra?: React.CSSProperties) => (
  <div
    style={{
      width,
      height,
      borderRadius: 999,
      background: color,
      ...extra,
    }}
  />
);

const TemplateShowcase = () => {
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
        {t('landing.templates.title')}
      </h2>
      <div style={{ display: 'flex', gap: 14 }}>
        {templates.map((tpl) => (
          <div
            key={tpl.key}
            style={{
              flex: 1,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#ffffff',
              border: '1px solid var(--rs-border)',
              boxShadow: 'var(--rs-shadow-sm)',
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
                  width: '46%',
                  height: 10,
                  borderRadius: 999,
                  background: tpl.accent,
                  marginBottom: 10,
                }}
              />
              {row('82%', 6, '#edece9', { marginBottom: 5 })}
              {row('68%', 6, '#edece9', { marginBottom: 14 })}
              {row('38%', 8, tpl.accent, { marginBottom: 8, opacity: 0.85 })}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: `${92 - i * 12}%`,
                    height: 5,
                    borderRadius: 999,
                    background: '#f1efeb',
                    marginBottom: 4,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--rs-ink-soft)',
                textAlign: 'center',
                marginTop: 14,
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

import { useTranslation } from 'react-i18next';

const HeroSection = () => {
  const { t } = useTranslation();

  const highlights = [
    { icon: '✦', key: 'aiWriting' },
    { icon: '⚡', key: 'fastCreate' },
    { icon: '📄', key: 'pdfExport' },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.2,
          margin: 0,
          color: 'var(--rs-ink)',
          letterSpacing: '-0.02em',
        }}
      >
        {t('landing.hero.title')}
      </h1>
      <p
        style={{
          fontSize: 17,
          lineHeight: 1.7,
          margin: '16px 0 32px',
          color: 'var(--rs-ink-soft)',
          maxWidth: 520,
        }}
      >
        {t('landing.hero.subtitle')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {highlights.map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.72)',
                border: '1px solid var(--rs-gold-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                color: 'var(--rs-gold-deep)',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            <span style={{ fontSize: 15, color: 'var(--rs-ink)', fontWeight: 500 }}>
              {t(`landing.hero.${item.key}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;

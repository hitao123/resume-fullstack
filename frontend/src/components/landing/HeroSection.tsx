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
          color: '#fff',
        }}
      >
        {t('landing.hero.title')}
      </h1>
      <p
        style={{
          fontSize: 18,
          lineHeight: 1.6,
          margin: '16px 0 32px',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {t('landing.hero.subtitle')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {highlights.map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.95)' }}>
              {t(`landing.hero.${item.key}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;

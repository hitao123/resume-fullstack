import { useTranslation } from 'react-i18next';

const SocialProof = () => {
  const { t } = useTranslation();

  const stats = [
    { key: 'users', value: '10,000+' },
    { key: 'resumes', value: '50,000+' },
    { key: 'exports', value: '100,000+' },
  ];

  const testimonials = [
    { key: 'user1', avatar: 'L' },
    { key: 'user2', avatar: 'W' },
  ];

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 40, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.key}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--rs-ink)', letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--rs-ink-soft)', marginTop: 4 }}>
              {t(`landing.stats.${s.key}`)}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {testimonials.map((item) => (
          <div
            key={item.key}
            style={{
              background: 'rgba(255, 255, 255, 0.78)',
              border: '1px solid var(--rs-border)',
              boxShadow: 'var(--rs-shadow-sm)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--rs-gold-soft)',
                border: '1px solid var(--rs-gold-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--rs-gold-deep)',
                flexShrink: 0,
              }}
            >
              {item.avatar}
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--rs-ink)', fontWeight: 600 }}>
                {t(`landing.testimonials.${item.key}.name`)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--rs-ink-soft)', lineHeight: 1.6, marginTop: 4 }}>
                {t(`landing.testimonials.${item.key}.text`)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialProof;

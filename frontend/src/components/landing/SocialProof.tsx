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
      <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.key} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              {t(`landing.stats.${s.key}`)}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {testimonials.map((item) => (
          <div
            key={item.key}
            style={{
              background: 'rgba(255,255,255,0.1)',
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
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {item.avatar}
            </div>
            <div>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>
                {t(`landing.testimonials.${item.key}.name`)}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginTop: 4 }}>
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

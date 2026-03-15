import React from 'react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import Footer from '@/components/layout/Footer';
import HeroSection from './HeroSection';
import FeatureShowcase from './FeatureShowcase';
import TemplateShowcase from './TemplateShowcase';
import SocialProof from './SocialProof';
import './LandingLayout.css';

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  return (
    <div className="landing-layout">
      <div className="landing-form">
        <div className="landing-lang-switcher">
          <LanguageSwitcher variant="default" />
        </div>
        <div className="landing-form-inner">
          {children}
          <div className="landing-footer">
            <Footer />
          </div>
        </div>
      </div>
      <div className="landing-marketing">
        <HeroSection />
        <FeatureShowcase />
        <TemplateShowcase />
        <SocialProof />
      </div>
    </div>
  );
};

export default LandingLayout;

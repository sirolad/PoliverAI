import React from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@poliverai/intl';
import {
  HeroSection,
  FeaturesSection,
  Footer,
  TeamCarousel,
  AppPlatforms,
  HowItWorks,
  PricingSection,
  CTASection,
  TeamWriteup,
} from '@poliverai/shared-ui';
import AppFooter from '../../components/AppFooter';

type LandingScreenContentProps = {
  wrapSection?: (id: string, children: React.ReactNode) => React.ReactNode;
};

export default function LandingScreenContent({
  wrapSection,
}: LandingScreenContentProps) {
  const { isAuthenticated } = useAuth();

  const section = (id: string, children: React.ReactNode) =>
    wrapSection ? wrapSection(id, children) : children;

  return (
    <>
      <HeroSection />
      {section('platforms', <AppPlatforms />)}
      {section('features', <FeaturesSection />)}
      {section('how-it-works', <HowItWorks />)}
      {section('pricing', <PricingSection />)}
      {!isAuthenticated ? <CTASection /> : null}
      {section(
        'team',
        <>
          <TeamCarousel />
          <TeamWriteup />
        </>
      )}
      {Platform.OS === 'web' ? (
        <Footer hasBackground={true} />
      ) : (
        section('footer', <AppFooter />)
      )}
    </>
  );
}

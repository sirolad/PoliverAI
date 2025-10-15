
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useAuth } from '@poliverai/intl';
import { colors, spacing, twFromTokens, Splash, HeroSection, FeaturesSection, Footer, TeamCarousel, AppPlatforms, HowItWorks, PricingSection, CTASection, TeamWriteup } from '@poliverai/shared-ui';

export default function LandingScreen() {
	const { isAuthenticated } = useAuth();
	const [showSplash, setShowSplash] = useState(true);

	return (
		<ScrollView style={twFromTokens('min-h-screen', colors.pageGradient)}>
			{showSplash && (
				<Splash onFinish={() => setShowSplash(false)} delayMs={200} durationMs={5000} />
			)}
			<HeroSection />
			<View style={twFromTokens(spacing.sectionContainer)}>
				<AppPlatforms />
			</View>
			<FeaturesSection />
			<HowItWorks />
			<PricingSection />
			{!isAuthenticated && <CTASection />}
			<TeamCarousel />
			<TeamWriteup />
			<Footer hasBackground={true} />
		</ScrollView>
	);
}

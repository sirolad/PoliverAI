import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@poliverai/shared-ui';
import { FeatureCard } from '@poliverai/shared-ui';
import { useAuth } from '@poliverai/intl';
import { useTranslation } from '@poliverai/intl';

export const DashboardFullScreen: React.FC = () => {
	const { user, isAuthenticated, isLoading } = useAuth();
	const { t, get } = useTranslation();

	// Local types for locale-provided arrays
	type Feature = { emoji: string; title: string; description: string; isPro?: boolean };
	type Step = { n: number; title: string; desc: string };

	// AuthContext does not include an `isPro` flag on the User type by default.
	// Safely derive a boolean from the user object if present (keeps TypeScript happy
	// and avoids changing the shared AuthContext shape here).
	// Local type guard for user objects that might include an isPro flag
	const isUserWithPro = (u: unknown): u is { isPro?: boolean } => !!u && typeof u === 'object' && 'isPro' in (u as Record<string, unknown>);
	const isPro: boolean = isUserWithPro(user) ? Boolean(user.isPro) : false;

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.center}><Text>{t('common.loading', 'Loading...')}</Text></View>
			</SafeAreaView>
		);
	}

	if (!isAuthenticated) {
		// If not authenticated, render a placeholder — navigation should protect this route.
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.center}><Text>{t('screens.login.header.subtitle', 'Sign in to access your GDPR compliance dashboard')}</Text></View>
			</SafeAreaView>
		);
	}

	// Load feature lists from locales; fall back to inline defaults if missing
	const freeFeatures = (get('screens.dashboard.features.free') as Feature[]) || [
		{ emoji: '✅', title: 'Policy Verification', description: 'Upload and analyze privacy policies with basic GDPR compliance checks', isPro: false },
		{ emoji: '⏱️', title: 'Fast Analysis', description: 'Quick rule-based compliance screening', isPro: false },
		{ emoji: '🛡️', title: 'Basic Recommendations', description: 'Get essential compliance improvement suggestions', isPro: false },
	];

	const proFeatures = (get('screens.dashboard.features.pro') as Feature[]) || [
		{ emoji: '⚡', title: 'AI-Powered Analysis', description: 'Advanced AI analysis with nuanced violation detection', isPro: !!isPro },
		{ emoji: '📊', title: 'Comprehensive Reports', description: 'Detailed PDF reports with confidence scores and evidence', isPro: !!isPro },
		{ emoji: '📝', title: 'Policy Generation', description: 'Automatically generate revised compliant policies', isPro: !!isPro },
	];

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					{/* welcome template uses {{name}} placeholder; replace manually */}
					<Text style={styles.title}>{(get('screens.dashboard.header.welcome') as string || 'Welcome back, {{name}}!').replace('{{name}}', user?.name ?? '')}</Text>
					<Text style={styles.subtitle}>{t('screens.dashboard.header.subtitle')}</Text>
				</View>

				<Card style={{ marginBottom: 16 }}>
					<View style={styles.cardRow}>
						<View style={{ flex: 1 }}>
							<Text style={styles.cardTitle}>{t('screens.dashboard.account.title')}</Text>
							<Text style={styles.cardDesc}>{(get('screens.dashboard.account.status') as string || 'You are currently on the {{plan}} plan').replace('{{plan}}', isPro ? 'Pro' : 'Free')}</Text>
						</View>
						<View style={styles.cardActions}>
							<View style={[styles.planPill, isPro ? styles.proPill : styles.freePill]}>
								<Text style={styles.planText}>{isPro ? t('screens.dashboard.account.planLabel.pro', 'PRO PLAN') : t('screens.dashboard.account.planLabel.free', 'FREE PLAN')}</Text>
							</View>
							{!isPro && (
								<TouchableOpacity style={[styles.upgradeButton]}>
									<Text style={{ color: '#fff', fontWeight: '700' }}>{t('screens.dashboard.account.upgrade', 'Upgrade to Pro')}</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</Card>

				<View style={{ marginBottom: 16 }}>
					<Text style={styles.sectionTitle}>{t('screens.dashboard.quickActions.title', 'Quick Actions')}</Text>
					<View style={styles.quickActionsRow}>
									<TouchableOpacity style={[styles.quickActionCard]}>
										<View style={{ flexDirection: 'row', alignItems: 'center' }}>
															<View style={[{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginRight: 8 }]} accessibilityRole="image" accessibilityLabel="Analyze New Policy">
																<Text style={{ fontSize: 14 }}>A</Text>
															</View>
															<Text style={styles.quickActionTitle}>{t('screens.dashboard.quickActions.analyze.title', 'Analyze New Policy')}</Text>
										</View>
										<Text style={styles.quickActionDesc}>{t('screens.dashboard.quickActions.analyze.desc', 'Upload a privacy policy for GDPR compliance analysis')}</Text>
									</TouchableOpacity>

						{isPro && (
											<TouchableOpacity style={[styles.quickActionCard]}>
												<View style={{ flexDirection: 'row', alignItems: 'center' }}>
																		<View style={[{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 8 }]} accessibilityRole="image" accessibilityLabel="View Reports">
																			<Text style={{ fontSize: 14 }}>R</Text>
																		</View>
																		<Text style={styles.quickActionTitle}>{t('screens.dashboard.quickActions.reports.title', 'View Reports')}</Text>
												</View>
												<Text style={styles.quickActionDesc}>{t('screens.dashboard.quickActions.reports.desc', 'Access your detailed compliance reports and history')}</Text>
											</TouchableOpacity>
						)}
					</View>
				</View>

				<View style={{ marginBottom: 16 }}>
					<Text style={styles.sectionTitle}>{t('screens.dashboard.features.title', 'Your Features')}</Text>

					<Text style={styles.subheading}>{t('screens.dashboard.features.freeHeading', 'Free Plan Features')}</Text>
					<View style={styles.featuresGrid}>
						{freeFeatures.map((f, i) => (
							<FeatureCard key={i} {...f} />
						))}
					</View>

					<Text style={[styles.subheading, { marginTop: 12 }]}>{t('screens.dashboard.features.proHeading', 'Pro Plan Features')}</Text>
					<View style={styles.featuresGrid}>
						{proFeatures.map((f, i) => (
							<FeatureCard key={i} {...f} />
						))}
					</View>
				</View>

				<Card>
					<View style={{ padding: 12 }}>
						<Text style={styles.cardTitle}>{t('screens.dashboard.gettingStarted.title', 'Getting Started')}</Text>
						<Text style={styles.cardDesc}>{t('screens.dashboard.gettingStarted.lead', "New to PoliverAI? Here's how to get the most out of your account")}</Text>

						<View style={{ marginTop: 12 }}>
							{((get('screens.dashboard.gettingStarted.steps') as Step[]) || []).map((s) => (
								<View key={s.n} style={styles.stepRow}>
									<View style={styles.stepNumber}><Text style={styles.stepNumberText}>{s.n}</Text></View>
									<View style={{ flex: 1 }}>
										<Text style={styles.stepTitle}>{s.title}</Text>
										<Text style={styles.stepDesc}>{s.desc}</Text>
									</View>
								</View>
							))}
						</View>
					</View>
				</Card>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F8FAFC' },
	content: { padding: 16 },
	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	header: { marginBottom: 12 },
	title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
	subtitle: { color: '#64748b', marginTop: 4 },
	cardRow: { flexDirection: 'row', alignItems: 'center' },
	cardTitle: { fontSize: 18, fontWeight: '800' },
	cardDesc: { color: '#64748b', marginTop: 4 },
	cardActions: { alignItems: 'flex-end' },
	planPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 8 },
	proPill: { backgroundColor: '#e0f2fe' },
	freePill: { backgroundColor: '#ecfdf5' },
	planText: { fontWeight: '800', color: '#0f172a' },
	upgradeButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 6 },
	sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
	quickActionsRow: { flexDirection: 'row', gap: 12 },
	quickActionCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, marginRight: 8 },
	quickActionTitle: { fontWeight: '700', marginBottom: 4 },
	quickActionDesc: { color: '#64748b' },
	featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
	subheading: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
	stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
	stepNumber: { backgroundColor: '#e0f2fe', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
	stepNumberText: { fontWeight: '800' },
	stepTitle: { fontWeight: '700' },
	stepDesc: { color: '#64748b' },
});


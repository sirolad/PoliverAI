import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@poliverai/shared-ui';
import { FeatureCard } from '@poliverai/shared-ui';
import { useAuth } from '@poliverai/intl';

export const DashboardFullScreen: React.FC = () => {
	const { user, isAuthenticated, isLoading } = useAuth();

	// AuthContext does not include an `isPro` flag on the User type by default.
	// Safely derive a boolean from the user object if present (keeps TypeScript happy
	// and avoids changing the shared AuthContext shape here).
	// Local type guard for user objects that might include an isPro flag
	const isUserWithPro = (u: unknown): u is { isPro?: boolean } => !!u && typeof u === 'object' && 'isPro' in (u as Record<string, unknown>);
	const isPro: boolean = isUserWithPro(user) ? Boolean(user.isPro) : false;

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.center}><Text>Loading...</Text></View>
			</SafeAreaView>
		);
	}

	if (!isAuthenticated) {
		// If not authenticated, render a placeholder — navigation should protect this route.
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.center}><Text>Please sign in to view your dashboard.</Text></View>
			</SafeAreaView>
		);
	}

	const freeFeatures = [
		{ emoji: '✅', title: 'Policy Verification', description: 'Upload and analyze privacy policies with basic GDPR compliance checks', isPro: false },
		{ emoji: '⏱️', title: 'Fast Analysis', description: 'Quick rule-based compliance screening', isPro: false },
		{ emoji: '🛡️', title: 'Basic Recommendations', description: 'Get essential compliance improvement suggestions', isPro: false },
	];

	const proFeatures = [
		{ emoji: '⚡', title: 'AI-Powered Analysis', description: 'Advanced AI analysis with nuanced violation detection', isPro: !isPro ? false : true },
		{ emoji: '📊', title: 'Comprehensive Reports', description: 'Detailed PDF reports with confidence scores and evidence', isPro: !!isPro },
		{ emoji: '📝', title: 'Policy Generation', description: 'Automatically generate revised compliant policies', isPro: !!isPro },
	];

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>Welcome back, {user?.name}!</Text>
					<Text style={styles.subtitle}>Manage your GDPR compliance analysis and reports from your dashboard.</Text>
				</View>

				<Card style={{ marginBottom: 16 }}>
					<View style={styles.cardRow}>
						<View style={{ flex: 1 }}>
							<Text style={styles.cardTitle}>Account Status</Text>
							<Text style={styles.cardDesc}>You are currently on the {isPro ? 'Pro' : 'Free'} plan</Text>
						</View>
						<View style={styles.cardActions}>
							<View style={[styles.planPill, isPro ? styles.proPill : styles.freePill]}>
								<Text style={styles.planText}>{isPro ? 'PRO PLAN' : 'FREE PLAN'}</Text>
							</View>
							{!isPro && (
								<TouchableOpacity style={[styles.upgradeButton]}>
									<Text style={{ color: '#fff', fontWeight: '700' }}>Upgrade to Pro</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</Card>

				<View style={{ marginBottom: 16 }}>
					<Text style={styles.sectionTitle}>Quick Actions</Text>
					<View style={styles.quickActionsRow}>
									<TouchableOpacity style={[styles.quickActionCard]}>
										<View style={{ flexDirection: 'row', alignItems: 'center' }}>
															<View style={[{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginRight: 8 }]} accessibilityRole="image" accessibilityLabel="Analyze New Policy">
																<Text style={{ fontSize: 14 }}>A</Text>
															</View>
															<Text style={styles.quickActionTitle}>Analyze New Policy</Text>
										</View>
										<Text style={styles.quickActionDesc}>Upload a privacy policy for GDPR compliance analysis</Text>
									</TouchableOpacity>

						{isPro && (
											<TouchableOpacity style={[styles.quickActionCard]}>
												<View style={{ flexDirection: 'row', alignItems: 'center' }}>
																		<View style={[{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 8 }]} accessibilityRole="image" accessibilityLabel="View Reports">
																			<Text style={{ fontSize: 14 }}>R</Text>
																		</View>
																		<Text style={styles.quickActionTitle}>View Reports</Text>
												</View>
												<Text style={styles.quickActionDesc}>Access your detailed compliance reports and history</Text>
											</TouchableOpacity>
						)}
					</View>
				</View>

				<View style={{ marginBottom: 16 }}>
					<Text style={styles.sectionTitle}>Your Features</Text>

					<Text style={styles.subheading}>Free Plan Features</Text>
					<View style={styles.featuresGrid}>
						{freeFeatures.map((f, i) => (
							<FeatureCard key={i} {...f} />
						))}
					</View>

					<Text style={[styles.subheading, { marginTop: 12 }]}>Pro Plan Features</Text>
					<View style={styles.featuresGrid}>
						{proFeatures.map((f, i) => (
							<FeatureCard key={i} {...f} />
						))}
					</View>
				</View>

				<Card>
					<View style={{ padding: 12 }}>
						<Text style={styles.cardTitle}>Getting Started</Text>
						<Text style={styles.cardDesc}>New to PoliverAI? Here's how to get the most out of your account</Text>

						<View style={{ marginTop: 12 }}>
							<View style={styles.stepRow}>
								<View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
								<View style={{ flex: 1 }}>
									<Text style={styles.stepTitle}>Upload Your First Policy</Text>
									<Text style={styles.stepDesc}>Start by uploading a privacy policy document to analyze for GDPR compliance</Text>
								</View>
							</View>

							<View style={styles.stepRow}>
								<View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
								<View style={{ flex: 1 }}>
									<Text style={styles.stepTitle}>Review Analysis Results</Text>
									<Text style={styles.stepDesc}>Examine compliance scores, violations, and recommendations for improvement</Text>
								</View>
							</View>

							<View style={styles.stepRow}>
								<View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
								<View style={{ flex: 1 }}>
									<Text style={styles.stepTitle}>{isPro ? 'Generate Reports' : 'Consider Upgrading'}</Text>
									<Text style={styles.stepDesc}>{isPro ? 'Create detailed compliance reports and generate revised policies' : 'Upgrade to Pro for advanced AI analysis and comprehensive reporting'}</Text>
								</View>
							</View>
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


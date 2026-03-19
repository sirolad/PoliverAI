import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { appColors, Splash } from '@poliverai/shared-ui';
import AppTopNav from '../../components/AppTopNav';
import LandingScreenContent from './LandingScreenContent';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'linear-gradient(180deg, #eff6ff 0%, #f8fbff 16%, #ffffff 34%, #f8fafc 100%)',
  color: appColors.ink900,
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export default function LandingScreen() {
  const [showWebSplash, setShowWebSplash] = useState(true);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.page}>
        <AppTopNav currentRoute="landing" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <LandingScreenContent wrapSection={(id, children) => <View key={id}>{children}</View>} />
          </View>
        </ScrollView>
      </View>
    );
  }

	return (
		<div style={pageStyle}>
      <AppTopNav currentRoute="landing" />
      {showWebSplash ? (
        <Splash
          onFinish={() => setShowWebSplash(false)}
          delayMs={200}
          durationMs={5000}
        />
      ) : null}
      <LandingScreenContent
        wrapSection={(id, children) => <div id={id}>{children}</div>}
      />
		</div>
	);
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: appColors.skyAlt50,
  },
  scrollView: {
    flex: 1,
    backgroundColor: appColors.skyAlt50,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
  },
});

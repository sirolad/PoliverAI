import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { apiService, getApiBaseOrigin, t } from '@poliverai/intl';
import { Apple, ArrowDownToLine, Monitor, MonitorCog, Smartphone, TerminalSquare } from 'lucide-react-native';
import { appAlphaColors, appColors } from './colorTokens';

type PlatformKey = 'android' | 'ios' | 'windows' | 'macos' | 'linux';

const platformOrder: PlatformKey[] = ['android', 'ios', 'windows', 'macos', 'linux'];

function platformIcon(platform: PlatformKey, active: boolean) {
  const color = active ? appColors.white : appColors.slate700;
  switch (platform) {
    case 'android':
      return <Smartphone size={16} color={color} />;
    case 'ios':
      return <Apple size={16} color={color} />;
    case 'windows':
      return <Monitor size={16} color={color} />;
    case 'macos':
      return <MonitorCog size={16} color={color} />;
    case 'linux':
      return <TerminalSquare size={16} color={color} />;
  }
}

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function AppPlatforms() {
  const [activePlatforms, setActivePlatforms] = React.useState<Record<PlatformKey, boolean>>({
    android: false,
    ios: false,
    windows: false,
    macos: false,
    linux: false,
  });
  const [stats, setStats] = React.useState({
    free_reports: 0,
    full_reports: 0,
    ai_policy_reports: 0,
    total_downloads: 0,
    total_users: 0,
    total_subscriptions: 0,
  });

  React.useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseOrigin() || 'https://poliverai.com';
    if (Platform.OS === 'macos') {
      console.log('[startup] AppPlatforms loading stats', { apiBase });
    }
    apiService
      .get<Record<string, unknown> | { data?: Record<string, unknown> }>('/api/v1/stats/summary')
      .then((res) => {
        if (cancelled || !res) return;
        const payload = typeof res === 'object' && res && 'data' in res ? (res as any).data : res;
        const nextStats = {
          free_reports: Number(payload?.free_reports ?? payload?.freeReports ?? 0),
          full_reports: Number(payload?.full_reports ?? payload?.fullReports ?? 0),
          ai_policy_reports: Number(payload?.ai_policy_reports ?? payload?.aiPolicyReports ?? 0),
          total_downloads: Number(payload?.total_downloads ?? payload?.totalDownloads ?? 0),
          total_users: Number(payload?.total_users ?? payload?.user_count ?? payload?.totalUsers ?? 0),
          total_subscriptions: Number(
            payload?.total_subscriptions ?? payload?.subscription_count ?? payload?.totalSubscriptions ?? 0
          ),
        };
        if (Platform.OS === 'macos') {
          console.log('[startup] AppPlatforms stats loaded', {
            apiBase,
            nextStats,
          });
        }
        setStats(nextStats);
      })
      .catch((error: unknown) => {
        if (Platform.OS === 'macos') {
          console.warn('[startup] AppPlatforms stats load failed', {
            apiBase,
            error,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (platform: PlatformKey) => {
    setActivePlatforms((current) => {
      if (platform === 'ios') {
        const next = !current.ios;
        return { android: false, ios: next, windows: false, macos: false, linux: false };
      }
      return { ...current, ios: false, [platform]: !current[platform] };
    });
  };

  const handleDownload = async () => {
    const apiBase = getApiBaseOrigin() || 'https://poliverai.com';
    try {
      await apiService.post('/api/v1/stats/downloads');
    } catch (error) {
      if (Platform.OS === 'macos') {
        console.warn('[startup] AppPlatforms download stat update failed', {
          apiBase,
          error,
        });
      }
    }
    setStats((current) => ({ ...current, total_downloads: current.total_downloads + 1 }));
  };

  const statItem = (label: string, value: number, unit: string) => (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value.toLocaleString()} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
      <Text style={styles.statFooter}>{copy('app_platforms.and_counting', 'and counting')}</Text>
    </View>
  );

  return (
    <View style={styles.shell}>
      <View style={styles.card}>
        <Text style={styles.heading}>{copy('app_platforms.heading', 'Built for every device')}</Text>
        <Text style={styles.subheading}>
          {copy('app_platforms.subheading', "We've got you covered no matter your device type or operating system.")}
        </Text>

        <View style={styles.platformRow}>
          {platformOrder.map((platform) => {
            const active = activePlatforms[platform];
            return (
              <Pressable
                key={platform}
                onPress={() => toggle(platform)}
                style={[styles.platformPill, active ? styles.platformPillActive : null]}
              >
                <View style={styles.platformPillInner}>
                  {platformIcon(platform, active)}
                  <Text style={[styles.platformPillText, active ? styles.platformPillTextActive : null]}>
                    {copy(`app_platforms.platforms.${platform}`, platform.charAt(0).toUpperCase() + platform.slice(1))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.downloadRow}>
          <Pressable onPress={handleDownload} style={styles.downloadButton}>
            <View style={styles.downloadButtonInner}>
              <ArrowDownToLine size={18} color={appColors.white} />
              <Text style={styles.downloadButtonText}>{copy('app_platforms.download_app', 'Download App')}</Text>
            </View>
          </Pressable>

          <View style={styles.downloadsWrap}>
            <Text style={styles.downloadsValue}>{stats.total_downloads.toLocaleString()}</Text>
            <View>
              <Text style={styles.downloadsLabel}>{copy('app_platforms.downloads_label', 'Downloads')}</Text>
              <Text style={styles.downloadsMeta}>{copy('app_platforms.downloads_so_far', 'so far')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.description}>
          {copy(
            'app_platforms.description',
            "PoliverAI delivers fast, practical reports for quick checks and deep, AI-powered policy reviews for thorough compliance. Whether you're running a quick scan or generating a full policy report, we've made it simple and reliable — built to support teams across devices and platforms."
          )}
        </Text>

        <View style={styles.topStats}>
          {statItem(copy('app_platforms.free_reports', 'Free Reports'), stats.free_reports, copy('app_platforms.reports_label', 'Reports'))}
          {statItem(copy('app_platforms.full_reports', 'Full Reports'), stats.full_reports, copy('app_platforms.reports_label', 'Reports'))}
          {statItem(copy('app_platforms.ai_revised_policies', 'AI Revised Policies'), stats.ai_policy_reports, copy('app_platforms.policies_label', 'Policies'))}
        </View>

        <View style={styles.bottomStats}>
          {statItem(copy('app_platforms.sign_ups', 'Sign Ups'), stats.total_users, copy('app_platforms.users_label', 'Users'))}
          {statItem(copy('app_platforms.subs_label', 'Subs'), stats.total_subscriptions, copy('app_platforms.subs_label', 'Subs'))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 28,
    backgroundColor: appAlphaColors.white92,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSlateFaint,
    padding: 36,
    alignItems: 'center',
  },
  heading: {
    color: appColors.ink900,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    textAlign: 'center',
  },
  subheading: {
    marginTop: 12,
    maxWidth: 720,
    color: appColors.slate600,
    fontSize: 18,
    lineHeight: 29,
    textAlign: 'center',
  },
  platformRow: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  platformPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSlateSoft,
  },
  platformPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformPillActive: {
    backgroundColor: appColors.blue600,
    borderColor: appColors.blue600,
  },
  platformPillText: {
    color: appColors.slate700,
    fontSize: 15,
    fontWeight: '600',
  },
  platformPillTextActive: {
    color: appColors.white,
  },
  downloadRow: {
    marginTop: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  downloadButton: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: appColors.green600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadButtonText: {
    color: appColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  downloadsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  downloadsValue: {
    color: appColors.ink900,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800',
  },
  downloadsLabel: {
    color: appColors.slate500,
    fontSize: 18,
    fontWeight: '600',
  },
  downloadsMeta: {
    color: appColors.slate500,
    fontSize: 13,
  },
  description: {
    maxWidth: 860,
    marginTop: 26,
    color: appColors.slate600,
    fontSize: 17,
    lineHeight: 30,
    textAlign: 'center',
  },
  topStats: {
    width: '100%',
    marginTop: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  bottomStats: {
    width: '100%',
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
  },
  statBlock: {
    minWidth: 220,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: appColors.ink900,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  statValue: {
    marginTop: 10,
    color: appColors.ink900,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
  },
  statUnit: {
    color: appColors.slate400,
    fontSize: 14,
    fontWeight: '500',
  },
  statFooter: {
    marginTop: 6,
    color: appColors.slate400,
    fontSize: 14,
  },
});

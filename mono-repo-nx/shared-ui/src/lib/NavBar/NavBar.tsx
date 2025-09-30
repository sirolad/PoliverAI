import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../Button/Button';
import { useAuth } from '@poliverai/intl';

export const NavBar: React.FC = () => {
  const navigation = (() => {
    try {
      return useNavigation();
    } catch {
      return undefined as any;
    }
  })();

  const { user, logout, isAuthenticated, isPro } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Prefer navigating via react-navigation when available; otherwise fall back to web path
    safeNavigate('WebLanding', '/');
  };

  const safeNavigate = (routeName: string, webPath?: string) => {
    try {
      if (navigation && typeof navigation.navigate === 'function') {
        // navigation.navigate typing can be broad across RN/WEB implementations
        (navigation.navigate as any)(routeName);
        return;
      }
    } catch (e) {
      // swallow and fallback to web
    }

    const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    if (g) {
      const path = webPath ?? (() => {
        switch (routeName) {
          case 'Login':
            return '/login';
          case 'Register':
          case 'Signup':
            return '/register';
          case 'Dashboard':
            return '/dashboard';
          case 'WebLanding':
          case 'Landing':
            return '/';
          case 'Pricing':
            return '/pricing';
          case 'Analyze':
            return '/analyze';
          case 'Reports':
            return '/reports';
          default:
            return '/';
        }
      })();
      // Use replace to avoid piling up history for programmatic nav from header clicks
      try {
        // Use pushState if available to create a navigation entry; fallback to replaceState
        if (typeof g.history?.pushState === 'function') {
          g.history.pushState(null, '', path);
        } else if (typeof g.history?.replaceState === 'function') {
          g.history.replaceState(null, '', path);
        } else {
          g.location.href = path;
        }

        // Dispatch popstate so listeners (including react-navigation linking) respond
        try {
          const GlobalPopState = (g as any).PopStateEvent;
          const GlobalEvent = (g as any).Event;
          const ev = typeof GlobalPopState === 'function' ? new GlobalPopState('popstate', { state: null }) : new GlobalEvent('popstate');
          g.dispatchEvent?.(ev);
        } catch (e) {
          // last resort: reload the page
          if (g.location?.href !== path) g.location.href = path;
        }
      } catch (err) {
        // last resort
        g.location.href = path;
      }
    }
  };

  return (
    <View style={styles.nav}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => safeNavigate('WebLanding', '/')} style={styles.logoRow} accessibilityRole="link" accessible accessibilityLabel="PoliverAI logo">
          <Text style={styles.logoEmoji}>🔰</Text>
          <Text style={styles.logoText}>PoliverAI</Text>
        </TouchableOpacity>

        <View style={styles.linksRow}>
          {isAuthenticated && (
            <>
              <TouchableOpacity onPress={() => safeNavigate('Dashboard', '/dashboard')}>
                <Text style={styles.link}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => safeNavigate('Analyze', '/analyze')}>
                <Text style={styles.link}>Analyze Policy</Text>
              </TouchableOpacity>
              {isPro && (
                <TouchableOpacity onPress={() => safeNavigate('Reports', '/reports')}>
                  <Text style={styles.link}>Reports</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.userRow}>
          {isAuthenticated ? (
            <View style={styles.userGroup}>
              <View style={styles.userInfo}>
                <Text style={styles.userIcon}>👤</Text>
                <Text style={styles.userName}>{user?.name}</Text>
                <View style={[styles.tierPill, isPro ? styles.proPill : styles.freePill]}>
                  <Text style={styles.tierText}>{isPro ? 'PRO' : 'FREE'}</Text>
                </View>
              </View>

              {!isPro && <Button title="Upgrade to Pro" size="sm" style={styles.upgradeBtn} onPress={() => safeNavigate('Pricing', '/pricing')} />}

              <Button title="Logout" size="sm" variant="outline" onPress={handleLogout} style={styles.logoutBtn} />
            </View>
          ) : (
            <View style={styles.authLinks}>
              <Button title="Login" size="sm" variant="outline" onPress={() => safeNavigate('Login', '/login')} />
              <Button title="Sign Up" size="sm" onPress={() => safeNavigate('Register', '/register')} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb', 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    width: '75%', 
    justifyContent: 'center',
    alignSelf: 'center',
  },
  container: { height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontWeight: '800', fontSize: 18, marginLeft: 8 },
  logoEmoji: { fontSize: 18 },
  linksRow: { flexDirection: 'row', alignItems: 'center' },
  link: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginHorizontal: 6 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userGroup: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userIcon: { fontSize: 14, marginRight: 4 },
  userName: { fontSize: 14, marginLeft: 4 },
  tierPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  proPill: { backgroundColor: '#e0f2fe' },
  freePill: { backgroundColor: '#ecfdf5' },
  tierText: { fontWeight: '700', color: '#0f172a' },
  upgradeBtn: { backgroundColor: '#2563eb' },
  logoutBtn: { paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  logoutText: { marginLeft: 6 },
  authLinks: { flexDirection: 'row' },
});

export default NavBar;

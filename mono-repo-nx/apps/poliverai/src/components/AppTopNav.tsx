import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentsService, useAuth } from '@poliverai/intl';
import { appAlphaColors, appColors, CrossPlatformModal, EnterCreditsModal } from '@poliverai/shared-ui';
import { CreditCard, LayoutDashboard, LogIn, LogOut, Menu, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react-native';
import { BrandLogo } from './BrandLogo';

type AppTopNavProps = {
  currentRoute?: 'landing' | 'login' | 'register' | 'dashboard' | 'analyze' | 'credits' | 'reports';
};

type WebLocationLike = {
  href?: string;
  pathname?: string;
};

const webStickyStyle = {
  position: 'sticky',
  top: 0,
  backdropFilter: 'blur(18px)',
} as any;

function NavActionButton({
  label,
  onPress,
  icon,
  variant = 'ghost',
  fullWidth = false,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        variant === 'primary' ? styles.primaryButton : null,
        variant === 'secondary' ? styles.secondaryButton : null,
        variant === 'ghost' ? styles.ghostButton : null,
        fullWidth ? styles.mobileActionButton : null,
      ]}
    >
      <View style={styles.actionButtonInner}>
        {icon ? <View style={styles.actionButtonIcon}>{icon}</View> : null}
        <Text
          style={[
            styles.actionButtonText,
            variant === 'primary' ? styles.primaryButtonText : null,
            variant === 'secondary' ? styles.secondaryButtonText : null,
            variant === 'ghost' ? styles.ghostButtonText : null,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AppTopNav({ currentRoute = 'landing' }: AppTopNavProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isPro, user, logout } = useAuth() as unknown as {
    isAuthenticated?: boolean;
    isPro?: boolean;
    user?: { name?: string | null; credits?: number | null };
    logout?: () => void | Promise<void>;
  };
  const { width } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = React.useState(false);

  const isDashboard =
    currentRoute === 'dashboard' ||
    currentRoute === 'analyze' ||
    currentRoute === 'credits' ||
    currentRoute === 'reports';
  const desktopBreakpoint =
    Platform.OS === 'macos'
      ? isAuthenticated && isDashboard
        ? 1560
        : 1240
      : 980;
  const effectiveWidth = containerWidth > 0 ? containerWidth : width;
  const isDesktop = effectiveWidth > desktopBreakpoint;
  const creditCount = Number(user?.credits ?? 0);
  const displayName = user?.name?.trim() || 'Account';
  const handleContainerLayout = React.useCallback((nextWidth: number) => {
    setContainerWidth((current) => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }, []);

  React.useEffect(() => {
    if (isDesktop && menuOpen) {
      setMenuOpen(false);
    }
  }, [isDesktop, menuOpen]);

  const safeNavigate = React.useCallback((routeName: string, webPath: string) => {
    try {
      navigation.navigate(routeName);
      setMenuOpen(false);
      return;
    } catch {
      const g = typeof globalThis !== 'undefined' ? (globalThis as { location?: WebLocationLike }) : undefined;
      if (g?.location) {
        if (webPath.startsWith('/#')) g.location.href = webPath;
        else g.location.pathname = webPath;
      }
    }
    setMenuOpen(false);
  }, [navigation]);

  const handleLogout = React.useCallback(async () => {
    try {
      await logout?.();
    } finally {
      safeNavigate('WebLanding', '/');
    }
  }, [logout, safeNavigate]);

  const openCreditsModal = React.useCallback(() => {
    if (Platform.OS !== 'web' && menuOpen) {
      setMenuOpen(false);
      setTimeout(() => setCreditsModalOpen(true), 150);
      return;
    }
    setCreditsModalOpen(true);
  }, [menuOpen]);

  const showLoginAction = !isAuthenticated && currentRoute !== 'login';
  const showSignupAction = !isAuthenticated && currentRoute !== 'register';

  if (Platform.OS !== 'web') {
    const nativeDesktopActions = isAuthenticated ? (
      <>
        <Pressable onPress={() => safeNavigate('Dashboard', '/dashboard')} style={[styles.nativeActionButton, styles.nativePrimaryButton]}>
          <View style={styles.nativeActionButtonInner}>
            <LayoutDashboard size={16} color={appColors.white} />
            <Text style={styles.primaryButtonText}>Dashboard</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => safeNavigate('Analyze', '/analyze')} style={styles.nativeActionButton}>
          <View style={styles.nativeActionButtonInner}>
            <ShieldCheck size={16} color={appColors.ink900} />
            <Text style={styles.nativeSecondaryButtonText}>Analyze Policy</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => safeNavigate('Reports', '/reports')} style={styles.nativeActionButton}>
          <View style={styles.nativeActionButtonInner}>
            <ShieldCheck size={16} color={appColors.ink900} />
            <Text style={styles.nativeSecondaryButtonText}>Reports</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => safeNavigate('Credits', '/credits')} style={styles.nativeActionButton}>
          <View style={styles.nativeActionButtonInner}>
            <CreditCard size={16} color={appColors.ink900} />
            <Text style={styles.nativeSecondaryButtonText}>Transaction History</Text>
          </View>
        </Pressable>
        {!isPro ? (
          <Pressable onPress={() => PaymentsService.purchaseUpgrade(29).catch(() => undefined)} style={[styles.nativeActionButton, styles.nativePrimaryButton]}>
            <View style={styles.nativeActionButtonInner}>
              <Sparkles size={16} color={appColors.white} />
              <Text style={styles.primaryButtonText}>Upgrade to Pro</Text>
            </View>
          </Pressable>
        ) : null}
        <Pressable onPress={openCreditsModal} style={[styles.nativeActionButton, styles.nativeDarkButton]}>
          <View style={styles.nativeActionButtonInner}>
            <CreditCard size={16} color={appColors.white} />
            <Text style={styles.nativeDarkButtonText}>Buy Credits</Text>
          </View>
        </Pressable>
        <View style={styles.nativeDesktopMeta}>
          <Text style={styles.nativeMetaPill}>{isPro ? 'PRO' : 'FREE'}</Text>
          <Text style={styles.nativeDesktopMetaText}>Credits: {creditCount}</Text>
          <Text style={styles.nativeDesktopMetaText}>{displayName}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.nativeActionButton}>
          <View style={styles.nativeActionButtonInner}>
            <LogOut size={16} color={appColors.ink900} />
            <Text style={styles.nativeSecondaryButtonText}>Logout</Text>
          </View>
        </Pressable>
      </>
    ) : (
      <>
        {showLoginAction ? (
          <Pressable onPress={() => safeNavigate('Login', '/login')} style={styles.nativeActionButton}>
            <View style={styles.nativeActionButtonInner}>
              <LogIn size={16} color={appColors.ink900} />
              <Text style={styles.nativeSecondaryButtonText}>Login</Text>
            </View>
          </Pressable>
        ) : null}
        {showSignupAction ? (
          <Pressable onPress={() => safeNavigate('Register', '/register')} style={[styles.nativeActionButton, styles.nativePrimaryButton]}>
            <View style={styles.nativeActionButtonInner}>
              <UserPlus size={16} color={appColors.white} />
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            </View>
          </Pressable>
        ) : null}
      </>
    );

    const nativeMobileActions = isAuthenticated ? (
      <>
        <NavActionButton
          label="Dashboard"
          onPress={() => safeNavigate('Dashboard', '/dashboard')}
          icon={<LayoutDashboard size={16} color={appColors.ink900} />}
          variant="ghost"
          fullWidth
        />
        <NavActionButton
          label="Analyze Policy"
          onPress={() => safeNavigate('Analyze', '/analyze')}
          icon={<ShieldCheck size={16} color={appColors.ink900} />}
          variant="ghost"
          fullWidth
        />
        <NavActionButton
          label="Reports"
          onPress={() => safeNavigate('Reports', '/reports')}
          icon={<ShieldCheck size={16} color={appColors.ink900} />}
          variant="ghost"
          fullWidth
        />
        <NavActionButton
          label="Transaction History"
          onPress={() => safeNavigate('Credits', '/credits')}
          icon={<CreditCard size={16} color={appColors.ink900} />}
          variant="ghost"
          fullWidth
        />
        {!isPro ? (
          <NavActionButton
            label="Upgrade to Pro"
            onPress={() => PaymentsService.purchaseUpgrade(29).catch(() => undefined)}
            icon={<Sparkles size={16} color={appColors.white} />}
            variant="primary"
            fullWidth
          />
        ) : null}
        <NavActionButton
          label="Buy Credits"
          onPress={openCreditsModal}
          icon={<CreditCard size={16} color={appColors.white} />}
          variant="secondary"
          fullWidth
        />
        <NavActionButton
          label="Logout"
          onPress={handleLogout}
          icon={<LogOut size={16} color={appColors.ink900} />}
          variant="ghost"
          fullWidth
        />
        <View style={styles.mobileMeta}>
          <Text style={styles.mobileMetaText}>{isPro ? 'PRO' : 'FREE'}</Text>
          <Text style={styles.mobileMetaText}>Credits: {creditCount}</Text>
          <Text style={styles.mobileMetaText}>{displayName}</Text>
        </View>
      </>
    ) : (
      <>
        {showLoginAction ? (
          <NavActionButton
            label="Login"
            onPress={() => safeNavigate('Login', '/login')}
            icon={<LogIn size={16} color={appColors.ink900} />}
            variant="ghost"
            fullWidth
          />
        ) : null}
        {showSignupAction ? (
          <NavActionButton
            label="Sign Up"
            onPress={() => safeNavigate('Register', '/register')}
            icon={<UserPlus size={16} color={appColors.white} />}
            variant="primary"
            fullWidth
          />
        ) : null}
      </>
    );

    return (
      <>
        <View
          onLayout={(event) => handleContainerLayout(event.nativeEvent.layout.width)}
          style={[styles.nativeOuter, { paddingTop: Math.max(insets.top, 8), minHeight: 56 + insets.top }]}
        >
          <Pressable onPress={() => safeNavigate('WebLanding', '/')} style={styles.nativeBrandButton}>
            <BrandLogo width={40} height={40} />
            <Text style={styles.brandText}>
              Poliver <Text style={styles.brandAccent}>AI</Text>
            </Text>
          </Pressable>

          {isDesktop ? (
            <View style={styles.nativeActionsRow}>
              {nativeDesktopActions}
            </View>
          ) : (
            <Pressable onPress={() => setMenuOpen(true)} style={styles.menuButton}>
              <View style={styles.actionButtonInner}>
                <Menu size={16} color={appColors.ink900} />
                <Text style={styles.menuButtonText}>Menu</Text>
              </View>
            </Pressable>
          )}
        </View>

        {!isDesktop ? (
          <CrossPlatformModal open={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
            <Pressable style={styles.mobileMenuBackdrop} onPress={() => setMenuOpen(false)}>
              <Pressable style={styles.mobileMenuSheet} onPress={() => undefined}>
                <View style={styles.mobileMenuHeader}>
                  <Text style={styles.mobileMenuTitle}>Menu</Text>
                  <Pressable onPress={() => setMenuOpen(false)} style={styles.mobileMenuCloseButton}>
                    <X size={18} color={appColors.ink900} />
                  </Pressable>
                </View>
                <View style={styles.mobileActionsRow}>{nativeMobileActions}</View>
              </Pressable>
            </Pressable>
          </CrossPlatformModal>
        ) : null}
        <EnterCreditsModal
          open={creditsModalOpen}
          onClose={() => setCreditsModalOpen(false)}
          onConfirm={async (amountUsd) => {
            await PaymentsService.purchaseCredits(amountUsd);
          }}
        />
      </>
    );
  }

  const dashboardDesktopActions = (
    <>
      <View style={styles.dashboardLinksRow}>
        <Pressable onPress={() => safeNavigate('Dashboard', '/dashboard')}>
          <Text style={styles.dashboardLink}>Dashboard</Text>
        </Pressable>
        <Pressable onPress={() => safeNavigate('Analyze', '/analyze')}>
          <Text style={styles.dashboardLink}>Analyze Policy</Text>
        </Pressable>
        <Pressable onPress={() => safeNavigate('Reports', '/reports')}>
          <Text style={styles.dashboardLink}>Reports</Text>
        </Pressable>
        <Pressable onPress={() => safeNavigate('Credits', '/credits')}>
          <Text style={styles.dashboardLink}>Transaction History</Text>
        </Pressable>
      </View>
      <View style={styles.userMeta}>
        <View style={[styles.planBadge, isPro ? styles.proBadge : styles.freeBadge]}>
          <Text style={styles.planBadgeText}>{isPro ? 'PRO' : 'FREE'}</Text>
        </View>
        <Text style={styles.creditsText}>Credits: {creditCount}</Text>
        <Text style={styles.userNameText}>{displayName}</Text>
      </View>
      {!isPro ? (
        <NavActionButton
          label="Upgrade to Pro"
          onPress={() => PaymentsService.purchaseUpgrade(29).catch(() => undefined)}
          icon={<Sparkles size={16} color={appColors.white} />}
          variant="primary"
        />
      ) : null}
      <NavActionButton label="Buy Credits" onPress={openCreditsModal} icon={<CreditCard size={16} color={appColors.white} />} variant="secondary" />
      <NavActionButton label="Logout" onPress={handleLogout} icon={<LogOut size={16} color={appColors.ink900} />} variant="ghost" />
    </>
  );

  const authDesktopActions = isAuthenticated ? (
    <NavActionButton
      label="Go to Dashboard"
      onPress={() => safeNavigate('Dashboard', '/dashboard')}
      icon={<LayoutDashboard size={16} color={appColors.white} />}
      variant="primary"
    />
  ) : (
    <>
      {showLoginAction ? (
        <NavActionButton label="Login" onPress={() => safeNavigate('Login', '/login')} icon={<LogIn size={16} color={appColors.ink900} />} variant="ghost" />
      ) : null}
      {showSignupAction ? (
        <NavActionButton label="Sign Up" onPress={() => safeNavigate('Register', '/register')} icon={<UserPlus size={16} color={appColors.white} />} variant="primary" />
      ) : null}
    </>
  );

  const dashboardMobileActions = (
    <>
      <NavActionButton label="Dashboard" onPress={() => safeNavigate('Dashboard', '/dashboard')} icon={<LayoutDashboard size={16} color={appColors.ink900} />} variant="ghost" fullWidth />
      <NavActionButton label="Analyze Policy" onPress={() => safeNavigate('Analyze', '/analyze')} icon={<ShieldCheck size={16} color={appColors.ink900} />} variant="ghost" fullWidth />
      <NavActionButton label="Reports" onPress={() => safeNavigate('Reports', '/reports')} icon={<ShieldCheck size={16} color={appColors.ink900} />} variant="ghost" fullWidth />
      <NavActionButton label="Transaction History" onPress={() => safeNavigate('Credits', '/credits')} icon={<CreditCard size={16} color={appColors.ink900} />} variant="ghost" fullWidth />
      {!isPro ? (
        <NavActionButton
          label="Upgrade to Pro"
          onPress={() => PaymentsService.purchaseUpgrade(29).catch(() => undefined)}
          icon={<Sparkles size={16} color={appColors.white} />}
          variant="primary"
          fullWidth
        />
      ) : null}
      <NavActionButton label="Buy Credits" onPress={openCreditsModal} icon={<CreditCard size={16} color={appColors.white} />} variant="secondary" fullWidth />
      <NavActionButton label="Logout" onPress={handleLogout} icon={<LogOut size={16} color={appColors.ink900} />} variant="ghost" fullWidth />
      <View style={styles.mobileMeta}>
        <Text style={styles.mobileMetaText}>{isPro ? 'PRO' : 'FREE'}</Text>
        <Text style={styles.mobileMetaText}>Credits: {creditCount}</Text>
        <Text style={styles.mobileMetaText}>{displayName}</Text>
      </View>
    </>
  );

  const authMobileActions = isAuthenticated ? (
    <NavActionButton
      label="Go to Dashboard"
      onPress={() => safeNavigate('Dashboard', '/dashboard')}
      icon={<LayoutDashboard size={16} color={appColors.white} />}
      variant="primary"
      fullWidth
    />
  ) : (
    <>
      {showLoginAction ? (
        <NavActionButton label="Login" onPress={() => safeNavigate('Login', '/login')} icon={<LogIn size={16} color={appColors.ink900} />} variant="ghost" fullWidth />
      ) : null}
      {showSignupAction ? (
        <NavActionButton label="Sign Up" onPress={() => safeNavigate('Register', '/register')} icon={<UserPlus size={16} color={appColors.white} />} variant="primary" fullWidth />
      ) : null}
    </>
  );

  return (
    <View
      onLayout={(event) => handleContainerLayout(event.nativeEvent.layout.width)}
      style={[styles.outer, Platform.OS === 'web' ? webStickyStyle : null]}
    >
      <View style={styles.inner}>
        <Pressable onPress={() => safeNavigate('WebLanding', '/')} style={styles.brandButton}>
          {Platform.OS === 'web' ? (
            <BrandLogo width={40} height={40} style={styles.brandIconImage} />
          ) : (
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>P</Text>
            </View>
          )}
          <Text style={styles.brandText}>
            Poliver <Text style={styles.brandAccent}>AI</Text>
          </Text>
        </Pressable>

        {isDesktop ? (
          <View style={styles.actionsRow}>
            {isAuthenticated && isDashboard ? dashboardDesktopActions : authDesktopActions}
          </View>
        ) : (
          <Pressable onPress={() => setMenuOpen((value) => !value)} style={styles.menuButton}>
            <View style={styles.actionButtonInner}>
              {menuOpen ? <X size={16} color={appColors.ink900} /> : <Menu size={16} color={appColors.ink900} />}
              <Text style={styles.menuButtonText}>{menuOpen ? 'Close' : 'Menu'}</Text>
            </View>
          </Pressable>
        )}
      </View>

      {!isDesktop ? (
        <CrossPlatformModal open={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={styles.mobileMenuBackdrop} onPress={() => setMenuOpen(false)}>
            <Pressable style={styles.mobileMenuSheet} onPress={() => undefined}>
              <View style={styles.mobileMenuHeader}>
                <Text style={styles.mobileMenuTitle}>Menu</Text>
                <Pressable onPress={() => setMenuOpen(false)} style={styles.mobileMenuCloseButton}>
                  <X size={18} color={appColors.ink900} />
                </Pressable>
              </View>
              <View style={styles.mobileActionsRow}>
                {isAuthenticated && isDashboard ? dashboardMobileActions : authMobileActions}
              </View>
            </Pressable>
          </Pressable>
        </CrossPlatformModal>
      ) : null}
      <EnterCreditsModal
        open={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        onConfirm={async (amountUsd) => {
          await PaymentsService.purchaseCredits(amountUsd);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nativeOuter: {
    backgroundColor: appColors.white,
    borderBottomWidth: 1,
    borderBottomColor: appColors.slate200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nativeBrandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  nativeBrandImage: {
    width: 112,
    height: 32,
  },
  nativeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  nativeActionButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.slate200,
  },
  nativePrimaryButton: {
    backgroundColor: appColors.blue600,
  },
  nativeDarkButton: {
    backgroundColor: appColors.ink900,
  },
  nativeActionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nativeSecondaryButtonText: {
    color: appColors.ink900,
    fontSize: 14,
    fontWeight: '700',
  },
  nativeDarkButtonText: {
    color: appColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  nativeDesktopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  nativeMetaPill: {
    color: appColors.ink900,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: appColors.blue100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  nativeDesktopMetaText: {
    color: appColors.ink900,
    fontSize: 14,
    fontWeight: '600',
  },
  outer: {
    backgroundColor: appAlphaColors.white94,
    borderBottomWidth: 1,
    borderBottomColor: appAlphaColors.borderSoft,
    zIndex: 40,
  },
  inner: {
    maxWidth: 1240,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: appColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 30px rgba(37, 99, 235, 0.22)',
  } as any,
  brandIconText: {
    color: appColors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  brandIconImage: {
    width: 40,
    height: 40,
  },
  brandText: {
    color: appColors.ink900,
    fontSize: 20,
    fontWeight: '700',
  },
  brandAccent: {
    color: appColors.blue600,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
    flex: 1,
  },
  dashboardLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dashboardLink: {
    color: appColors.ink900,
    fontSize: 15,
    fontWeight: '600',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  freeBadge: {
    backgroundColor: appColors.green100,
  },
  proBadge: {
    backgroundColor: appColors.blue100,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: appColors.ink900,
  },
  creditsText: {
    color: appColors.ink800,
    fontSize: 14,
    fontWeight: '700',
  },
  userNameText: {
    color: appColors.ink900,
    fontSize: 14,
    fontWeight: '600',
  },
  ghostButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSlateSoft,
    backgroundColor: appColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  ghostButtonText: {
    color: appColors.ink900,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: appColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 18px 40px rgba(37, 99, 235, 0.22)',
  } as any,
  primaryButtonText: {
    color: appColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: appColors.ink900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: appColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  menuButton: {
    minHeight: 42,
    minWidth: 72,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSlateSoft,
    backgroundColor: appColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    color: appColors.ink900,
    fontSize: 14,
    fontWeight: '700',
  },
  mobileMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.38)',
    justifyContent: 'flex-start',
    paddingTop: 82,
    paddingHorizontal: 16,
  },
  mobileMenuSheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: 16,
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSoftStrong,
    padding: 12,
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
  } as any,
  mobileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mobileMenuTitle: {
    color: appColors.ink900,
    fontSize: 18,
    fontWeight: '800',
  },
  mobileMenuCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.sky50,
  },
  mobileActionsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  mobileActionButton: {
    width: '100%',
  },
  mobileMeta: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: appAlphaColors.borderSoftStrong,
    gap: 4,
  },
  mobileMetaText: {
    color: appColors.slate700,
    fontSize: 14,
    fontWeight: '600',
  },
});

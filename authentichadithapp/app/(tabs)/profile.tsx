import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useRevenueCatSubscription } from '@/hooks/useRevenueCatSubscription';
import { PaywallScreen } from '@/components/premium/PaywallScreen';
import { CustomerCenterScreen } from '@/components/premium/CustomerCenterScreen';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS, LAYOUT } from '@/lib/styles/colors';
import { useDeviceLayout } from '@/lib/hooks/use-device-layout';

interface SettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
  tint?: string;
  showChevron?: boolean;
}

function SettingsRow({ icon, label, value, onPress, tint, showChevron = true }: SettingsRowProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        { borderBottomColor: colors.borderSubtle, opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.settingsIconWrap, { backgroundColor: (tint || colors.emeraldMid) + '18' }]}>
        <Ionicons name={icon} size={18} color={tint || colors.emeraldMid} />
      </View>
      <Text style={[styles.settingsLabel, { color: colors.bronzeText }]}>{label}</Text>
      <View style={styles.settingsRight}>
        {value ? (
          <Text style={[styles.settingsValue, { color: colors.mutedText }]}>{value}</Text>
        ) : null}
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
        )}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isGuest, signOut } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { contentTop, contentBottom, pagePadding, maxContentWidth } = useDeviceLayout();
  const { isPremium } = usePremiumStatus();
  const { restorePurchases, expirationDate, productIdentifier } = useRevenueCatSubscription();
  const [showPaywall, setShowPaywall] = React.useState(false);
  const [showCustomerCenter, setShowCustomerCenter] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('Restore Complete', 'Your purchases have been restored.');
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  // Derive initials for avatar
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AH';

  if (isGuest) {
    return (
      <View style={[styles.guestRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.guestInner, { paddingTop: contentTop, paddingHorizontal: pagePadding }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.emeraldMid + '22' }]}>
            <Ionicons name="person-outline" size={36} color={colors.emeraldMid} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.bronzeText }]}>Welcome</Text>
          <Text style={[styles.guestText, { color: colors.mutedText }]}>
            Sign in to save hadiths, track your progress, and unlock premium features.
          </Text>
          <Button title="Sign In" onPress={() => router.push('/auth/login')} variant="primary" />
          <Button title="Create Account" onPress={() => router.push('/auth/signup')} variant="outline" />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: contentTop,
        paddingBottom: contentBottom,
        paddingHorizontal: pagePadding,
        alignSelf: 'center',
        width: '100%',
        maxWidth: maxContentWidth,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen title */}
      <Text style={[styles.screenTitle, { color: colors.bronzeText }]}>Profile</Text>

      {/* Identity card */}
      <Card variant="elevated" style={styles.identityCard}>
        <View style={styles.identityRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.emeraldMid + '22' }]}>
            <Text style={[styles.avatarInitials, { color: colors.emeraldMid }]}>{initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.emailText, { color: colors.bronzeText }]} numberOfLines={1}>
              {user?.email}
            </Text>
            {isPremium ? (
              <View style={[styles.proBadge, { backgroundColor: colors.goldMid }]}>
                <Text style={styles.proBadgeText}>Pro Member</Text>
              </View>
            ) : (
              <Text style={[styles.freeLabel, { color: colors.mutedText }]}>Free Plan</Text>
            )}
          </View>
        </View>
        {!isPremium && (
          <Button
            title="Upgrade to Pro"
            variant="primary"
            size="medium"
            onPress={() => setShowPaywall(true)}
            style={{ marginTop: SPACING.md }}
          />
        )}
      </Card>

      {/* Subscription details (premium users) */}
      {isPremium && (
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>SUBSCRIPTION</Text>
          <SettingsRow
            icon="checkmark-circle"
            label={productIdentifier || 'Pro Plan'}
            tint={colors.emeraldMid}
            onPress={() => setShowCustomerCenter(true)}
          />
          {expirationDate && (
            <SettingsRow
              icon="calendar-outline"
              label="Renews"
              value={new Date(expirationDate).toLocaleDateString()}
              onPress={() => setShowCustomerCenter(true)}
            />
          )}
          <SettingsRow
            icon="settings-outline"
            label="Manage Subscription"
            onPress={() => setShowCustomerCenter(true)}
          />
        </Card>
      )}

      {/* Account actions */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>ACCOUNT</Text>
        <SettingsRow
          icon="bookmark-outline"
          label="Saved Hadiths"
          onPress={() => router.push('/bookmarks')}
        />
        <SettingsRow
          icon="card-outline"
          label="Subscription"
          onPress={() => router.push('/settings/subscription')}
        />
        {!isPremium && (
          <SettingsRow
            icon="refresh-outline"
            label="Restore Purchases"
            onPress={handleRestore}
          />
        )}
        <SettingsRow
          icon="gift-outline"
          label="Redeem Promo Code"
          onPress={() => router.push('/redeem')}
        />
        <SettingsRow
          icon="share-outline"
          label="My Referral Code"
          onPress={() => router.push('/redeem/my-code')}
        />
      </Card>

      {/* Settings */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>SETTINGS</Text>
        <SettingsRow
          icon="color-palette-outline"
          label="Appearance"
          onPress={() => router.push('/settings/appearance')}
        />
        <SettingsRow
          icon="language-outline"
          label="Language"
          onPress={() => router.push('/settings/language')}
        />
        <SettingsRow
          icon="shield-outline"
          label="Privacy"
          onPress={() => router.push('/settings/privacy')}
        />
        <SettingsRow
          icon="information-circle-outline"
          label="About"
          onPress={() => router.push('/settings/about')}
        />
        <SettingsRow
          icon="trash-outline"
          label="Delete Account"
          tint={colors.error}
          onPress={() => router.push('/settings/delete-account')}
        />
      </Card>

      {/* Sign out */}
      <Pressable
        style={({ pressed }) => [
          styles.signOutRow,
          { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
      </Pressable>

      {/* Modals */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen
          onDismiss={() => setShowPaywall(false)}
          onPurchaseCompleted={() => setShowPaywall(false)}
          onRestoreCompleted={() => setShowPaywall(false)}
        />
      </Modal>

      <Modal
        visible={showCustomerCenter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomerCenter(false)}
      >
        <CustomerCenterScreen onDismiss={() => setShowCustomerCenter(false)} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  guestRoot: {
    flex: 1,
  },
  guestInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    paddingBottom: 80,
  },
  guestTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: SPACING.sm,
  },
  guestText: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  identityCard: {
    marginBottom: SPACING.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  identityText: {
    flex: 1,
    gap: 6,
  },
  emailText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  proBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  freeLabel: {
    fontSize: FONT_SIZES.sm,
  },
  section: {
    marginBottom: SPACING.md,
    padding: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: LAYOUT.touchTarget,
  },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsValue: {
    fontSize: FONT_SIZES.sm,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    marginTop: SPACING.sm,
    minHeight: LAYOUT.touchTarget,
  },
  signOutText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});

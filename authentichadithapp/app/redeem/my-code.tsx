import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import QRCode from 'react-native-qrcode-svg';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';

export default function MyCodeScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const router = useRouter();
  const { user } = useAuth();

  const { data: referralCode, isLoading, isError, refetch } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('type', 'referral')
        .eq('created_by', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.error }]}>Please sign in to view your referral code</Text>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isError && <QueryErrorBanner onRetry={refetch} />}
      <View style={styles.header}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text style={[styles.title, { color: colors.bronzeText }]}>My Referral Code</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.qrCard}>
          {referralCode ? (
            <>
              <Text style={[styles.code, { color: colors.emeraldMid }]}>{referralCode.code}</Text>
              <View style={[styles.qrContainer, { backgroundColor: colors.white }]}>
                <QRCode
                  value={`authentichadith://redeem?code=${referralCode.code}`}
                  size={200}
                  backgroundColor={colors.white}
                  color={colors.emeraldMid}
                />
              </View>
              <Text style={[styles.instructions, { color: colors.mutedText }]}>
                Share this code with friends to give them premium access
              </Text>
              <Text style={[styles.uses, { color: colors.mutedText }]}>
                Used {referralCode.current_uses} times
              </Text>
            </>
          ) : (
            <Text style={[styles.noCode, { color: colors.mutedText }]}>
              {"You don't have a referral code yet. Contact support to get one."}
            </Text>
          )}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  content: {
    padding: SPACING.md,
  },
  qrCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  code: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    letterSpacing: 2,
  },
  qrContainer: {
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  instructions: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  uses: {
    fontSize: FONT_SIZES.sm,
  },
  noCode: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  error: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});

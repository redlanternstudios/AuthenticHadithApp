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
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors';

export default function MyCodeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: referralCode, isLoading } = useQuery({
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
      <View style={styles.container}>
        <Text style={styles.error}>Please sign in to view your referral code</Text>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text style={styles.title}>My Referral Code</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.qrCard}>
          {referralCode ? (
            <>
              <Text style={styles.code}>{referralCode.code}</Text>
              <View style={styles.qrContainer}>
                <QRCode
                  value={`authentichadith://redeem?code=${referralCode.code}`}
                  size={200}
                  backgroundColor={COLORS.white}
                  color={COLORS.emeraldMid}
                />
              </View>
              <Text style={styles.instructions}>
                Share this code with friends to give them premium access
              </Text>
              <Text style={styles.uses}>
                Used {referralCode.current_uses} times
              </Text>
            </>
          ) : (
            <Text style={styles.noCode}>
              You don't have a referral code yet. Contact support to get one.
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
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
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
    color: COLORS.emeraldMid,
    marginBottom: SPACING.lg,
    letterSpacing: 2,
  },
  qrContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  instructions: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  uses: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
  },
  noCode: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
  error: {
    fontSize: FONT_SIZES.base,
    color: COLORS.error,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});

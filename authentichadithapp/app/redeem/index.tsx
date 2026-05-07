import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors';

export default function RedeemScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRedeem = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to redeem codes');
      router.push('/auth/login');
      return;
    }

    if (!code) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('redeem_promo_code', { p_code: code.toUpperCase() });

      if (error) throw error;

      Alert.alert(
        'Success!',
        `Code redeemed! You received ${data.premium_days} days of premium access.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Redemption Failed', error.message || 'Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text style={styles.title}>🎁 Redeem Code</Text>
      </View>

      <View style={styles.content}>
        <Card>
          <Text style={styles.instructions}>
            Enter a promo or referral code to unlock premium features
          </Text>

          <Input
            label="Promo Code"
            placeholder="ENTER-CODE-HERE"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            autoCapitalize="characters"
          />

          <Button
            title="Redeem"
            onPress={handleRedeem}
            isLoading={isLoading}
          />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Premium Benefits:</Text>
          <Text style={styles.infoBullet}>✓ AI Assistant</Text>
          <Text style={styles.infoBullet}>✓ Unlimited Learning Paths</Text>
          <Text style={styles.infoBullet}>✓ Offline Mode</Text>
          <Text style={styles.infoBullet}>✓ Ad-Free Experience</Text>
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
    gap: SPACING.lg,
  },
  instructions: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    marginBottom: SPACING.md,
  },
  infoCard: {
    marginTop: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.bronzeText,
    marginBottom: SPACING.sm,
  },
  infoBullet: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    marginBottom: SPACING.xs,
  },
});

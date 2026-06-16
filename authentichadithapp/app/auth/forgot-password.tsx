import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function ForgotPasswordScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Check your email',
        'We sent you a password reset link',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* FIX-086: Hardcode header title to prevent raw route string display */}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.bronzeText }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {"Enter your email and we'll send you a reset link"}
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title="Send Reset Link"
          onPress={handleReset}
          isLoading={isLoading}
        />

        <Button
          title="Back to Login"
          onPress={() => router.back()}
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
  },
  header: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
  },
  form: {
    gap: SPACING.md,
  },
});

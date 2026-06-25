import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter, Link, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* FIX-086: Hardcode header title to prevent raw route string display */}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.bronzeText }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>Sign in to continue</Text>
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
        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          isLoading={isLoading}
        />

        <Link href="/auth/forgot-password" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.emeraldMid }]}>Forgot password?</Text>
        </Link>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedText }]}>{"Don't have an account? "}</Text>
        <Link href="/auth/signup">
          <Text style={[styles.footerLink, { color: colors.emeraldMid }]}>Sign up</Text>
        </Link>
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
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
  },
  form: {
    gap: SPACING.md,
  },
  link: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  linkText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
  },
  footerLink: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});

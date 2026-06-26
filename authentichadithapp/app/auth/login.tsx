import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter, Link, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase/client';

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

  const handleAppleSignIn = async () => {
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
        nonce: rawNonce,
      });
      if (error) {
        Alert.alert('Apple Sign In Failed', error.message);
        return;
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Apple Sign In Failed', error.message || 'Something went wrong');
      }
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

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
          <Text style={{ color: '#888', marginHorizontal: 8, fontSize: 13 }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
        </View>

        {/* Sign in with Apple */}
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={8}
          style={{ width: '100%', height: 50 }}
          onPress={handleAppleSignIn}
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

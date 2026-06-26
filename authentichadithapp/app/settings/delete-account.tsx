import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { SPACING, FONT_SIZES , getColors } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { supabase } from '@/lib/supabase/client';
import Constants from 'expo-constants';
import { normalizeApiBaseUrl } from '@/lib/config/constants';

const API_URL = normalizeApiBaseUrl(Constants.expoConfig?.extra?.apiUrl);
export default function DeleteAccountScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;

    Alert.alert(
      'Are you sure?',
      'This will permanently delete your account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Get session token
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.access_token) {
                Alert.alert('Error', 'You must be signed in to delete your account.');
                setIsDeleting(false);
                return;
              }

              // Call the server endpoint
              const res = await fetch(`${API_URL}/api/auth/delete-account`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ confirmation: confirmText }),
              });

              const body = await res.json();
              if (!res.ok) throw new Error(body.error || 'Deletion failed');

              // Sign out AFTER the user dismisses the alert to prevent
              // AuthProvider's "Session Expired" alert firing simultaneously.
              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently removed.',
                [{
                  text: 'OK',
                  onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace('/');
                  },
                }],
              );
            } catch (err: any) {
              Alert.alert(
                'Deletion Failed',
                err.message || 'Something went wrong. Please try again or contact support.',
                [{ text: 'OK', onPress: () => setIsDeleting(false) }],
              );
            }
          },
        },
      ],
    );
  };

  return (
    // FIX-136: KeyboardAvoidingView ensures the "Type DELETE" input and the
    // Delete button remain accessible above the iOS keyboard. Without this the
    // keyboard covers the destructive action button entirely.
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Delete Account',
          headerShown: true,
          headerBackTitle: 'Settings',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.destructive,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.content}>
        <View style={[styles.warningBox, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '40' }]}>
          <Text style={[styles.warningTitle, { color: colors.destructive }]}>
            This action is permanent
          </Text>
          <Text style={[styles.warningText, { color: colors.bronzeText }]}>
            Deleting your account will permanently remove:{'\n'}
            {'\n'}&bull; Your profile and preferences
            {'\n'}&bull; All saved hadiths and bookmarks
            {'\n'}&bull; Learning progress and notes
            {'\n'}&bull; AI conversation history
            {'\n'}&bull; Subscription information
          </Text>
        </View>

        <Text style={[styles.confirmLabel, { color: colors.mutedText }]}> 
          Type <Text style={styles.confirmKeyword}>DELETE</Text> to confirm:
        </Text>

        <TextInput
          style={[styles.input, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.bronzeText,
          }]}
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder="Type DELETE"
          placeholderTextColor={colors.mutedText}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: colors.destructive },
            { opacity: confirmText !== 'DELETE' || isDeleting ? 0.4 : 1 },
          ]}
          onPress={handleDelete}
          disabled={confirmText !== 'DELETE' || isDeleting}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.destructiveText} />
          ) : (
            <Text style={[styles.deleteButtonText, { color: colors.destructiveText }]}>Permanently Delete Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md },
  warningBox: {
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  warningTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY.heading,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 22,
  },
  confirmLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.body,
    marginBottom: SPACING.sm,
  },
  confirmKeyword: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.base,
    fontFamily: 'monospace',
    marginBottom: SPACING.md,
  },
  deleteButton: {
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_FAMILY.heading,
    fontWeight: '700',
  },
});

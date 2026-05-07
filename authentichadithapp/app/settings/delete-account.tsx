import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getColors } from '@/lib/styles/colors';
import { supabase } from '@/lib/supabase/client';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://authentichadith.app';
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
              const res = await fetch(`${API_URL}/api/delete-account`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });

              const body = await res.json();
              if (!res.ok) throw new Error(body.error || 'Deletion failed');

              // Sign out locally
              await supabase.auth.signOut();

              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently removed.',
                [{ text: 'OK', onPress: () => router.replace('/') }],
              );
            } catch (err: any) {
              Alert.alert('Deletion Failed', err.message || 'Something went wrong. Please try again or contact support.');
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Stack.Screen
        options={{
          title: 'Delete Account',
          headerShown: true,
          headerBackTitle: 'Settings',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: '#dc2626',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.content}>
        <View style={[styles.warningBox, { backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderColor: '#dc2626' }]}> 
          <Text style={[styles.warningTitle, { color: '#dc2626' }]}> 
            This action is permanent
          </Text>
          <Text style={[styles.warningText, { color: isDark ? '#fca5a5' : '#991b1b' }]}> 
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
            { opacity: confirmText !== 'DELETE' || isDeleting ? 0.4 : 1 },
          ]}
          onPress={handleDelete}
          disabled={confirmText !== 'DELETE' || isDeleting}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.deleteButtonText}>Permanently Delete Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
  },
  confirmLabel: {
    fontSize: FONT_SIZES.sm,
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
    backgroundColor: '#dc2626',
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
});

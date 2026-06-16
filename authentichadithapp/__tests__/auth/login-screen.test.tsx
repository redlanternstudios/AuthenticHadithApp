/**
 * Login Screen Render Tests
 * Verifies the login screen renders core elements without crashing.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  Link: ({ children }: any) => children,
  // FIX-086 added <Stack.Screen> to the auth screens; mock it as a null-render
  // (matches real behavior: it only registers nav options, renders nothing).
  Stack: { Screen: () => null },
}));

// Mock AuthProvider
jest.mock('@/lib/auth/AuthProvider', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    user: null,
    session: null,
    isLoading: false,
    isGuest: true,
  }),
}));

// Mock ThemeProvider
jest.mock('@/lib/theme/ThemeProvider', () => ({
  useTheme: () => ({ isDark: false }),
}));

describe('LoginScreen', () => {
  it('renders without crashing', () => {
    const LoginScreen = require('@/app/auth/login').default;
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('renders forgot password link', () => {
    const LoginScreen = require('@/app/auth/login').default;
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Forgot password?')).toBeTruthy();
  });

  it('renders sign up link', () => {
    const LoginScreen = require('@/app/auth/login').default;
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Sign up')).toBeTruthy();
  });
});

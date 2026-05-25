/**
 * Auth Provider Tests
 * Verifies AuthProvider exports and context shape.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('AuthProvider', () => {
  it('exports AuthProvider and useAuth', () => {
    const { AuthProvider, useAuth } = require('@/lib/auth/AuthProvider');
    expect(AuthProvider).toBeDefined();
    expect(useAuth).toBeDefined();
    expect(typeof AuthProvider).toBe('function');
    expect(typeof useAuth).toBe('function');
  });

  it('useAuth returns expected shape from default context', () => {
    const { useAuth } = require('@/lib/auth/AuthProvider');

    function TestConsumer() {
      const auth = useAuth();
      return <Text testID="auth-json">{JSON.stringify(Object.keys(auth).sort())}</Text>;
    }

    const { getByTestId } = render(<TestConsumer />);
    const keys = JSON.parse(getByTestId('auth-json').props.children);
    expect(keys).toContain('user');
    expect(keys).toContain('session');
    expect(keys).toContain('isLoading');
    expect(keys).toContain('signIn');
    expect(keys).toContain('signOut');
  });

  it('default context has user as null (not logged in)', () => {
    const { useAuth } = require('@/lib/auth/AuthProvider');

    function TestConsumer() {
      const { user, isGuest } = useAuth();
      return (
        <>
          <Text testID="user">{String(user)}</Text>
          <Text testID="guest">{String(isGuest)}</Text>
        </>
      );
    }

    const { getByTestId } = render(<TestConsumer />);
    expect(getByTestId('user').props.children).toBe('null');
    expect(getByTestId('guest').props.children).toBe('true');
  });
});

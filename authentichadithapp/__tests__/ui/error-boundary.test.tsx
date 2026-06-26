/**
 * ErrorBoundary Tests
 * Verifies the global error boundary catches render crashes.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// ThemedErrorFallback calls useTheme(); mock it so the test runs without a real ThemeProvider
jest.mock('@/lib/theme/ThemeProvider', () => ({
  useTheme: () => ({ isDark: false, theme: 'light', toggleTheme: jest.fn(), setTheme: jest.fn() }),
}));

describe('ErrorBoundary', () => {
  it('exports ErrorBoundary component', () => {
    const { ErrorBoundary } = require('@/components/common/ErrorBoundary');
    expect(ErrorBoundary).toBeDefined();
  });

  it('renders children when no error', () => {
    const { ErrorBoundary } = require('@/components/common/ErrorBoundary');
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Safe Content</Text>
      </ErrorBoundary>,
    );
    expect(getByText('Safe Content')).toBeTruthy();
  });

  it('catches thrown error and renders fallback', () => {
    const { ErrorBoundary } = require('@/components/common/ErrorBoundary');
    // Suppress console.error for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    function Crasher(): React.ReactNode {
      throw new Error('Test crash');
    }

    const { queryByText } = render(
      <ErrorBoundary>
        <Crasher />
      </ErrorBoundary>,
    );

    // ErrorBoundary should NOT render the crashing component's content
    // It should render some fallback instead of white-screening
    expect(queryByText('Test crash')).toBeFalsy();
    spy.mockRestore();
  });
});

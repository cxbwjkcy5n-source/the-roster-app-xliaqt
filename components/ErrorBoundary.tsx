
import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[ErrorBoundary] Error caught:', error);
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    console.log('[ErrorBoundary] Resetting error state');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const errorStack = this.state.error?.stack || '';

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. Please try again.
            </Text>

            <ScrollView style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              {__DEV__ && (
                <>
                  <Text style={styles.errorTitle}>Stack Trace:</Text>
                  <Text style={styles.errorText}>{errorStack}</Text>
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

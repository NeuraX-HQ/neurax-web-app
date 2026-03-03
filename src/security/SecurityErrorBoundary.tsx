/**
 * SecurityErrorBoundary - React Error Boundary for secure error handling
 * 
 * Features:
 * - Catches errors in component tree
 * - Uses ErrorHandler to process errors securely
 * - Shows user-friendly fallback UI
 * - Logs errors without exposing stack traces
 * - Prevents sensitive information leakage
 * 
 * Requirements: 8.4, 11.3
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { errorHandler, ErrorInfo } from './ErrorHandler';

interface Props {
  children: ReactNode;
  screenName?: string;
  fallback?: (errorInfo: ErrorInfo, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: ErrorInfo | null;
}

export class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Process error through ErrorHandler
    const processedError = errorHandler.handleError(error, {
      screen: this.props.screenName,
      timestamp: Date.now(),
      componentStack: errorInfo.componentStack,
    });

    // Update state with processed error info
    this.setState({
      errorInfo: processedError,
    });

    // Error is already logged by ErrorHandler.handleError
  }

  handleRetry = (): void => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.errorInfo) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.errorInfo, this.handleRetry);
      }

      // Default fallback UI
      const userMessage = errorHandler.getUserMessage(this.state.errorInfo);

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Oops!</Text>
            <Text style={styles.message}>{userMessage}</Text>
            <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

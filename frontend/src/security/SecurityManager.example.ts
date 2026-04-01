/**
 * SecurityManager Usage Examples
 * 
 * This file demonstrates how to use the SecurityManager in your application.
 */

import { securityManager } from './SecurityManager';

/**
 * Example 1: Initialize SecurityManager on app startup
 */
export async function initializeSecurityOnAppStartup() {
  try {
    await securityManager.initialize();
    console.log('Security initialized successfully');
  } catch (error) {
    console.error('Failed to initialize security:', error);
  }
}

/**
 * Example 2: Login flow
 */
export async function loginUser(email: string, password: string) {
  try {
    // SecurityManager will:
    // 1. Validate email and password
    // 2. Create session
    // 3. Store biometric hash if biometric is enabled
    await securityManager.login(email, password);
    
    console.log('Login successful');
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

/**
 * Example 3: Check authentication status
 */
export async function checkUserAuthentication() {
  try {
    const isAuthenticated = await securityManager.checkAuth();
    
    if (isAuthenticated) {
      console.log('User is authenticated');
      return true;
    } else {
      console.log('User is not authenticated or session is locked');
      return false;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

/**
 * Example 4: Logout flow
 */
export async function logoutUser() {
  try {
    // SecurityManager will:
    // 1. End session
    // 2. Clear all auth data
    // 3. Reset biometric failed attempts
    await securityManager.logout();
    
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

/**
 * Example 5: Handle app lifecycle events
 * 
 * In your App.tsx or root component:
 */
export function setupAppLifecycleHandlers() {
  // Import AppState from react-native
  const { AppState } = require('react-native');
  
  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active') {
      // App came to foreground
      await securityManager.onAppForeground();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background
      await securityManager.onAppBackground();
    }
  };
  
  // Subscribe to app state changes
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  
  // Return cleanup function
  return () => {
    subscription.remove();
  };
}

/**
 * Example 6: Access individual security modules
 */
export async function useSecurityModules() {
  // Access StorageManager
  await securityManager.storage.setItem('my_key', 'my_value');
  const value = await securityManager.storage.getItem('my_key');
  
  // Access SessionManager
  const session = await securityManager.session.getSession();
  await securityManager.session.updateLastActivity();
  
  // Access BiometricManager
  const biometricStatus = await securityManager.biometric.checkBiometricStatus();
  if (biometricStatus.isSupported && biometricStatus.isEnrolled) {
    const success = await securityManager.biometric.authenticate('Verify your identity');
  }
  
  // Access InputValidator
  const emailValidation = securityManager.validator.validateEmail('test@example.com');
  if (!emailValidation.isValid) {
    console.error('Email validation errors:', emailValidation.errors);
  }
  
  // Access ScreenProtection
  securityManager.screenProtection.enableProtection('profile');
  
  // Access ErrorHandler
  try {
    // Some operation that might fail
    throw new Error('Something went wrong');
  } catch (error) {
    const errorInfo = securityManager.errorHandler.handleError(error as Error);
    const userMessage = securityManager.errorHandler.getUserMessage(errorInfo);
    console.log('User-friendly message:', userMessage);
  }
  
  // Access SecureLogger
  securityManager.logger.info('User performed action', { action: 'view_profile' });
  securityManager.logger.logSecurityEvent('custom_security_event', { details: 'event details' });
}

/**
 * Example 7: Complete authentication flow in a React component
 */
export const AuthenticationFlowExample = `
import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { securityManager } from './security/SecurityManager';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize security on component mount
    securityManager.initialize().catch(err => {
      console.error('Security initialization failed:', err);
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await securityManager.login(email, password);
      // Navigate to home screen
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
`;

/**
 * Example 8: App.tsx integration
 */
export const AppIntegrationExample = `
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { securityManager } from './security/SecurityManager';

export default function App() {
  useEffect(() => {
    // Initialize security on app startup
    const initSecurity = async () => {
      try {
        await securityManager.initialize();
        console.log('Security initialized');
      } catch (error) {
        console.error('Security initialization failed:', error);
      }
    };
    
    initSecurity();
    
    // Setup app lifecycle handlers
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        await securityManager.onAppForeground();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        await securityManager.onAppBackground();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    // Your app components
    <YourAppNavigator />
  );
}
`;

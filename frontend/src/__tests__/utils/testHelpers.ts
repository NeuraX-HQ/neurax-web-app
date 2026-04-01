/**
 * Test Helper Utilities
 * 
 * Common utilities and helpers for testing security modules
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Reset all mocks to their initial state
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  
  // Reset SecureStore mocks
  (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
  
  // Reset AsyncStorage mocks
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.multiSet as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([]);
  (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
  
  // Reset LocalAuthentication mocks
  (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
  (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
  (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([1, 2]);
  (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
};

/**
 * Mock SecureStore to simulate storage behavior
 */
export const mockSecureStore = () => {
  const storage = new Map<string, string>();
  
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (key: string, value: string) => {
    storage.set(key, value);
  });
  
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
    return storage.get(key) || null;
  });
  
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (key: string) => {
    storage.delete(key);
  });
  
  return {
    storage,
    clear: () => storage.clear(),
  };
};

/**
 * Mock AsyncStorage to simulate storage behavior
 */
export const mockAsyncStorage = () => {
  const storage = new Map<string, string>();
  
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    storage.set(key, value);
  });
  
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
    return storage.get(key) || null;
  });
  
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
    storage.delete(key);
  });
  
  (AsyncStorage.multiSet as jest.Mock).mockImplementation(async (pairs: [string, string][]) => {
    pairs.forEach(([key, value]) => storage.set(key, value));
  });
  
  (AsyncStorage.multiGet as jest.Mock).mockImplementation(async (keys: string[]) => {
    return keys.map(key => [key, storage.get(key) || null]);
  });
  
  (AsyncStorage.multiRemove as jest.Mock).mockImplementation(async (keys: string[]) => {
    keys.forEach(key => storage.delete(key));
  });
  
  (AsyncStorage.clear as jest.Mock).mockImplementation(async () => {
    storage.clear();
  });
  
  (AsyncStorage.getAllKeys as jest.Mock).mockImplementation(async () => {
    return Array.from(storage.keys());
  });
  
  return {
    storage,
    clear: () => storage.clear(),
  };
};

/**
 * Mock LocalAuthentication to simulate biometric behavior
 */
export const mockLocalAuthentication = (config?: {
  hasHardware?: boolean;
  isEnrolled?: boolean;
  authSuccess?: boolean;
}) => {
  const {
    hasHardware = true,
    isEnrolled = true,
    authSuccess = true,
  } = config || {};
  
  (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(hasHardware);
  (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(isEnrolled);
  (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: authSuccess });
  
  return {
    setAuthSuccess: (success: boolean) => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success });
    },
  };
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setImmediate(resolve));

/**
 * Create a mock timer and advance time
 */
export const advanceTime = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

/**
 * Setup fake timers for testing time-based functionality
 */
export const setupFakeTimers = () => {
  jest.useFakeTimers();
  return () => jest.useRealTimers();
};

/**
 * Generate a random string for testing
 */
export const randomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a mock auth token
 */
export const mockAuthToken = (): string => {
  return `Bearer ${randomString(64)}`;
};

/**
 * Generate a mock session data
 */
export const mockSessionData = () => ({
  userId: `user-${randomString(16)}`,
  email: `test${randomString(8)}@example.com`,
  loginTime: Date.now() - 3600000,
  lastActivityTime: Date.now(),
});

/**
 * Check if a value contains sensitive data patterns
 */
export const containsSensitiveData = (value: string): boolean => {
  const patterns = [
    /token["\s:]+([a-zA-Z0-9._-]+)/gi,
    /password["\s:]+([^\s,"]+)/gi,
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ];
  
  return patterns.some(pattern => pattern.test(value));
};

/**
 * Check if a value has been redacted
 */
export const isRedacted = (value: string): boolean => {
  return value.includes('[REDACTED]') || value.includes('***');
};

/**
 * Create a spy on console methods
 */
export const spyOnConsole = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const logs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log = jest.fn((...args) => logs.push(args.join(' ')));
  console.error = jest.fn((...args) => errors.push(args.join(' ')));
  console.warn = jest.fn((...args) => warnings.push(args.join(' ')));
  
  return {
    logs,
    errors,
    warnings,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
};

/**
 * Assert that a function throws an error with a specific message
 */
export const expectToThrow = async (fn: () => Promise<any>, expectedMessage?: string) => {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedMessage && error instanceof Error) {
      expect(error.message).toContain(expectedMessage);
    }
  }
};

/**
 * Create a delay for testing async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

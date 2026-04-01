/**
 * Setup Verification Test
 * 
 * This test verifies that the testing framework is properly configured
 * and all mocks are working correctly.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as fc from 'fast-check';
import { resetAllMocks, mockSecureStore, mockAsyncStorage } from './utils/testHelpers';
import { sensitiveDataGen, emailGen } from './utils/generators';

describe('Testing Framework Setup', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Jest Configuration', () => {
    it('should be able to run basic tests', () => {
      expect(true).toBe(true);
    });

    it('should support async/await', async () => {
      const result = await Promise.resolve('success');
      expect(result).toBe('success');
    });
  });

  describe('SecureStore Mock', () => {
    it('should mock setItemAsync', async () => {
      await SecureStore.setItemAsync('test-key', 'test-value');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should mock getItemAsync', async () => {
      const result = await SecureStore.getItemAsync('test-key');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });

    it('should mock deleteItemAsync', async () => {
      await SecureStore.deleteItemAsync('test-key');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test-key');
    });

    it('should simulate storage behavior with mockSecureStore', async () => {
      const { storage } = mockSecureStore();
      
      await SecureStore.setItemAsync('key1', 'value1');
      const result = await SecureStore.getItemAsync('key1');
      
      expect(result).toBe('value1');
      expect(storage.size).toBe(1);
    });
  });

  describe('AsyncStorage Mock', () => {
    it('should mock setItem', async () => {
      await AsyncStorage.setItem('test-key', 'test-value');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should mock getItem', async () => {
      const result = await AsyncStorage.getItem('test-key');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });

    it('should mock removeItem', async () => {
      await AsyncStorage.removeItem('test-key');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should simulate storage behavior with mockAsyncStorage', async () => {
      const { storage } = mockAsyncStorage();
      
      await AsyncStorage.setItem('key1', 'value1');
      const result = await AsyncStorage.getItem('key1');
      
      expect(result).toBe('value1');
      expect(storage.size).toBe(1);
    });
  });

  describe('LocalAuthentication Mock', () => {
    it('should mock hasHardwareAsync', async () => {
      const result = await LocalAuthentication.hasHardwareAsync();
      expect(result).toBe(true);
    });

    it('should mock isEnrolledAsync', async () => {
      const result = await LocalAuthentication.isEnrolledAsync();
      expect(result).toBe(true);
    });

    it('should mock authenticateAsync', async () => {
      const result = await LocalAuthentication.authenticateAsync();
      expect(result).toEqual({ success: true });
    });
  });

  describe('fast-check Integration', () => {
    it('should be able to run property-based tests', () => {
      fc.assert(
        fc.property(fc.integer(), (n) => {
          return n + 0 === n;
        })
      );
    });

    it('should work with async properties', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (s) => {
          const result = await Promise.resolve(s);
          return result === s;
        })
      );
    });

    it('should work with custom generators', () => {
      fc.assert(
        fc.property(sensitiveDataGen, (data) => {
          expect(data).toHaveProperty('type');
          expect(data).toHaveProperty('value');
          expect(data).toHaveProperty('encrypted');
          return true;
        }),
        { numRuns: 10 }
      );
    });

    it('should work with email generator', () => {
      fc.assert(
        fc.property(emailGen, (email) => {
          expect(email).toContain('@');
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Test Utilities', () => {
    it('should reset all mocks', () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue('custom');
      resetAllMocks();
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should create isolated storage mocks', async () => {
      const secureStore = mockSecureStore();
      const asyncStore = mockAsyncStorage();
      
      await SecureStore.setItemAsync('secure-key', 'secure-value');
      await AsyncStorage.setItem('async-key', 'async-value');
      
      expect(secureStore.storage.size).toBe(1);
      expect(asyncStore.storage.size).toBe(1);
      expect(secureStore.storage.get('secure-key')).toBe('secure-value');
      expect(asyncStore.storage.get('async-key')).toBe('async-value');
    });
  });
});

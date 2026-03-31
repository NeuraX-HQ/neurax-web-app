/**
 * StorageManager - Secure storage management with data classification and encryption
 * 
 * This module provides a unified interface for storing sensitive and non-sensitive data
 * with automatic routing to SecureStore or AsyncStorage based on data classification.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum StorageType {
  SECURE = 'secure',    // SecureStore - for sensitive data
  STANDARD = 'standard' // AsyncStorage - for non-sensitive data
}

export interface StorageConfig {
  encrypt?: boolean;
  type: StorageType;
}

export interface StorageManager {
  // Core operations
  setItem(key: string, value: string, config?: StorageConfig): Promise<void>;
  getItem(key: string, config?: StorageConfig): Promise<string | null>;
  removeItem(key: string, config?: StorageConfig): Promise<void>;
  
  // Batch operations
  setItems(items: Record<string, string>, config?: StorageConfig): Promise<void>;
  getItems(keys: string[], config?: StorageConfig): Promise<Record<string, string | null>>;
  removeItems(keys: string[], config?: StorageConfig): Promise<void>;
  
  // Cleanup
  clearAllSecureData(): Promise<void>;
  clearAllStandardData(): Promise<void>;
  clearAllData(): Promise<void>;
  
  // Utility
  getAllKeys(type: StorageType): Promise<string[]>;
}

// ============================================================================
// Storage Keys Constants
// ============================================================================

export const STORAGE_KEYS = {
  // Secure storage (SecureStore) - sensitive data
  AUTH_TOKEN: 'secure_auth_token',
  REFRESH_TOKEN: 'secure_refresh_token',
  USER_CREDENTIALS: 'secure_user_credentials',
  HEALTH_DATA: 'secure_health_data',
  BIOMETRIC_KEY: 'secure_biometric_key',
  
  // Standard storage (AsyncStorage) - non-sensitive data
  SESSION_INFO: 'session_info',
  USER_PREFERENCES: 'user_preferences',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  AUTO_LOCK_TIMEOUT: 'auto_lock_timeout',
  LAST_ACTIVITY: 'last_activity',
  LOGIN_TIME: 'login_time',
  FAILED_BIOMETRIC_ATTEMPTS: 'failed_biometric_attempts',
  LAST_BIOMETRIC_CHECK: 'last_biometric_check',
} as const;

// ============================================================================
// Encryption Utilities
// ============================================================================

/**
 * Simple encryption for sensitive data
 * Note: This is a basic implementation. In production, consider using a more robust
 * encryption library like react-native-crypto or expo-crypto
 */
class SimpleEncryption {
  private static readonly ENCRYPTION_KEY = 'nutritrack_secure_key_v1';
  
  /**
   * Encrypt a string value
   */
  static encrypt(value: string): string {
    try {
      // Base64 encode with a simple XOR cipher
      // In production, use a proper encryption library
      const encrypted = value.split('').map((char, i) => {
        const keyChar = this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      }).join('');
      
      return Buffer.from(encrypted, 'binary').toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Decrypt a string value
   */
  static decrypt(encryptedValue: string): string {
    try {
      const decoded = Buffer.from(encryptedValue, 'base64').toString('binary');
      
      const decrypted = decoded.split('').map((char, i) => {
        const keyChar = this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      }).join('');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============================================================================
// StorageManager Implementation
// ============================================================================

class StorageManagerImpl implements StorageManager {
  
  /**
   * Determine storage type based on key name
   * Sensitive keys (starting with 'secure_') go to SecureStore
   */
  private getStorageType(key: string, config?: StorageConfig): StorageType {
    if (config?.type) {
      return config.type;
    }
    
    // Auto-detect based on key prefix
    return key.startsWith('secure_') ? StorageType.SECURE : StorageType.STANDARD;
  }
  
  /**
   * Check if encryption should be applied
   */
  private shouldEncrypt(key: string, config?: StorageConfig): boolean {
    if (config?.encrypt !== undefined) {
      return config.encrypt;
    }
    
    // Auto-encrypt sensitive data
    return key.startsWith('secure_');
  }
  
  // ==========================================================================
  // Core Operations
  // ==========================================================================
  
  /**
   * Store an item with automatic routing to SecureStore or AsyncStorage
   * Requirement 2.1, 2.2, 2.3, 2.4
   */
  async setItem(key: string, value: string, config?: StorageConfig): Promise<void> {
    const storageType = this.getStorageType(key, config);
    const shouldEncrypt = this.shouldEncrypt(key, config);
    
    try {
      let valueToStore = value;
      
      // Encrypt if needed
      if (shouldEncrypt) {
        valueToStore = SimpleEncryption.encrypt(value);
      }
      
      // Route to appropriate storage
      if (storageType === StorageType.SECURE) {
        // SecureStore for sensitive data
        await SecureStore.setItemAsync(key, valueToStore);
      } else {
        // AsyncStorage for non-sensitive data
        await AsyncStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      throw new Error(
        `Failed to store item '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Retrieve an item from SecureStore or AsyncStorage
   * Requirement 2.1, 2.2, 2.3
   */
  async getItem(key: string, config?: StorageConfig): Promise<string | null> {
    const storageType = this.getStorageType(key, config);
    const shouldEncrypt = this.shouldEncrypt(key, config);
    
    try {
      let value: string | null = null;
      
      // Retrieve from appropriate storage
      if (storageType === StorageType.SECURE) {
        value = await SecureStore.getItemAsync(key);
      } else {
        value = await AsyncStorage.getItem(key);
      }
      
      if (value === null) {
        return null;
      }
      
      // Decrypt if needed
      if (shouldEncrypt) {
        return SimpleEncryption.decrypt(value);
      }
      
      return value;
    } catch (error) {
      throw new Error(
        `Failed to retrieve item '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Remove an item from storage
   * Requirement 2.5
   */
  async removeItem(key: string, config?: StorageConfig): Promise<void> {
    const storageType = this.getStorageType(key, config);
    
    try {
      if (storageType === StorageType.SECURE) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      throw new Error(
        `Failed to remove item '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  // ==========================================================================
  // Batch Operations
  // ==========================================================================
  
  /**
   * Store multiple items at once
   * Requirement 2.5
   */
  async setItems(items: Record<string, string>, config?: StorageConfig): Promise<void> {
    const promises = Object.entries(items).map(([key, value]) =>
      this.setItem(key, value, config)
    );
    
    await Promise.all(promises);
  }
  
  /**
   * Retrieve multiple items at once
   * Requirement 2.5
   */
  async getItems(keys: string[], config?: StorageConfig): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    
    const promises = keys.map(async (key) => {
      const value = await this.getItem(key, config);
      results[key] = value;
    });
    
    await Promise.all(promises);
    
    return results;
  }
  
  /**
   * Remove multiple items at once
   * Requirement 2.5
   */
  async removeItems(keys: string[], config?: StorageConfig): Promise<void> {
    const promises = keys.map((key) => this.removeItem(key, config));
    await Promise.all(promises);
  }
  
  // ==========================================================================
  // Cleanup Operations
  // ==========================================================================
  
  /**
   * Clear all secure data from SecureStore
   * Requirement 15.3
   */
  async clearAllSecureData(): Promise<void> {
    try {
      // Get all secure keys (keys starting with 'secure_')
      const allKeys = await this.getAllKeys(StorageType.STANDARD);
      const secureKeys = allKeys.filter(key => key.startsWith('secure_'));
      
      // Also clear known secure keys from STORAGE_KEYS
      const knownSecureKeys = Object.values(STORAGE_KEYS).filter(key => 
        key.startsWith('secure_')
      );
      
      // Combine and deduplicate
      const keysToRemove = [...new Set([...secureKeys, ...knownSecureKeys])];
      
      // Remove all secure keys
      const promises = keysToRemove.map(key => 
        SecureStore.deleteItemAsync(key).catch(() => {
          // Ignore errors for keys that don't exist
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      throw new Error(
        `Failed to clear secure data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Clear all standard data from AsyncStorage
   * Requirement 15.3
   */
  async clearAllStandardData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      throw new Error(
        `Failed to clear standard data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Clear all data from both SecureStore and AsyncStorage
   * Requirement 15.3
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.clearAllSecureData(),
      this.clearAllStandardData(),
    ]);
  }
  
  // ==========================================================================
  // Utility Operations
  // ==========================================================================
  
  /**
   * Get all keys from specified storage type
   * Requirement 2.5
   */
  async getAllKeys(type: StorageType): Promise<string[]> {
    try {
      if (type === StorageType.SECURE) {
        // SecureStore doesn't have a native getAllKeys method
        // Return known secure keys from STORAGE_KEYS
        const secureKeys = Object.values(STORAGE_KEYS).filter(key => key.startsWith('secure_'));
        return Array.from(secureKeys);
      } else {
        // AsyncStorage has getAllKeys
        const keys = await AsyncStorage.getAllKeys();
        return Array.from(keys);
      }
    } catch (error) {
      throw new Error(
        `Failed to get all keys: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const storageManager: StorageManager = new StorageManagerImpl();

// Export class for testing
export { StorageManagerImpl };

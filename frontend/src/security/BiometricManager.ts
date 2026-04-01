/**
 * BiometricManager - Biometric authentication with rate limiting and change detection
 * 
 * Features:
 * - Rate limiting: max 3 failed attempts before lockout
 * - Lockout duration: 5 minutes
 * - Biometric change detection via hash comparison
 * - Enable/disable biometric authentication
 * - Fallback to credentials when needed
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { storageManager, STORAGE_KEYS } from './StorageManager';
import { secureLogger, SECURITY_EVENTS } from './SecureLogger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BiometricStatus {
  isSupported: boolean;
  isEnrolled: boolean;
  isEnabled: boolean;
  availableTypes: LocalAuthentication.AuthenticationType[];
  hasChanged: boolean;
}

export interface BiometricConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // milliseconds
  promptMessage: string;
  fallbackLabel: string;
}

export interface BiometricManager {
  // Status checks
  checkBiometricStatus(): Promise<BiometricStatus>;
  isBiometricAvailable(): Promise<boolean>;
  hasBiometricChanged(): Promise<boolean>;
  
  // Authentication
  authenticate(message?: string): Promise<boolean>;
  authenticateWithFallback(): Promise<{ success: boolean; usedBiometric: boolean }>;
  
  // Settings
  enableBiometric(): Promise<void>;
  disableBiometric(): Promise<void>;
  isBiometricEnabled(): Promise<boolean>;
  
  // Rate limiting
  recordFailedAttempt(): Promise<void>;
  getFailedAttempts(): Promise<number>;
  resetFailedAttempts(): Promise<void>;
  isLockedOut(): Promise<boolean>;
  
  // Biometric change detection
  storeBiometricHash(): Promise<void>;
  checkBiometricHash(): Promise<boolean>;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_BIOMETRIC_CONFIG: BiometricConfig = {
  maxFailedAttempts: 3,
  lockoutDuration: 5 * 60 * 1000, // 5 minutes
  promptMessage: 'Authenticate to continue',
  fallbackLabel: 'Use passcode',
};

// ============================================================================
// BiometricManager Implementation
// ============================================================================

class BiometricManagerImpl implements BiometricManager {
  private config: BiometricConfig;
  
  constructor(config: BiometricConfig = DEFAULT_BIOMETRIC_CONFIG) {
    this.config = config;
  }
  
  // ==========================================================================
  // Status Checks
  // ==========================================================================
  
  /**
   * Check comprehensive biometric status
   * Requirement 4.1, 4.3, 4.4, 4.5
   */
  async checkBiometricStatus(): Promise<BiometricStatus> {
    try {
      // Check hardware support
      const isSupported = await LocalAuthentication.hasHardwareAsync();
      
      // Check if biometrics are enrolled
      const isEnrolled = isSupported 
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      
      // Get available authentication types
      const availableTypes = isSupported
        ? await LocalAuthentication.supportedAuthenticationTypesAsync()
        : [];
      
      // Check if biometric is enabled in app settings
      const isEnabled = await this.isBiometricEnabled();
      
      // Check if biometrics have changed
      const hasChanged = isEnrolled 
        ? await this.hasBiometricChanged()
        : false;
      
      return {
        isSupported,
        isEnrolled,
        isEnabled,
        availableTypes,
        hasChanged,
      };
    } catch (error) {
      secureLogger.error('Failed to check biometric status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Return safe defaults on error
      return {
        isSupported: false,
        isEnrolled: false,
        isEnabled: false,
        availableTypes: [],
        hasChanged: false,
      };
    }
  }
  
  /**
   * Check if biometric authentication is available
   * Requirement 4.1
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return false;
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return isEnrolled;
    } catch (error) {
      secureLogger.error('Failed to check biometric availability', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
  
  /**
   * Check if enrolled biometrics have changed since last login
   * Requirement 4.3, 4.4
   */
  async hasBiometricChanged(): Promise<boolean> {
    try {
      // Get stored biometric hash
      const storedHash = await storageManager.getItem(STORAGE_KEYS.BIOMETRIC_KEY);
      
      // If no stored hash, biometrics haven't been set up yet
      if (!storedHash) {
        return false;
      }
      
      // Generate current biometric hash
      const currentHash = await this.generateBiometricHash();
      
      // Compare hashes
      const hasChanged = storedHash !== currentHash;
      
      if (hasChanged) {
        secureLogger.logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_CHANGED, {
          timestamp: Date.now(),
        });
      }
      
      return hasChanged;
    } catch (error) {
      secureLogger.error('Failed to check biometric change', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // On error, assume biometrics haven't changed to avoid false positives
      return false;
    }
  }
  
  // ==========================================================================
  // Authentication
  // ==========================================================================
  
  /**
   * Authenticate using biometrics
   * Requirement 4.1, 4.2
   */
  async authenticate(message?: string): Promise<boolean> {
    try {
      // Check if locked out
      const lockedOut = await this.isLockedOut();
      if (lockedOut) {
        secureLogger.warning('Biometric authentication blocked due to lockout');
        return false;
      }
      
      // Check if biometric is available
      const available = await this.isBiometricAvailable();
      if (!available) {
        secureLogger.warning('Biometric authentication not available');
        return false;
      }
      
      // Check if biometric is enabled
      const enabled = await this.isBiometricEnabled();
      if (!enabled) {
        secureLogger.warning('Biometric authentication is disabled');
        return false;
      }
      
      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: message || this.config.promptMessage,
        fallbackLabel: this.config.fallbackLabel,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        // Reset failed attempts on success
        await this.resetFailedAttempts();
        
        secureLogger.logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_AUTH_SUCCESS, {
          timestamp: Date.now(),
        });
        
        return true;
      } else {
        // Record failed attempt
        await this.recordFailedAttempt();
        
        secureLogger.logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_AUTH_FAILED, {
          timestamp: Date.now(),
          error: result.error,
        });
        
        // Check if now locked out
        const nowLockedOut = await this.isLockedOut();
        if (nowLockedOut) {
          secureLogger.logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_LOCKOUT, {
            timestamp: Date.now(),
          });
        }
        
        return false;
      }
    } catch (error) {
      secureLogger.error('Biometric authentication error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Record failed attempt on error
      await this.recordFailedAttempt();
      
      return false;
    }
  }
  
  /**
   * Authenticate with fallback to credentials
   * Requirement 4.2
   */
  async authenticateWithFallback(): Promise<{ success: boolean; usedBiometric: boolean }> {
    try {
      // Check if biometric is available and enabled
      const available = await this.isBiometricAvailable();
      const enabled = await this.isBiometricEnabled();
      const lockedOut = await this.isLockedOut();
      
      // If biometric is available, enabled, and not locked out, try biometric first
      if (available && enabled && !lockedOut) {
        const biometricSuccess = await this.authenticate();
        
        if (biometricSuccess) {
          return { success: true, usedBiometric: true };
        }
      }
      
      // Fallback to credentials
      // Note: Actual credential authentication should be handled by the caller
      // This method just indicates that fallback is needed
      secureLogger.info('Biometric authentication unavailable, fallback to credentials required');
      
      return { success: false, usedBiometric: false };
    } catch (error) {
      secureLogger.error('Authentication with fallback error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return { success: false, usedBiometric: false };
    }
  }
  
  // ==========================================================================
  // Settings
  // ==========================================================================
  
  /**
   * Enable biometric authentication
   * Requirement 4.5
   */
  async enableBiometric(): Promise<void> {
    try {
      // Check if biometric is available
      const available = await this.isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric authentication is not available on this device');
      }
      
      // Store biometric hash for change detection
      await this.storeBiometricHash();
      
      // Enable biometric in settings
      await storageManager.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      
      // Reset failed attempts
      await this.resetFailedAttempts();
      
      secureLogger.logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_ENABLED, {
        timestamp: Date.now(),
      });
    } catch (error) {
      secureLogger.error('Failed to enable biometric', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  /**
   * Disable biometric authentication
   * Requirement 4.5
   */
  async disableBiometric(): Promise<void> {
    try {
      await storageManager.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
      
      // Reset failed attempts
      await this.resetFailedAttempts();
      
      secureLogger.logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_DISABLED, {
        timestamp: Date.now(),
      });
    } catch (error) {
      secureLogger.error('Failed to disable biometric', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  /**
   * Check if biometric authentication is enabled
   * Requirement 4.5
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await storageManager.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      secureLogger.error('Failed to check if biometric is enabled', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
  
  // ==========================================================================
  // Rate Limiting
  // ==========================================================================
  
  /**
   * Record a failed biometric authentication attempt
   * Requirement 4.1, 4.2
   */
  async recordFailedAttempt(): Promise<void> {
    try {
      const currentAttempts = await this.getFailedAttempts();
      const newAttempts = currentAttempts + 1;
      
      // Store failed attempts count and timestamp
      const attemptsData = JSON.stringify({
        count: newAttempts,
        lastAttempt: Date.now(),
      });
      
      await storageManager.setItem(STORAGE_KEYS.FAILED_BIOMETRIC_ATTEMPTS, attemptsData);
      
      secureLogger.warning('Biometric failed attempt recorded', {
        attempts: newAttempts,
        maxAttempts: this.config.maxFailedAttempts,
      });
    } catch (error) {
      secureLogger.error('Failed to record failed attempt', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  /**
   * Get the number of failed biometric attempts
   * Requirement 4.1
   */
  async getFailedAttempts(): Promise<number> {
    try {
      const attemptsData = await storageManager.getItem(STORAGE_KEYS.FAILED_BIOMETRIC_ATTEMPTS);
      
      if (!attemptsData) {
        return 0;
      }
      
      const parsed = JSON.parse(attemptsData);
      return parsed.count || 0;
    } catch (error) {
      secureLogger.error('Failed to get failed attempts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }
  
  /**
   * Reset failed biometric attempts counter
   * Requirement 4.1, 4.2
   */
  async resetFailedAttempts(): Promise<void> {
    try {
      await storageManager.removeItem(STORAGE_KEYS.FAILED_BIOMETRIC_ATTEMPTS);
      
      secureLogger.debug('Biometric failed attempts reset');
    } catch (error) {
      secureLogger.error('Failed to reset failed attempts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  /**
   * Check if biometric authentication is locked out
   * Requirement 4.1, 4.2
   */
  async isLockedOut(): Promise<boolean> {
    try {
      const attemptsData = await storageManager.getItem(STORAGE_KEYS.FAILED_BIOMETRIC_ATTEMPTS);
      
      if (!attemptsData) {
        return false;
      }
      
      const parsed = JSON.parse(attemptsData);
      const attempts = parsed.count || 0;
      const lastAttempt = parsed.lastAttempt || 0;
      
      // Check if max attempts exceeded
      if (attempts < this.config.maxFailedAttempts) {
        return false;
      }
      
      // Check if lockout duration has passed
      const timeSinceLastAttempt = Date.now() - lastAttempt;
      const isStillLockedOut = timeSinceLastAttempt < this.config.lockoutDuration;
      
      // If lockout duration has passed, reset attempts
      if (!isStillLockedOut) {
        await this.resetFailedAttempts();
        return false;
      }
      
      return true;
    } catch (error) {
      secureLogger.error('Failed to check lockout status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // On error, assume not locked out to avoid blocking legitimate users
      return false;
    }
  }
  
  // ==========================================================================
  // Biometric Change Detection
  // ==========================================================================
  
  /**
   * Store a hash of current enrolled biometrics
   * Requirement 4.3, 4.4
   */
  async storeBiometricHash(): Promise<void> {
    try {
      const hash = await this.generateBiometricHash();
      
      await storageManager.setItem(STORAGE_KEYS.BIOMETRIC_KEY, hash);
      
      // Update last check timestamp
      await storageManager.setItem(
        STORAGE_KEYS.LAST_BIOMETRIC_CHECK,
        Date.now().toString()
      );
      
      secureLogger.debug('Biometric hash stored');
    } catch (error) {
      secureLogger.error('Failed to store biometric hash', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  /**
   * Check if stored biometric hash matches current biometrics
   * Requirement 4.3, 4.4
   */
  async checkBiometricHash(): Promise<boolean> {
    try {
      const storedHash = await storageManager.getItem(STORAGE_KEYS.BIOMETRIC_KEY);
      
      if (!storedHash) {
        // No stored hash means biometrics haven't been set up
        return true;
      }
      
      const currentHash = await this.generateBiometricHash();
      
      return storedHash === currentHash;
    } catch (error) {
      secureLogger.error('Failed to check biometric hash', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // On error, assume hash matches to avoid false positives
      return true;
    }
  }
  
  /**
   * Generate a hash representing current enrolled biometrics
   * This is a simplified implementation - in production, consider using
   * device-specific biometric identifiers if available
   */
  private async generateBiometricHash(): Promise<string> {
    try {
      // Get available authentication types
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Create a simple hash based on available types and enrollment status
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      
      // Combine into a hash string
      const hashData = {
        types: types.sort().join(','),
        enrolled: isEnrolled,
        hardware: hasHardware,
        timestamp: Date.now(),
      };
      
      // Simple hash generation (in production, use a proper hashing library)
      const hashString = JSON.stringify(hashData);
      const hash = this.simpleHash(hashString);
      
      return hash;
    } catch (error) {
      secureLogger.error('Failed to generate biometric hash', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  /**
   * Simple hash function for biometric data
   * Note: This is a basic implementation. In production, use a proper
   * cryptographic hash function like SHA-256
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const biometricManager: BiometricManager = new BiometricManagerImpl();

// Export class for testing
export { BiometricManagerImpl };

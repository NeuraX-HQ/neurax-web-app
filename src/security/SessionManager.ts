/**
 * SessionManager - Session lifecycle management with timeout and auto-lock
 * 
 * Features:
 * - Session creation and validation
 * - Session timeout: 30 days of inactivity
 * - Last activity tracking
 * - Session expiration logic
 * - Complete data cleanup on session end
 * - Auto-lock functionality with configurable timeout
 * - Biometric authentication for unlock
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { storageManager, STORAGE_KEYS } from './StorageManager';
import { secureLogger, SECURITY_EVENTS } from './SecureLogger';
import { biometricManager } from './BiometricManager';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SessionData {
  userId: string;
  email: string;
  loginTime: number;
  lastActivityTime: number;
  biometricHash?: string;
}

export interface SessionConfig {
  sessionTimeout: number;      // 30 days in milliseconds
  autoLockTimeout: number;      // User configurable in milliseconds
  requireBiometricOnLock: boolean;
}

export interface SessionManager {
  createSession(userId: string, email: string, token: string): Promise<void>;
  getSession(): Promise<SessionData | null>;
  updateLastActivity(): Promise<void>;
  validateSession(): Promise<boolean>;
  endSession(): Promise<void>;
  isSessionExpired(): Promise<boolean>;
  isSessionLocked(): Promise<boolean>;
  getTimeSinceLastActivity(): Promise<number>;
  onAppForeground(): Promise<void>;
  onAppBackground(): Promise<void>;
  
  // Auto-lock functionality
  setAutoLockTimeout(minutes: number): Promise<void>;
  getAutoLockTimeout(): Promise<number>;
  checkAutoLock(): Promise<boolean>;
  lockSession(): Promise<void>;
  unlockSession(): Promise<boolean>;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
  autoLockTimeout: 5 * 60 * 1000,            // 5 minutes default
  requireBiometricOnLock: true,
};

// ============================================================================
// SessionManager Implementation
// ============================================================================

class SessionManagerImpl implements SessionManager {
  private config: SessionConfig;
  private sessionCache: SessionData | null = null;
  private isLocked: boolean = false;

  constructor(config: SessionConfig = DEFAULT_SESSION_CONFIG) {
    this.config = config;
  }

  // ==========================================================================
  // Session Lifecycle
  // ==========================================================================

  /**
   * Create a new session
   * Requirement 3.5 - Store login time and last activity time
   */
  async createSession(userId: string, email: string, token: string): Promise<void> {
    try {
      const now = Date.now();
      
      const sessionData: SessionData = {
        userId,
        email,
        loginTime: now,
        lastActivityTime: now,
      };

      // Store session data in standard storage (non-sensitive)
      await storageManager.setItem(
        STORAGE_KEYS.SESSION_INFO,
        JSON.stringify(sessionData)
      );

      // Store auth token in secure storage (sensitive)
      await storageManager.setItem(
        STORAGE_KEYS.AUTH_TOKEN,
        token
      );

      // Update cache
      this.sessionCache = sessionData;
      this.isLocked = false;

      // Log security event
      secureLogger.logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
        userId,
        timestamp: now,
      });

      secureLogger.info('Session created successfully', { userId });
    } catch (error) {
      secureLogger.error('Failed to create session', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(
        `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current session data
   * Requirement 3.5 - Retrieve session information
   */
  async getSession(): Promise<SessionData | null> {
    try {
      // Return cached session if available
      if (this.sessionCache) {
        return this.sessionCache;
      }

      // Retrieve from storage
      const sessionJson = await storageManager.getItem(STORAGE_KEYS.SESSION_INFO);
      
      if (!sessionJson) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      
      // Update cache
      this.sessionCache = sessionData;
      
      return sessionData;
    } catch (error) {
      secureLogger.error('Failed to get session', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Update last activity time
   * Requirement 3.5 - Track last activity time
   */
  async updateLastActivity(): Promise<void> {
    try {
      const session = await this.getSession();
      
      if (!session) {
        secureLogger.warning('Cannot update activity: No active session');
        return;
      }

      const now = Date.now();
      session.lastActivityTime = now;

      // Store updated session
      await storageManager.setItem(
        STORAGE_KEYS.SESSION_INFO,
        JSON.stringify(session)
      );

      // Update cache
      this.sessionCache = session;

      secureLogger.debug('Last activity updated', { timestamp: now });
    } catch (error) {
      secureLogger.error('Failed to update last activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate current session
   * Requirement 3.3 - Check session validity
   */
  async validateSession(): Promise<boolean> {
    try {
      const session = await this.getSession();
      
      if (!session) {
        secureLogger.info('Session validation failed: No session found');
        return false;
      }

      // Check if session is expired
      const expired = await this.isSessionExpired();
      
      if (expired) {
        secureLogger.info('Session validation failed: Session expired');
        await this.endSession();
        return false;
      }

      secureLogger.debug('Session validation successful', {
        userId: session.userId,
      });

      return true;
    } catch (error) {
      secureLogger.error('Session validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * End current session and cleanup all data
   * Requirement 3.2 - Complete data cleanup on session end
   */
  async endSession(): Promise<void> {
    try {
      const session = await this.getSession();
      
      // Remove session data
      await storageManager.removeItem(STORAGE_KEYS.SESSION_INFO);
      
      // Remove auth token
      await storageManager.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // Clear cache
      this.sessionCache = null;
      this.isLocked = false;

      // Log security event
      secureLogger.logSecurityEvent(SECURITY_EVENTS.LOGOUT, {
        userId: session?.userId,
        timestamp: Date.now(),
      });

      secureLogger.info('Session ended and data cleaned up', {
        userId: session?.userId,
      });
    } catch (error) {
      secureLogger.error('Failed to end session', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(
        `Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==========================================================================
  // Session Validation
  // ==========================================================================

  /**
   * Check if session is expired (30 days of inactivity)
   * Requirement 3.1 - Auto-expire session after 30 days
   */
  async isSessionExpired(): Promise<boolean> {
    try {
      const session = await this.getSession();
      
      if (!session) {
        return true;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - session.lastActivityTime;

      const expired = timeSinceLastActivity > this.config.sessionTimeout;

      if (expired) {
        secureLogger.logSecurityEvent(SECURITY_EVENTS.SESSION_EXPIRED, {
          userId: session.userId,
          lastActivity: session.lastActivityTime,
          timeSinceLastActivity,
        });
      }

      return expired;
    } catch (error) {
      secureLogger.error('Failed to check session expiration', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return true; // Assume expired on error
    }
  }

  /**
   * Check if session is locked
   */
  async isSessionLocked(): Promise<boolean> {
    return this.isLocked;
  }

  /**
   * Get time since last activity in milliseconds
   */
  async getTimeSinceLastActivity(): Promise<number> {
    try {
      const session = await this.getSession();
      
      if (!session) {
        return Infinity;
      }

      const now = Date.now();
      return now - session.lastActivityTime;
    } catch (error) {
      secureLogger.error('Failed to get time since last activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return Infinity;
    }
  }

  // ==========================================================================
  // App Lifecycle Handlers
  // ==========================================================================

  /**
   * Handle app foreground event
   * Requirement 3.3 - Validate session when app is opened
   * Requirement 3.4 - Check auto-lock on foreground
   */
  async onAppForeground(): Promise<void> {
    try {
      secureLogger.debug('App foreground: Validating session');

      // Validate session
      const isValid = await this.validateSession();

      if (!isValid) {
        secureLogger.info('Session invalid on app foreground');
        return;
      }

      // Check if auto-lock should be triggered
      // Requirement 9.2 - Lock session after inactivity timeout
      const shouldLock = await this.checkAutoLock();
      
      if (shouldLock) {
        await this.lockSession();
        secureLogger.info('Session locked due to inactivity on app foreground');
        return;
      }

      // Update last activity
      await this.updateLastActivity();

      secureLogger.debug('App foreground: Session validated and activity updated');
    } catch (error) {
      secureLogger.error('Error handling app foreground', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle app background event
   * Requirement 3.4 - Track background time for auto-lock
   */
  async onAppBackground(): Promise<void> {
    try {
      secureLogger.debug('App background: Saving session state');

      // Update last activity before going to background
      await this.updateLastActivity();

      secureLogger.debug('App background: Session state saved');
    } catch (error) {
      secureLogger.error('Error handling app background', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ==========================================================================
  // Auto-Lock Functionality
  // ==========================================================================

  /**
   * Set auto-lock timeout in minutes
   * Requirement 9.1 - Configurable auto-lock timeout (1, 5, 15, 30 minutes)
   */
  async setAutoLockTimeout(minutes: number): Promise<void> {
    try {
      // Validate timeout value
      const validTimeouts = [1, 5, 15, 30];
      if (!validTimeouts.includes(minutes)) {
        throw new Error(`Invalid auto-lock timeout. Must be one of: ${validTimeouts.join(', ')}`);
      }

      const timeoutMs = minutes * 60 * 1000;
      
      // Update config
      this.config.autoLockTimeout = timeoutMs;
      
      // Store in storage
      await storageManager.setItem(
        STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
        minutes.toString()
      );

      secureLogger.info('Auto-lock timeout updated', { minutes });
    } catch (error) {
      secureLogger.error('Failed to set auto-lock timeout', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get current auto-lock timeout in minutes
   * Requirement 9.1 - Retrieve auto-lock configuration
   */
  async getAutoLockTimeout(): Promise<number> {
    try {
      const timeoutStr = await storageManager.getItem(STORAGE_KEYS.AUTO_LOCK_TIMEOUT);
      
      if (!timeoutStr) {
        // Return default (5 minutes)
        return 5;
      }

      const minutes = parseInt(timeoutStr, 10);
      return isNaN(minutes) ? 5 : minutes;
    } catch (error) {
      secureLogger.error('Failed to get auto-lock timeout', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 5; // Return default on error
    }
  }

  /**
   * Check if session should be auto-locked based on inactivity
   * Requirement 9.2 - Detect inactivity and determine if lock is needed
   * Returns true if session should be locked
   */
  async checkAutoLock(): Promise<boolean> {
    try {
      // Check if session exists
      const session = await this.getSession();
      if (!session) {
        return false;
      }

      // Check if already locked
      if (this.isLocked) {
        return false;
      }

      // Get time since last activity
      const timeSinceLastActivity = await this.getTimeSinceLastActivity();

      // Get auto-lock timeout
      const autoLockTimeoutMinutes = await this.getAutoLockTimeout();
      const autoLockTimeoutMs = autoLockTimeoutMinutes * 60 * 1000;

      // Check if timeout exceeded
      const shouldLock = timeSinceLastActivity >= autoLockTimeoutMs;

      if (shouldLock) {
        secureLogger.debug('Auto-lock check: Should lock', {
          timeSinceLastActivity,
          autoLockTimeout: autoLockTimeoutMs,
        });
      }

      return shouldLock;
    } catch (error) {
      secureLogger.error('Failed to check auto-lock', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Lock the current session
   * Requirement 9.2 - Lock session when inactivity timeout is exceeded
   * Requirement 9.3 - Require re-authentication to unlock
   */
  async lockSession(): Promise<void> {
    try {
      const session = await this.getSession();
      
      if (!session) {
        secureLogger.warning('Cannot lock session: No active session');
        return;
      }

      // Set locked state
      this.isLocked = true;

      // Log security event
      secureLogger.logSecurityEvent(SECURITY_EVENTS.AUTO_LOCK_TRIGGERED, {
        userId: session.userId,
        timestamp: Date.now(),
      });

      secureLogger.info('Session locked', { userId: session.userId });
    } catch (error) {
      secureLogger.error('Failed to lock session', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Unlock the session using biometric or credential authentication
   * Requirement 9.3 - Require biometric or credential authentication to unlock
   * Requirement 9.4 - Reset auto-lock timer on successful unlock
   * Requirement 9.5 - Fallback to credentials if biometric unavailable
   * Returns true if unlock was successful
   */
  async unlockSession(): Promise<boolean> {
    try {
      // Check if session exists
      const session = await this.getSession();
      if (!session) {
        secureLogger.warning('Cannot unlock session: No active session');
        return false;
      }

      // Check if session is locked
      if (!this.isLocked) {
        secureLogger.debug('Session is not locked');
        return true;
      }

      // Try biometric authentication if available and enabled
      const biometricStatus = await biometricManager.checkBiometricStatus();
      
      let authSuccess = false;

      if (biometricStatus.isSupported && biometricStatus.isEnrolled && 
          biometricStatus.isEnabled && !biometricStatus.hasChanged) {
        // Requirement 9.3, 9.5 - Use biometric if available
        authSuccess = await biometricManager.authenticate('Unlock to continue');
        
        if (authSuccess) {
          secureLogger.info('Session unlocked with biometric authentication');
        }
      } else {
        // Requirement 9.5 - Fallback to credentials
        // Note: Actual credential authentication should be handled by the caller
        // This method returns false to indicate credential authentication is needed
        secureLogger.info('Biometric unavailable, credential authentication required');
        return false;
      }

      if (authSuccess) {
        // Unlock session
        this.isLocked = false;

        // Requirement 9.4 - Reset auto-lock timer by updating last activity
        await this.updateLastActivity();

        // Log security event
        secureLogger.logSecurityEvent(SECURITY_EVENTS.SESSION_UNLOCKED, {
          userId: session.userId,
          timestamp: Date.now(),
        });

        return true;
      }

      return false;
    } catch (error) {
      secureLogger.error('Failed to unlock session', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const sessionManager: SessionManager = new SessionManagerImpl();

// Export class for testing
export { SessionManagerImpl };

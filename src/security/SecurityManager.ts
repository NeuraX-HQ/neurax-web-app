/**
 * SecurityManager - Unified security facade for the application
 * 
 * This module provides a centralized interface for all security operations,
 * coordinating between StorageManager, SessionManager, BiometricManager,
 * InputValidator, ScreenProtection, ErrorHandler, and SecureLogger.
 * 
 * Features:
 * - Module initialization and coordination
 * - High-level authentication operations (login, logout, checkAuth)
 * - App lifecycle management (foreground/background)
 * - Unified access to all security modules
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { storageManager, StorageManager } from './StorageManager';
import { sessionManager, SessionManager } from './SessionManager';
import { biometricManager, BiometricManager } from './BiometricManager';
import { InputValidator } from './InputValidator';
import { screenProtection, ScreenProtection } from './ScreenProtection';
import { errorHandler, ErrorHandler } from './ErrorHandler';
import { secureLogger, SecureLogger } from './SecureLogger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SecurityManager {
  // Initialization
  initialize(): Promise<void>;
  
  // Module access
  storage: StorageManager;
  session: SessionManager;
  biometric: BiometricManager;
  validator: typeof InputValidator;
  screenProtection: ScreenProtection;
  errorHandler: ErrorHandler;
  logger: SecureLogger;
  
  // High-level operations
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  checkAuth(): Promise<boolean>;
  
  // App lifecycle
  onAppForeground(): Promise<void>;
  onAppBackground(): Promise<void>;
}

// ============================================================================
// SecurityManager Implementation
// ============================================================================

class SecurityManagerImpl implements SecurityManager {
  // Module instances
  public readonly storage: StorageManager;
  public readonly session: SessionManager;
  public readonly biometric: BiometricManager;
  public readonly validator: typeof InputValidator;
  public readonly screenProtection: ScreenProtection;
  public readonly errorHandler: ErrorHandler;
  public readonly logger: SecureLogger;
  
  private isInitialized: boolean = false;

  constructor() {
    // Initialize module references
    this.storage = storageManager;
    this.session = sessionManager;
    this.biometric = biometricManager;
    this.validator = InputValidator;
    this.screenProtection = screenProtection;
    this.errorHandler = errorHandler;
    this.logger = secureLogger;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize all security modules
   * Requirement 1.1, 1.2, 1.3, 1.4, 1.5
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        this.logger.warning('SecurityManager already initialized');
        return;
      }

      this.logger.info('Initializing SecurityManager...');

      // Check if running in production mode
      const isProduction = this.logger.isProductionMode();
      
      if (isProduction) {
        // Disable console.log in production
        this.logger.disableAllConsoleLogs();
        this.logger.info('Production mode: Console logs disabled');
      }

      // Initialize screen protection for sensitive screens
      this.logger.debug('Setting up screen protection...');
      // Screen protection is already initialized with default protected screens
      
      // Log initialization complete
      this.isInitialized = true;
      this.logger.info('SecurityManager initialized successfully', {
        production: isProduction,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error('Failed to initialize SecurityManager', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(
        `SecurityManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==========================================================================
  // High-Level Operations
  // ==========================================================================

  /**
   * Login user with email and password
   * Requirement 1.1, 1.2, 1.3
   * 
   * This method:
   * 1. Validates input
   * 2. Authenticates user (placeholder - actual auth logic should be implemented)
   * 3. Creates session
   * 4. Stores biometric hash if biometric is enabled
   */
  async login(email: string, password: string): Promise<void> {
    try {
      this.logger.info('Login attempt started');

      // Validate email
      const emailValidation = this.validator.validateEmail(email);
      if (!emailValidation.isValid) {
        const error = new Error(emailValidation.errors.join(', '));
        const errorInfo = this.errorHandler.handleValidationError(error);
        throw new Error(this.errorHandler.getUserMessage(errorInfo));
      }

      // Validate password
      const passwordValidation = this.validator.validatePassword(password);
      if (!passwordValidation.isValid) {
        const error = new Error(passwordValidation.errors.join(', '));
        const errorInfo = this.errorHandler.handleValidationError(error);
        throw new Error(this.errorHandler.getUserMessage(errorInfo));
      }

      // TODO: Actual authentication logic should be implemented here
      // For now, we'll create a mock successful authentication
      // In production, this would call an API or local authentication service
      
      // Mock user data (replace with actual authentication)
      const userId = 'user_' + Date.now();
      const authToken = 'token_' + Math.random().toString(36).substring(7);

      // Create session
      await this.session.createSession(userId, email, authToken);

      // Check if biometric is available and enabled
      const biometricStatus = await this.biometric.checkBiometricStatus();
      if (biometricStatus.isSupported && biometricStatus.isEnrolled && biometricStatus.isEnabled) {
        // Store biometric hash for change detection
        await this.biometric.storeBiometricHash();
        this.logger.info('Biometric hash stored for change detection');
      }

      this.logger.info('Login successful', { userId });
    } catch (error) {
      this.logger.error('Login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Handle and rethrow with user-friendly message
      if (error instanceof Error) {
        const errorInfo = this.errorHandler.handleAuthError(error);
        throw new Error(this.errorHandler.getUserMessage(errorInfo));
      }
      
      throw error;
    }
  }

  /**
   * Logout user and cleanup all session data
   * Requirement 1.1, 1.2, 1.3
   */
  async logout(): Promise<void> {
    try {
      this.logger.info('Logout started');

      // End session (this will cleanup all auth data)
      await this.session.endSession();

      // Reset biometric failed attempts
      await this.biometric.resetFailedAttempts();

      this.logger.info('Logout successful');
    } catch (error) {
      this.logger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Handle error but don't throw - logout should always succeed
      const errorInfo = this.errorHandler.handleAuthError(
        error instanceof Error ? error : new Error('Logout failed')
      );
      this.logger.warning('Logout completed with errors', {
        userMessage: this.errorHandler.getUserMessage(errorInfo),
      });
    }
  }

  /**
   * Check if user is authenticated
   * Requirement 1.1, 1.2, 1.3
   * 
   * Returns true if:
   * - Session exists and is valid
   * - Session is not expired
   * - Session is not locked (or can be unlocked)
   */
  async checkAuth(): Promise<boolean> {
    try {
      this.logger.debug('Checking authentication status');

      // Validate session
      const isValid = await this.session.validateSession();
      
      if (!isValid) {
        this.logger.info('Authentication check failed: Invalid session');
        return false;
      }

      // Check if session is locked
      const isLocked = await this.session.isSessionLocked();
      
      if (isLocked) {
        this.logger.info('Authentication check: Session is locked');
        // Session is locked but valid - caller should handle unlock
        return false;
      }

      this.logger.debug('Authentication check passed');
      return true;
    } catch (error) {
      this.logger.error('Authentication check error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // ==========================================================================
  // App Lifecycle Handlers
  // ==========================================================================

  /**
   * Handle app coming to foreground
   * Requirement 1.4, 1.5
   * 
   * This method:
   * 1. Validates session
   * 2. Checks for auto-lock
   * 3. Checks for biometric changes
   * 4. Updates screen protection
   */
  async onAppForeground(): Promise<void> {
    try {
      this.logger.debug('App foreground event');

      // Delegate to session manager for session validation and auto-lock check
      await this.session.onAppForeground();

      // Check if biometric has changed
      const session = await this.session.getSession();
      if (session) {
        const biometricStatus = await this.biometric.checkBiometricStatus();
        
        if (biometricStatus.hasChanged) {
          this.logger.warning('Biometric changed detected, session may require re-authentication');
          // Note: Actual re-authentication should be handled by the UI layer
        }
      }

      // Update screen protection
      this.screenProtection.onAppForeground();

      this.logger.debug('App foreground handling complete');
    } catch (error) {
      this.logger.error('Error handling app foreground', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Don't throw - app lifecycle should continue
      const errorInfo = this.errorHandler.handleError(
        error instanceof Error ? error : new Error('App foreground error')
      );
      this.logger.warning('App foreground completed with errors', {
        userMessage: this.errorHandler.getUserMessage(errorInfo),
      });
    }
  }

  /**
   * Handle app going to background
   * Requirement 1.4, 1.5
   * 
   * This method:
   * 1. Updates last activity time
   * 2. Activates screen protection (splash screen)
   * 3. Clears sensitive data from memory (if needed)
   */
  async onAppBackground(): Promise<void> {
    try {
      this.logger.debug('App background event');

      // Delegate to session manager to update last activity
      await this.session.onAppBackground();

      // Activate screen protection (splash screen overlay)
      this.screenProtection.onAppBackground();

      // Note: Memory cleanup for sensitive data should be handled by
      // individual components/screens as they unmount

      this.logger.debug('App background handling complete');
    } catch (error) {
      this.logger.error('Error handling app background', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Don't throw - app lifecycle should continue
      const errorInfo = this.errorHandler.handleError(
        error instanceof Error ? error : new Error('App background error')
      );
      this.logger.warning('App background completed with errors', {
        userMessage: this.errorHandler.getUserMessage(errorInfo),
      });
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const securityManager: SecurityManager = new SecurityManagerImpl();

// Export class for testing
export { SecurityManagerImpl };

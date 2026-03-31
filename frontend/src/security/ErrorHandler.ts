/**
 * ErrorHandler - Secure error handling with generic user messages
 * 
 * Features:
 * - Secure error handling that doesn't leak system information
 * - Generic user-facing error messages
 * - Detailed error logging via SecureLogger
 * - Error categorization (auth, network, validation, storage)
 * - Error severity levels
 */

import { secureLogger } from './SecureLogger';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  screen?: string;
  action?: string;
  timestamp: number;
  [key: string]: any;
}

export interface ErrorInfo {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
}

export interface ErrorHandler {
  handleError(error: Error, context?: ErrorContext): ErrorInfo;
  handleAuthError(error: Error, context?: ErrorContext): ErrorInfo;
  handleNetworkError(error: Error, context?: ErrorContext): ErrorInfo;
  handleValidationError(error: Error, context?: ErrorContext): ErrorInfo;
  getUserMessage(errorInfo: ErrorInfo): string;
  logError(errorInfo: ErrorInfo): void;
}

// Generic error messages for users
export const USER_ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  BIOMETRIC_FAILED: 'Biometric authentication failed. Please try again.',
  STORAGE_ERROR: 'Failed to save data. Please try again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again later.',
} as const;

// Error codes for logging
export const ERROR_CODES = {
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Session expired',
  AUTH_003: 'Biometric authentication failed',
  AUTH_004: 'Biometric lockout',
  AUTH_005: 'Biometric changed',
  STORAGE_001: 'Failed to save data',
  STORAGE_002: 'Failed to retrieve data',
  STORAGE_003: 'Failed to delete data',
  VALIDATION_001: 'Invalid input format',
  VALIDATION_002: 'Input too long',
  VALIDATION_003: 'Dangerous characters detected',
  NETWORK_001: 'Request timeout',
  NETWORK_002: 'Connection failed',
  NETWORK_003: 'Server error',
  UNKNOWN_001: 'Unhandled error',
} as const;

// Error code to user message mapping
const ERROR_CODE_TO_MESSAGE: Record<string, string> = {
  AUTH_001: USER_ERROR_MESSAGES.AUTH_FAILED,
  AUTH_002: USER_ERROR_MESSAGES.SESSION_EXPIRED,
  AUTH_003: USER_ERROR_MESSAGES.BIOMETRIC_FAILED,
  AUTH_004: USER_ERROR_MESSAGES.BIOMETRIC_FAILED,
  AUTH_005: USER_ERROR_MESSAGES.AUTH_FAILED,
  STORAGE_001: USER_ERROR_MESSAGES.STORAGE_ERROR,
  STORAGE_002: USER_ERROR_MESSAGES.STORAGE_ERROR,
  STORAGE_003: USER_ERROR_MESSAGES.STORAGE_ERROR,
  VALIDATION_001: USER_ERROR_MESSAGES.VALIDATION_ERROR,
  VALIDATION_002: USER_ERROR_MESSAGES.VALIDATION_ERROR,
  VALIDATION_003: USER_ERROR_MESSAGES.VALIDATION_ERROR,
  NETWORK_001: USER_ERROR_MESSAGES.NETWORK_ERROR,
  NETWORK_002: USER_ERROR_MESSAGES.NETWORK_ERROR,
  NETWORK_003: USER_ERROR_MESSAGES.NETWORK_ERROR,
  UNKNOWN_001: USER_ERROR_MESSAGES.UNKNOWN_ERROR,
};

// Error code to severity mapping
const ERROR_CODE_TO_SEVERITY: Record<string, ErrorSeverity> = {
  AUTH_001: ErrorSeverity.MEDIUM,
  AUTH_002: ErrorSeverity.MEDIUM,
  AUTH_003: ErrorSeverity.LOW,
  AUTH_004: ErrorSeverity.MEDIUM,
  AUTH_005: ErrorSeverity.HIGH,
  STORAGE_001: ErrorSeverity.MEDIUM,
  STORAGE_002: ErrorSeverity.MEDIUM,
  STORAGE_003: ErrorSeverity.MEDIUM,
  VALIDATION_001: ErrorSeverity.LOW,
  VALIDATION_002: ErrorSeverity.LOW,
  VALIDATION_003: ErrorSeverity.MEDIUM,
  NETWORK_001: ErrorSeverity.LOW,
  NETWORK_002: ErrorSeverity.MEDIUM,
  NETWORK_003: ErrorSeverity.MEDIUM,
  UNKNOWN_001: ErrorSeverity.MEDIUM,
};

class ErrorHandlerImpl implements ErrorHandler {
  /**
   * Handle generic error
   */
  handleError(error: Error, context?: ErrorContext): ErrorInfo {
    const errorCode = this.determineErrorCode(error);
    const severity = ERROR_CODE_TO_SEVERITY[errorCode] || ErrorSeverity.MEDIUM;
    
    const errorInfo: ErrorInfo = {
      code: errorCode,
      message: error.message,
      severity,
      context: {
        ...context,
        timestamp: context?.timestamp || Date.now(),
      },
    };

    this.logError(errorInfo);
    return errorInfo;
  }

  /**
   * Handle authentication error
   */
  handleAuthError(error: Error, context?: ErrorContext): ErrorInfo {
    const errorCode = this.determineAuthErrorCode(error);
    const severity = ERROR_CODE_TO_SEVERITY[errorCode] || ErrorSeverity.MEDIUM;
    
    const errorInfo: ErrorInfo = {
      code: errorCode,
      message: error.message,
      severity,
      context: {
        ...context,
        timestamp: context?.timestamp || Date.now(),
        errorType: 'authentication',
      },
    };

    this.logError(errorInfo);
    return errorInfo;
  }

  /**
   * Handle network error
   */
  handleNetworkError(error: Error, context?: ErrorContext): ErrorInfo {
    const errorCode = this.determineNetworkErrorCode(error);
    const severity = ERROR_CODE_TO_SEVERITY[errorCode] || ErrorSeverity.MEDIUM;
    
    const errorInfo: ErrorInfo = {
      code: errorCode,
      message: error.message,
      severity,
      context: {
        ...context,
        timestamp: context?.timestamp || Date.now(),
        errorType: 'network',
      },
    };

    this.logError(errorInfo);
    return errorInfo;
  }

  /**
   * Handle validation error
   */
  handleValidationError(error: Error, context?: ErrorContext): ErrorInfo {
    const errorCode = this.determineValidationErrorCode(error);
    const severity = ERROR_CODE_TO_SEVERITY[errorCode] || ErrorSeverity.LOW;
    
    const errorInfo: ErrorInfo = {
      code: errorCode,
      message: error.message,
      severity,
      context: {
        ...context,
        timestamp: context?.timestamp || Date.now(),
        errorType: 'validation',
      },
    };

    this.logError(errorInfo);
    return errorInfo;
  }

  /**
   * Get user-friendly message from error info
   */
  getUserMessage(errorInfo: ErrorInfo): string {
    return ERROR_CODE_TO_MESSAGE[errorInfo.code] || USER_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Log error with detailed information
   */
  logError(errorInfo: ErrorInfo): void {
    const logContext = {
      code: errorInfo.code,
      severity: errorInfo.severity,
      ...errorInfo.context,
    };

    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        secureLogger.error(`Error: ${errorInfo.message}`, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        secureLogger.warning(`Error: ${errorInfo.message}`, logContext);
        break;
      case ErrorSeverity.LOW:
        secureLogger.info(`Error: ${errorInfo.message}`, logContext);
        break;
    }
  }

  /**
   * Determine error code from generic error
   */
  private determineErrorCode(error: Error): string {
    const message = error.message.toLowerCase();

    // Check for auth errors
    if (message.includes('auth') || message.includes('credential') || message.includes('login')) {
      return this.determineAuthErrorCode(error);
    }

    // Check for network errors
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return this.determineNetworkErrorCode(error);
    }

    // Check for validation errors
    if (message.includes('invalid') || message.includes('validation') || message.includes('format')) {
      return this.determineValidationErrorCode(error);
    }

    // Check for storage errors
    if (message.includes('storage') || message.includes('save') || message.includes('retrieve')) {
      return this.determineStorageErrorCode(error);
    }

    return 'UNKNOWN_001';
  }

  /**
   * Determine auth error code
   */
  private determineAuthErrorCode(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('session') && message.includes('expired')) {
      return 'AUTH_002';
    }

    if (message.includes('biometric') && message.includes('lockout')) {
      return 'AUTH_004';
    }

    if (message.includes('biometric') && message.includes('changed')) {
      return 'AUTH_005';
    }

    if (message.includes('biometric')) {
      return 'AUTH_003';
    }

    if (message.includes('invalid') || message.includes('credential')) {
      return 'AUTH_001';
    }

    return 'AUTH_001';
  }

  /**
   * Determine network error code
   */
  private determineNetworkErrorCode(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) {
      return 'NETWORK_001';
    }

    if (message.includes('connection') || message.includes('failed')) {
      return 'NETWORK_002';
    }

    if (message.includes('server') || message.includes('500') || message.includes('503')) {
      return 'NETWORK_003';
    }

    return 'NETWORK_002';
  }

  /**
   * Determine validation error code
   */
  private determineValidationErrorCode(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('too long') || message.includes('length')) {
      return 'VALIDATION_002';
    }

    if (message.includes('dangerous') || message.includes('invalid character')) {
      return 'VALIDATION_003';
    }

    if (message.includes('invalid') || message.includes('format')) {
      return 'VALIDATION_001';
    }

    return 'VALIDATION_001';
  }

  /**
   * Determine storage error code
   */
  private determineStorageErrorCode(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('save') || message.includes('write')) {
      return 'STORAGE_001';
    }

    if (message.includes('retrieve') || message.includes('read') || message.includes('get')) {
      return 'STORAGE_002';
    }

    if (message.includes('delete') || message.includes('remove')) {
      return 'STORAGE_003';
    }

    return 'STORAGE_001';
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerImpl();

// Export class for testing
export { ErrorHandlerImpl };

/**
 * SecureLogger - Secure logging system with sensitive data redaction
 * 
 * Features:
 * - Log levels: DEBUG, INFO, WARNING, ERROR
 * - Auto-redact sensitive patterns (tokens, passwords, emails, credit cards, SSN)
 * - Security event logging (login, logout, biometric events)
 * - Production mode detection to disable console.log
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
}

export interface SecureLogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warning(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  logSecurityEvent(event: string, context?: Record<string, any>): void;
  logAuthEvent(event: string, userId?: string, success?: boolean): void;
  setLogLevel(level: LogLevel): void;
  enableConsoleOutput(enabled: boolean): void;
  redactSensitiveData(data: any): any;
  isProductionMode(): boolean;
  disableAllConsoleLogs(): void;
}

// Sensitive data patterns to redact
export const SENSITIVE_PATTERNS = {
  TOKEN: /token["\s:]+([a-zA-Z0-9._-]+)/gi,
  PASSWORD: /password["\s:]+([^\s,"]+)/gi,
  EMAIL: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  CREDIT_CARD: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
};

// Security events to log
export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  BIOMETRIC_DISABLED: 'biometric_disabled',
  BIOMETRIC_AUTH_SUCCESS: 'biometric_auth_success',
  BIOMETRIC_AUTH_FAILED: 'biometric_auth_failed',
  BIOMETRIC_LOCKOUT: 'biometric_lockout',
  BIOMETRIC_CHANGED: 'biometric_changed',
  AUTO_LOCK_TRIGGERED: 'auto_lock_triggered',
  SESSION_UNLOCKED: 'session_unlocked',
  DATA_CLEARED: 'data_cleared',
} as const;

// Log level hierarchy for filtering
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARNING]: 2,
  [LogLevel.ERROR]: 3,
};

class SecureLoggerImpl implements SecureLogger {
  private currentLogLevel: LogLevel = LogLevel.INFO;
  private consoleOutputEnabled: boolean = true;
  private productionMode: boolean = false;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 100;

  constructor() {
    // Detect production mode
    this.productionMode = this.isProductionMode();
    
    // In production, disable console output by default
    if (this.productionMode) {
      this.consoleOutputEnabled = false;
    }
  }

  /**
   * Check if running in production mode
   */
  isProductionMode(): boolean {
    // Check if __DEV__ is defined (React Native)
    if (typeof __DEV__ !== 'undefined') {
      return !__DEV__;
    }
    
    // Check NODE_ENV
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production';
    }
    
    // Default to false (development)
    return false;
  }

  /**
   * Disable all console.log statements
   */
  disableAllConsoleLogs(): void {
    if (typeof console !== 'undefined') {
      const noop = () => {};
      console.log = noop;
      console.debug = noop;
      console.info = noop;
      console.warn = noop;
      // Keep console.error for critical issues
    }
  }

  /**
   * Set the minimum log level to output
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Enable or disable console output
   */
  enableConsoleOutput(enabled: boolean): void {
    this.consoleOutputEnabled = enabled;
  }

  /**
   * Redact sensitive data from any value
   */
  redactSensitiveData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle strings
    if (typeof data === 'string') {
      return this.redactString(data);
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    // Handle objects
    if (typeof data === 'object') {
      const redacted: Record<string, any> = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // Redact keys that might contain sensitive data
          if (this.isSensitiveKey(key)) {
            redacted[key] = '[REDACTED]';
          } else {
            redacted[key] = this.redactSensitiveData(data[key]);
          }
        }
      }
      return redacted;
    }

    // Return primitives as-is
    return data;
  }

  /**
   * Check if a key name indicates sensitive data
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeywords = [
      'token',
      'password',
      'secret',
      'key',
      'auth',
      'credential',
      'ssn',
      'social',
      'card',
      'cvv',
      'pin',
    ];
    
    const lowerKey = key.toLowerCase();
    return sensitiveKeywords.some(keyword => lowerKey.includes(keyword));
  }

  /**
   * Redact sensitive patterns from a string
   */
  private redactString(str: string): string {
    let redacted = str;

    // Redact tokens
    redacted = redacted.replace(SENSITIVE_PATTERNS.TOKEN, 'token: [REDACTED]');
    
    // Redact passwords
    redacted = redacted.replace(SENSITIVE_PATTERNS.PASSWORD, 'password: [REDACTED]');
    
    // Redact emails
    redacted = redacted.replace(SENSITIVE_PATTERNS.EMAIL, '[REDACTED_EMAIL]');
    
    // Redact credit cards
    redacted = redacted.replace(SENSITIVE_PATTERNS.CREDIT_CARD, '[REDACTED_CARD]');
    
    // Redact SSN
    redacted = redacted.replace(SENSITIVE_PATTERNS.SSN, '[REDACTED_SSN]');

    return redacted;
  }

  /**
   * Create a log entry
   */
  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message: this.redactString(message),
      timestamp: Date.now(),
      context: context ? this.redactSensitiveData(context) : undefined,
    };
  }

  /**
   * Write log entry to output
   */
  private writeLog(entry: LogEntry): void {
    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Check if this log level should be output
    if (LOG_LEVEL_PRIORITY[entry.level] < LOG_LEVEL_PRIORITY[this.currentLogLevel]) {
      return;
    }

    // Output to console if enabled
    if (this.consoleOutputEnabled && !this.productionMode) {
      const timestamp = new Date(entry.timestamp).toISOString();
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const logMessage = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(logMessage);
          break;
        case LogLevel.INFO:
          console.info(logMessage);
          break;
        case LogLevel.WARNING:
          console.warn(logMessage);
          break;
        case LogLevel.ERROR:
          console.error(logMessage);
          break;
      }
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }

  /**
   * Log warning message
   */
  warning(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARNING, message, context);
    this.writeLog(entry);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context);
    this.writeLog(entry);
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, context?: Record<string, any>): void {
    this.info(`Security Event: ${event}`, {
      ...context,
      eventType: 'security',
      event,
    });
  }

  /**
   * Log authentication event
   */
  logAuthEvent(event: string, userId?: string, success?: boolean): void {
    this.info(`Auth Event: ${event}`, {
      eventType: 'authentication',
      event,
      userId: userId ? this.redactString(userId) : undefined,
      success,
    });
  }

  /**
   * Get log history (for debugging)
   */
  getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearLogHistory(): void {
    this.logHistory = [];
  }
}

// Export singleton instance
export const secureLogger = new SecureLoggerImpl();

// Export class for testing
export { SecureLoggerImpl };

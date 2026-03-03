/**
 * Security Module Exports
 * 
 * Central export point for all security-related modules
 */

export { SecureLogger, secureLogger, LogLevel, SENSITIVE_PATTERNS, SECURITY_EVENTS } from './SecureLogger';
export type { LogEntry } from './SecureLogger';

export { StorageManager, storageManager, StorageType, STORAGE_KEYS } from './StorageManager';
export type { StorageConfig } from './StorageManager';

export { BiometricManager, biometricManager, DEFAULT_BIOMETRIC_CONFIG } from './BiometricManager';
export type { BiometricStatus, BiometricConfig } from './BiometricManager';

export { SessionManager, sessionManager, DEFAULT_SESSION_CONFIG } from './SessionManager';
export type { SessionData, SessionConfig } from './SessionManager';

export { InputValidator, inputValidator, VALIDATION_RULES, DANGEROUS_PATTERNS } from './InputValidator';
export type { ValidationRule, ValidationResult } from './InputValidator';

export { ErrorHandler, errorHandler, ErrorSeverity, USER_ERROR_MESSAGES, ERROR_CODES } from './ErrorHandler';
export type { ErrorContext, ErrorInfo } from './ErrorHandler';

export { SecurityErrorBoundary } from './SecurityErrorBoundary';

export { screenProtection, DEFAULT_SCREEN_PROTECTION, PROTECTED_SCREENS, PUBLIC_SCREENS } from './ScreenProtection';
export type { ScreenProtectionConfig, ScreenProtection } from './ScreenProtection';

export { SecurityManager, securityManager } from './SecurityManager';
export type { SecurityManager as ISecurityManager } from './SecurityManager';

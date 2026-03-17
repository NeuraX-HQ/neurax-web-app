/**
 * InputValidator Module
 * 
 * Provides comprehensive input validation and sanitization to prevent
 * XSS attacks, SQL injection, and other security vulnerabilities.
 * 
 * Features:
 * - Validation rules for common inputs (email, password, numeric)
 * - Sanitization to remove dangerous characters
 * - XSS and SQL injection pattern detection
 * - User-friendly error messages
 * - Length limit checking
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => boolean;
  errorMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Dangerous patterns to detect in user input
 */
export const DANGEROUS_PATTERNS = {
  SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  XSS_PATTERNS: /[<>\"']/g,
  NULL_BYTE: /\0/g,
} as const;

/**
 * Common validation rules for standard inputs
 */
export const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
    errorMessage: 'Invalid email format',
  },
  PASSWORD: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    errorMessage: 'Password must be 8+ characters with uppercase, lowercase, and number',
  },
  NAME: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    errorMessage: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  },
} as const;

// ============================================================================
// InputValidator Implementation
// ============================================================================

class InputValidatorImpl {
  /**
   * Validate a value against an array of validation rules
   */
  validate(value: string, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    
    for (const rule of rules) {
      // Check required
      if (rule.required && (!value || value.trim().length === 0)) {
        errors.push(rule.errorMessage || 'This field is required');
        continue;
      }
      
      // Skip other validations if value is empty and not required
      if (!value || value.trim().length === 0) {
        continue;
      }
      
      // Check min length
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(rule.errorMessage || `Minimum length is ${rule.minLength} characters`);
      }
      
      // Check max length
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(rule.errorMessage || `Maximum length is ${rule.maxLength} characters`);
      }
      
      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.errorMessage || 'Invalid format');
      }
      
      // Check custom validator
      if (rule.customValidator && !rule.customValidator(value)) {
        errors.push(rule.errorMessage || 'Validation failed');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? this.sanitize(value) : undefined,
    };
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || email.trim().length === 0) {
      errors.push('Email is required');
      return { isValid: false, errors };
    }
    
    if (email.length > VALIDATION_RULES.EMAIL.maxLength) {
      errors.push(`Email must be less than ${VALIDATION_RULES.EMAIL.maxLength} characters`);
    }
    
    if (!VALIDATION_RULES.EMAIL.pattern.test(email)) {
      errors.push(VALIDATION_RULES.EMAIL.errorMessage);
    }
    
    // Check for dangerous characters
    if (this.containsDangerousChars(email)) {
      errors.push('Email contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? this.sanitize(email) : undefined,
    };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password || password.length === 0) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }
    
    if (password.length < VALIDATION_RULES.PASSWORD.minLength) {
      errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD.minLength} characters`);
    }
    
    if (password.length > VALIDATION_RULES.PASSWORD.maxLength) {
      errors.push(`Password must be less than ${VALIDATION_RULES.PASSWORD.maxLength} characters`);
    }
    
    if (!VALIDATION_RULES.PASSWORD.pattern.test(password)) {
      errors.push(VALIDATION_RULES.PASSWORD.errorMessage);
    }
    
    // Check for null bytes
    if (DANGEROUS_PATTERNS.NULL_BYTE.test(password)) {
      errors.push('Password contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      // Note: We don't sanitize passwords as they should be used as-is
      sanitizedValue: errors.length === 0 ? password : undefined,
    };
  }

  /**
   * Validate numeric input with optional min/max range
   */
  validateNumeric(value: string, min?: number, max?: number): ValidationResult {
    const errors: string[] = [];
    
    if (!value || value.trim().length === 0) {
      errors.push('Value is required');
      return { isValid: false, errors };
    }
    
    // Check if it's a valid number
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push('Value must be a valid number');
      return { isValid: false, errors };
    }
    
    // Check min value
    if (min !== undefined && numValue < min) {
      errors.push(`Value must be at least ${min}`);
    }
    
    // Check max value
    if (max !== undefined && numValue > max) {
      errors.push(`Value must be at most ${max}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? value.trim() : undefined,
    };
  }

  /**
   * Sanitize input by removing dangerous characters
   */
  sanitize(value: string): string {
    if (!value) return '';
    
    let sanitized = value;
    
    // Remove null bytes
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.NULL_BYTE, '');
    
    // Remove script tags
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.SCRIPT_TAG, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }

  /**
   * Sanitize HTML by escaping dangerous characters
   */
  sanitizeHTML(value: string): string {
    if (!value) return '';
    
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Remove special characters, keeping only allowed ones
   */
  removeSpecialChars(value: string, allowed: string[] = []): string {
    if (!value) return '';
    
    // Create a regex pattern for allowed characters
    // Default: alphanumeric, spaces, and common punctuation
    const allowedPattern = allowed.length > 0
      ? allowed.map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')
      : '';
    
    const pattern = new RegExp(`[^a-zA-Z0-9\\s${allowedPattern}]`, 'g');
    return value.replace(pattern, '');
  }

  /**
   * Check if value contains dangerous characters
   */
  containsDangerousChars(value: string): boolean {
    if (!value) return false;
    
    // Check for XSS patterns
    if (DANGEROUS_PATTERNS.XSS_PATTERNS.test(value)) {
      return true;
    }
    
    // Check for null bytes
    if (DANGEROUS_PATTERNS.NULL_BYTE.test(value)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if value contains script tags
   */
  containsScriptTags(value: string): boolean {
    if (!value) return false;
    
    // Reset regex lastIndex to ensure consistent results
    const scriptPattern = new RegExp(DANGEROUS_PATTERNS.SCRIPT_TAG.source, 'gi');
    return scriptPattern.test(value);
  }

  /**
   * Check if value is within length limit
   */
  isWithinLengthLimit(value: string, maxLength: number): boolean {
    if (!value) return true;
    return value.length <= maxLength;
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const InputValidator = new InputValidatorImpl();

// Export type for the interface
export type InputValidator = InputValidatorImpl;

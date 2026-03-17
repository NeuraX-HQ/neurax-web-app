# SecurityManager

The SecurityManager is a unified security facade that provides centralized access to all security modules in the application. It coordinates between StorageManager, SessionManager, BiometricManager, InputValidator, ScreenProtection, ErrorHandler, and SecureLogger.

## Features

- **Module Initialization**: Initializes all security modules with proper configuration
- **High-Level Authentication**: Provides login, logout, and checkAuth operations
- **App Lifecycle Management**: Handles foreground/background events
- **Unified Module Access**: Single point of access to all security modules
- **Production Mode**: Automatically disables console logs in production

## Requirements

Validates Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

## Installation

The SecurityManager is already integrated into the security module. Import it from the security index:

```typescript
import { securityManager } from './security';
```

## Usage

### 1. Initialize on App Startup

```typescript
import { securityManager } from './security';

async function initializeApp() {
  try {
    await securityManager.initialize();
    console.log('Security initialized successfully');
  } catch (error) {
    console.error('Failed to initialize security:', error);
  }
}
```

### 2. Login Flow

```typescript
async function login(email: string, password: string) {
  try {
    await securityManager.login(email, password);
    // Login successful - navigate to home screen
  } catch (error) {
    // Show error message to user
    console.error('Login failed:', error.message);
  }
}
```

The login method:
- Validates email and password format
- Creates a session with auth token
- Stores biometric hash if biometric is enabled
- Logs security events

### 3. Check Authentication Status

```typescript
async function checkAuth() {
  const isAuthenticated = await securityManager.checkAuth();
  
  if (isAuthenticated) {
    // User is authenticated and session is valid
    return true;
  } else {
    // User needs to login or unlock session
    return false;
  }
}
```

The checkAuth method returns `true` if:
- Session exists and is valid
- Session is not expired
- Session is not locked

### 4. Logout Flow

```typescript
async function logout() {
  try {
    await securityManager.logout();
    // Navigate to login screen
  } catch (error) {
    // Logout always succeeds, errors are logged
    console.error('Logout completed with errors:', error);
  }
}
```

The logout method:
- Ends the session
- Clears all auth data
- Resets biometric failed attempts
- Never throws errors (always succeeds)

### 5. App Lifecycle Integration

In your App.tsx or root component:

```typescript
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { securityManager } from './security';

export default function App() {
  useEffect(() => {
    // Initialize security
    securityManager.initialize();
    
    // Setup app lifecycle handlers
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        await securityManager.onAppForeground();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        await securityManager.onAppBackground();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  return <YourAppNavigator />;
}
```

### 6. Access Individual Security Modules

The SecurityManager provides direct access to all security modules:

```typescript
// Storage operations
await securityManager.storage.setItem('key', 'value');
const value = await securityManager.storage.getItem('key');

// Session operations
const session = await securityManager.session.getSession();
await securityManager.session.updateLastActivity();

// Biometric operations
const biometricStatus = await securityManager.biometric.checkBiometricStatus();
const success = await securityManager.biometric.authenticate('Verify your identity');

// Input validation
const emailValidation = securityManager.validator.validateEmail('test@example.com');
if (!emailValidation.isValid) {
  console.error('Validation errors:', emailValidation.errors);
}

// Screen protection
securityManager.screenProtection.enableProtection('profile');

// Error handling
try {
  // Some operation
} catch (error) {
  const errorInfo = securityManager.errorHandler.handleError(error);
  const userMessage = securityManager.errorHandler.getUserMessage(errorInfo);
  // Show userMessage to user
}

// Logging
securityManager.logger.info('User action', { action: 'view_profile' });
securityManager.logger.logSecurityEvent('custom_event', { details: 'event details' });
```

## API Reference

### SecurityManager Interface

```typescript
interface SecurityManager {
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
```

### Methods

#### `initialize(): Promise<void>`

Initializes all security modules. Should be called once on app startup.

- Disables console logs in production mode
- Sets up screen protection for sensitive screens
- Logs initialization status

**Throws**: Error if initialization fails

#### `login(email: string, password: string): Promise<void>`

Authenticates user and creates a session.

**Parameters**:
- `email`: User's email address
- `password`: User's password

**Throws**: Error with user-friendly message if:
- Email format is invalid
- Password format is invalid
- Authentication fails

**Side effects**:
- Creates session with auth token
- Stores biometric hash if biometric is enabled
- Logs security events

#### `logout(): Promise<void>`

Ends user session and cleans up all auth data.

**Never throws** - always succeeds even if errors occur

**Side effects**:
- Ends session
- Clears all auth data
- Resets biometric failed attempts
- Logs security events

#### `checkAuth(): Promise<boolean>`

Checks if user is authenticated.

**Returns**: `true` if user is authenticated and session is valid, `false` otherwise

**Checks**:
- Session exists
- Session is not expired
- Session is not locked

#### `onAppForeground(): Promise<void>`

Handles app coming to foreground.

**Never throws** - errors are logged

**Actions**:
- Validates session
- Checks for auto-lock
- Checks for biometric changes
- Updates screen protection

#### `onAppBackground(): Promise<void>`

Handles app going to background.

**Never throws** - errors are logged

**Actions**:
- Updates last activity time
- Activates screen protection (splash screen)
- Prepares for potential auto-lock

## Module Access

All security modules are accessible through the SecurityManager:

- **storage**: StorageManager - Secure data storage
- **session**: SessionManager - Session lifecycle management
- **biometric**: BiometricManager - Biometric authentication
- **validator**: InputValidator - Input validation and sanitization
- **screenProtection**: ScreenProtection - Screenshot/recording prevention
- **errorHandler**: ErrorHandler - Secure error handling
- **logger**: SecureLogger - Secure logging with redaction

See individual module documentation for detailed API reference.

## Production Mode

In production mode (`__DEV__ === false`), the SecurityManager:
- Disables all console.log statements
- Routes all logging through SecureLogger
- Automatically redacts sensitive data from logs

## Error Handling

The SecurityManager uses the ErrorHandler module to:
- Return generic, user-friendly error messages
- Log detailed errors securely
- Prevent information leakage through error messages

Example:
```typescript
try {
  await securityManager.login(email, password);
} catch (error) {
  // error.message contains user-friendly message like:
  // "Authentication failed. Please try again."
  // Detailed error is logged securely
}
```

## Security Events

The SecurityManager logs security events through SecureLogger:
- Login success/failure
- Logout
- Session expiration
- Biometric authentication
- Auto-lock triggers
- Biometric changes

These events are logged with timestamps and context for security auditing.

## Best Practices

1. **Initialize Early**: Call `initialize()` as early as possible in your app startup
2. **Handle Lifecycle**: Always set up app lifecycle handlers to call `onAppForeground()` and `onAppBackground()`
3. **Check Auth**: Check authentication status before accessing protected resources
4. **Use Module Access**: Access individual modules through SecurityManager for consistency
5. **Handle Errors**: Always handle errors from login/logout operations
6. **Don't Mock in Production**: Never mock SecurityManager in production code

## Testing

When testing components that use SecurityManager:

```typescript
import { securityManager } from './security';

// Mock the methods you need
jest.spyOn(securityManager, 'checkAuth').mockResolvedValue(true);
jest.spyOn(securityManager, 'login').mockResolvedValue();
```

## Examples

See `SecurityManager.example.ts` for complete usage examples including:
- App initialization
- Login/logout flows
- Authentication checks
- App lifecycle integration
- Module access patterns
- React component integration

## Related Modules

- [StorageManager](./StorageManager.ts) - Secure data storage
- [SessionManager](./SessionManager.ts) - Session management
- [BiometricManager](./BiometricManager.ts) - Biometric authentication
- [InputValidator](./InputValidator.ts) - Input validation
- [ScreenProtection](./ScreenProtection.ts) - Screen protection
- [ErrorHandler](./ErrorHandler.ts) - Error handling
- [SecureLogger](./SecureLogger.ts) - Secure logging

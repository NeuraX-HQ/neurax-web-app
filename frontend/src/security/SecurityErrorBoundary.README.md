# SecurityErrorBoundary

React Error Boundary component for secure error handling in the NutriTrack application.

## Features

- Catches errors in React component tree
- Integrates with ErrorHandler for secure error processing
- Shows user-friendly fallback UI without exposing technical details
- Logs errors securely without stack traces in production
- Prevents sensitive information leakage
- Supports custom fallback UI
- Provides retry functionality

## Requirements

Validates Requirements: 8.4, 11.3

## Usage

### Basic Usage

```tsx
import { SecurityErrorBoundary } from './security';

function App() {
  return (
    <SecurityErrorBoundary>
      <YourApp />
    </SecurityErrorBoundary>
  );
}
```

### With Screen Name Context

```tsx
<SecurityErrorBoundary screenName="ProfileScreen">
  <ProfileScreen />
</SecurityErrorBoundary>
```

### With Custom Fallback UI

```tsx
<SecurityErrorBoundary
  fallback={(errorInfo, retry) => (
    <View>
      <Text>Custom error message</Text>
      <Button title="Retry" onPress={retry} />
    </View>
  )}
>
  <YourComponent />
</SecurityErrorBoundary>
```

## Props

### `children: ReactNode`
The component tree to wrap with error boundary protection.

### `screenName?: string`
Optional screen name to include in error context for better debugging.

### `fallback?: (errorInfo: ErrorInfo, retry: () => void) => ReactNode`
Optional custom fallback UI function. Receives:
- `errorInfo`: Processed error information from ErrorHandler
- `retry`: Function to reset error state and retry rendering

## Default Fallback UI

When no custom fallback is provided, shows:
- "Oops!" title
- User-friendly error message (from ErrorHandler)
- "Try Again" button to retry

## Error Handling Flow

1. Component throws error
2. `getDerivedStateFromError` updates state to show fallback
3. `componentDidCatch` processes error through ErrorHandler
4. ErrorHandler logs detailed error securely
5. User sees generic, friendly error message
6. User can retry to attempt recovery

## Integration with ErrorHandler

The SecurityErrorBoundary automatically:
- Calls `errorHandler.handleError()` with error and context
- Includes screen name, timestamp, and component stack in context
- Gets user-friendly message via `errorHandler.getUserMessage()`
- Logs errors without exposing stack traces to users

## Example: Wrapping App Root

```tsx
// App.tsx
import { SecurityErrorBoundary } from './security';

export default function App() {
  return (
    <SecurityErrorBoundary screenName="App">
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SecurityErrorBoundary>
  );
}
```

## Example: Wrapping Individual Screens

```tsx
// ProfileScreen.tsx
import { SecurityErrorBoundary } from './security';

export function ProfileScreen() {
  return (
    <SecurityErrorBoundary screenName="Profile">
      <ProfileContent />
    </SecurityErrorBoundary>
  );
}
```

## Testing

The component includes comprehensive unit tests covering:
- Error catching and state management
- ErrorHandler integration
- Custom fallback support
- Retry functionality
- Context inclusion (screen name, timestamp, component stack)

## Security Considerations

- Never exposes stack traces to users in production
- All detailed error information is logged securely via SecureLogger
- User-facing messages are generic and don't leak system information
- Error context includes only necessary debugging information
- Component stack is logged but not shown to users

## Related Modules

- `ErrorHandler`: Processes errors and generates user messages
- `SecureLogger`: Logs detailed error information securely
- `SecurityManager`: Coordinates all security modules

# ScreenProtection Module

## Overview

The ScreenProtection module provides screenshot and screen recording prevention for sensitive screens in your React Native application. It uses `expo-screen-capture` to set native secure flags on iOS and Android platforms.

## Features

- **Screenshot Prevention**: Prevents users from taking screenshots of sensitive screens
- **Screen Recording Prevention**: Prevents screen recording on protected screens
- **Splash Screen Overlay**: Shows a splash screen when the app goes to background to hide sensitive content
- **Per-Screen Configuration**: Configure protection settings for individual screens
- **Global Protection**: Enable protection for all screens at once
- **Default Protected Screens**: Automatically protects sensitive screens on initialization
- **Public Screens**: Explicitly allows screenshots on public screens

## Installation

The module requires `expo-screen-capture`:

```bash
npm install expo-screen-capture
```

## Usage

### Basic Usage

```typescript
import { screenProtection } from './security/ScreenProtection';

// Enable protection for a screen
screenProtection.enableProtection('profile');

// Disable protection for a screen
screenProtection.disableProtection('profile');

// Check if a screen is protected
const isProtected = screenProtection.isProtected('profile');
```

### Custom Configuration

```typescript
// Enable protection with custom settings
screenProtection.enableProtection('medical-records', {
  preventScreenshot: true,
  preventScreenRecording: true,
  showSplashOnBackground: true,
  blurContent: false,
});

// Set default configuration for all new protected screens
screenProtection.setDefaultConfig({
  preventScreenshot: true,
  preventScreenRecording: false,
  showSplashOnBackground: true,
  blurContent: true,
});
```

### Global Protection

```typescript
// Enable protection for all screens
screenProtection.enableGlobalProtection({
  preventScreenshot: true,
  preventScreenRecording: true,
  showSplashOnBackground: true,
});

// Disable global protection
screenProtection.disableGlobalProtection();
```

### React Navigation Integration

```typescript
import { useNavigationState } from '@react-navigation/native';
import { useEffect } from 'react';
import { screenProtection, PROTECTED_SCREENS } from './security/ScreenProtection';

function ScreenProtectionNavigationListener() {
  const currentRoute = useNavigationState(state => {
    const route = state.routes[state.index];
    return route.name;
  });
  
  useEffect(() => {
    if (PROTECTED_SCREENS.includes(currentRoute as any)) {
      screenProtection.enableProtection(currentRoute);
    } else {
      screenProtection.disableProtection(currentRoute);
    }
  }, [currentRoute]);
  
  return null;
}
```

### Expo Router Integration

```typescript
import { useSegments } from 'expo-router';
import { useEffect } from 'react';
import { screenProtection, PROTECTED_SCREENS } from './security/ScreenProtection';

export default function Layout() {
  const segments = useSegments();
  const currentScreen = segments[segments.length - 1];
  
  useEffect(() => {
    if (PROTECTED_SCREENS.includes(currentScreen as any)) {
      screenProtection.enableProtection(currentScreen);
    } else {
      screenProtection.disableProtection(currentScreen);
    }
  }, [currentScreen]);
  
  return <Slot />;
}
```

## Configuration Options

### ScreenProtectionConfig

```typescript
interface ScreenProtectionConfig {
  preventScreenshot: boolean;        // Prevent screenshots
  preventScreenRecording: boolean;   // Prevent screen recording
  showSplashOnBackground: boolean;   // Show splash when app goes to background
  blurContent: boolean;              // Blur content instead of splash (future feature)
}
```

### Default Configuration

```typescript
const DEFAULT_SCREEN_PROTECTION: ScreenProtectionConfig = {
  preventScreenshot: true,
  preventScreenRecording: true,
  showSplashOnBackground: true,
  blurContent: false,
};
```

## Protected Screens

The following screens are protected by default:

- `profile` - User profile with personal information
- `settings` - App settings with sensitive configurations
- `food-detail` - Food details with health data
- `add-hydration` - Hydration tracking with health metrics
- `notifications` - Notifications that may contain sensitive information

## Public Screens

The following screens are explicitly marked as public (screenshots allowed):

- `welcome` - Welcome/landing screen
- `login` - Login screen
- `onboarding` - Onboarding flow

## API Reference

### Methods

#### `enableProtection(screenName: string, config?: Partial<ScreenProtectionConfig>): void`

Enables protection for a specific screen with optional custom configuration.

**Parameters:**
- `screenName`: Name of the screen to protect
- `config`: Optional partial configuration to override defaults

**Example:**
```typescript
screenProtection.enableProtection('profile');
screenProtection.enableProtection('medical-records', {
  preventScreenshot: true,
  showSplashOnBackground: true,
});
```

#### `disableProtection(screenName: string): void`

Disables protection for a specific screen.

**Parameters:**
- `screenName`: Name of the screen to unprotect

**Example:**
```typescript
screenProtection.disableProtection('profile');
```

#### `isProtected(screenName: string): boolean`

Checks if a screen is currently protected.

**Parameters:**
- `screenName`: Name of the screen to check

**Returns:** `true` if the screen is protected, `false` otherwise

**Example:**
```typescript
if (screenProtection.isProtected('profile')) {
  console.log('Profile screen is protected');
}
```

#### `enableGlobalProtection(config?: Partial<ScreenProtectionConfig>): void`

Enables protection for all screens in the app.

**Parameters:**
- `config`: Optional partial configuration to override defaults

**Example:**
```typescript
screenProtection.enableGlobalProtection({
  preventScreenshot: true,
  preventScreenRecording: true,
});
```

#### `disableGlobalProtection(): void`

Disables global protection. Individual screen protections remain active.

**Example:**
```typescript
screenProtection.disableGlobalProtection();
```

#### `onAppBackground(): void`

Handles app going to background. Called automatically by the module.

**Example:**
```typescript
// Usually called automatically, but can be called manually if needed
screenProtection.onAppBackground();
```

#### `onAppForeground(): void`

Handles app coming to foreground. Called automatically by the module.

**Example:**
```typescript
// Usually called automatically, but can be called manually if needed
screenProtection.onAppForeground();
```

#### `setDefaultConfig(config: Partial<ScreenProtectionConfig>): void`

Sets the default configuration for newly protected screens.

**Parameters:**
- `config`: Partial configuration to merge with current defaults

**Example:**
```typescript
screenProtection.setDefaultConfig({
  preventScreenshot: true,
  blurContent: true,
});
```

#### `getConfig(screenName: string): ScreenProtectionConfig`

Gets the current configuration for a specific screen.

**Parameters:**
- `screenName`: Name of the screen

**Returns:** The current configuration for the screen

**Example:**
```typescript
const config = screenProtection.getConfig('profile');
console.log('Screenshot prevention:', config.preventScreenshot);
```

## Platform Support

### iOS

- Uses `UIView.isSecure` flag to prevent screenshots and screen recording
- Shows splash screen in app switcher when app is in background
- Supported on iOS 11+

### Android

- Uses `FLAG_SECURE` window flag to prevent screenshots and screen recording
- Hides content in recent apps screen when app is in background
- Supported on Android 5.0+ (API level 21+)

## Best Practices

1. **Protect Sensitive Screens**: Always enable protection for screens containing personal information, health data, or financial information.

2. **Allow Public Screens**: Don't protect public screens like welcome, login, or onboarding to allow users to share app information.

3. **Use Navigation Integration**: Integrate with your navigation system to automatically enable/disable protection based on the current screen.

4. **Test on Both Platforms**: Test screenshot prevention on both iOS and Android as the behavior may differ slightly.

5. **Inform Users**: Consider showing a security indicator when a screen is protected to inform users about the security measures.

6. **Handle Edge Cases**: Consider what happens when users try to take screenshots and provide appropriate feedback.

## Troubleshooting

### Screenshots Still Work

- Ensure `expo-screen-capture` is properly installed
- Check that the screen name matches exactly
- Verify that protection is enabled for the current screen
- Test on a physical device (simulators may not enforce protection)

### App Crashes on Background

- Ensure the splash screen overlay is properly configured
- Check that app state listeners are properly set up
- Verify that the module is initialized before use

### Protection Not Working on Simulator

- Screenshot prevention may not work on iOS Simulator or Android Emulator
- Always test on physical devices for accurate results

## Security Considerations

1. **Not Foolproof**: Screenshot prevention is not 100% foolproof. Users can still take photos of the screen with another device.

2. **Platform Limitations**: Some Android devices or custom ROMs may not fully support screenshot prevention.

3. **Accessibility**: Consider accessibility implications when preventing screenshots, as some users may need to capture screens for assistive purposes.

4. **User Experience**: Balance security with user experience. Don't over-protect screens that don't contain sensitive information.

## Related Modules

- **SecureLogger**: For secure logging without exposing sensitive data
- **StorageManager**: For secure data storage
- **SessionManager**: For session management and auto-lock
- **ErrorHandler**: For secure error handling

## License

This module is part of the NutriTrack security framework.

/**
 * ScreenProtection Usage Examples
 * 
 * This file demonstrates how to use the ScreenProtection module
 * in your React Native application.
 */

import { screenProtection, PROTECTED_SCREENS, PUBLIC_SCREENS } from './ScreenProtection';

/**
 * Example 1: Enable protection for a specific screen
 * 
 * Use this when navigating to a sensitive screen that contains
 * personal or health data.
 */
export function enableScreenProtectionExample() {
  // Enable protection with default settings
  screenProtection.enableProtection('profile');
  
  // Enable protection with custom settings
  screenProtection.enableProtection('medical-records', {
    preventScreenshot: true,
    preventScreenRecording: true,
    showSplashOnBackground: true,
    blurContent: false,
  });
}

/**
 * Example 2: Disable protection for a specific screen
 * 
 * Use this when navigating away from a sensitive screen
 * to a public screen.
 */
export function disableScreenProtectionExample() {
  screenProtection.disableProtection('profile');
}

/**
 * Example 3: Check if a screen is protected
 * 
 * Use this to conditionally show UI elements based on
 * whether the current screen is protected.
 */
export function checkProtectionExample(screenName: string) {
  if (screenProtection.isProtected(screenName)) {
    console.log(`Screen ${screenName} is protected`);
    // Show security indicator in UI
  } else {
    console.log(`Screen ${screenName} is not protected`);
  }
}

/**
 * Example 4: Enable global protection
 * 
 * Use this to protect all screens in the app, useful for
 * high-security modes or when handling very sensitive data.
 */
export function enableGlobalProtectionExample() {
  screenProtection.enableGlobalProtection({
    preventScreenshot: true,
    preventScreenRecording: true,
    showSplashOnBackground: true,
  });
}

/**
 * Example 5: Disable global protection
 * 
 * Use this to return to normal mode where only specific
 * screens are protected.
 */
export function disableGlobalProtectionExample() {
  screenProtection.disableGlobalProtection();
}

/**
 * Example 6: Set default configuration
 * 
 * Use this to customize the default protection settings
 * for all newly protected screens.
 */
export function setDefaultConfigExample() {
  screenProtection.setDefaultConfig({
    preventScreenshot: true,
    preventScreenRecording: false, // Allow recording but not screenshots
    showSplashOnBackground: true,
    blurContent: true, // Blur content instead of showing splash
  });
}

/**
 * Example 7: Get configuration for a screen
 * 
 * Use this to check the current protection settings
 * for a specific screen.
 */
export function getConfigExample(screenName: string) {
  const config = screenProtection.getConfig(screenName);
  console.log(`Protection config for ${screenName}:`, config);
  return config;
}

/**
 * Example 8: React Navigation Integration
 * 
 * Use this pattern to automatically enable/disable protection
 * based on the current screen in React Navigation.
 */
export function navigationIntegrationExample() {
  // In your navigation setup:
  /*
  import { useNavigationState } from '@react-navigation/native';
  
  function ScreenProtectionNavigationListener() {
    const currentRoute = useNavigationState(state => {
      const route = state.routes[state.index];
      return route.name;
    });
    
    useEffect(() => {
      if (PROTECTED_SCREENS.includes(currentRoute as any)) {
        screenProtection.enableProtection(currentRoute);
      } else if (PUBLIC_SCREENS.includes(currentRoute as any)) {
        screenProtection.disableProtection(currentRoute);
      }
    }, [currentRoute]);
    
    return null;
  }
  */
}

/**
 * Example 9: App State Integration
 * 
 * The ScreenProtection module automatically handles app state changes,
 * but you can also manually trigger these handlers if needed.
 */
export function appStateIntegrationExample() {
  // These are called automatically by the module,
  // but you can call them manually if needed:
  
  // When app goes to background
  screenProtection.onAppBackground();
  
  // When app comes to foreground
  screenProtection.onAppForeground();
}

/**
 * Example 10: Using with Expo Router
 * 
 * Use this pattern with Expo Router to protect screens
 * based on the current route.
 */
export function expoRouterIntegrationExample() {
  // In your layout file (_layout.tsx):
  /*
  import { useSegments } from 'expo-router';
  import { useEffect } from 'react';
  
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
  */
}

/**
 * Example 11: Protected Screens List
 * 
 * These screens are protected by default when the module initializes.
 */
export function protectedScreensExample() {
  console.log('Protected screens:', PROTECTED_SCREENS);
  // Output: ['profile', 'settings', 'food-detail', 'add-hydration', 'notifications']
}

/**
 * Example 12: Public Screens List
 * 
 * These screens should NOT be protected as they contain public information.
 */
export function publicScreensExample() {
  console.log('Public screens:', PUBLIC_SCREENS);
  // Output: ['welcome', 'login', 'onboarding']
}

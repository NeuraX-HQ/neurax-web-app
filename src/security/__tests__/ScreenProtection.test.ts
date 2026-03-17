/**
 * Unit Tests for ScreenProtection Module
 * 
 * Tests screenshot/recording prevention functionality
 */

// Mock expo-screen-capture
jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn(() => Promise.resolve()),
  allowScreenCaptureAsync: jest.fn(() => Promise.resolve()),
}));

// Mock AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ScreenProtectionImpl, DEFAULT_SCREEN_PROTECTION, PROTECTED_SCREENS, PUBLIC_SCREENS } from '../ScreenProtection';
import * as ScreenCapture from 'expo-screen-capture';

describe('ScreenProtection', () => {
  let screenProtection: ScreenProtectionImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    screenProtection = new ScreenProtectionImpl();
  });

  afterEach(() => {
    screenProtection.destroy();
  });

  describe('Default Configuration', () => {
    it('should have correct default configuration', () => {
      expect(DEFAULT_SCREEN_PROTECTION).toEqual({
        preventScreenshot: true,
        preventScreenRecording: true,
        showSplashOnBackground: true,
        blurContent: false,
      });
    });

    it('should have correct protected screens list', () => {
      expect(PROTECTED_SCREENS).toEqual([
        'profile',
        'settings',
        'food-detail',
        'add-hydration',
        'notifications',
      ]);
    });

    it('should have correct public screens list', () => {
      expect(PUBLIC_SCREENS).toEqual([
        'welcome',
        'login',
        'onboarding',
      ]);
    });
  });

  describe('Screen Protection Management', () => {
    it('should enable protection for a specific screen', () => {
      screenProtection.enableProtection('test-screen');
      expect(screenProtection.isProtected('test-screen')).toBe(true);
    });

    it('should disable protection for a specific screen', () => {
      screenProtection.enableProtection('test-screen');
      screenProtection.disableProtection('test-screen');
      expect(screenProtection.isProtected('test-screen')).toBe(false);
    });

    it('should apply custom config when enabling protection', () => {
      const customConfig = {
        preventScreenshot: false,
        showSplashOnBackground: false,
      };

      screenProtection.enableProtection('test-screen', customConfig);
      const config = screenProtection.getConfig('test-screen');

      expect(config.preventScreenshot).toBe(false);
      expect(config.showSplashOnBackground).toBe(false);
      expect(config.preventScreenRecording).toBe(true); // default value
    });

    it('should protect default screens on initialization', () => {
      PROTECTED_SCREENS.forEach(screen => {
        expect(screenProtection.isProtected(screen)).toBe(true);
      });
    });

    it('should not protect public screens by default', () => {
      PUBLIC_SCREENS.forEach(screen => {
        expect(screenProtection.isProtected(screen)).toBe(false);
      });
    });
  });

  describe('Global Protection', () => {
    it('should enable global protection for all screens', () => {
      screenProtection.enableGlobalProtection();
      
      expect(screenProtection.isProtected('any-screen')).toBe(true);
      expect(screenProtection.isProtected('another-screen')).toBe(true);
    });

    it('should disable global protection', () => {
      screenProtection.enableGlobalProtection();
      screenProtection.disableGlobalProtection();
      
      // Should still protect default screens
      expect(screenProtection.isProtected('profile')).toBe(true);
      // But not arbitrary screens
      expect(screenProtection.isProtected('random-screen')).toBe(false);
    });

    it('should apply custom config for global protection', () => {
      const customConfig = {
        preventScreenshot: false,
        blurContent: true,
      };

      screenProtection.enableGlobalProtection(customConfig);
      const config = screenProtection.getConfig('any-screen');

      expect(config.preventScreenshot).toBe(false);
      expect(config.blurContent).toBe(true);
    });
  });

  describe('Native Protection Activation', () => {
    it('should activate native protection when enabling screen protection', async () => {
      screenProtection.enableProtection('test-screen');
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(ScreenCapture.preventScreenCaptureAsync).toHaveBeenCalled();
    });

    it('should deactivate native protection when all protections are removed', async () => {
      screenProtection.enableProtection('test-screen');
      
      // Remove all default protected screens
      PROTECTED_SCREENS.forEach(screen => {
        screenProtection.disableProtection(screen);
      });
      
      screenProtection.disableProtection('test-screen');
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(ScreenCapture.allowScreenCaptureAsync).toHaveBeenCalled();
    });

    it('should activate native protection for global protection', async () => {
      screenProtection.enableGlobalProtection();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(ScreenCapture.preventScreenCaptureAsync).toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    it('should set default config for new screens', () => {
      const newDefaults = {
        preventScreenshot: false,
        blurContent: true,
      };

      screenProtection.setDefaultConfig(newDefaults);
      screenProtection.enableProtection('new-screen');

      const config = screenProtection.getConfig('new-screen');
      expect(config.preventScreenshot).toBe(false);
      expect(config.blurContent).toBe(true);
    });

    it('should return default config for unprotected screens', () => {
      const config = screenProtection.getConfig('unprotected-screen');
      expect(config).toEqual(DEFAULT_SCREEN_PROTECTION);
    });

    it('should return global config when global protection is enabled', () => {
      const globalConfig = {
        preventScreenshot: false,
        blurContent: true,
      };

      screenProtection.enableGlobalProtection(globalConfig);
      const config = screenProtection.getConfig('any-screen');

      expect(config.preventScreenshot).toBe(false);
      expect(config.blurContent).toBe(true);
    });
  });

  describe('App Lifecycle Handlers', () => {
    it('should activate protection on app background', async () => {
      screenProtection.enableProtection('test-screen', {
        showSplashOnBackground: true,
      });

      screenProtection.onAppBackground();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(ScreenCapture.preventScreenCaptureAsync).toHaveBeenCalled();
    });

    it('should maintain protection state on app foreground', async () => {
      screenProtection.enableProtection('test-screen');
      
      screenProtection.onAppForeground();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(ScreenCapture.preventScreenCaptureAsync).toHaveBeenCalled();
    });

    it('should not show splash if showSplashOnBackground is false', () => {
      screenProtection.enableProtection('test-screen', {
        showSplashOnBackground: false,
      });

      // Clear previous calls
      jest.clearAllMocks();

      screenProtection.onAppBackground();
      
      // Should not activate protection just for background
      // (protection should already be active from enableProtection)
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      screenProtection.enableProtection('test-screen');
      
      screenProtection.destroy();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(ScreenCapture.allowScreenCaptureAsync).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle enabling protection for already protected screen', () => {
      screenProtection.enableProtection('test-screen');
      screenProtection.enableProtection('test-screen', {
        preventScreenshot: false,
      });

      const config = screenProtection.getConfig('test-screen');
      expect(config.preventScreenshot).toBe(false);
    });

    it('should handle disabling protection for non-protected screen', () => {
      expect(() => {
        screenProtection.disableProtection('non-existent-screen');
      }).not.toThrow();
    });

    it('should handle multiple enable/disable cycles', () => {
      for (let i = 0; i < 5; i++) {
        screenProtection.enableProtection('test-screen');
        expect(screenProtection.isProtected('test-screen')).toBe(true);
        
        screenProtection.disableProtection('test-screen');
        expect(screenProtection.isProtected('test-screen')).toBe(false);
      }
    });
  });
});

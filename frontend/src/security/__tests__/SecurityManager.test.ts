/**
 * Unit Tests for SecurityManager
 * 
 * Tests module initialization, coordination, and high-level operations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Import after mocks are set up
const { SecurityManagerImpl } = require('../SecurityManager');
const { storageManager } = require('../StorageManager');
const { sessionManager } = require('../SessionManager');
const { biometricManager } = require('../BiometricManager');
const { InputValidator } = require('../InputValidator');
const { screenProtection } = require('../ScreenProtection');
const { errorHandler } = require('../ErrorHandler');
const { secureLogger } = require('../SecureLogger');

describe('SecurityManager', () => {
  let securityManager: SecurityManagerImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    securityManager = new SecurityManagerImpl();
  });

  describe('Module Access', () => {
    it('should provide access to all security modules', () => {
      expect(securityManager.storage).toBe(storageManager);
      expect(securityManager.session).toBe(sessionManager);
      expect(securityManager.biometric).toBe(biometricManager);
      expect(securityManager.validator).toBe(InputValidator);
      expect(securityManager.screenProtection).toBe(screenProtection);
      expect(securityManager.errorHandler).toBe(errorHandler);
      expect(securityManager.logger).toBe(secureLogger);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(securityManager.initialize()).resolves.not.toThrow();
    });

    it('should not throw when initialized multiple times', async () => {
      await securityManager.initialize();
      await expect(securityManager.initialize()).resolves.not.toThrow();
    });

    it('should disable console logs in production mode', async () => {
      // Mock production mode
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;

      const disableLogsSpy = jest.spyOn(secureLogger, 'disableAllConsoleLogs');
      
      const prodSecurityManager = new SecurityManagerImpl();
      await prodSecurityManager.initialize();

      expect(disableLogsSpy).toHaveBeenCalled();

      // Restore
      (global as any).__DEV__ = originalDev;
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should validate email format', async () => {
      await expect(
        securityManager.login('invalid-email', 'ValidPass123')
      ).rejects.toThrow();
    });

    it('should validate password format', async () => {
      await expect(
        securityManager.login('test@example.com', 'weak')
      ).rejects.toThrow();
    });

    it('should create session on successful login', async () => {
      const createSessionSpy = jest.spyOn(sessionManager, 'createSession');
      
      await securityManager.login('test@example.com', 'ValidPass123');
      
      expect(createSessionSpy).toHaveBeenCalled();
    });

    it('should store biometric hash if biometric is enabled', async () => {
      // Mock biometric status
      jest.spyOn(biometricManager, 'checkBiometricStatus').mockResolvedValue({
        isSupported: true,
        isEnrolled: true,
        isEnabled: true,
        availableTypes: [],
        hasChanged: false,
      });

      const storeBiometricHashSpy = jest.spyOn(biometricManager, 'storeBiometricHash');
      
      await securityManager.login('test@example.com', 'ValidPass123');
      
      expect(storeBiometricHashSpy).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should end session on logout', async () => {
      const endSessionSpy = jest.spyOn(sessionManager, 'endSession');
      
      await securityManager.logout();
      
      expect(endSessionSpy).toHaveBeenCalled();
    });

    it('should reset biometric failed attempts on logout', async () => {
      const resetAttemptsSpy = jest.spyOn(biometricManager, 'resetFailedAttempts');
      
      await securityManager.logout();
      
      expect(resetAttemptsSpy).toHaveBeenCalled();
    });

    it('should not throw even if session end fails', async () => {
      jest.spyOn(sessionManager, 'endSession').mockRejectedValue(new Error('Session end failed'));
      
      await expect(securityManager.logout()).resolves.not.toThrow();
    });
  });

  describe('Check Auth', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should return false if session is invalid', async () => {
      jest.spyOn(sessionManager, 'validateSession').mockResolvedValue(false);
      
      const isAuth = await securityManager.checkAuth();
      
      expect(isAuth).toBe(false);
    });

    it('should return false if session is locked', async () => {
      jest.spyOn(sessionManager, 'validateSession').mockResolvedValue(true);
      jest.spyOn(sessionManager, 'isSessionLocked').mockResolvedValue(true);
      
      const isAuth = await securityManager.checkAuth();
      
      expect(isAuth).toBe(false);
    });

    it('should return true if session is valid and not locked', async () => {
      jest.spyOn(sessionManager, 'validateSession').mockResolvedValue(true);
      jest.spyOn(sessionManager, 'isSessionLocked').mockResolvedValue(false);
      
      const isAuth = await securityManager.checkAuth();
      
      expect(isAuth).toBe(true);
    });

    it('should return false on error', async () => {
      jest.spyOn(sessionManager, 'validateSession').mockRejectedValue(new Error('Validation error'));
      
      const isAuth = await securityManager.checkAuth();
      
      expect(isAuth).toBe(false);
    });
  });

  describe('App Lifecycle - Foreground', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should call session onAppForeground', async () => {
      const sessionForegroundSpy = jest.spyOn(sessionManager, 'onAppForeground');
      
      await securityManager.onAppForeground();
      
      expect(sessionForegroundSpy).toHaveBeenCalled();
    });

    it('should call screenProtection onAppForeground', async () => {
      const screenForegroundSpy = jest.spyOn(screenProtection, 'onAppForeground');
      
      await securityManager.onAppForeground();
      
      expect(screenForegroundSpy).toHaveBeenCalled();
    });

    it('should check for biometric changes if session exists', async () => {
      jest.spyOn(sessionManager, 'getSession').mockResolvedValue({
        userId: 'test-user',
        email: 'test@example.com',
        loginTime: Date.now(),
        lastActivityTime: Date.now(),
      });

      const checkBiometricSpy = jest.spyOn(biometricManager, 'checkBiometricStatus');
      
      await securityManager.onAppForeground();
      
      expect(checkBiometricSpy).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      jest.spyOn(sessionManager, 'onAppForeground').mockRejectedValue(new Error('Foreground error'));
      
      await expect(securityManager.onAppForeground()).resolves.not.toThrow();
    });
  });

  describe('App Lifecycle - Background', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should call session onAppBackground', async () => {
      const sessionBackgroundSpy = jest.spyOn(sessionManager, 'onAppBackground');
      
      await securityManager.onAppBackground();
      
      expect(sessionBackgroundSpy).toHaveBeenCalled();
    });

    it('should call screenProtection onAppBackground', async () => {
      const screenBackgroundSpy = jest.spyOn(screenProtection, 'onAppBackground');
      
      await securityManager.onAppBackground();
      
      expect(screenBackgroundSpy).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      jest.spyOn(sessionManager, 'onAppBackground').mockRejectedValue(new Error('Background error'));
      
      await expect(securityManager.onAppBackground()).resolves.not.toThrow();
    });
  });
});

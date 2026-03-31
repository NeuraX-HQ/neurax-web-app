/**
 * Unit tests for SecurityErrorBoundary
 * 
 * Tests:
 * - Error catching and handling
 * - Error logging integration
 * - getDerivedStateFromError
 * - componentDidCatch
 */

import React from 'react';
import { SecurityErrorBoundary } from '../SecurityErrorBoundary';
import { errorHandler, ErrorInfo } from '../ErrorHandler';

// Mock ErrorHandler
const mockHandleError = jest.fn((error, context) => ({
  code: 'UNKNOWN_001',
  message: error.message,
  severity: 'medium' as const,
  context,
}));

const mockGetUserMessage = jest.fn(() => 'Something went wrong. Please try again later.');

jest.mock('../ErrorHandler', () => ({
  errorHandler: {
    handleError: mockHandleError,
    getUserMessage: mockGetUserMessage,
  },
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
}));

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
};

describe('SecurityErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('getDerivedStateFromError', () => {
    it('should return hasError: true when error occurs', () => {
      const error = new Error('Test error');
      const state = SecurityErrorBoundary.getDerivedStateFromError(error);
      
      expect(state).toEqual({ hasError: true });
    });
  });

  describe('componentDidCatch', () => {
    it('should call errorHandler.handleError with error and context', () => {
      const boundary = new SecurityErrorBoundary({ children: null, screenName: 'TestScreen' });
      const error = new Error('Test error');
      const errorInfo = { componentStack: 'Component stack trace' };
      
      boundary.componentDidCatch(error, errorInfo);
      
      expect(mockHandleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          screen: 'TestScreen',
          timestamp: expect.any(Number),
          componentStack: 'Component stack trace',
        })
      );
    });

    it('should update state with processed error info', () => {
      const boundary = new SecurityErrorBoundary({ children: null });
      const error = new Error('Test error');
      const errorInfo = { componentStack: 'Component stack trace' };
      
      const mockErrorInfo: ErrorInfo = {
        code: 'UNKNOWN_001',
        message: 'Test error',
        severity: 'medium' as any,
        context: { timestamp: Date.now() },
      };
      
      mockHandleError.mockReturnValueOnce(mockErrorInfo);
      
      boundary.componentDidCatch(error, errorInfo);
      
      expect(boundary.state.errorInfo).toEqual(mockErrorInfo);
    });

    it('should work without screen name', () => {
      const boundary = new SecurityErrorBoundary({ children: null });
      const error = new Error('Test error');
      const errorInfo = { componentStack: 'Component stack trace' };
      
      boundary.componentDidCatch(error, errorInfo);
      
      expect(mockHandleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          screen: undefined,
        })
      );
    });
  });

  describe('handleRetry', () => {
    it('should reset error state', () => {
      const boundary = new SecurityErrorBoundary({ children: null });
      
      // Set error state
      boundary.setState({
        hasError: true,
        errorInfo: {
          code: 'UNKNOWN_001',
          message: 'Test error',
          severity: 'medium' as any,
        },
      });
      
      // Call retry
      boundary.handleRetry();
      
      // State should be reset
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.errorInfo).toBeNull();
    });
  });

  describe('render', () => {
    it('should render children when no error', () => {
      const boundary = new SecurityErrorBoundary({ children: 'Test content' });
      
      const result = boundary.render();
      
      expect(result).toBe('Test content');
    });

    it('should call getUserMessage when error occurs', () => {
      const boundary = new SecurityErrorBoundary({ children: null });
      
      const mockErrorInfo: ErrorInfo = {
        code: 'UNKNOWN_001',
        message: 'Test error',
        severity: 'medium' as any,
      };
      
      boundary.setState({
        hasError: true,
        errorInfo: mockErrorInfo,
      });
      
      boundary.render();
      
      expect(mockGetUserMessage).toHaveBeenCalledWith(mockErrorInfo);
    });

    it('should use custom fallback when provided', () => {
      const customFallback = jest.fn((errorInfo, retry) => 'Custom fallback');
      
      const boundary = new SecurityErrorBoundary({
        children: null,
        fallback: customFallback,
      });
      
      const mockErrorInfo: ErrorInfo = {
        code: 'UNKNOWN_001',
        message: 'Test error',
        severity: 'medium' as any,
      };
      
      boundary.setState({
        hasError: true,
        errorInfo: mockErrorInfo,
      });
      
      const result = boundary.render();
      
      expect(customFallback).toHaveBeenCalledWith(
        mockErrorInfo,
        expect.any(Function)
      );
      expect(result).toBe('Custom fallback');
    });
  });

  describe('Error context', () => {
    it('should include timestamp in error context', () => {
      const boundary = new SecurityErrorBoundary({ children: null });
      const error = new Error('Test error');
      const errorInfo = { componentStack: 'Component stack trace' };
      
      const beforeTimestamp = Date.now();
      boundary.componentDidCatch(error, errorInfo);
      const afterTimestamp = Date.now();
      
      const callArgs = mockHandleError.mock.calls[0];
      const timestamp = callArgs[1].timestamp;
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should include component stack in error context', () => {
      const boundary = new SecurityErrorBoundary({ children: null });
      const error = new Error('Test error');
      const errorInfo = { componentStack: 'Component stack trace' };
      
      boundary.componentDidCatch(error, errorInfo);
      
      expect(mockHandleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          componentStack: 'Component stack trace',
        })
      );
    });
  });
});

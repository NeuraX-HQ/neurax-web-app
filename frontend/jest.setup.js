// Mock TurboModuleRegistry before react-native
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn((name) => {
    if (name === 'DevMenu') {
      return {
        show: jest.fn(),
        reload: jest.fn(),
      };
    }
    if (name === 'DeviceInfo') {
      return {
        getConstants: jest.fn(() => ({
          Dimensions: {
            window: { width: 375, height: 667, scale: 2, fontScale: 1 },
            screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
          },
        })),
      };
    }
    if (name === 'PlatformConstants') {
      return {
        getConstants: jest.fn(() => ({
          isTesting: true,
          reactNativeVersion: { major: 0, minor: 81, patch: 5 },
          forceTouchAvailable: false,
          osVersion: '14.0',
          systemName: 'iOS',
          interfaceIdiom: 'phone',
        })),
      };
    }
    return null;
  }),
  get: jest.fn(() => null),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

// Mock expo-screen-capture
jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn(() => Promise.resolve()),
  allowScreenCaptureAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native AppState and other modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock TurboModuleRegistry
  const TurboModuleRegistry = {
    getEnforcing: jest.fn((name) => {
      if (name === 'DevMenu') {
        return {
          show: jest.fn(),
          reload: jest.fn(),
        };
      }
      return null;
    }),
  };
  
  return {
    ...RN,
    TurboModuleRegistry,
    AppState: {
      addEventListener: jest.fn((event, handler) => {
        return { remove: jest.fn() };
      }),
      removeEventListener: jest.fn(),
      currentState: 'active',
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => style),
    },
  };
});

// Extend Jest matchers with React Native Testing Library matchers
// Note: @testing-library/react-native v12.4+ includes built-in matchers
// No need to import extend-expect separately

// Global test timeout
jest.setTimeout(10000);

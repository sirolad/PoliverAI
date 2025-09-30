// Jest setup for React Native + react-native-web + TypeScript in the poliverai app
// This file is executed after the test framework is installed in the environment

import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';
import fetch from 'node-fetch';

// react-native-web mapping: ensure web-specific behavior is available
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock any native modules used in expo or react-native that don't run in node
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Provide a simple global fetch if tests rely on it
if (!global.fetch) {
  // assign top-level import (node environment in Jest)
  global.fetch = fetch;
}

// Provide a minimal mock for expo-file-system / expo-constants if used
jest.mock('expo-constants', () => ({
  manifest: {},
}));

// Silence warnings about act wrappers
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && (args[0] as string).includes('Warning: An update to %s inside a test was not wrapped in act')) {
      return;
    }
    // forward to original
  // spread unknown[] into console is safe for tests
  originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Setup React 18 act and async utils if testing-library needs it
// ...additional global mocks can be added here as needed

export {};

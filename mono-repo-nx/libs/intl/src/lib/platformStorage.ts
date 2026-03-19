import { Platform } from 'react-native';

type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const noopStorage: StorageLike = {
  async getItem() {
    return null;
  },
  async setItem() {
    return undefined;
  },
  async removeItem() {
    return undefined;
  },
};

const webStorage: StorageLike = {
  async getItem(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      return undefined;
    }
  },
  async removeItem(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      return undefined;
    }
  },
};

export function isWebPlatform() {
  return (
    Platform.OS === 'web' ||
    (typeof window !== 'undefined' && typeof window.document !== 'undefined')
  );
}

export function getPlatformStorage(): StorageLike {
  if (isWebPlatform()) {
    return webStorage;
  }

  try {
    // Require lazily so native startup does not crash during module evaluation
    // when AsyncStorage is not linked yet.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const moduleValue = require('@react-native-async-storage/async-storage');
    const asyncStorage = moduleValue?.default ?? moduleValue;

    if (
      asyncStorage &&
      typeof asyncStorage.getItem === 'function' &&
      typeof asyncStorage.setItem === 'function' &&
      typeof asyncStorage.removeItem === 'function'
    ) {
      return asyncStorage as StorageLike;
    }
  } catch {
    return noopStorage;
  }

  return noopStorage;
}


import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// CRITICAL: Stable storage keys - NEVER change these or users will be logged out on update
const STORAGE_KEYS = {
  APP_VERSION: '@roster_app_version',
  AUTH_TOKEN: '@roster_auth_token',
  USER_DATA: '@roster_user_data',
  UPLOAD_QUEUE: '@roster_upload_queue',
  LAST_UPLOAD_ERROR: '@roster_last_upload_error',
  LAST_SAVE_ERROR: '@roster_last_save_error',
} as const;

// Get current app version from app.json
export function getAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

// Secure storage for sensitive data (auth tokens)
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Error getting item:', key, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('[SecureStorage] Error setting item:', key, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Error removing item:', key, error);
    }
  },
};

// Regular storage for non-sensitive data
export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('[AppStorage] Error getting item:', key, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('[AppStorage] Error setting item:', key, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[AppStorage] Error removing item:', key, error);
    }
  },

  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[AppStorage] Error getting object:', key, error);
      return null;
    }
  },

  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('[AppStorage] Error setting object:', key, error);
    }
  },
};

// Version migration system
export async function checkAndMigrateVersion(): Promise<void> {
  try {
    const currentVersion = getAppVersion();
    const storedVersion = await appStorage.getItem(STORAGE_KEYS.APP_VERSION);

    console.log('[Storage] Current version:', currentVersion);
    console.log('[Storage] Stored version:', storedVersion);

    if (!storedVersion) {
      // First install
      console.log('[Storage] First install detected');
      await appStorage.setItem(STORAGE_KEYS.APP_VERSION, currentVersion);
      return;
    }

    if (storedVersion !== currentVersion) {
      console.log('[Storage] Version change detected:', storedVersion, '->', currentVersion);
      
      // Run migrations based on version changes
      await runMigrations(storedVersion, currentVersion);
      
      // Update stored version
      await appStorage.setItem(STORAGE_KEYS.APP_VERSION, currentVersion);
      console.log('[Storage] Migration complete');
    } else {
      console.log('[Storage] No migration needed');
    }
  } catch (error) {
    console.error('[Storage] Error checking version:', error);
  }
}

// Run migrations between versions
async function runMigrations(fromVersion: string, toVersion: string): Promise<void> {
  console.log('[Storage] Running migrations from', fromVersion, 'to', toVersion);
  
  // Example migration: If we need to change data structure in future versions
  // Add version-specific migrations here
  
  // For now, we just preserve all data across updates
  console.log('[Storage] No data structure changes needed');
}

// Upload queue management
export interface QueuedUpload {
  id: string;
  uri: string;
  type: 'profile' | 'roster';
  profileId?: string;
  timestamp: number;
  retryCount: number;
}

export async function getUploadQueue(): Promise<QueuedUpload[]> {
  const queue = await appStorage.getObject<QueuedUpload[]>(STORAGE_KEYS.UPLOAD_QUEUE);
  return queue || [];
}

export async function addToUploadQueue(upload: Omit<QueuedUpload, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  const queue = await getUploadQueue();
  const newUpload: QueuedUpload = {
    ...upload,
    id: Date.now().toString(),
    timestamp: Date.now(),
    retryCount: 0,
  };
  queue.push(newUpload);
  await appStorage.setObject(STORAGE_KEYS.UPLOAD_QUEUE, queue);
  console.log('[UploadQueue] Added upload to queue:', newUpload.id);
}

export async function removeFromUploadQueue(id: string): Promise<void> {
  const queue = await getUploadQueue();
  const filtered = queue.filter(u => u.id !== id);
  await appStorage.setObject(STORAGE_KEYS.UPLOAD_QUEUE, filtered);
  console.log('[UploadQueue] Removed upload from queue:', id);
}

export async function incrementUploadRetry(id: string): Promise<void> {
  const queue = await getUploadQueue();
  const upload = queue.find(u => u.id === id);
  if (upload) {
    upload.retryCount++;
    await appStorage.setObject(STORAGE_KEYS.UPLOAD_QUEUE, queue);
    console.log('[UploadQueue] Incremented retry count for:', id, 'to', upload.retryCount);
  }
}

// Error logging for debug overlay
export async function logUploadError(error: string): Promise<void> {
  const errorLog = {
    message: error,
    timestamp: new Date().toISOString(),
  };
  await appStorage.setObject(STORAGE_KEYS.LAST_UPLOAD_ERROR, errorLog);
  console.error('[UploadError]', error);
}

export async function getLastUploadError(): Promise<{ message: string; timestamp: string } | null> {
  return await appStorage.getObject(STORAGE_KEYS.LAST_UPLOAD_ERROR);
}

export async function logSaveError(error: string): Promise<void> {
  const errorLog = {
    message: error,
    timestamp: new Date().toISOString(),
  };
  await appStorage.setObject(STORAGE_KEYS.LAST_SAVE_ERROR, errorLog);
  console.error('[SaveError]', error);
}

export async function getLastSaveError(): Promise<{ message: string; timestamp: string } | null> {
  return await appStorage.getObject(STORAGE_KEYS.LAST_SAVE_ERROR);
}

export { STORAGE_KEYS };

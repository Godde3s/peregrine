import { createMMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';

/**
 * Persistence split (state architecture):
 * - MMKV for tiny client state (conversations, settings) — sync, fast.
 * - SecureStore for the API key — never in MMKV, never in the store,
 *   never logged.
 */
export const kv = createMMKV({ id: 'peregrine.v1' });

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = kv.getString(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    kv.set(key, JSON.stringify(value));
  } catch {
    // Persisting is best-effort; the UI must never crash on storage.
  }
}

const API_KEY_STORE = 'peregrine.apiKey';

let keyCache: string | null = null;

export async function getApiKey(): Promise<string> {
  if (keyCache !== null) return keyCache;
  try {
    keyCache = (await SecureStore.getItemAsync(API_KEY_STORE)) ?? '';
  } catch {
    keyCache = '';
  }
  return keyCache;
}

export async function setApiKey(value: string): Promise<void> {
  keyCache = value;
  try {
    if (value) {
      await SecureStore.setItemAsync(API_KEY_STORE, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } else {
      await SecureStore.deleteItemAsync(API_KEY_STORE);
    }
  } catch {
    // Keychain can fail on simulators without credentials — keep going.
  }
}

export function hasApiKeySync(): boolean {
  return keyCache !== null && keyCache.length > 0;
}

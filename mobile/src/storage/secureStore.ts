import { APP_CONFIG } from "../constants/config";

let SecureStore: any = null;
try {
  SecureStore = require("expo-secure-store");
} catch {
  SecureStore = null;
}

let Platform: any = { OS: "web" };
try {
  Platform = require("react-native").Platform;
} catch {
  Platform = { OS: "node" };
}

// In-memory fallback for web and node testing environments
const memoryFallback = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web" || Platform.OS === "node" || !SecureStore?.setItemAsync) {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // Fallback to memory
      }
    }
    memoryFallback.set(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web" || Platform.OS === "node" || !SecureStore?.getItemAsync) {
    if (typeof localStorage !== "undefined") {
      try {
        return localStorage.getItem(key);
      } catch {
        // Fallback to memory
      }
    }
    return memoryFallback.get(key) || null;
  }

  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web" || Platform.OS === "node" || !SecureStore?.deleteItemAsync) {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(key);
      } catch {
        // Fallback
      }
    }
    memoryFallback.delete(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export const TokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      setItem(APP_CONFIG.TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      setItem(APP_CONFIG.TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return await getItem(APP_CONFIG.TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return await getItem(APP_CONFIG.TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  },

  async saveUser(user: any): Promise<void> {
    await setItem(APP_CONFIG.TOKEN_STORAGE_KEYS.SESSION_USER, JSON.stringify(user));
  },

  async getUser<T = any>(): Promise<T | null> {
    const raw = await getItem(APP_CONFIG.TOKEN_STORAGE_KEYS.SESSION_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      deleteItem(APP_CONFIG.TOKEN_STORAGE_KEYS.ACCESS_TOKEN),
      deleteItem(APP_CONFIG.TOKEN_STORAGE_KEYS.REFRESH_TOKEN),
      deleteItem(APP_CONFIG.TOKEN_STORAGE_KEYS.SESSION_USER),
    ]);
  },
};

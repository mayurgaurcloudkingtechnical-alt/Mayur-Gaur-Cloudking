let Platform: any = { OS: "web" };
try {
  Platform = require("react-native").Platform;
} catch {
  Platform = { OS: "node" };
}

let Constants: any = {};
try {
  Constants = require("expo-constants").default || require("expo-constants");
} catch {
  Constants = {};
}

function resolveApiBaseUrl(): string {
  // 1. Explicit environment variable configured in mobile .env
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, "");
  }

  // 2. Expo debugger host / localhost fallback for dev
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:3000`;
  }

  // 3. Android Emulator vs iOS Simulator default
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
}

export const APP_CONFIG = {
  APP_NAME: "SOFTLAB GLOBAL LMS",
  APP_VERSION: "1.0.0",
  API_BASE_URL: resolveApiBaseUrl(),
  TOKEN_STORAGE_KEYS: {
    ACCESS_TOKEN: "slg_access_token",
    REFRESH_TOKEN: "slg_refresh_token",
    SESSION_USER: "slg_session_user",
  },
};

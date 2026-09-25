export interface DeviceMetadata {
  deviceId?: string;
  deviceName?: string;
  platform: "ANDROID" | "IOS" | "WINDOWS" | "MACOS" | "DESKTOP" | "OTHER";
}

let Platform: any = { OS: "web" };
try {
  Platform = require("react-native").Platform;
} catch {
  Platform = { OS: "node" };
}

let Device: any = {};
try {
  Device = require("expo-device");
} catch {
  Device = {};
}

export function getDeviceMetadata(): DeviceMetadata {
  let platform: DeviceMetadata["platform"] = "OTHER";

  if (Platform.OS === "android") {
    platform = "ANDROID";
  } else if (Platform.OS === "ios") {
    platform = "IOS";
  } else if (Platform.OS === "windows") {
    platform = "WINDOWS";
  } else if (Platform.OS === "macos") {
    platform = "MACOS";
  } else if (Platform.OS === "web") {
    platform = "DESKTOP";
  }

  const deviceName = Device?.modelName || Device?.deviceName || `${Platform.OS} Device`;
  const deviceId = Device?.osInternalBuildId || undefined;

  return {
    deviceId,
    deviceName,
    platform,
  };
}

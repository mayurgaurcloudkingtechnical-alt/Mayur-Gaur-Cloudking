export const colors = {
  primary: "#10B981", // SoftLab Emerald Green
  primaryDark: "#059669",
  primaryLight: "#D1FAE5",
  primaryMuted: "#ECFDF5",
  
  slate900: "#0F172A",
  slate800: "#1E293B",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",

  background: "#F8FAFC",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  error: "#EF4444",
  errorLight: "#FEE2E2",
  errorText: "#991B1B",

  warning: "#F59E0B",
  warningLight: "#FEF3C7",

  success: "#10B981",
  successLight: "#D1FAE5",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.textPrimary },
  bodyMedium: { fontSize: 15, fontWeight: "500" as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: "400" as const, color: colors.textSecondary },
  small: { fontSize: 11, fontWeight: "500" as const, color: colors.textMuted },
  button: { fontSize: 16, fontWeight: "600" as const, color: colors.textInverse },
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};

export const theme = {
  colors: {
    ...colors,
    text: colors.textPrimary,
  },
  spacing,
  typography: {
    ...typography,
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
      xxl: 28,
    },
  },
  borderRadius: radius,
  radius,
};

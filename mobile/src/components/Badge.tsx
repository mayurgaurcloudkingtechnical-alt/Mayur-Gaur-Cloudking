import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../constants/theme";

interface BadgeProps {
  label: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "default" | "info";
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = "primary" }) => {
  const getColors = () => {
    switch (variant) {
      case "success":
        return { bg: colors.successLight, text: colors.primaryDark };
      case "warning":
        return { bg: colors.warningLight, text: "#B45309" };
      case "error":
        return { bg: colors.errorLight, text: colors.errorText };
      case "secondary":
      case "default":
        return { bg: colors.slate100, text: colors.slate700 };
      case "info":
        return { bg: "#EFF6FF", text: "#1D4ED8" };
      default:
        return { bg: colors.primaryLight, text: colors.primaryDark };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  text: {
    ...typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

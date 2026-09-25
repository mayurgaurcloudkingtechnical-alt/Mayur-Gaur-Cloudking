import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius, spacing, typography } from "../constants/theme";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  text: {
    ...typography.caption,
    color: colors.errorText,
    flex: 1,
    fontWeight: "500",
  },
  closeBtn: {
    paddingLeft: spacing.sm,
  },
  closeText: {
    fontSize: 16,
    color: colors.errorText,
    fontWeight: "700",
  },
});

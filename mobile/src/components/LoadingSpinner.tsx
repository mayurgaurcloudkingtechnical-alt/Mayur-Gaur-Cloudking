import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../constants/theme";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, fullScreen }) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  fullScreen: {
    flex: 1,
    minHeight: 250,
  },
  message: {
    ...typography.caption,
    marginTop: spacing.md,
    color: colors.slate600,
  },
});

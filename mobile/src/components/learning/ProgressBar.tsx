import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface ProgressBarProps {
  progressPercent: number; // 0 to 100
  showLabel?: boolean;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercent,
  showLabel = true,
  height = 8,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progressPercent)));

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${clamped}%`, height }]} />
      </View>
      {showLabel && (
        <Text style={styles.label}>{clamped}% Completed</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  },
  track: {
    width: '100%',
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
});

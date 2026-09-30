import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface QuizTimerProps {
  startedAt: string | Date;
  durationMinutes: number;
  onTimeout: () => void;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  startedAt,
  durationMinutes,
  onTimeout,
}) => {
  const calculateRemainingSeconds = () => {
    const startMs = new Date(startedAt).getTime();
    const totalSecs = durationMinutes * 60;
    const elapsedSecs = Math.floor((Date.now() - startMs) / 1000);
    return Math.max(0, totalSecs - elapsedSecs);
  };

  const [secondsRemaining, setSecondsRemaining] = useState<number>(calculateRemainingSeconds);
  const timeoutTriggeredRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setSecondsRemaining(remaining);

      if (remaining <= 0 && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
        clearInterval(timer);
        onTimeout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAt, durationMinutes, onTimeout]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isLowTime = secondsRemaining <= 60;
  const isWarning = secondsRemaining <= 300 && !isLowTime;

  return (
    <View
      style={[
        styles.container,
        isWarning && styles.containerWarning,
        isLowTime && styles.containerDanger,
      ]}
    >
      <Text style={styles.icon}>⏱</Text>
      <Text
        style={[
          styles.text,
          isWarning && styles.textWarning,
          isLowTime && styles.textDanger,
        ]}
      >
        {timeFormatted}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  containerWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  containerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  icon: {
    fontSize: 12,
  },
  text: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  textWarning: {
    color: '#F59E0B',
  },
  textDanger: {
    color: '#EF4444',
  },
});

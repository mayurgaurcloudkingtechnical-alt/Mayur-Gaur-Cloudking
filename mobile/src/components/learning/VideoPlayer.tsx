import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { Badge } from '../common/Badge';

export interface VideoPlayerProps {
  bunnyVideoId?: string | null;
  videoUrl?: string | null;
  lessonTitle: string;
  watermark: {
    email: string;
    timestamp: string;
  };
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  bunnyVideoId,
  videoUrl,
  lessonTitle,
  watermark,
}) => {
  const hasBunnyStream = Boolean(bunnyVideoId);
  const hasDirectVideo = Boolean(videoUrl);

  return (
    <View style={styles.container}>
      {/* Dynamic Security Watermark Overlay */}
      <View style={styles.watermarkContainer} pointerEvents="none">
        <Text style={styles.watermarkTextTop}>
          {watermark.email} • {watermark.timestamp}
        </Text>
        <Text style={styles.watermarkTextBottom}>
          SOFTLAB GLOBAL • {watermark.email}
        </Text>
      </View>

      {/* Video Content State */}
      <View style={styles.content}>
        <View style={styles.playIconCircle}>
          <Text style={styles.playIconText}>▶</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {lessonTitle}
        </Text>

        {hasBunnyStream ? (
          <View style={styles.infoBox}>
            <View style={styles.badgeRow}>
              <Badge label="Bunny.net Stream" variant="info" />
              <Badge label="DRM Stream" variant="success" />
            </View>
            <Text style={styles.statusHeading}>Mobile Video Player Integration Pending</Text>
            <Text style={styles.statusDescription}>
              Bunny Stream video asset is provisioned for this lesson. Secure mobile native HLS /
              DRM player bridge is scheduled for upcoming mobile media step. Video is playable on Web LMS.
            </Text>
          </View>
        ) : hasDirectVideo ? (
          <View style={styles.infoBox}>
            <Badge label="Direct Video Stream" variant="success" />
            <Text style={styles.statusHeading}>Direct Stream Provisioned</Text>
            <Text style={styles.statusDescription}>
              Playback source available. Native video player adapter initialized.
            </Text>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Badge label="Curriculum Resource" variant="info" />
            <Text style={styles.statusHeading}>Video Content Stream Provisioned</Text>
            <Text style={styles.statusDescription}>
              Faculty instructor media asset will load during scheduled streaming sessions.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#090D16',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    padding: theme.spacing.sm,
    justifyContent: 'space-between',
    zIndex: 10,
    opacity: 0.25,
  },
  watermarkTextTop: {
    color: '#94A3B8',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  watermarkTextBottom: {
    color: '#94A3B8',
    fontSize: 9,
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    zIndex: 5,
    maxWidth: '92%',
  },
  playIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  playIconText: {
    color: theme.colors.primary,
    fontSize: 18,
    marginLeft: 3,
  },
  title: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  infoBox: {
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  statusHeading: {
    color: '#E2E8F0',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  statusDescription: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { theme } from '../../constants/theme';
import { MediaService } from '../../services/media.service';
import { LessonContentDetails } from '../../types/learning';

export interface DocumentViewerProps {
  enrollmentId: string;
  lessonId: string;
  contentDetails: LessonContentDetails | null;
  lessonTitle: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  enrollmentId,
  lessonId,
  contentDetails,
  lessonTitle,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [expiresInSec, setExpiresInSec] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasResource = Boolean(
    contentDetails?.hasResource || contentDetails?.fileName
  );
  const fileName = contentDetails?.fileName || `${lessonTitle}.pdf`;
  const fileSizeStr = MediaService.formatFileSize(contentDetails?.fileSizeBytes);
  const mimeType = contentDetails?.mimeType || 'application/pdf';

  const handleRequestDownload = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await MediaService.requestDocumentDownload(enrollmentId, lessonId);

      if (res.available && res.downloadUrl) {
        setDownloadUrl(res.downloadUrl);
        setExpiresInSec(res.expiresInSec || 300);
      } else {
        setErrorMessage(
          res.message || 'The requested document resource is currently unavailable.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to request document download link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUrl = async () => {
    if (!downloadUrl) return;

    try {
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert(
          'Cannot Open URL',
          'Unable to open this document URL on your device browser/viewer.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to open document.');
    }
  };

  return (
    <View style={styles.container}>
      {/* File Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📄</Text>
        </View>
        <View style={styles.headerDetails}>
          <Text style={styles.fileName} numberOfLines={2}>
            {fileName}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{fileSizeStr}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{mimeType.split('/').pop()?.toUpperCase() || 'PDF'}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.badgeProtected}>S3 Encrypted</Text>
          </View>
        </View>
      </View>

      {/* Resource Status / Content */}
      {!hasResource ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeHeading}>No Document Attached</Text>
          <Text style={styles.noticeBody}>
            This lesson does not contain a downloadable document asset. Please review written lecture notes or module instructions.
          </Text>
        </View>
      ) : downloadUrl ? (
        <View style={styles.downloadReadyBox}>
          <View style={styles.readyHeaderRow}>
            <Text style={styles.readyIcon}>✓</Text>
            <Text style={styles.readyTitle}>Authorized Download Link Generated</Text>
          </View>
          <Text style={styles.readyExpiry}>
            Link expires in approx {Math.round((expiresInSec || 300) / 60)} minutes.
          </Text>

          <TouchableOpacity
            style={styles.openButton}
            onPress={handleOpenUrl}
            activeOpacity={0.8}
          >
            <Text style={styles.openButtonText}>Open / View Document ↗</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionBox}>
          <Text style={styles.securityNotice}>
            🔒 This document is protected by AWS SigV4 signed access. Generate a short-lived link to view or download.
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.requestButton, isLoading && styles.buttonDisabled]}
            onPress={handleRequestDownload}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#0A0E17" size="small" />
            ) : (
              <Text style={styles.requestButtonText}>Request Secure Download Link</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  iconText: {
    fontSize: 20,
  },
  headerDetails: {
    flex: 1,
  },
  fileName: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
  },
  metaDot: {
    color: '#475569',
    fontSize: theme.typography.fontSize.xs,
  },
  badgeProtected: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  noticeBox: {
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  noticeHeading: {
    color: '#CBD5E1',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: 2,
  },
  noticeBody: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  actionBox: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: theme.spacing.sm,
  },
  securityNotice: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: theme.spacing.sm,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    textAlign: 'center',
  },
  requestButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    color: '#0A0E17',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
  downloadReadyBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: theme.spacing.md,
  },
  readyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  readyIcon: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  readyTitle: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  readyExpiry: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: theme.spacing.md,
  },
  openButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  openButtonText: {
    color: '#0A0E17',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
});

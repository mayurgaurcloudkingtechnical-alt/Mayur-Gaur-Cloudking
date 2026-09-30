import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Linking,
  Share,
} from 'react-native';
import { certificateApi } from '../api/certificate';
import { StudentCertificate } from '../types/certificate';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';

interface CertificateScreenProps {
  onBack: () => void;
  initialCertificateId?: string;
  courseId?: string;
}

export const CertificateScreen: React.FC<CertificateScreenProps> = ({
  onBack,
  initialCertificateId,
  courseId,
}) => {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [selectedCertId, setSelectedCertId] = useState<string | null>(initialCertificateId || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      setError(null);
      const res = await certificateApi.getMyCertificates();
      setCertificates(res);

      if (res.length > 0) {
        if (initialCertificateId) {
          const match = res.find((c) => c.id === initialCertificateId);
          setSelectedCertId(match ? match.id : res[0].id);
        } else if (courseId) {
          const match = res.find((c) => c.courseId === courseId);
          setSelectedCertId(match ? match.id : res[0].id);
        } else if (!selectedCertId) {
          setSelectedCertId(res[0].id);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve your credentials. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialCertificateId, courseId, selectedCertId]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCertificates();
  };

  const activeCert = certificates.find((c) => c.id === selectedCertId) || certificates[0];

  const handleOpenVerification = async (certNo: string) => {
    const url = `https://www.softlabglobal.com/verify/certificate/${encodeURIComponent(certNo)}`;
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleShareCredential = async (cert: StudentCertificate) => {
    try {
      const url = `https://www.softlabglobal.com/verify/certificate/${encodeURIComponent(cert.certificateNo)}`;
      await Share.share({
        title: `SOFTLAB GLOBAL Certificate: ${cert.course.title}`,
        message: `I have earned an official verified certificate for "${cert.course.title}" from SOFTLAB GLOBAL!\n\nCertificate No: ${cert.certificateNo}\nVerify here: ${url}`,
        url,
      });
    } catch (err) {
      // User dismissed share dialog
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your verified credentials..." fullScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      {/* Navigation Header */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Official Credentials</Text>
        <Text style={styles.screenSubtitle}>
          Cryptographically verifiable certificates issued by SOFTLAB GLOBAL
        </Text>
      </View>

      {error && (
        <View style={styles.errorSection}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <Button title="Retry" onPress={fetchCertificates} variant="outline" style={{ marginTop: theme.spacing.sm }} />
        </View>
      )}

      {/* Empty State */}
      {(!certificates || certificates.length === 0) && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <Text style={styles.emptyTitle}>No Certificates Earned Yet</Text>
          <Text style={styles.emptyDescription}>
            Complete 100% of curriculum lessons and pass all required assessments to automatically unlock your official certificate.
          </Text>
          <Button
            title="Return to My Courses"
            onPress={onBack}
            variant="primary"
            style={{ marginTop: theme.spacing.md }}
          />
        </Card>
      )}

      {/* Certificate Selector Pills if student has > 1 */}
      {certificates.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
          contentContainerStyle={styles.pillContainer}
        >
          {certificates.map((cert) => {
            const isSelected = cert.id === activeCert?.id;
            return (
              <TouchableOpacity
                key={cert.id}
                onPress={() => setSelectedCertId(cert.id)}
                style={[styles.certPill, isSelected && styles.activeCertPill]}
                activeOpacity={0.8}
              >
                <Text style={[styles.certPillText, isSelected && styles.activeCertPillText]} numberOfLines={1}>
                  {cert.course.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Verifiable Certificate Card */}
      {activeCert && (
        <View style={styles.certificateWrapper}>
          <View style={styles.certificateBorder}>
            <Card style={styles.certificateBody}>
              {/* Seal Watermark & Header */}
              <View style={styles.certHeader}>
                <View style={styles.academyLogoRow}>
                  <Text style={styles.academyLogoIcon}>🎖</Text>
                  <Text style={styles.academyBrand}>SOFTLAB GLOBAL</Text>
                </View>
                <Text style={styles.academySubBrand}>
                  Center for Advanced Technology & Professional Excellence
                </Text>
                <View style={styles.divider} />
                <Text style={styles.certHeading}>Certificate of Completion</Text>
              </View>

              {/* Recipient */}
              <View style={styles.certRecipientSection}>
                <Text style={styles.proudlyPresentedText}>This is proudly conferred upon</Text>
                <Text style={styles.recipientCourseTitle}>
                  {activeCert.course.title}
                </Text>
                <Text style={styles.completionStatement}>
                  for successfully satisfying all practical coursework, assessments, and curriculum standards.
                </Text>
              </View>

              {/* Status & Credential Info */}
              <View style={styles.metadataGrid}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Credential ID:</Text>
                  <Text style={styles.metaValueMono}>{activeCert.certificateNo}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Issued Date:</Text>
                  <Text style={styles.metaValue}>
                    {new Date(activeCert.issuedDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Status:</Text>
                  <Badge
                    label={activeCert.status === 'VALID' ? 'Authentic & Valid' : 'Revoked'}
                    variant={activeCert.status === 'VALID' ? 'success' : 'error'}
                  />
                </View>
              </View>

              {/* QR Code Verification Section */}
              <View style={styles.verificationSection}>
                {activeCert.qrCodeData ? (
                  <Image
                    source={{ uri: activeCert.qrCodeData }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.qrFallback}>
                    <Text style={styles.qrFallbackIcon}>🛡</Text>
                    <Text style={styles.qrFallbackText}>Verified Credential</Text>
                  </View>
                )}
                <View style={styles.verificationInfo}>
                  <Text style={styles.securityTitle}>Official Digital Verification</Text>
                  <Text style={styles.securityDescription}>
                    Scan this code or click below to verify authentic issuance on the SOFTLAB GLOBAL registry.
                  </Text>
                </View>
              </View>

              {/* Signatory Footer */}
              <View style={styles.signatorySection}>
                <View style={styles.signatoryBlock}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatoryName}>
                    {activeCert.signatoryName || 'Director of Academic Affairs'}
                  </Text>
                  <Text style={styles.signatoryTitle}>
                    {activeCert.signatoryTitle || 'Authorized Signatory, SOFTLAB GLOBAL'}
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <Button
              title="Verify Credential ↗"
              onPress={() => handleOpenVerification(activeCert.certificateNo)}
              variant="primary"
              style={styles.actionButton}
            />
            <Button
              title="Share Credential 📤"
              onPress={() => handleShareCredential(activeCert)}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  backBtn: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  backBtnText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: theme.spacing.md,
  },
  screenTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '800',
    color: theme.colors.text,
  },
  screenSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  errorSection: {
    marginBottom: theme.spacing.md,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  pillScroll: {
    marginBottom: theme.spacing.md,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  certPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    maxWidth: 200,
  },
  activeCertPill: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  certPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
  },
  activeCertPillText: {
    color: '#FFFFFF',
  },
  certificateWrapper: {
    marginTop: theme.spacing.xs,
  },
  certificateBorder: {
    borderWidth: 4,
    borderColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  certificateBody: {
    padding: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  academyLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  academyLogoIcon: {
    fontSize: 22,
  },
  academyBrand: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#0F172A',
  },
  academySubBrand: {
    fontSize: 9,
    letterSpacing: 1,
    color: '#64748B',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginVertical: theme.spacing.sm,
  },
  certHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  certRecipientSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  proudlyPresentedText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  recipientCourseTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    marginVertical: 4,
  },
  completionStatement: {
    fontSize: theme.typography.fontSize.xs,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  metadataGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: '#64748B',
  },
  metaValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: '#0F172A',
  },
  metaValueMono: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: theme.colors.primary,
  },
  verificationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginVertical: theme.spacing.sm,
  },
  qrImage: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
  },
  qrFallback: {
    width: 80,
    height: 80,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFallbackIcon: {
    fontSize: 24,
  },
  qrFallbackText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  verificationInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: '#0F172A',
  },
  securityDescription: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginTop: 2,
  },
  signatorySection: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  signatoryBlock: {
    alignItems: 'center',
    width: '80%',
  },
  signatureLine: {
    height: 1,
    backgroundColor: '#94A3B8',
    width: '100%',
    marginBottom: 6,
  },
  signatoryName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: '#0F172A',
  },
  signatoryTitle: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

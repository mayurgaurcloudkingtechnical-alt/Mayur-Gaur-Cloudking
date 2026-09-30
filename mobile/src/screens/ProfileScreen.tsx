import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { learningService } from '../api/learning';
import { deviceApi } from '../api/device';
import { getDeviceMetadata } from '../services/device.service';
import { StudentProfileData } from '../types/learning';
import { UserDeviceSessionItem } from '../types/device';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';

interface ProfileScreenProps {
  onBack?: () => void;
  onNavigateToCertificates?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToNotifications?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onNavigateToCertificates,
  onNavigateToHistory,
  onNavigateToNotifications,
}) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [sessions, setSessions] = useState<UserDeviceSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const localDevice = getDeviceMetadata();

  const fetchProfileAndSessions = useCallback(async () => {
    try {
      setError(null);
      const [profileRes, sessionsRes] = await Promise.allSettled([
        learningService.getStudentProfile(),
        deviceApi.getMySessions(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value);
      }
      if (sessionsRes.status === 'fulfilled') {
        setSessions(sessionsRes.value);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileAndSessions();
  }, [fetchProfileAndSessions]);

  const handleRevokeSession = (sessionId: string, deviceName?: string | null) => {
    Alert.alert(
      'Revoke Session',
      `Are you sure you want to disconnect ${deviceName || 'this session'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              setRevokingId(sessionId);
              await deviceApi.revokeSession(sessionId);
              setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed to revoke session';
              Alert.alert('Error', msg);
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of SoftLab Global LMS?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <LoadingSpinner message="Loading student account..." fullScreen />;
  }

  const studentName = profile?.user
    ? `${profile.user.firstName} ${profile.user.lastName}`
    : user?.name || 'Student';
  const email = profile?.user?.email || user?.email || 'N/A';
  const phone = profile?.user?.phone || 'Not Registered';
  const studentId = profile?.studentId || 'Pending Verification';
  const campus = profile?.center || 'SOFTLAB GLOBAL Main Campus, Prayagraj';
  const degree = profile?.highestDegree || 'Graduate';

  // Identify current session and other active sessions
  const currentSession = sessions.find((s) => s.isCurrentSession) || sessions[0];
  const otherSessions = sessions.filter((s) => s.id !== currentSession?.id);

  const formatSessionTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Active recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Active';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header */}
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      )}

      {/* Avatar & Name Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(studentName[0] || 'S').toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{studentName}</Text>
        <Badge label={user?.roleCode || 'STUDENT'} variant="success" />
      </View>

      {error && <ErrorBanner message={error} />}

      {/* SECTION 1: ACCOUNT */}
      <Text style={styles.sectionCategoryHeader}>ACCOUNT</Text>

      {/* Academic Identity */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Profile & Academic Identity</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Student ID</Text>
          <Text style={styles.fieldValueBold}>{studentId}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <Text style={styles.fieldValue}>{email}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <Text style={styles.fieldValue}>{phone}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Academic Center</Text>
          <Text style={styles.fieldValue}>{campus}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Highest Qualification</Text>
          <Text style={styles.fieldValue}>{degree}</Text>
        </View>
      </Card>

      {/* Quick Links: Notifications, Certificates, History */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Learning Activities & Alerts</Text>

        {onNavigateToNotifications && (
          <>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={onNavigateToNotifications}
              activeOpacity={0.7}
            >
              <View style={styles.actionRowLeft}>
                <Text style={styles.actionIcon}>🔔</Text>
                <View>
                  <Text style={styles.actionTitle}>Notifications</Text>
                  <Text style={styles.actionSubtitle}>Course notices, fee receipts, and exam alerts</Text>
                </View>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
          </>
        )}

        {onNavigateToCertificates && (
          <>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={onNavigateToCertificates}
              activeOpacity={0.7}
            >
              <View style={styles.actionRowLeft}>
                <Text style={styles.actionIcon}>🏆</Text>
                <View>
                  <Text style={styles.actionTitle}>Official Certificates</Text>
                  <Text style={styles.actionSubtitle}>View and verify awarded course credentials</Text>
                </View>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
          </>
        )}

        {onNavigateToHistory && (
          <TouchableOpacity
            style={styles.actionRow}
            onPress={onNavigateToHistory}
            activeOpacity={0.7}
          >
            <View style={styles.actionRowLeft}>
              <Text style={styles.actionIcon}>⏱</Text>
              <View>
                <Text style={styles.actionTitle}>Learning History</Text>
                <Text style={styles.actionSubtitle}>Coursework, quizzes, and completed timeline</Text>
              </View>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Enrolled Programs */}
      {profile?.enrollments && profile.enrollments.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Enrolled Programs</Text>
          {profile.enrollments.map((enr) => (
            <View key={enr.id} style={styles.enrollmentItem}>
              <Text style={styles.courseName}>{enr.course.title}</Text>
              {enr.batch && (
                <Text style={styles.batchName}>
                  {enr.batch.name} ({enr.batch.code})
                </Text>
              )}
            </View>
          ))}
        </Card>
      )}

      {/* SECTION 2: SECURITY & DEVICE MANAGEMENT */}
      <Text style={styles.sectionCategoryHeader}>SECURITY</Text>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Current Device & Session</Text>

        <View style={styles.deviceRow}>
          <View style={styles.deviceIconCircle}>
            <Text style={styles.deviceIconText}>📱</Text>
          </View>
          <View style={styles.deviceInfo}>
            <View style={styles.deviceNameRow}>
              <Text style={styles.deviceName}>
                {currentSession?.deviceName || localDevice.deviceName || 'Mobile Device'}
              </Text>
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>This Device</Text>
              </View>
            </View>
            <Text style={styles.deviceMeta}>
              Platform: {currentSession?.platform || localDevice.platform}
            </Text>
            <Text style={styles.deviceMeta}>
              Last active: {formatSessionTime(currentSession?.lastUsedAt || currentSession?.createdAt)}
            </Text>
          </View>
        </View>

        {/* Other Active Sessions */}
        {otherSessions.length > 0 && (
          <View style={styles.otherSessionsContainer}>
            <View style={styles.divider} />
            <Text style={styles.subSectionTitle}>Other Active Sessions ({otherSessions.length})</Text>
            {otherSessions.map((s) => (
              <View key={s.id} style={styles.otherSessionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.otherSessionName}>{s.deviceName || 'Other Device'}</Text>
                  <Text style={styles.deviceMeta}>Platform: {s.platform || 'Unknown'}</Text>
                  <Text style={styles.deviceMeta}>Active: {formatSessionTime(s.lastUsedAt || s.createdAt)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.revokeBtn}
                  onPress={() => handleRevokeSession(s.id, s.deviceName)}
                  disabled={revokingId === s.id}
                >
                  {revokingId === s.id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Text style={styles.revokeBtnText}>Revoke</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* SECTION 3: APP INFO */}
      <Text style={styles.sectionCategoryHeader}>APP</Text>

      <Card style={styles.sectionCard}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Application</Text>
          <Text style={styles.fieldValue}>SoftLab Global Mobile LMS</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Version</Text>
          <Text style={styles.fieldValue}>v1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Campus</Text>
          <Text style={styles.fieldValue}>Prayagraj Main Center</Text>
        </View>
      </Card>

      {/* Sign Out Card */}
      <View style={styles.footerSection}>
        <Button
          title="Sign Out of LMS"
          onPress={handleLogout}
          variant="danger"
          loading={loggingOut}
        />
        <Text style={styles.versionNote}>
          Secure JWT Native Session • SoftLab Global LMS
        </Text>
      </View>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionCategoryHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: 4,
  },
  sectionCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    flex: 1,
  },
  fieldValue: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  fieldValueBold: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '700',
    flex: 1.5,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.text,
  },
  actionSubtitle: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  arrowIcon: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    fontWeight: '700',
    marginLeft: theme.spacing.xs,
  },
  enrollmentItem: {
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  courseName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
  },
  batchName: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  deviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceIconText: {
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  deviceName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.text,
  },
  currentBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '700',
  },
  deviceMeta: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  otherSessionsContainer: {
    marginTop: 8,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginVertical: 6,
  },
  otherSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  otherSessionName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
  },
  revokeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  revokeBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  footerSection: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  versionNote: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
});

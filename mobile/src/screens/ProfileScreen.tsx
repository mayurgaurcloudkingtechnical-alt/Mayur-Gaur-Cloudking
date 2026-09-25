import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { learningService } from '../api/learning';
import { StudentProfileData } from '../types/learning';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';

interface ProfileScreenProps {
  onBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const res = await learningService.getStudentProfile();
      setProfile(res);
    } catch (err: any) {
      // Fallback: we still have context user
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    return <LoadingSpinner message="Loading your student profile..." fullScreen />;
  }

  const studentName = profile?.user
    ? `${profile.user.firstName} ${profile.user.lastName}`
    : user?.name || 'Student';
  const email = profile?.user?.email || user?.email || 'N/A';
  const phone = profile?.user?.phone || 'Not Registered';
  const studentId = profile?.studentId || 'Pending Verification';
  const campus = profile?.center || 'SOFTLAB GLOBAL Main Campus, Prayagraj';
  const degree = profile?.highestDegree || 'Graduate';

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
          <Text style={styles.avatarText}>
            {(studentName[0] || 'S').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{studentName}</Text>
        <Badge label={user?.roleCode || 'STUDENT'} variant="success" />
      </View>

      {error && <ErrorBanner message={error} />}

      {/* Identity & Academic Information Card */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Academic Identity</Text>

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

      {/* Active Enrollments Card */}
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

      {/* Sign Out Card */}
      <View style={styles.footerSection}>
        <Button
          title="Sign Out of LMS"
          onPress={handleLogout}
          variant="danger"
          loading={loggingOut}
        />
        <Text style={styles.versionNote}>
          SoftLab Global Mobile LMS • v1.0.0
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
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
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

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { StudentDashboardScreen } from '../screens/StudentDashboardScreen';
import { MyCoursesScreen } from '../screens/MyCoursesScreen';
import { CourseDetailsScreen } from '../screens/CourseDetailsScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { theme } from '../constants/theme';

type Tab = 'dashboard' | 'courses' | 'profile';

type ScreenState =
  | { type: 'tab'; tab: Tab }
  | { type: 'course-details'; enrollmentId: string; fromTab: Tab }
  | { type: 'lesson'; enrollmentId: string; lessonId?: string; fromTab: Tab };

export const RootNavigator: React.FC = () => {
  const { status, user, logout } = useAuth();
  const [screen, setScreen] = useState<ScreenState>({ type: 'tab', tab: 'dashboard' });
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Connecting to SOFTLAB GLOBAL..." fullScreen />
      </View>
    );
  }

  if (status !== 'authenticated') {
    return <LoginScreen />;
  }

  const isStudentOrAdmin =
    user?.roleCode === 'STUDENT' || user?.roleCode === 'SUPER_ADMIN';

  // Role Safety: Non-student users (e.g. TRAINER, HR, ACCOUNTANT)
  if (!isStudentOrAdmin && !showDiagnostic) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.roleSafetyContainer}>
          <Card style={styles.roleCard}>
            <View style={styles.roleHeader}>
              <Text style={styles.roleGreeting}>Hello, {user?.firstName}!</Text>
              <Badge label={user?.roleCode || 'STAFF'} variant="warning" />
            </View>
            <Text style={styles.roleNoticeTitle}>Student Mobile Portal</Text>
            <Text style={styles.roleNoticeBody}>
              This mobile application core is specifically tailored for enrolled student learning.
              Your administrative / staff console is fully available on the Web LMS portal.
            </Text>
            <Button
              title="View Security & Account Info"
              onPress={() => setShowDiagnostic(true)}
              variant="outline"
              style={{ marginTop: theme.spacing.md }}
            />
            <Button
              title="Sign Out"
              onPress={logout}
              variant="danger"
              style={{ marginTop: theme.spacing.sm }}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (showDiagnostic) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.diagnosticHeader}>
          <TouchableOpacity
            onPress={() => setShowDiagnostic(false)}
            style={styles.diagBackBtn}
          >
            <Text style={styles.diagBackText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <HomeScreen />
      </SafeAreaView>
    );
  }

  // Active Tab / Stack resolution for Student / SuperAdmin
  const activeTab: Tab = screen.type === 'tab' ? screen.tab : screen.fromTab;

  const navigateToTab = (tab: Tab) => {
    setScreen({ type: 'tab', tab });
  };

  const navigateToCourseDetails = (enrollmentId: string) => {
    setScreen({ type: 'course-details', enrollmentId, fromTab: activeTab });
  };

  const navigateToLesson = (enrollmentId: string, lessonId?: string) => {
    setScreen({ type: 'lesson', enrollmentId, lessonId, fromTab: activeTab });
  };

  const navigateBack = () => {
    if (screen.type === 'lesson') {
      setScreen({
        type: 'course-details',
        enrollmentId: screen.enrollmentId,
        fromTab: screen.fromTab,
      });
    } else if (screen.type === 'course-details') {
      setScreen({ type: 'tab', tab: screen.fromTab });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Container */}
      <View style={styles.mainContent}>
        {screen.type === 'tab' && screen.tab === 'dashboard' && (
          <StudentDashboardScreen
            onNavigateToCourses={() => navigateToTab('courses')}
            onNavigateToCourseDetails={navigateToCourseDetails}
            onNavigateToLesson={navigateToLesson}
            onNavigateToProfile={() => navigateToTab('profile')}
          />
        )}

        {screen.type === 'tab' && screen.tab === 'courses' && (
          <MyCoursesScreen onSelectCourse={navigateToCourseDetails} />
        )}

        {screen.type === 'tab' && screen.tab === 'profile' && (
          <ProfileScreen onBack={() => navigateToTab('dashboard')} />
        )}

        {screen.type === 'course-details' && (
          <CourseDetailsScreen
            enrollmentId={screen.enrollmentId}
            onBack={navigateBack}
            onOpenLesson={navigateToLesson}
          />
        )}

        {screen.type === 'lesson' && (
          <LessonScreen
            enrollmentId={screen.enrollmentId}
            lessonId={screen.lessonId}
            onBackToCourse={navigateBack}
            onNavigateToLesson={navigateToLesson}
          />
        )}
      </View>

      {/* Bottom Tab Bar (shown when in primary tab navigation) */}
      {screen.type === 'tab' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateToTab('dashboard')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'dashboard' && styles.activeTabIcon,
              ]}
            >
              ⌂
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'dashboard' && styles.activeTabLabel,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateToTab('courses')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'courses' && styles.activeTabIcon,
              ]}
            >
              📖
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'courses' && styles.activeTabLabel,
              ]}
            >
              My Courses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateToTab('profile')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'profile' && styles.activeTabIcon,
              ]}
            >
              👤
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'profile' && styles.activeTabLabel,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  activeTabIcon: {
    color: theme.colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  activeTabLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  roleSafetyContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  roleCard: {
    padding: theme.spacing.lg,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  roleGreeting: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  roleNoticeTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  roleNoticeBody: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  diagnosticHeader: {
    padding: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  diagBackBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  diagBackText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

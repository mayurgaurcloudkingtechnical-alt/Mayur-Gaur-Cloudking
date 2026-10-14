import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { UserProfile } from "./types/electron";
import LoginScreen from "./components/LoginScreen";
import { SoftlabLogo } from "./components/common/SoftlabLogo";
import { AppShell, NavView } from "./components/layout/AppShell";
import { DashboardView } from "./views/DashboardView";
import { MyCoursesView } from "./views/MyCoursesView";
import { CourseDetailsView } from "./views/CourseDetailsView";
import { LessonViewerView } from "./views/LessonViewerView";
import { ExamsView } from "./views/ExamsView";
import { ExamRunnerView } from "./views/ExamRunnerView";
import { ProfileView } from "./views/ProfileView";
import {
  setInMemoryAccessToken,
  registerAuthFailureHandler,
  setApiBaseUrl,
} from "./api/client";

// SoftLab Global LMS Windows Desktop Application
// Enforces Electron Security: Context Isolation, Node Integration disabled, Sandbox

export default function App() {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  // Desktop Navigation State
  const [currentView, setCurrentView] = useState<NavView>("DASHBOARD");
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen for auth failures in API client
    registerAuthFailureHandler(() => {
      setInMemoryAccessToken(null);
      setAuthenticatedUser(null);
      setSessionExpiredMessage("Your session has expired or was revoked. Please log in again.");
      setCurrentView("DASHBOARD");
    });

    // 2. Perform startup session restoration
    const initializeDesktopSession = async () => {
      try {
        if (window.electronAPI) {
          // Resolve backend URL
          const backendUrl = await window.electronAPI.getBackendUrl();
          if (backendUrl) {
            setApiBaseUrl(backendUrl);
          }

          // Restore session from DPAPI encrypted refresh token
          if (window.electronAPI.auth?.restoreSession) {
            const res = await window.electronAPI.auth.restoreSession();
            if (res.authenticated && res.user && res.accessToken) {
              setInMemoryAccessToken(res.accessToken);
              setAuthenticatedUser(res.user);
            } else if (res.error && res.code === "SESSION_EXPIRED") {
              setSessionExpiredMessage(res.error);
            }
          }
        }
      } catch (err) {
        console.error("[App] Session restoration error:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDesktopSession();
  }, []);

  const handleLoginSuccess = (user: UserProfile, accessToken: string) => {
    setInMemoryAccessToken(accessToken);
    setAuthenticatedUser(user);
    setSessionExpiredMessage(null);
    setCurrentView("DASHBOARD");
  };

  const handleLogout = async () => {
    try {
      if (window.electronAPI?.auth) {
        await window.electronAPI.auth.logout();
      }
    } catch (err) {
      console.warn("[App] Logout error:", err);
    } finally {
      setInMemoryAccessToken(null);
      setAuthenticatedUser(null);
      setCurrentView("DASHBOARD");
    }
  };

  const handleOpenCourseDetails = (enrollmentId: string) => {
    setSelectedEnrollmentId(enrollmentId);
    setCurrentView("COURSE_DETAILS");
  };

  const handleOpenLesson = (enrollmentId: string, lessonId?: string) => {
    setSelectedEnrollmentId(enrollmentId);
    setSelectedLessonId(lessonId || null);
    setCurrentView("LESSON_VIEWER");
  };

  const handleBackToCourses = () => {
    setSelectedEnrollmentId(null);
    setSelectedLessonId(null);
    setCurrentView("COURSES");
  };

  const handleBackToCourseDetails = () => {
    setSelectedLessonId(null);
    setCurrentView("COURSE_DETAILS");
  };

  const handleStartExam = (examId: string) => {
    setSelectedExamId(examId);
    setCurrentView("EXAM_RUNNER");
  };

  const handleExitExam = () => {
    setSelectedExamId(null);
    setCurrentView("EXAMS");
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 space-y-6">
        <SoftlabLogo size="lg" variant="dark" showTagline={true} />
        <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium px-4 py-2 rounded-full bg-slate-900/80 border border-emerald-500/20 shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Restoring SoftLab Global LMS secure session...</span>
        </div>
      </div>
    );
  }

  if (!authenticatedUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        sessionExpiredMessage={sessionExpiredMessage}
      />
    );
  }

  return (
    <AppShell
      user={authenticatedUser}
      currentView={currentView}
      onNavigate={(view) => setCurrentView(view)}
      onLogout={handleLogout}
    >
      {currentView === "DASHBOARD" && (
        <DashboardView
          user={authenticatedUser}
          onNavigateToCourses={() => setCurrentView("COURSES")}
          onOpenCourseDetails={handleOpenCourseDetails}
          onOpenLesson={handleOpenLesson}
        />
      )}

      {currentView === "COURSES" && (
        <MyCoursesView
          onOpenCourseDetails={handleOpenCourseDetails}
          onOpenLesson={handleOpenLesson}
        />
      )}

      {currentView === "COURSE_DETAILS" && selectedEnrollmentId && (
        <CourseDetailsView
          enrollmentId={selectedEnrollmentId}
          onBack={handleBackToCourses}
          onOpenLesson={handleOpenLesson}
        />
      )}

      {currentView === "LESSON_VIEWER" && selectedEnrollmentId && (
        <LessonViewerView
          enrollmentId={selectedEnrollmentId}
          lessonId={selectedLessonId || undefined}
          onBackToCourse={handleBackToCourseDetails}
          onNavigateToLesson={handleOpenLesson}
        />
      )}

      {currentView === "EXAMS" && (
        <ExamsView onStartExam={handleStartExam} />
      )}

      {currentView === "EXAM_RUNNER" && selectedExamId && (
        <ExamRunnerView
          examId={selectedExamId}
          onExit={handleExitExam}
        />
      )}

      {currentView === "PROFILE" && <ProfileView user={authenticatedUser} />}
    </AppShell>
  );
}

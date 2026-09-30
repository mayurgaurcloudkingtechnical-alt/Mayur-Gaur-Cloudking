import { TokenStorage } from '../storage/secureStore';
import { notificationApi } from '../api/notification';
import { getDeviceMetadata } from './device.service';
import { NotificationNavigationTarget } from '../types/notification';

export const PushNotificationService = {
  /**
   * Initializes push notification foundation:
   * Retrieves or registers the device push token, saves to SecureStore,
   * and synchronizes with the backend.
   */
  async registerDevicePushToken(providedToken?: string): Promise<string | null> {
    try {
      const device = getDeviceMetadata();
      // Use provided token or generate a unique expo-style device client identifier
      let token = providedToken || (await TokenStorage.getPushToken());

      if (!token) {
        const uniqueId = device.deviceId || `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        token = `ExponentPushToken[mock_softlab_${uniqueId}]`;
      }

      await TokenStorage.savePushToken(token);

      // Register with backend
      await notificationApi.registerPushToken({
        pushToken: token,
        deviceId: device.deviceId,
        platform: device.platform,
      });

      return token;
    } catch (err) {
      console.warn('[PushNotificationService] Failed to register push token:', err);
      return null;
    }
  },

  /**
   * Unregisters push token on logout
   */
  async unregisterDevicePushToken(): Promise<void> {
    try {
      await TokenStorage.deletePushToken();
    } catch (err) {
      console.warn('[PushNotificationService] Failed to clear local push token:', err);
    }
  },

  /**
   * Parses and validates notification links/metadata into safe internal navigation targets.
   * Strictly disallows arbitrary external URLs, javascript schemes, or unapproved routes.
   */
  parseNotificationDestination(
    link?: string | null,
    metadata?: Record<string, any> | null
  ): NotificationNavigationTarget | null {
    // 1. Check metadata overrides first
    if (metadata) {
      if (metadata.lessonId && metadata.courseId) {
        return {
          screen: 'Lesson',
          params: { courseId: String(metadata.courseId), lessonId: String(metadata.lessonId) },
        };
      }
      if (metadata.quizId) {
        return {
          screen: 'QuizModal',
          params: { quizId: String(metadata.quizId), title: metadata.title || 'Quiz' },
        };
      }
      if (metadata.certificateId || metadata.certNumber) {
        return {
          screen: 'Certificate',
          params: {
            certificateId: metadata.certificateId ? String(metadata.certificateId) : undefined,
            certNumber: metadata.certNumber ? String(metadata.certNumber) : undefined,
          },
        };
      }
      if (metadata.courseId) {
        return {
          screen: 'CourseDetails',
          params: { courseId: String(metadata.courseId) },
        };
      }
    }

    if (!link || typeof link !== 'string') {
      return null;
    }

    const cleanLink = link.trim();

    // Security check: reject arbitrary external protocols, javascript schemes, data URLs
    if (
      cleanLink.startsWith('javascript:') ||
      cleanLink.startsWith('data:') ||
      cleanLink.startsWith('vbscript:') ||
      (cleanLink.includes('://') && !cleanLink.startsWith('softlab://'))
    ) {
      return null;
    }

    // Strip scheme if softlab://
    const path = cleanLink.replace(/^softlab:\/\//, '');

    // Match Lessons: /courses/:courseId/lessons/:lessonId or /student/courses/:courseId/lessons/:lessonId
    const lessonMatch = path.match(/(?:student\/)?courses\/([^/]+)\/lessons\/([^/?#]+)/);
    if (lessonMatch) {
      return {
        screen: 'Lesson',
        params: { courseId: lessonMatch[1], lessonId: lessonMatch[2] },
      };
    }

    // Match Courses: /courses/:courseId or /student/courses/:courseId
    const courseMatch = path.match(/(?:student\/)?courses\/([^/?#]+)/);
    if (courseMatch) {
      return {
        screen: 'CourseDetails',
        params: { courseId: courseMatch[1] },
      };
    }

    // Match Quiz: /quiz/:quizId or /student/quiz/:quizId
    const quizMatch = path.match(/(?:student\/)?quiz\/([^/?#]+)/);
    if (quizMatch) {
      return {
        screen: 'QuizModal',
        params: { quizId: quizMatch[1] },
      };
    }

    // Match Certificates: /verify/certificate/:certNumber or /student/certificates
    const certMatch = path.match(/verify\/certificate\/([^/?#]+)/);
    if (certMatch) {
      return {
        screen: 'Certificate',
        params: { certNumber: certMatch[1] },
      };
    }
    if (path.includes('student/certificates') || path.includes('certificates')) {
      return {
        screen: 'Certificate',
      };
    }

    // Match Learning History: /student/history or /learning/history
    if (path.includes('student/history') || path.includes('learning/history')) {
      return {
        screen: 'LearningHistory',
      };
    }

    // Match Notifications: /student/notifications or /notifications
    if (path.includes('notifications')) {
      return {
        screen: 'Notifications',
      };
    }

    return null;
  },
};

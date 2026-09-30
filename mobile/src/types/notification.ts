export type NotificationType =
  | 'SYSTEM'
  | 'ADMISSION'
  | 'FEE_PAYMENT'
  | 'ACADEMIC_EXAM'
  | 'CERTIFICATE'
  | 'PLACEMENT'
  | 'LEAVE_STATUS'
  | 'PAYROLL';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationNavigationTarget {
  screen: 'CourseDetails' | 'Lesson' | 'QuizModal' | 'Certificate' | 'LearningHistory' | 'Notifications';
  params?: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  PROFILE_CREATED = 'profile.created',
  PROFILE_UPDATED = 'profile.updated',
  PROFILE_DELETED = 'profile.deleted',
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  SYSTEM_ALERT = 'system.alert',
  CUSTOM = 'custom',
}

export interface NotificationEvent {
  type: NotificationType;
  userId: string;
  data: any;
  timestamp: Date;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  sentAt: Date;
}

export interface AppNotification {
  id: number;
  userId?: number;
  recipientRole?: string;
  customerId?: number;
  title: string;
  message: string;
  category: string;
  read: boolean;
  targetUrl?: string;
  createdAt: string;
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private api: ApiService) {}

  getNotifications(filter: { userId?: number; role?: string; customerId?: number }): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('/notifications', filter);
  }

  markAsRead(id: number): Observable<void> {
    return this.api.patch<void>(`/notifications/${id}/read`, {});
  }
}

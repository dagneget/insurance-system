import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UserManagement, CreateUserRequest, UnderwriterAuthority } from '../models/user-management.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private api: ApiService) {}

  getAllUsers(): Observable<UserManagement[]> {
    return this.api.get<UserManagement[]>('/admin/users');
  }

  getUserById(id: number): Observable<UserManagement> {
    return this.api.get<UserManagement>(`/admin/users/${id}`);
  }

  createUser(request: CreateUserRequest, adminUsername = 'elena.manager'): Observable<UserManagement> {
    return this.api.post<UserManagement>(`/admin/users?adminUsername=${encodeURIComponent(adminUsername)}`, request);
  }

  toggleUserStatus(userId: number, active: boolean, adminUsername = 'elena.manager'): Observable<UserManagement> {
    return this.api.patch<UserManagement>(`/admin/users/${userId}/status?adminUsername=${encodeURIComponent(adminUsername)}`, { active });
  }

  updateUnderwriterAuthority(userId: number, authority: UnderwriterAuthority, adminUsername = 'elena.manager'): Observable<UserManagement> {
    return this.api.put<UserManagement>(`/admin/users/${userId}/authority?adminUsername=${encodeURIComponent(adminUsername)}`, authority);
  }

  getAuditLogs(): Observable<any[]> {
    return this.api.get<any[]>('/audit-logs');
  }
}

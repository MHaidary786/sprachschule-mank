import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../services/auth.service';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatar?: string;
  password?: string;
  role?: 'student' | 'teacher' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getAll(limit = 50, offset = 0): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiBaseUrl}/admin/users`, {
      params: { limit: String(limit), offset: String(offset) },
    });
  }

  create(input: CreateUserInput): Observable<{ message: string; user: User }> {
    return this.http.post<{ message: string; user: User }>(`${environment.apiBaseUrl}/admin/users`, input);
  }

  update(id: number, input: UpdateUserInput): Observable<{ message: string; user: User }> {
    return this.http.patch<{ message: string; user: User }>(`${environment.apiBaseUrl}/admin/users/${id}`, input);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiBaseUrl}/admin/users/${id}`);
  }
}

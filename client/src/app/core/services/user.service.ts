import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../services/auth.service';

export interface UserStats {
  total: number;
  students: number;
  teachers: number;
  admins: number;
}

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

  getStudents(limit = 50, offset = 0): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiBaseUrl}/teacher/students`, {
      params: { limit: String(limit), offset: String(offset) },
    });
  }

  getStudentCount(): Observable<number> {
    return this.fetchAll((offset) => this.getStudents(200, offset)).pipe(map((users) => users.length));
  }

  getStats(): Observable<UserStats> {
    return this.fetchAll((offset) => this.getAll(200, offset)).pipe(
      map((users) => {
        const stats: UserStats = { total: users.length, students: 0, teachers: 0, admins: 0 };
        users.forEach((u) => {
          if (u.role === 'student') stats.students++;
          else if (u.role === 'teacher') stats.teachers++;
          else if (u.role === 'admin') stats.admins++;
        });
        return stats;
      })
    );
  }

  private fetchAll(page: (offset: number) => Observable<User[]>): Observable<User[]> {
    const pageSize = 200;
    return new Observable<User[]>((subscriber) => {
      const all: User[] = [];
      const fetch = (offset: number) => {
        page(offset).subscribe({
          next: (data) => {
            all.push(...data);
            if (data.length < pageSize) {
              subscriber.next(all);
              subscriber.complete();
              return;
            }
            fetch(offset + pageSize);
          },
          error: (err) => subscriber.error(err),
        });
      };
      fetch(0);
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

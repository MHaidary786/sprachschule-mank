import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// A booking request (Buchungsanfrage) submitted by an interested person via the public
// booking form. Managed by admins at /admin/bookings.
export interface BookingRequest {
  id: number;
  course_id: number;
  course_title: string;
  level: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  student_id: number | null;
  student_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminBookingService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  list(status?: string): Observable<BookingRequest[]> {
    return this.http.get<BookingRequest[]>(`${this.base}/admin/bookings`, {
      params: status ? { status } : {},
    });
  }

  approve(id: number): Observable<{ message: string; booking: BookingRequest }> {
    return this.http.post<{ message: string; booking: BookingRequest }>(
      `${this.base}/admin/bookings/${id}/approve`,
      {},
    );
  }

  reject(id: number, admin_note?: string): Observable<{ message: string; booking: BookingRequest }> {
    const body = admin_note ? { admin_note } : {};
    return this.http.post<{ message: string; booking: BookingRequest }>(
      `${this.base}/admin/bookings/${id}/reject`,
      body,
    );
  }
}

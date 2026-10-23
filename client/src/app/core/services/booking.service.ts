import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PublicBookingInput {
  course_id: number;
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

/**
 * Public (guest) course bookings only.
 * Admin booking methods live elsewhere and are not part of this service.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  submitBooking(data: PublicBookingInput): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/public/bookings`,
      data,
    );
  }
}

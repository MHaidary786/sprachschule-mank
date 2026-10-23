import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactResponse {
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  submit(data: ContactMessage): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.base}/public/contact`, data);
  }
}

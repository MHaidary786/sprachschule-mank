import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventPhoto {
  url: string;
  caption?: string | null;
}

export interface PublicEvent {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  event_date: string | null;
  cover_image: string | null;
  photo_count: number;
  photos: EventPhoto[];
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Public events (list: up to 3 photos each + photo_count).
  getEvents(): Observable<PublicEvent[]> {
    return this.http.get<PublicEvent[]>(`${this.base}/public/events`);
  }

  // Full detail for one event (all photos). 404 if missing or hidden.
  getEventBySlug(slug: string): Observable<PublicEvent> {
    return this.http.get<PublicEvent>(
      `${this.base}/public/events/${encodeURIComponent(slug)}`,
    );
  }
}

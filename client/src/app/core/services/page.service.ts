import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  show_in_nav: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PageInput {
  title: string;
  slug: string;
  content: string;
  show_in_nav?: boolean;
  order?: number;
}

export interface PageUpdate {
  title?: string;
  slug?: string;
  content?: string;
  show_in_nav?: boolean;
  order?: number;
}

@Injectable({ providedIn: 'root' })
export class PageService {
  private base = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  // Public
  getPublicPages(): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.base}/public/pages`);
  }

  getPublicPage(slug: string): Observable<Page> {
    return this.http.get<Page>(`${this.base}/public/pages/${encodeURIComponent(slug)}`);
  }

  // Admin
  listPages(): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.base}/admin/pages`);
  }

  createPage(input: PageInput): Observable<{ message: string; page: Page }> {
    return this.http.post<{ message: string; page: Page }>(`${this.base}/admin/pages`, input);
  }

  updatePage(id: number, input: PageUpdate): Observable<{ message: string; page: Page }> {
    return this.http.patch<{ message: string; page: Page }>(`${this.base}/admin/pages/${id}`, input);
  }

  deletePage(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/admin/pages/${id}`);
  }
}

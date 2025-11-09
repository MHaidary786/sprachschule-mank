import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Student {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentApiService {
  private baseUrl = 'http://localhost:5000/api/student/create'; // your backend URL

  constructor(private http: HttpClient) {}

  createStudent(student: Student): Observable<Student> {
    return this.http.post<Student>(this.baseUrl, student);
  }
}

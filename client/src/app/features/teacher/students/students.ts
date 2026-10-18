import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="p-6">
      <h2 class="text-2xl font-bold mb-6">Meine Schüler</h2>

      @if (error) {
        <div class="mb-4 rounded-lg bg-red-100 border border-red-300 text-red-800 px-4 py-2 text-sm">{{ error }}</div>
      }

      <table class="w-full bg-white rounded-lg shadow overflow-hidden">
        <thead class="bg-gray-100 text-left">
          <tr>
            <th class="p-3">Name</th>
            <th class="p-3">E-Mail</th>
          </tr>
        </thead>
        <tbody>
          @for (student of students; track student.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3">{{ student.name }}</td>
              <td class="p-3">{{ student.email }}</td>
            </tr>
          } @empty {
            <tr><td colspan="2" class="p-4 text-center text-gray-500">Noch keine Schüler vorhanden.</td></tr>
          }
        </tbody>
      </table>
    </main>
  `,
  styleUrl: './students.css',
})
export class Students implements OnInit {
  students: User[] = [];
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<User[]>(`${environment.apiBaseUrl}/teacher/students`).subscribe({
      next: (data) => (this.students = data),
      error: () => (this.error = 'Schüler konnten nicht geladen werden.'),
    });
  }
}

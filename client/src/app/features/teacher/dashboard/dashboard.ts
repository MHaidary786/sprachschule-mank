import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, User } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink, CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  studentCount: number | null = null;

  constructor(private auth: AuthService, private userService: UserService) {}

  get user(): User | null {
    return this.auth.getUser();
  }

  ngOnInit(): void {
    this.loadStudentCount();
  }

  private loadStudentCount(): void {
    this.userService.getStats().subscribe({
      next: (stats) => (this.studentCount = stats.students),
      error: () => (this.studentCount = null),
    });
  }
}

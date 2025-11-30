import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [FormsModule],
})
export class Login implements OnInit {
  credentials = { username: '', password: '' };
  role: string[] = [];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.role = this.authService.getUserRoles();
  }

  login() {
    this.authService.login(this.credentials).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => console.error(err),
    });
  }
}

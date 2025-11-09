import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StudentGuard } from './student-guard';
import { AuthService } from '../services/auth.service';

describe('StudentGuard', () => {
  let guard: StudentGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StudentGuard,
        { provide: AuthService, useValue: { getRole: () => 'student' } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });
    guard = TestBed.inject(StudentGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow student user', () => {
    expect(guard.canActivate()).toBeTrue();
  });

  it('should redirect non-student user', () => {
    spyOn(authService, 'getRole').and.returnValue('teacher');
    expect(guard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});

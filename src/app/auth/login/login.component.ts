import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { UserProfileService } from '../../core/user-profile.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  recentUsers: string[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userProfileService: UserProfileService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]]
    });

    // Load recent users from localStorage
    const recent = localStorage.getItem('recentUsers');
    if (recent) {
      this.recentUsers = JSON.parse(recent).slice(0, 3); // Show max 3
    }
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const username = this.loginForm.get('username')?.value.trim();

      // Login with username only
      this.userProfileService.login(username).subscribe({
        next: () => {
          // Save to recent users
          this.saveRecentUser(username);

          // Navigate to home
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 500);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isLoading = false;
        }
      });
    }
  }

  quickLogin(username: string): void {
    this.loginForm.patchValue({ username });
    this.onLogin();
  }

  private saveRecentUser(username: string): void {
    let recent = this.recentUsers.filter(u => u !== username);
    recent.unshift(username);
    recent = recent.slice(0, 5); // Keep max 5
    localStorage.setItem('recentUsers', JSON.stringify(recent));
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styles: [`:host { display: block; }`],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userName = '';
  password = '';
  hidePassword = signal(true);
  loading = signal(false);
  errorMessage = signal('');

  onSubmit(): void {
    if (!this.userName || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ userName: this.userName, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 401
            ? 'Pogrešno korisničko ime ili lozinka.'
            : 'Greška pri prijavi. Pokušajte ponovo.',
        );
      },
    });
  }
}

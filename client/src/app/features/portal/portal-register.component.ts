import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-portal-register',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatDatepickerModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <mat-card class="w-full max-w-lg">
        <mat-card-header>
          <mat-icon mat-card-avatar class="text-blue-500 !text-4xl">local_hospital</mat-icon>
          <mat-card-title>Registracija pacijenta</mat-card-title>
          <mat-card-subtitle>Kreirajte nalog za pristup portalu</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="mt-4">
          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
              {{ errorMessage() }}
            </div>
          }
          @if (successMessage()) {
            <div class="mb-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">
              {{ successMessage() }}
            </div>
          }

          <form #form="ngForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <mat-form-field>
                <mat-label>Ime</mat-label>
                <input matInput [(ngModel)]="model.ime" name="ime" required />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Prezime</mat-label>
                <input matInput [(ngModel)]="model.prezime" name="prezime" required />
              </mat-form-field>
            </div>

            <mat-form-field>
              <mat-label>Korisničko ime</mat-label>
              <input matInput [(ngModel)]="model.userName" name="userName" required />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Lozinka</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'"
                     [(ngModel)]="model.password" name="password" required />
              <button mat-icon-button matSuffix type="button"
                      (click)="hidePassword.update(v => !v)">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field>
              <mat-label>JMBG</mat-label>
              <input matInput [(ngModel)]="model.jmbg" name="jmbg" required maxlength="13" />
            </mat-form-field>

            <div class="grid grid-cols-2 gap-3">
              <mat-form-field>
                <mat-label>Datum rođenja</mat-label>
                <input matInput [matDatepicker]="dp" [(ngModel)]="model.datumRodjenja"
                       name="datumRodjenja" required />
                <mat-datepicker-toggle matSuffix [for]="dp" />
                <mat-datepicker #dp />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Pol</mat-label>
                <mat-select [(ngModel)]="model.pol" name="pol" required>
                  <mat-option value="muški">Muški</mat-option>
                  <mat-option value="ženski">Ženski</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field>
              <mat-label>Adresa</mat-label>
              <input matInput [(ngModel)]="model.adresa" name="adresa" />
            </mat-form-field>

            <div class="grid grid-cols-2 gap-3">
              <mat-form-field>
                <mat-label>Telefon</mat-label>
                <input matInput [(ngModel)]="model.telefon" name="telefon" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Email</mat-label>
                <input matInput [(ngModel)]="model.email" name="email" type="email" />
              </mat-form-field>
            </div>

            <button mat-flat-button color="primary" type="submit"
                    [disabled]="!form.valid || loading()" class="w-full mt-2">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Registruj se
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="justify-center">
          <a mat-button routerLink="/login">Već imate nalog? Prijavite se</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class PortalRegisterComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  hidePassword = signal(true);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  model = {
    userName: '',
    password: '',
    ime: '',
    prezime: '',
    jmbg: '',
    datumRodjenja: null as Date | null,
    pol: '',
    adresa: '',
    telefon: '',
    email: '',
  };

  onSubmit(): void {
    if (!this.model.datumRodjenja) return;
    this.loading.set(true);
    this.errorMessage.set('');

    const body = {
      userName: this.model.userName,
      password: this.model.password,
      ime: this.model.ime,
      prezime: this.model.prezime,
      jmbg: this.model.jmbg,
      datumRodjenja: this.model.datumRodjenja.toISOString().split('T')[0],
      pol: this.model.pol,
      adresa: this.model.adresa || null,
      telefon: this.model.telefon || null,
      email: this.model.email || null,
    };

    this.http.post(`${environment.apiUrl}/portal/register`, body).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Registracija uspešna! Preusmeravanje na prijavu...');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Greška pri registraciji.');
      },
    });
  }
}

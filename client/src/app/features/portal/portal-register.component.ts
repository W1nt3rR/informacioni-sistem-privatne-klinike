import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-portal-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div class="card bg-base-100 shadow-lg w-full max-w-lg">
        <div class="card-body">
          <div class="flex items-center gap-3 mb-2">
            <span class="material-icons text-primary text-4xl">local_hospital</span>
            <div>
              <h2 class="card-title">Registracija pacijenta</h2>
              <p class="text-base-content/60 text-sm">Kreirajte nalog za pristup portalu</p>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="alert alert-error mb-4">{{ errorMessage() }}</div>
          }
          @if (successMessage()) {
            <div class="alert alert-success mb-4">{{ successMessage() }}</div>
          }

          <form #form="ngForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Ime</legend>
                <input class="input w-full" [(ngModel)]="model.ime" name="ime" required />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Prezime</legend>
                <input class="input w-full" [(ngModel)]="model.prezime" name="prezime" required />
              </fieldset>
            </div>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Korisničko ime</legend>
              <input class="input w-full" [(ngModel)]="model.userName" name="userName" required />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Lozinka</legend>
              <label class="input w-full flex items-center gap-2">
                <input [type]="hidePassword() ? 'password' : 'text'" class="grow"
                       [(ngModel)]="model.password" name="password" required minlength="6"
                       #passwordField="ngModel" />
                <button type="button" class="btn btn-ghost btn-xs btn-square"
                        (click)="hidePassword.update(v => !v)">
                  <span class="material-icons text-sm">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </label>
              <p class="text-xs text-base-content/50 mt-1">Min. 6 karaktera, veliko slovo, malo slovo i cifra</p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">JMBG</legend>
              <input class="input w-full" [(ngModel)]="model.jmbg" name="jmbg" required
                     minlength="13" maxlength="13" pattern="\\d{13}" #jmbgField="ngModel" />
              @if (jmbgField.invalid && jmbgField.touched) {
                <p class="text-xs text-error mt-1">JMBG mora sadržati tačno 13 cifara</p>
              }
            </fieldset>

            <div class="grid grid-cols-2 gap-3">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Datum rođenja</legend>
                <input type="date" class="input w-full" [(ngModel)]="model.datumRodjenja"
                       name="datumRodjenja" required />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Pol</legend>
                <select class="select w-full" [(ngModel)]="model.pol" name="pol" required>
                  <option value="" disabled>Izaberite</option>
                  <option value="M">Muški</option>
                  <option value="Ž">Ženski</option>
                </select>
              </fieldset>
            </div>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Adresa</legend>
              <input class="input w-full" [(ngModel)]="model.adresa" name="adresa" />
            </fieldset>

            <div class="grid grid-cols-2 gap-3">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Telefon</legend>
                <input class="input w-full" [(ngModel)]="model.telefon" name="telefon" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Email</legend>
                <input class="input w-full" [(ngModel)]="model.email" name="email" type="email" />
              </fieldset>
            </div>

            <button type="submit" class="btn btn-primary w-full mt-2"
                    [disabled]="!form.valid || loading()">
              @if (loading()) {
                <span class="loading loading-spinner loading-sm"></span>
              } @else {
                Registruj se
              }
            </button>
          </form>

          <div class="text-center mt-3">
            <a routerLink="/login" class="link link-primary text-sm">Već imate nalog? Prijavite se</a>
          </div>
        </div>
      </div>
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
    datumRodjenja: '',
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
      datumRodjenja: this.model.datumRodjenja,
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

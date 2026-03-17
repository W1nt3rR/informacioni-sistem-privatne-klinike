import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ApiService } from '../../shared/services/api.service';

interface ServiceOption { serviceId: number; naziv: string; }
interface DoctorOption { doctorId: number; ime: string; prezime: string; }

@Component({
  selector: 'app-request-appointment',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDatepickerModule,
  ],
  template: `
    <div class="max-w-lg mx-auto">
      <h2 class="text-2xl font-semibold text-slate-800 mb-6">Zakaži novi termin</h2>

      <mat-card>
        <mat-card-content>
          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
              {{ errorMessage() }}
            </div>
          }

          <form #form="ngForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <mat-form-field>
              <mat-label>Usluga</mat-label>
              <mat-select [(ngModel)]="model.serviceId" name="serviceId" required>
                @for (s of services(); track s.serviceId) {
                  <mat-option [value]="s.serviceId">{{ s.naziv }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Lekar</mat-label>
              <mat-select [(ngModel)]="model.doctorId" name="doctorId" required>
                @for (d of doctors(); track d.doctorId) {
                  <mat-option [value]="d.doctorId">{{ d.ime }} {{ d.prezime }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Datum</mat-label>
              <input matInput [matDatepicker]="dp" [(ngModel)]="model.datum" name="datum" required />
              <mat-datepicker-toggle matSuffix [for]="dp" />
              <mat-datepicker #dp />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Vreme (HH:mm)</mat-label>
              <input matInput [(ngModel)]="model.vreme" name="vreme" required
                     placeholder="09:00" pattern="^([01]?\\d|2[0-3]):[0-5]\\d$" />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Napomena</mat-label>
              <textarea matInput [(ngModel)]="model.napomena" name="napomena" rows="3"></textarea>
            </mat-form-field>

            <div class="flex gap-3 justify-end">
              <button mat-button type="button" (click)="goBack()">Otkaži</button>
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="!form.valid || loading()">
                {{ loading() ? 'Zakazivanje...' : 'Zakaži termin' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class RequestAppointmentComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  services = signal<ServiceOption[]>([]);
  doctors = signal<DoctorOption[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  model = {
    serviceId: null as number | null,
    doctorId: null as number | null,
    datum: null as Date | null,
    vreme: '',
    napomena: '',
  };

  ngOnInit() {
    this.api.get<ServiceOption[]>('services').subscribe(d => this.services.set(d));
    this.api.get<DoctorOption[]>('doctors').subscribe(d => this.doctors.set(d));
  }

  onSubmit(): void {
    if (!this.model.datum || !this.model.vreme) return;
    this.loading.set(true);
    this.errorMessage.set('');

    const [h, m] = this.model.vreme.split(':').map(Number);
    const dt = new Date(this.model.datum);
    dt.setHours(h, m, 0, 0);

    this.api.post('portal/appointment-requests', {
      serviceId: this.model.serviceId,
      doctorId: this.model.doctorId,
      datumVreme: dt.toISOString(),
      napomena: this.model.napomena || null,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/portal/appointments']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Greška pri zakazivanju.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/portal/appointments']);
  }
}

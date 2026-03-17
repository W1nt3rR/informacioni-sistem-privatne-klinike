import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';

interface ServiceOption { serviceId: number; naziv: string; }
interface DoctorOption { doctorId: number; ime: string; prezime: string; }

@Component({
  selector: 'app-request-appointment',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-lg mx-auto">
      <h2 class="text-2xl font-semibold mb-6">Zakaži novi termin</h2>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          @if (errorMessage()) {
            <div class="alert alert-error mb-4">{{ errorMessage() }}</div>
          }

          <form #form="ngForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Usluga</legend>
              <select class="select w-full" [(ngModel)]="model.serviceId" name="serviceId" required>
                <option [ngValue]="null" disabled>Izaberite uslugu</option>
                @for (s of services(); track s.serviceId) {
                  <option [ngValue]="s.serviceId">{{ s.naziv }}</option>
                }
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Lekar</legend>
              <select class="select w-full" [(ngModel)]="model.doctorId" name="doctorId" required>
                <option [ngValue]="null" disabled>Izaberite lekara</option>
                @for (d of doctors(); track d.doctorId) {
                  <option [ngValue]="d.doctorId">{{ d.ime }} {{ d.prezime }}</option>
                }
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Datum</legend>
              <input type="date" class="input w-full" [(ngModel)]="model.datum" name="datum" required />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Vreme (HH:mm)</legend>
              <input type="time" class="input w-full" [(ngModel)]="model.vreme" name="vreme" required />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Napomena</legend>
              <textarea class="textarea w-full" [(ngModel)]="model.napomena" name="napomena" rows="3"></textarea>
            </fieldset>

            <div class="flex gap-3 justify-end">
              <button type="button" class="btn" (click)="goBack()">Otkaži</button>
              <button type="submit" class="btn btn-primary" [disabled]="!form.valid || loading()">
                {{ loading() ? 'Zakazivanje...' : 'Zakaži termin' }}
              </button>
            </div>
          </form>
        </div>
      </div>
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
    datum: '',
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

    const dt = new Date(`${this.model.datum}T${this.model.vreme}:00`);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;

    this.api.post('portal/appointment-requests', {
      serviceId: this.model.serviceId,
      doctorId: this.model.doctorId,
      datumVreme: localIso,
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

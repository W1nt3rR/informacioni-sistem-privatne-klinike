import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { ToastService } from '../../shared/services/toast.service';
import { DoctorDetail, WorkingHoursItem } from './doctor.model';

interface ServiceOption {
  serviceId: number;
  naziv: string;
  trajanjeMinuta: number;
  cena: number;
  specializationId: number;
  aktivan: boolean;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Ponedeljak', 2: 'Utorak', 3: 'Sreda', 4: 'Četvrtak',
  5: 'Petak', 6: 'Subota', 7: 'Nedelja',
};

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else if (doctor()) {
      <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm btn-square" routerLink="/staff">
          <span class="material-icons">arrow_back</span>
        </button>
        <h2 class="text-2xl font-semibold">
          {{ doctor()!.titula ? doctor()!.titula + ' ' : '' }}{{ doctor()!.ime }} {{ doctor()!.prezime }}
        </h2>
        <span class="badge" [class]="doctor()!.aktivan ? 'badge-success' : 'badge-error'">
          {{ doctor()!.aktivan ? 'Aktivan' : 'Neaktivan' }}
        </span>
      </div>

      <div class="card bg-base-100 shadow-sm mb-4">
        <div class="card-body">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-base-content/60">Email:</span> {{ doctor()!.email }}</div>
          <div><span class="text-base-content/60">Telefon:</span> {{ doctor()!.telefon ?? '—' }}</div>
          <div><span class="text-base-content/60">Specijalizacija:</span> {{ doctor()!.specijalizacijaNaziv }}</div>
          <div><span class="text-base-content/60">Broj licence:</span> {{ doctor()!.licencaBroj }}</div>
        </div>
        </div>
      </div>

      <div class="tabs tabs-bordered mb-4">
        <button class="tab" [class.tab-active]="activeTab() === 0" (click)="activeTab.set(0)">Usluge</button>
        <button class="tab" [class.tab-active]="activeTab() === 1" (click)="activeTab.set(1)">Radno vreme</button>
      </div>

      @if (activeTab() === 0) {
        <div class="mb-3">
          <select class="select w-full max-w-sm" (change)="assignServiceFromSelect($event)">
            <option value="" selected disabled>Dodaj uslugu...</option>
            @for (s of availableServices(); track s.serviceId) {
              <option [value]="s.serviceId">{{ s.naziv }} ({{ s.trajanjeMinuta }} min, {{ s.cena }} RSD)</option>
            }
          </select>
        </div>
        <div class="card bg-base-100 shadow-sm overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Usluga</th>
                <th>Trajanje</th>
                <th>Cena</th>
                <th class="w-16"></th>
              </tr>
            </thead>
            <tbody>
              @for (row of doctor()!.services; track row.serviceId) {
                <tr>
                  <td>{{ row.naziv }}</td>
                  <td>{{ row.trajanjeMinuta }} min</td>
                  <td>{{ row.cena }} RSD</td>
                  <td>
                    <button class="btn btn-ghost btn-xs btn-square text-error" (click)="removeService(row.serviceId)">
                      <span class="material-icons text-sm">remove_circle</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (doctor()!.services.length === 0) {
            <div class="text-center text-base-content/60 py-4">Nema dodeljenih usluga.</div>
          }
        </div>
      }

      @if (activeTab() === 1) {
        <div class="space-y-2">
          @for (day of days; track day) {
            <div class="flex items-center gap-3">
              <span class="w-28 text-sm font-medium">{{ dayNames[day] }}</span>
              <fieldset class="fieldset w-28">
                <legend class="fieldset-legend">Od</legend>
                <input class="input w-full" type="time" [value]="getWorkingHour(day)?.vremeOd ?? ''"
                       (change)="updateWorkingHour(day, 'vremeOd', $event)" />
              </fieldset>
              <fieldset class="fieldset w-28">
                <legend class="fieldset-legend">Do</legend>
                <input class="input w-full" type="time" [value]="getWorkingHour(day)?.vremeDo ?? ''"
                       (change)="updateWorkingHour(day, 'vremeDo', $event)" />
              </fieldset>
              @if (getWorkingHour(day)) {
                <button class="btn btn-ghost btn-xs btn-square text-error" (click)="clearDay(day)">
                  <span class="material-icons text-sm">clear</span>
                </button>
              }
            </div>
          }
        </div>
        <button class="btn btn-primary mt-4" (click)="saveWorkingHours()">
          <span class="material-icons">save</span> Sačuvaj radno vreme
        </button>
      }
    }
  `,
})
export class DoctorDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  doctor = signal<DoctorDetail | null>(null);
  allServices = signal<ServiceOption[]>([]);
  loading = signal(true);
  activeTab = signal(0);
  days = [1, 2, 3, 4, 5, 6, 7];
  dayNames = DAY_NAMES;
  workingHoursEdit: Record<number, { vremeOd: string; vremeDo: string }> = {};

  availableServices = signal<ServiceOption[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadDoctor(+id);
    this.api.get<ServiceOption[]>('services').subscribe(s => {
      this.allServices.set(s);
      this.updateAvailableServices();
    });
  }

  loadDoctor(id: number): void {
    this.loading.set(true);
    this.api.get<DoctorDetail>(`doctors/${id}`).subscribe({
      next: d => {
        this.doctor.set(d);
        this.workingHoursEdit = {};
        for (const wh of d.workingHours) {
          this.workingHoursEdit[wh.danUNedelji] = { vremeOd: wh.vremeOd, vremeDo: wh.vremeDo };
        }
        this.loading.set(false);
        this.updateAvailableServices();
      },
      error: () => this.loading.set(false),
    });
  }

  private updateAvailableServices(): void {
    const doc = this.doctor();
    if (!doc) return;
    const assigned = new Set(doc.services.map(s => s.serviceId));
    this.availableServices.set(this.allServices().filter(s => !assigned.has(s.serviceId)));
  }

  getWorkingHour(day: number): { vremeOd: string; vremeDo: string } | null {
    return this.workingHoursEdit[day] ?? null;
  }

  updateWorkingHour(day: number, field: 'vremeOd' | 'vremeDo', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!this.workingHoursEdit[day]) {
      this.workingHoursEdit[day] = { vremeOd: '', vremeDo: '' };
    }
    this.workingHoursEdit[day][field] = value;
  }

  clearDay(day: number): void {
    delete this.workingHoursEdit[day];
  }

  assignServiceFromSelect(event: Event): void {
    const serviceId = +(event.target as HTMLSelectElement).value;
    if (!serviceId) return;
    const doc = this.doctor();
    if (!doc) return;
    this.api.post(`doctors/${doc.doctorId}/services/${serviceId}`, {}).subscribe({
      next: () => {
        this.toast.success('Usluga dodeljena');
        this.loadDoctor(doc.doctorId);
      },
      error: () => this.toast.error('Greška'),
    });
  }

  removeService(serviceId: number): void {
    const doc = this.doctor();
    if (!doc) return;
    this.api.delete(`doctors/${doc.doctorId}/services/${serviceId}`).subscribe({
      next: () => {
        this.toast.success('Usluga uklonjena');
        this.loadDoctor(doc.doctorId);
      },
      error: () => this.toast.error('Greška'),
    });
  }

  saveWorkingHours(): void {
    const doc = this.doctor();
    if (!doc) return;
    const hours = Object.entries(this.workingHoursEdit)
      .filter(([, v]) => v.vremeOd && v.vremeDo)
      .map(([day, v]) => ({ danUNedelji: +day, vremeOd: v.vremeOd, vremeDo: v.vremeDo }));

    this.api.put(`doctors/${doc.doctorId}/working-hours`, hours).subscribe({
      next: () => {
        this.toast.success('Radno vreme sačuvano');
        this.loadDoctor(doc.doctorId);
      },
      error: () => this.toast.error('Greška'),
    });
  }
}

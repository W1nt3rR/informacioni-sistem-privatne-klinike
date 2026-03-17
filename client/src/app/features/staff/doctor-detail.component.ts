import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
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
  imports: [
    MatButtonModule, MatIconModule, MatTabsModule, MatTableModule,
    MatProgressSpinnerModule, MatChipsModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink,
  ],
  template: `
    @if (loading()) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="40" />
      </div>
    } @else if (doctor()) {
      <div class="flex items-center gap-3 mb-4">
        <button mat-icon-button routerLink="/staff">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-xl font-semibold text-slate-800 m-0">
          {{ doctor()!.titula ? doctor()!.titula + ' ' : '' }}{{ doctor()!.ime }} {{ doctor()!.prezime }}
        </h2>
        <mat-chip [class]="doctor()!.aktivan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
          {{ doctor()!.aktivan ? 'Aktivan' : 'Neaktivan' }}
        </mat-chip>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-slate-500">Email:</span> {{ doctor()!.email }}</div>
          <div><span class="text-slate-500">Telefon:</span> {{ doctor()!.telefon ?? '—' }}</div>
          <div><span class="text-slate-500">Specijalizacija:</span> {{ doctor()!.specijalizacijaNaziv }}</div>
          <div><span class="text-slate-500">Broj licence:</span> {{ doctor()!.licencaBroj }}</div>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Usluge">
          <div class="p-4">
            <div class="flex items-center gap-3 mb-3">
              <mat-form-field class="flex-1" subscriptSizing="dynamic">
                <mat-label>Dodaj uslugu</mat-label>
                <mat-select (selectionChange)="assignService($event.value)">
                  @for (s of availableServices(); track s.serviceId) {
                    <mat-option [value]="s.serviceId">{{ s.naziv }} ({{ s.trajanjeMinuta }} min, {{ s.cena }} RSD)</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <table mat-table [dataSource]="doctor()!.services" class="w-full">
              <ng-container matColumnDef="naziv">
                <th mat-header-cell *matHeaderCellDef>Usluga</th>
                <td mat-cell *matCellDef="let row">{{ row.naziv }}</td>
              </ng-container>
              <ng-container matColumnDef="trajanje">
                <th mat-header-cell *matHeaderCellDef>Trajanje</th>
                <td mat-cell *matCellDef="let row">{{ row.trajanjeMinuta }} min</td>
              </ng-container>
              <ng-container matColumnDef="cena">
                <th mat-header-cell *matHeaderCellDef>Cena</th>
                <td mat-cell *matCellDef="let row">{{ row.cena }} RSD</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="w-16"></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button color="warn" (click)="removeService(row.serviceId)">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="serviceColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: serviceColumns"></tr>
            </table>
            @if (doctor()!.services.length === 0) {
              <div class="text-center text-slate-400 py-4">Nema dodeljenih usluga.</div>
            }
          </div>
        </mat-tab>

        <mat-tab label="Radno vreme">
          <div class="p-4">
            <div class="space-y-2">
              @for (day of days; track day) {
                <div class="flex items-center gap-3">
                  <span class="w-28 text-sm font-medium">{{ dayNames[day] }}</span>
                  <mat-form-field class="w-28" subscriptSizing="dynamic">
                    <mat-label>Od</mat-label>
                    <input matInput type="time" [value]="getWorkingHour(day)?.vremeOd ?? ''"
                           (change)="updateWorkingHour(day, 'vremeOd', $event)" />
                  </mat-form-field>
                  <mat-form-field class="w-28" subscriptSizing="dynamic">
                    <mat-label>Do</mat-label>
                    <input matInput type="time" [value]="getWorkingHour(day)?.vremeDo ?? ''"
                           (change)="updateWorkingHour(day, 'vremeDo', $event)" />
                  </mat-form-field>
                  @if (getWorkingHour(day)) {
                    <button mat-icon-button color="warn" (click)="clearDay(day)">
                      <mat-icon>clear</mat-icon>
                    </button>
                  }
                </div>
              }
            </div>
            <button mat-flat-button color="primary" class="mt-4" (click)="saveWorkingHours()">
              <mat-icon>save</mat-icon> Sačuvaj radno vreme
            </button>
          </div>
        </mat-tab>
      </mat-tab-group>
    }
  `,
})
export class DoctorDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  doctor = signal<DoctorDetail | null>(null);
  allServices = signal<ServiceOption[]>([]);
  loading = signal(true);
  serviceColumns = ['naziv', 'trajanje', 'cena', 'actions'];
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

  assignService(serviceId: number): void {
    const doc = this.doctor();
    if (!doc) return;
    this.api.post(`doctors/${doc.doctorId}/services/${serviceId}`, {}).subscribe({
      next: () => {
        this.snackBar.open('Usluga dodeljena', 'OK', { duration: 2000 });
        this.loadDoctor(doc.doctorId);
      },
      error: () => this.snackBar.open('Greška', 'OK', { duration: 3000 }),
    });
  }

  removeService(serviceId: number): void {
    const doc = this.doctor();
    if (!doc) return;
    this.api.delete(`doctors/${doc.doctorId}/services/${serviceId}`).subscribe({
      next: () => {
        this.snackBar.open('Usluga uklonjena', 'OK', { duration: 2000 });
        this.loadDoctor(doc.doctorId);
      },
      error: () => this.snackBar.open('Greška', 'OK', { duration: 3000 }),
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
        this.snackBar.open('Radno vreme sačuvano', 'OK', { duration: 2000 });
        this.loadDoctor(doc.doctorId);
      },
      error: () => this.snackBar.open('Greška', 'OK', { duration: 3000 }),
    });
  }
}

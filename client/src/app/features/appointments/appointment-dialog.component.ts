import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../shared/services/api.service';
import {
  CreateAppointmentRequest, Doctor, Office, ServiceItem, AvailableSlot,
} from './appointment.model';
import { Patient } from '../patients/patient.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

export interface AppointmentDialogData {
  date?: Date;
}

@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatDatepickerModule, MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>Novi termin</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="flex flex-col gap-3">
        <!-- Patient search -->
        <mat-form-field>
          <mat-label>Pretraži pacijenta</mat-label>
          <input matInput (input)="searchPatient($event)" [value]="selectedPatientName()" />
        </mat-form-field>
        @if (patients().length > 0 && !form.value.patientId) {
          <div class="bg-white border rounded shadow-sm max-h-40 overflow-y-auto -mt-2 mb-1">
            @for (p of patients(); track p.patientId) {
              <button type="button" class="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm"
                      (click)="selectPatient(p)">
                {{ p.ime }} {{ p.prezime }} ({{ p.jmbg }})
              </button>
            }
          </div>
        }

        <div class="grid grid-cols-2 gap-3">
          <mat-form-field>
            <mat-label>Lekar</mat-label>
            <mat-select formControlName="doctorId" (selectionChange)="onDoctorOrDateChange()">
              @for (d of doctors(); track d.doctorId) {
                <mat-option [value]="d.doctorId">{{ d.ime }} {{ d.prezime }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Usluga</mat-label>
            <mat-select formControlName="serviceId" (selectionChange)="onDoctorOrDateChange()">
              @for (s of services(); track s.serviceId) {
                <mat-option [value]="s.serviceId">{{ s.naziv }} ({{ s.trajanjeMinuta }} min)</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <mat-form-field>
            <mat-label>Datum</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date"
                   (dateChange)="onDoctorOrDateChange()" />
            <mat-datepicker-toggle matIconSuffix [for]="picker" />
            <mat-datepicker #picker />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Ordinacija</mat-label>
            <mat-select formControlName="officeId">
              @for (o of offices(); track o.officeId) {
                <mat-option [value]="o.officeId">{{ o.naziv }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (slots().length > 0) {
          <div>
            <label class="text-sm text-slate-600 mb-1 block">Slobodni termini</label>
            <div class="flex flex-wrap gap-2">
              @for (slot of slots(); track slot.vremeOd) {
                <mat-chip [class]="selectedSlot() === slot.vremeOd ? 'bg-blue-600 text-white' : 'bg-slate-100'"
                          (click)="selectSlot(slot)">
                  {{ slot.vremeOd }} - {{ slot.vremeDo }}
                </mat-chip>
              }
            </div>
          </div>
        }
        @if (slotsLoaded() && slots().length === 0 && form.value.doctorId && form.value.serviceId && form.value.date) {
          <div class="text-orange-600 text-sm">Nema slobodnih termina za odabrani dan.</div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Otkaži</button>
        <button mat-flat-button color="primary" type="submit"
                [disabled]="!form.valid || !selectedSlot()">
          Zakaži
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class AppointmentDialogComponent implements OnInit {
  data = inject<AppointmentDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AppointmentDialogComponent>);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  patients = signal<Patient[]>([]);
  doctors = signal<Doctor[]>([]);
  services = signal<ServiceItem[]>([]);
  offices = signal<Office[]>([]);
  slots = signal<AvailableSlot[]>([]);
  slotsLoaded = signal(false);
  selectedPatientName = signal('');
  selectedSlot = signal<string | null>(null);
  private search$ = new Subject<string>();

  form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    doctorId: [0, [Validators.required, Validators.min(1)]],
    serviceId: [0, [Validators.required, Validators.min(1)]],
    officeId: [0, [Validators.required, Validators.min(1)]],
    date: [this.data?.date ?? null as Date | null, Validators.required],
  });

  ngOnInit(): void {
    this.api.get<Doctor[]>('doctors?aktivan=true').subscribe(d => this.doctors.set(d));
    this.api.get<ServiceItem[]>('services?aktivan=true').subscribe(s => this.services.set(s));
    this.api.get<Office[]>('offices').subscribe(o => this.offices.set(o.filter(x => x.dostupna)));

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.api.get<Patient[]>(`patients/search?q=${encodeURIComponent(q)}`)),
    ).subscribe(p => this.patients.set(p));
  }

  searchPatient(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.selectedPatientName.set(q);
    this.form.patchValue({ patientId: 0 });
    if (q.length >= 2) {
      this.search$.next(q);
    } else {
      this.patients.set([]);
    }
  }

  selectPatient(p: Patient): void {
    this.form.patchValue({ patientId: p.patientId });
    this.selectedPatientName.set(`${p.ime} ${p.prezime} (${p.jmbg})`);
    this.patients.set([]);
  }

  selectSlot(slot: AvailableSlot): void {
    this.selectedSlot.set(slot.vremeOd);
  }

  onDoctorOrDateChange(): void {
    this.selectedSlot.set(null);
    this.slotsLoaded.set(false);
    const { doctorId, serviceId, date } = this.form.getRawValue();
    if (doctorId && serviceId && date) {
      const d = date as Date;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      this.api.get<AvailableSlot[]>(
        `appointments/available-slots?doctorId=${doctorId}&serviceId=${serviceId}&date=${dateStr}`
      ).subscribe(s => {
        this.slots.set(s);
        this.slotsLoaded.set(true);
      });
    }
  }

  save(): void {
    const val = this.form.getRawValue();
    const slot = this.selectedSlot();
    if (!slot || !val.date) return;

    const d = val.date as Date;
    const [h, m] = slot.split(':').map(Number);
    const datumVreme = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);

    const body: CreateAppointmentRequest = {
      patientId: val.patientId,
      doctorId: val.doctorId,
      serviceId: val.serviceId,
      officeId: val.officeId,
      datumVreme: datumVreme.toISOString(),
    };

    this.api.post('appointments', body).subscribe({
      next: () => {
        this.snackBar.open('Termin zakazan', 'OK', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        const msg = err?.error || 'Greška pri zakazivanju';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }
}

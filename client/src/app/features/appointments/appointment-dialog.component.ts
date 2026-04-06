import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { ApiService } from '../../shared/services/api.service';
import {
  CreateAppointmentRequest, Doctor, Office, ServiceItem, AvailableSlot,
} from './appointment.model';
import { Patient } from '../patients/patient.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

export interface AppointmentDialogData {
  date?: string;
}

@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">Novi termin</h3>
    <form [formGroup]="form" (ngSubmit)="save()">
      <!-- Patient search -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Pretraži pacijenta</legend>
        <input class="input w-full" (input)="searchPatient($event)" [value]="selectedPatientName()" />
      </fieldset>
      @if (patients().length > 0 && !form.value.patientId) {
        <ul class="menu bg-base-100 rounded-box max-h-40 overflow-y-auto shadow-lg border border-base-300 mb-2">
          @for (p of patients(); track p.patientId) {
            <li><a (click)="selectPatient(p)">{{ p.ime }} {{ p.prezime }} ({{ p.jmbg }})</a></li>
          }
        </ul>
      }

      <div class="grid grid-cols-2 gap-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Lekar</legend>
          <select class="select w-full" formControlName="doctorId" (change)="onDoctorOrDateChange()">
            <option [value]="0" disabled>Izaberite</option>
            @for (d of doctors(); track d.doctorId) {
              <option [value]="d.doctorId">{{ d.ime }} {{ d.prezime }}</option>
            }
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Usluga</legend>
          <select class="select w-full" formControlName="serviceId" (change)="onDoctorOrDateChange()">
            <option [value]="0" disabled>Izaberite</option>
            @for (s of services(); track s.serviceId) {
              <option [value]="s.serviceId">{{ s.naziv }} ({{ s.trajanjeMinuta }} min)</option>
            }
          </select>
        </fieldset>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Datum</legend>
          <input type="date" class="input w-full" formControlName="date"
                 [min]="today" (change)="onDoctorOrDateChange()" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Ordinacija</legend>
          <select class="select w-full" formControlName="officeId" (change)="onDoctorOrDateChange()">
            <option [value]="0" disabled>Izaberite</option>
            @for (o of offices(); track o.officeId) {
              <option [value]="o.officeId">{{ o.naziv }}</option>
            }
          </select>
        </fieldset>
      </div>

      @if (slots().length > 0) {
        <div class="mt-2">
          <label class="text-sm opacity-70 mb-1 block">Slobodni termini</label>
          <div class="flex flex-wrap gap-2">
            @for (slot of slots(); track slot.vremeOd) {
              <button type="button"
                      class="btn btn-sm"
                      [class.btn-primary]="selectedSlot() === slot.vremeOd"
                      [class.btn-outline]="selectedSlot() !== slot.vremeOd"
                      (click)="selectSlot(slot)">
                {{ slot.vremeOd }} - {{ slot.vremeDo }}
              </button>
            }
          </div>
        </div>
      }
      @if (slotsLoaded() && slots().length === 0 && form.value.doctorId && form.value.serviceId && form.value.date) {
        <div class="text-warning text-sm mt-2">Nema slobodnih termina za odabrani dan.</div>
      }

      <div class="modal-action">
        <button class="btn" type="button" (click)="dialogRef.close()">Otkaži</button>
        <button class="btn btn-primary" type="submit"
                [disabled]="!form.valid || !selectedSlot()">
          Zakaži
        </button>
      </div>
    </form>
  `,
})
export class AppointmentDialogComponent implements OnInit {
  data = inject<AppointmentDialogData>(DIALOG_DATA);
  dialogRef = inject(DialogRef);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  patients = signal<Patient[]>([]);
  doctors = signal<Doctor[]>([]);
  services = signal<ServiceItem[]>([]);
  offices = signal<Office[]>([]);
  slots = signal<AvailableSlot[]>([]);
  slotsLoaded = signal(false);
  selectedPatientName = signal('');
  selectedSlot = signal<string | null>(null);
  today = new Date().toISOString().slice(0, 10);
  private search$ = new Subject<string>();

  form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    doctorId: [0, [Validators.required, Validators.min(1)]],
    serviceId: [0, [Validators.required, Validators.min(1)]],
    officeId: [0, [Validators.required, Validators.min(1)]],
    date: [this.data?.date ?? '', Validators.required],
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
    const { doctorId, serviceId, officeId, date } = this.form.getRawValue();
    if (doctorId && serviceId && officeId && date) {
      this.api.get<AvailableSlot[]>(
        `appointments/available-slots?doctorId=${doctorId}&serviceId=${serviceId}&date=${date}&officeId=${officeId}`
      ).subscribe(s => {
        this.slots.set(s);
        this.slotsLoaded.set(true);
      });
    } else {
      this.slots.set([]);
    }
  }

  save(): void {
    const val = this.form.getRawValue();
    const slot = this.selectedSlot();
    if (!slot || !val.date) return;

    const [h, m] = slot.split(':').map(Number);
    const d = new Date(val.date);
    const datumVreme = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${datumVreme.getFullYear()}-${pad(datumVreme.getMonth() + 1)}-${pad(datumVreme.getDate())}T${pad(h)}:${pad(m)}:00`;

    const body: CreateAppointmentRequest = {
      patientId: val.patientId,
      doctorId: val.doctorId,
      serviceId: val.serviceId,
      officeId: val.officeId,
      datumVreme: localIso,
    };

    this.api.post('appointments', body).subscribe({
      next: () => {
        this.toast.success('Termin zakazan');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.toast.error(err?.error || 'Greška pri zakazivanju');
      },
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '../../shared/services/dialog.service';
import { ApiService } from '../../shared/services/api.service';

interface PatientOption { patientId: number; ime: string; prezime: string; }
interface ServiceOption { serviceId: number; naziv: string; }
interface DoctorOption { doctorId: number; ime: string; prezime: string; }

@Component({
  selector: 'app-waiting-list-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3 class="font-bold text-lg">Dodaj na listu čekanja</h3>
    <div class="mt-4 flex flex-col gap-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Pacijent</legend>
        <select class="select w-full" [(ngModel)]="model.patientId" name="patientId" required>
          <option [ngValue]="null" disabled>Izaberite pacijenta</option>
          @for (p of patients(); track p.patientId) {
            <option [ngValue]="p.patientId">{{ p.ime }} {{ p.prezime }}</option>
          }
        </select>
      </fieldset>

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
        <legend class="fieldset-legend">Lekar (opciono)</legend>
        <select class="select w-full" [(ngModel)]="model.doctorId" name="doctorId">
          <option [ngValue]="null">Bilo koji</option>
          @for (d of doctors(); track d.doctorId) {
            <option [ngValue]="d.doctorId">{{ d.ime }} {{ d.prezime }}</option>
          }
        </select>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Prioritet</legend>
        <select class="select w-full" [(ngModel)]="model.prioritet" name="prioritet" required>
          <option [ngValue]="1">Visok</option>
          <option [ngValue]="2">Srednji</option>
          <option [ngValue]="3">Nizak</option>
        </select>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Napomena</legend>
        <textarea class="textarea w-full" [(ngModel)]="model.napomena" name="napomena" rows="2"></textarea>
      </fieldset>
    </div>
    <div class="modal-action">
      <button class="btn" (click)="dialogRef.close(null)">Otkaži</button>
      <button class="btn btn-primary" (click)="save()"
              [disabled]="!model.patientId || !model.serviceId">
        Dodaj
      </button>
    </div>
  `,
})
export class WaitingListDialogComponent implements OnInit {
  private api = inject(ApiService);
  dialogRef = inject(DialogRef);

  patients = signal<PatientOption[]>([]);
  services = signal<ServiceOption[]>([]);
  doctors = signal<DoctorOption[]>([]);

  model = {
    patientId: null as number | null,
    serviceId: null as number | null,
    doctorId: null as number | null,
    prioritet: 2,
    napomena: '',
  };

  ngOnInit() {
    this.api.get<PatientOption[]>('patients').subscribe(d => this.patients.set(d));
    this.api.get<ServiceOption[]>('services').subscribe(d => this.services.set(d));
    this.api.get<DoctorOption[]>('doctors').subscribe(d => this.doctors.set(d));
  }

  save(): void {
    this.api.post('waiting-list', {
      patientId: this.model.patientId,
      serviceId: this.model.serviceId,
      doctorId: this.model.doctorId,
      prioritet: this.model.prioritet,
      napomena: this.model.napomena || null,
    }).subscribe(() => this.dialogRef.close(true));
  }
}

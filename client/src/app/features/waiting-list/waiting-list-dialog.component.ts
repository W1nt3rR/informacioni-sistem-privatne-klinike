import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../shared/services/api.service';

interface PatientOption { patientId: number; ime: string; prezime: string; }
interface ServiceOption { serviceId: number; naziv: string; }
interface DoctorOption { doctorId: number; ime: string; prezime: string; }

@Component({
  selector: 'app-waiting-list-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Dodaj na listu čekanja</h2>
    <mat-dialog-content class="flex flex-col gap-3 min-w-[400px]">
      <mat-form-field>
        <mat-label>Pacijent</mat-label>
        <mat-select [(ngModel)]="model.patientId" name="patientId" required>
          @for (p of patients(); track p.patientId) {
            <mat-option [value]="p.patientId">{{ p.ime }} {{ p.prezime }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Usluga</mat-label>
        <mat-select [(ngModel)]="model.serviceId" name="serviceId" required>
          @for (s of services(); track s.serviceId) {
            <mat-option [value]="s.serviceId">{{ s.naziv }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Lekar (opciono)</mat-label>
        <mat-select [(ngModel)]="model.doctorId" name="doctorId">
          <mat-option [value]="null">Bilo koji</mat-option>
          @for (d of doctors(); track d.doctorId) {
            <mat-option [value]="d.doctorId">{{ d.ime }} {{ d.prezime }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Prioritet</mat-label>
        <mat-select [(ngModel)]="model.prioritet" name="prioritet" required>
          <mat-option [value]="1">Visok</mat-option>
          <mat-option [value]="2">Srednji</mat-option>
          <mat-option [value]="3">Nizak</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Napomena</mat-label>
        <textarea matInput [(ngModel)]="model.napomena" name="napomena" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-flat-button color="primary" (click)="save()"
              [disabled]="!model.patientId || !model.serviceId">
        Dodaj
      </button>
    </mat-dialog-actions>
  `,
})
export class WaitingListDialogComponent implements OnInit {
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<WaitingListDialogComponent>);

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

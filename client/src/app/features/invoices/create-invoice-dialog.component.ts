import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../shared/services/api.service';
import { CreateInvoiceRequest, ServiceOption, PatientOption } from './invoice.model';

@Component({
  selector: 'app-create-invoice-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatAutocompleteModule, MatTableModule],
  template: `
    <h2 mat-dialog-title>Novi račun</h2>
    <mat-dialog-content class="min-w-[600px]">
      <!-- Patient Search -->
      <mat-form-field class="w-full">
        <mat-label>Pacijent</mat-label>
        <input matInput [matAutocomplete]="patientAuto"
          [(ngModel)]="patientSearch" (ngModelChange)="searchPatients($event)">
        <mat-autocomplete #patientAuto="matAutocomplete"
          [displayWith]="displayPatient" (optionSelected)="selectPatient($event.option.value)">
          @for (p of filteredPatients(); track p.patientId) {
            <mat-option [value]="p">{{ p.ime }} {{ p.prezime }} ({{ p.jmbg }})</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

      <!-- Items -->
      <h3 class="font-medium mt-2 mb-2">Stavke</h3>
      @for (item of items(); track $index) {
        <div class="flex gap-2 items-center mb-2">
          <mat-form-field class="flex-1">
            <mat-label>Usluga</mat-label>
            <mat-select [(ngModel)]="item.serviceId" (selectionChange)="recalculate()">
              @for (s of services(); track s.serviceId) {
                <mat-option [value]="s.serviceId">{{ s.naziv }} ({{ s.cena | number:'1.2-2' }})</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field class="w-20">
            <mat-label>Kol.</mat-label>
            <input matInput type="number" min="1" [(ngModel)]="item.kolicina" (ngModelChange)="recalculate()">
          </mat-form-field>
          <button mat-icon-button color="warn" (click)="removeItem($index)">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      }
      <button mat-stroked-button (click)="addItem()" class="mb-4">
        <mat-icon>add</mat-icon> Dodaj stavku
      </button>

      <!-- Discount & Note -->
      <div class="flex gap-4">
        <mat-form-field class="w-32">
          <mat-label>Popust (%)</mat-label>
          <input matInput type="number" min="0" max="100" [(ngModel)]="discount" (ngModelChange)="recalculate()">
        </mat-form-field>
        <mat-form-field class="flex-1">
          <mat-label>Napomena</mat-label>
          <input matInput [(ngModel)]="note">
        </mat-form-field>
      </div>

      <!-- Total -->
      <div class="text-right mt-2">
        <p>Ukupno: <strong>{{ total() | number:'1.2-2' }} RSD</strong></p>
        @if (discount > 0) {
          <p>Popust: {{ discount }}%</p>
        }
        <p class="text-lg">Za naplatu: <strong>{{ finalTotal() | number:'1.2-2' }} RSD</strong></p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-raised-button color="primary" (click)="save()"
        [disabled]="!selectedPatientId || items().length === 0">Sačuvaj</button>
    </mat-dialog-actions>
  `
})
export class CreateInvoiceDialogComponent implements OnInit {
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<CreateInvoiceDialogComponent>);

  services = signal<ServiceOption[]>([]);
  filteredPatients = signal<PatientOption[]>([]);
  items = signal<{ serviceId: number; kolicina: number }[]>([]);
  total = signal(0);
  finalTotal = signal(0);

  patientSearch: any = '';
  selectedPatientId: number | null = null;
  discount = 0;
  note = '';

  ngOnInit() {
    this.api.get<ServiceOption[]>('services')
      .subscribe(s => this.services.set(s));
    this.addItem();
  }

  searchPatients(query: string) {
    if (typeof query !== 'string' || query.length < 2) return;
    this.api.get<PatientOption[]>('patients', { search: query })
      .subscribe(p => this.filteredPatients.set(p));
  }

  displayPatient(p: PatientOption): string {
    return p ? `${p.ime} ${p.prezime}` : '';
  }

  selectPatient(p: PatientOption) {
    this.selectedPatientId = p.patientId;
  }

  addItem() {
    this.items.update(list => [...list, { serviceId: 0, kolicina: 1 }]);
  }

  removeItem(idx: number) {
    this.items.update(list => list.filter((_, i) => i !== idx));
    this.recalculate();
  }

  recalculate() {
    const svcs = this.services();
    let sum = 0;
    for (const item of this.items()) {
      const svc = svcs.find(s => s.serviceId === item.serviceId);
      if (svc) sum += svc.cena * item.kolicina;
    }
    this.total.set(sum);
    this.finalTotal.set(sum - (sum * this.discount / 100));
  }

  save() {
    if (!this.selectedPatientId) return;
    const req: CreateInvoiceRequest = {
      patientId: this.selectedPatientId,
      popustProcenat: this.discount,
      napomena: this.note || undefined,
      items: this.items()
        .filter(i => i.serviceId > 0)
        .map(i => ({ serviceId: i.serviceId, kolicina: i.kolicina }))
    };
    this.api.post<any>('invoices', req).subscribe(() => this.dialogRef.close(true));
  }
}

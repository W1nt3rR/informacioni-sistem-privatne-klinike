import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '../../shared/services/dialog.service';
import { ApiService } from '../../shared/services/api.service';
import { CreateInvoiceRequest, ServiceOption, PatientOption } from './invoice.model';

@Component({
  selector: 'app-create-invoice-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3 class="font-bold text-lg">Novi račun</h3>

    <!-- Patient Search -->
    <fieldset class="fieldset relative">
      <legend class="fieldset-legend">Pacijent</legend>
      <input class="input w-full" [(ngModel)]="patientSearch"
        (ngModelChange)="searchPatients($event)"
        (focus)="showPatientDropdown = true"
        (blur)="hidePatientDropdown()"
        placeholder="Pretraži pacijente...">
      @if (showPatientDropdown && filteredPatients().length > 0) {
        <ul class="menu bg-base-100 rounded-box absolute z-50 w-full max-h-48 overflow-auto shadow-lg border border-base-300 mt-1">
          @for (p of filteredPatients(); track p.patientId) {
            <li><a (mousedown)="selectPatient(p)">{{ p.ime }} {{ p.prezime }} ({{ p.jmbg }})</a></li>
          }
        </ul>
      }
    </fieldset>

    <!-- Items -->
    <h3 class="font-medium mt-2 mb-2">Stavke</h3>
    @for (item of items(); track $index) {
      <div class="flex gap-2 items-center mb-2">
        <fieldset class="fieldset flex-1">
          <legend class="fieldset-legend">Usluga</legend>
          <select class="select w-full" [(ngModel)]="item.serviceId" (ngModelChange)="recalculate()">
            <option [ngValue]="0" disabled>Izaberite uslugu</option>
            @for (s of services(); track s.serviceId) {
              <option [ngValue]="s.serviceId">{{ s.naziv }} ({{ s.cena | number:'1.2-2' }})</option>
            }
          </select>
        </fieldset>
        <fieldset class="fieldset w-20">
          <legend class="fieldset-legend">Kol.</legend>
          <input class="input w-full" type="number" min="1" [(ngModel)]="item.kolicina" (ngModelChange)="recalculate()">
        </fieldset>
        <button class="btn btn-ghost btn-sm btn-square text-error" (click)="removeItem($index)">
          <span class="material-icons text-sm">delete</span>
        </button>
      </div>
    }
    <button class="btn btn-outline btn-sm mb-4" (click)="addItem()">
      <span class="material-icons text-sm">add</span> Dodaj stavku
    </button>

    <!-- Discount & Note -->
    <div class="flex gap-4">
      <fieldset class="fieldset w-32">
        <legend class="fieldset-legend">Popust (%)</legend>
        <input class="input w-full" type="number" min="0" max="100" [(ngModel)]="discount" (ngModelChange)="recalculate()">
      </fieldset>
      <fieldset class="fieldset flex-1">
        <legend class="fieldset-legend">Napomena</legend>
        <input class="input w-full" [(ngModel)]="note">
      </fieldset>
    </div>

    <!-- Total -->
    <div class="text-right mt-2">
      <p>Ukupno: <strong>{{ total() | number:'1.2-2' }} RSD</strong></p>
      @if (discount > 0) {
        <p>Popust: {{ discount }}%</p>
      }
      <p class="text-lg">Za naplatu: <strong>{{ finalTotal() | number:'1.2-2' }} RSD</strong></p>
    </div>

    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" (click)="save()"
        [disabled]="!selectedPatientId || items().length === 0">Sačuvaj</button>
    </div>
  `
})
export class CreateInvoiceDialogComponent implements OnInit {
  private api = inject(ApiService);
  ref = inject(DialogRef);

  services = signal<ServiceOption[]>([]);
  filteredPatients = signal<PatientOption[]>([]);
  items = signal<{ serviceId: number; kolicina: number }[]>([]);
  total = signal(0);
  finalTotal = signal(0);

  patientSearch = '';
  selectedPatientId: number | null = null;
  discount = 0;
  note = '';
  showPatientDropdown = false;

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

  selectPatient(p: PatientOption) {
    this.selectedPatientId = p.patientId;
    this.patientSearch = `${p.ime} ${p.prezime}`;
    this.showPatientDropdown = false;
  }

  hidePatientDropdown() {
    setTimeout(() => this.showPatientDropdown = false, 200);
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
    this.api.post<any>('invoices', req).subscribe(() => this.ref.close(true));
  }
}

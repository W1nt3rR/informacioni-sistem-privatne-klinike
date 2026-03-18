import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '../../shared/services/dialog.service';
import { ApiService } from '../../shared/services/api.service';
import { CreateInvoiceRequest, ServiceOption, PatientOption, InvoicePreviewRequest, InvoicePreviewResponse } from './invoice.model';

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
          <select class="select w-full" [(ngModel)]="item.serviceId" (ngModelChange)="onItemChange()">
            <option [ngValue]="0" disabled>Izaberite uslugu</option>
            @for (s of services(); track s.serviceId) {
              <option [ngValue]="s.serviceId">{{ s.naziv }} ({{ s.cena | number:'1.2-2' }})</option>
            }
          </select>
        </fieldset>
        <fieldset class="fieldset w-20">
          <legend class="fieldset-legend">Kol.</legend>
          <input class="input w-full" type="number" min="1" [(ngModel)]="item.kolicina" (ngModelChange)="onItemChange()">
        </fieldset>
        <button class="btn btn-ghost btn-sm btn-square text-error" (click)="removeItem($index)">
          <span class="material-icons text-sm">delete</span>
        </button>
      </div>
    }
    <button class="btn btn-outline btn-sm mb-4" (click)="addItem()">
      <span class="material-icons text-sm">add</span> Dodaj stavku
    </button>

    <!-- Discount Code -->
    <div class="flex gap-4">
      <fieldset class="fieldset flex-1">
        <legend class="fieldset-legend">Kod popusta</legend>
        <div class="flex gap-2">
          <input class="input flex-1 font-mono uppercase" [(ngModel)]="discountCode"
            placeholder="npr. KLINIKA10" (keyup.enter)="applyCode()">
          <button class="btn btn-sm btn-outline" (click)="applyCode()" [disabled]="!discountCode">Primeni</button>
        </div>
        @if (codeMessage()) {
          <p class="text-sm mt-1" [class]="codeValid() ? 'text-success' : 'text-error'">{{ codeMessage() }}</p>
        }
      </fieldset>
      <fieldset class="fieldset flex-1">
        <legend class="fieldset-legend">Napomena</legend>
        <input class="input w-full" [(ngModel)]="note">
      </fieldset>
    </div>

    <!-- Applied Discounts -->
    @if (preview()?.appliedDiscounts?.length) {
      <div class="mt-3">
        <p class="text-sm font-medium mb-1">Primenjeni popusti:</p>
        <div class="flex flex-wrap gap-1">
          @for (d of preview()!.appliedDiscounts; track d.naziv) {
            <span class="badge badge-outline badge-sm">{{ d.naziv }} ({{ d.procenat }}%)</span>
          }
        </div>
      </div>
    }

    <!-- Total -->
    <div class="text-right mt-3">
      <p>Ukupno: <strong>{{ (preview()?.ukupanIznos ?? 0) | number:'1.2-2' }} RSD</strong></p>
      @if ((preview()?.popustProcenat ?? 0) > 0) {
        <p class="text-success">Popust: {{ preview()!.popustProcenat | number:'1.0-2' }}%</p>
      }
      <p class="text-lg">Za naplatu: <strong>{{ (preview()?.iznosZaNaplatu ?? 0) | number:'1.2-2' }} RSD</strong></p>
    </div>

    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" (click)="save()"
        [disabled]="!selectedPatientId || items().length === 0 || saving()">
        @if (saving()) { <span class="loading loading-spinner loading-xs"></span> }
        Sačuvaj
      </button>
    </div>
  `
})
export class CreateInvoiceDialogComponent implements OnInit {
  private api = inject(ApiService);
  ref = inject(DialogRef);

  services = signal<ServiceOption[]>([]);
  filteredPatients = signal<PatientOption[]>([]);
  items = signal<{ serviceId: number; kolicina: number }[]>([]);
  preview = signal<InvoicePreviewResponse | null>(null);
  saving = signal(false);
  codeMessage = signal('');
  codeValid = signal(false);

  patientSearch = '';
  selectedPatientId: number | null = null;
  discountCode = '';
  appliedCode: string | undefined;
  note = '';
  showPatientDropdown = false;

  private previewTimeout: any;

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
    this.fetchPreview();
  }

  hidePatientDropdown() {
    setTimeout(() => this.showPatientDropdown = false, 200);
  }

  addItem() {
    this.items.update(list => [...list, { serviceId: 0, kolicina: 1 }]);
  }

  removeItem(idx: number) {
    this.items.update(list => list.filter((_, i) => i !== idx));
    this.fetchPreview();
  }

  onItemChange() {
    this.fetchPreviewDebounced();
  }

  applyCode() {
    if (!this.discountCode.trim()) return;
    this.appliedCode = this.discountCode.trim();
    this.api.post<{ valid: boolean; naziv?: string; procenat?: number }>('discounts/validate-code', { kod: this.appliedCode }).subscribe({
      next: res => {
        if (res.valid) {
          this.codeValid.set(true);
          this.codeMessage.set(`Kod prihvaćen: ${res.naziv} (${res.procenat}%)`);
          this.fetchPreview();
        } else {
          this.codeValid.set(false);
          this.codeMessage.set('Nevažeći ili istekao kod.');
          this.appliedCode = undefined;
          this.fetchPreview();
        }
      },
      error: () => {
        this.codeValid.set(false);
        this.codeMessage.set('Greška pri proveri koda.');
        this.appliedCode = undefined;
      }
    });
  }

  private fetchPreviewDebounced() {
    clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => this.fetchPreview(), 300);
  }

  private fetchPreview() {
    if (!this.selectedPatientId) return;
    const validItems = this.items().filter(i => i.serviceId > 0);
    if (validItems.length === 0) {
      this.preview.set(null);
      return;
    }

    const req: InvoicePreviewRequest = {
      patientId: this.selectedPatientId,
      items: validItems.map(i => ({ serviceId: i.serviceId, kolicina: i.kolicina })),
      kodPopusta: this.appliedCode
    };
    this.api.post<InvoicePreviewResponse>('invoices/preview', req).subscribe({
      next: p => this.preview.set(p),
      error: () => this.preview.set(null)
    });
  }

  save() {
    if (!this.selectedPatientId) return;
    this.saving.set(true);
    const req: CreateInvoiceRequest = {
      patientId: this.selectedPatientId,
      napomena: this.note || undefined,
      items: this.items()
        .filter(i => i.serviceId > 0)
        .map(i => ({ serviceId: i.serviceId, kolicina: i.kolicina })),
      kodPopusta: this.appliedCode
    };
    this.api.post<any>('invoices', req).subscribe({
      next: () => this.ref.close(true),
      error: () => this.saving.set(false)
    });
  }
}

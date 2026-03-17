import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { InvoiceListItem, DailyRevenue } from './invoice.model';
import { CreateInvoiceDialogComponent } from './create-invoice-dialog.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold">Računi</h2>
        <div class="flex gap-3">
          <button class="btn btn-sm" (click)="showDailyReport()">
            <span class="material-icons text-sm">assessment</span> Dnevni izveštaj
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreate()">
            <span class="material-icons text-sm">add</span> Novi račun
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-4 flex-wrap">
        <fieldset class="fieldset w-48">
          <legend class="fieldset-legend">Status</legend>
          <select class="select w-full" [(ngModel)]="statusFilter" (ngModelChange)="load()">
            <option value="">Svi</option>
            <option value="neplaceno">Neplaćeno</option>
            <option value="delimicno">Delimično</option>
            <option value="placeno">Plaćeno</option>
          </select>
        </fieldset>

        <fieldset class="fieldset w-48">
          <legend class="fieldset-legend">Od datuma</legend>
          <input type="date" class="input w-full" [(ngModel)]="fromDate" (ngModelChange)="load()">
        </fieldset>

        <fieldset class="fieldset w-48">
          <legend class="fieldset-legend">Do datuma</legend>
          <input type="date" class="input w-full" [(ngModel)]="toDate" (ngModelChange)="load()">
        </fieldset>
      </div>

      <!-- Daily Report -->
      @if (dailyReport(); as report) {
        <div class="alert alert-info mb-6">
          <div>
            <h2 class="text-lg font-semibold mb-2">Dnevni izveštaj — {{ report.date | date:'dd.MM.yyyy.' }}</h2>
            <div class="flex gap-6">
              <div><span class="font-medium">Ukupan prihod:</span> {{ report.totalRevenue | number:'1.2-2' }} RSD</div>
              <div><span class="font-medium">Računa:</span> {{ report.invoiceCount }}</div>
              <div><span class="font-medium">Uplata:</span> {{ report.paymentCount }}</div>
            </div>
          </div>
        </div>
      }

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Br. računa</th>
              <th>Pacijent</th>
              <th>Datum</th>
              <th>Iznos</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of invoices(); track r.invoiceId) {
              <tr>
                <td>{{ r.brojRacuna }}</td>
                <td>{{ r.patientIme }} {{ r.patientPrezime }}</td>
                <td>{{ r.datumIzdavanja | date:'dd.MM.yyyy.' }}</td>
                <td>{{ r.iznosZaNaplatu | number:'1.2-2' }} RSD</td>
                <td><span class="badge" [ngClass]="statusBadge(r.statusNaplate)">
                  {{ r.statusNaplate === 'neplaceno' ? 'Neplaćeno' :
                     r.statusNaplate === 'delimicno' ? 'Delimično' : 'Plaćeno' }}
                </span></td>
                <td>
                  <a class="btn btn-ghost btn-xs btn-square" [routerLink]="['/invoices', r.invoiceId]">
                    <span class="material-icons">visibility</span>
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (invoices().length === 0) {
        <p class="text-center text-base-content/60 py-8">Nema računa za prikaz</p>
      }
  `
})
export class InvoiceListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);

  invoices = signal<InvoiceListItem[]>([]);
  dailyReport = signal<DailyRevenue | null>(null);

  statusFilter = '';
  fromDate = '';
  toDate = '';

  ngOnInit() { this.load(); }

  load() {
    let url = 'invoices?';
    if (this.statusFilter) url += `status=${this.statusFilter}&`;
    if (this.fromDate) url += `from=${this.fromDate}&`;
    if (this.toDate) url += `to=${this.toDate}&`;
    this.api.get<InvoiceListItem[]>(url).subscribe(list => this.invoices.set(list));
  }

  openCreate() {
    this.dialogService.open(CreateInvoiceDialogComponent)
      .afterClosed.subscribe(ok => { if (ok) this.load(); });
  }

  showDailyReport() {
    this.api.get<DailyRevenue>('invoices/daily-report')
      .subscribe(r => this.dailyReport.set(r));
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'neplaceno': return 'badge-error';
      case 'delimicno': return 'badge-warning';
      case 'placeno': return 'badge-success';
      default: return 'badge-info';
    }
  }
}

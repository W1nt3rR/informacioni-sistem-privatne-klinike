import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../shared/services/api.service';
import { InvoiceListItem, DailyRevenue } from './invoice.model';
import { CreateInvoiceDialogComponent } from './create-invoice-dialog.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatChipsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Računi</h1>
        <div class="flex gap-3">
          <button mat-raised-button (click)="showDailyReport()">
            <mat-icon>assessment</mat-icon> Dnevni izveštaj
          </button>
          <button mat-raised-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> Novi račun
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-4 flex-wrap">
        <mat-form-field class="w-48">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="load()">
            <mat-option value="">Svi</mat-option>
            <mat-option value="neplaceno">Neplaćeno</mat-option>
            <mat-option value="delimicno">Delimično</mat-option>
            <mat-option value="placeno">Plaćeno</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-48">
          <mat-label>Od datuma</mat-label>
          <input matInput [matDatepicker]="fromPicker" [(ngModel)]="fromDate" (dateChange)="load()">
          <mat-datepicker-toggle matSuffix [for]="fromPicker"/>
          <mat-datepicker #fromPicker/>
        </mat-form-field>

        <mat-form-field class="w-48">
          <mat-label>Do datuma</mat-label>
          <input matInput [matDatepicker]="toPicker" [(ngModel)]="toDate" (dateChange)="load()">
          <mat-datepicker-toggle matSuffix [for]="toPicker"/>
          <mat-datepicker #toPicker/>
        </mat-form-field>
      </div>

      <!-- Daily Report -->
      @if (dailyReport(); as report) {
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 class="text-lg font-semibold mb-2">Dnevni izveštaj — {{ report.date | date:'dd.MM.yyyy.' }}</h2>
          <div class="flex gap-6">
            <div><span class="font-medium">Ukupan prihod:</span> {{ report.totalRevenue | number:'1.2-2' }} RSD</div>
            <div><span class="font-medium">Računa:</span> {{ report.invoiceCount }}</div>
            <div><span class="font-medium">Uplata:</span> {{ report.paymentCount }}</div>
          </div>
        </div>
      }

      <!-- Table -->
      <table mat-table [dataSource]="invoices()" class="w-full">
        <ng-container matColumnDef="brojRacuna">
          <th mat-header-cell *matHeaderCellDef>Br. računa</th>
          <td mat-cell *matCellDef="let r">{{ r.brojRacuna }}</td>
        </ng-container>
        <ng-container matColumnDef="patient">
          <th mat-header-cell *matHeaderCellDef>Pacijent</th>
          <td mat-cell *matCellDef="let r">{{ r.patientIme }} {{ r.patientPrezime }}</td>
        </ng-container>
        <ng-container matColumnDef="datum">
          <th mat-header-cell *matHeaderCellDef>Datum</th>
          <td mat-cell *matCellDef="let r">{{ r.datumIzdavanja | date:'dd.MM.yyyy.' }}</td>
        </ng-container>
        <ng-container matColumnDef="iznos">
          <th mat-header-cell *matHeaderCellDef>Iznos</th>
          <td mat-cell *matCellDef="let r">{{ r.iznosZaNaplatu | number:'1.2-2' }} RSD</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let r">
            <span class="px-2 py-1 rounded text-xs font-medium"
              [class.bg-red-100]="r.statusNaplate === 'neplaceno'"
              [class.text-red-700]="r.statusNaplate === 'neplaceno'"
              [class.bg-yellow-100]="r.statusNaplate === 'delimicno'"
              [class.text-yellow-700]="r.statusNaplate === 'delimicno'"
              [class.bg-green-100]="r.statusNaplate === 'placeno'"
              [class.text-green-700]="r.statusNaplate === 'placeno'">
              {{ r.statusNaplate === 'neplaceno' ? 'Neplaćeno' :
                 r.statusNaplate === 'delimicno' ? 'Delimično' : 'Plaćeno' }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">
            <a mat-icon-button [routerLink]="['/invoices', r.invoiceId]">
              <mat-icon>visibility</mat-icon>
            </a>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>

      @if (invoices().length === 0) {
        <p class="text-center text-gray-500 py-8">Nema računa za prikaz</p>
      }
    </div>
  `
})
export class InvoiceListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);

  invoices = signal<InvoiceListItem[]>([]);
  dailyReport = signal<DailyRevenue | null>(null);
  columns = ['brojRacuna', 'patient', 'datum', 'iznos', 'status', 'actions'];

  statusFilter = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  ngOnInit() { this.load(); }

  load() {
    let url = 'invoices?';
    if (this.statusFilter) url += `status=${this.statusFilter}&`;
    if (this.fromDate) url += `from=${this.fromDate.toISOString()}&`;
    if (this.toDate) url += `to=${this.toDate.toISOString()}&`;
    this.api.get<InvoiceListItem[]>(url).subscribe(list => this.invoices.set(list));
  }

  openCreate() {
    this.dialog.open(CreateInvoiceDialogComponent, { width: '700px' })
      .afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  showDailyReport() {
    this.api.get<DailyRevenue>('invoices/daily-report')
      .subscribe(r => this.dailyReport.set(r));
  }
}

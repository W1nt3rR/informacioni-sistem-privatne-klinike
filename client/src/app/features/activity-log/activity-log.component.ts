import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '../../shared/services/api.service';

interface LogItem {
  activityLogId: number;
  userId: string;
  userName: string;
  akcija: string;
  tabela: string;
  entitetId: string | null;
  stareVrednosti: string | null;
  noveVrednosti: string | null;
  datumVreme: string;
  ipAdresa: string | null;
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Evidencija aktivnosti</h1>

      <div class="flex gap-4 mb-4 flex-wrap">
        <mat-form-field class="w-40">
          <mat-label>Akcija</mat-label>
          <mat-select [(ngModel)]="akcijaFilter" (selectionChange)="load()">
            <mat-option value="">Sve</mat-option>
            <mat-option value="kreiranje">Kreiranje</mat-option>
            <mat-option value="izmena">Izmena</mat-option>
            <mat-option value="brisanje">Brisanje</mat-option>
            <mat-option value="prijava">Prijava</mat-option>
            <mat-option value="odjava">Odjava</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field class="w-40">
          <mat-label>Tabela</mat-label>
          <input matInput [(ngModel)]="tabelaFilter">
        </mat-form-field>
        <mat-form-field class="w-44">
          <mat-label>Od</mat-label>
          <input matInput [matDatepicker]="fromPicker" [(ngModel)]="fromDate">
          <mat-datepicker-toggle matSuffix [for]="fromPicker"/>
          <mat-datepicker #fromPicker/>
        </mat-form-field>
        <mat-form-field class="w-44">
          <mat-label>Do</mat-label>
          <input matInput [matDatepicker]="toPicker" [(ngModel)]="toDate">
          <mat-datepicker-toggle matSuffix [for]="toPicker"/>
          <mat-datepicker #toPicker/>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="load()">
          <mat-icon>search</mat-icon> Pretraži
        </button>
      </div>

      <table mat-table [dataSource]="logs()" class="w-full">
        <ng-container matColumnDef="datum">
          <th mat-header-cell *matHeaderCellDef>Datum/vreme</th>
          <td mat-cell *matCellDef="let l">{{ l.datumVreme | date:'dd.MM.yyyy. HH:mm:ss' }}</td>
        </ng-container>
        <ng-container matColumnDef="user">
          <th mat-header-cell *matHeaderCellDef>Korisnik</th>
          <td mat-cell *matCellDef="let l">{{ l.userName }}</td>
        </ng-container>
        <ng-container matColumnDef="akcija">
          <th mat-header-cell *matHeaderCellDef>Akcija</th>
          <td mat-cell *matCellDef="let l">
            <span class="px-2 py-0.5 rounded text-xs font-medium"
              [class.bg-green-100]="l.akcija === 'kreiranje'"
              [class.text-green-800]="l.akcija === 'kreiranje'"
              [class.bg-blue-100]="l.akcija === 'izmena'"
              [class.text-blue-800]="l.akcija === 'izmena'"
              [class.bg-red-100]="l.akcija === 'brisanje'"
              [class.text-red-800]="l.akcija === 'brisanje'"
              [class.bg-gray-100]="l.akcija === 'prijava' || l.akcija === 'odjava'">
              {{ l.akcija }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="tabela">
          <th mat-header-cell *matHeaderCellDef>Tabela</th>
          <td mat-cell *matCellDef="let l">{{ l.tabela }}</td>
        </ng-container>
        <ng-container matColumnDef="entitet">
          <th mat-header-cell *matHeaderCellDef>ID entiteta</th>
          <td mat-cell *matCellDef="let l">{{ l.entitetId || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="ip">
          <th mat-header-cell *matHeaderCellDef>IP adresa</th>
          <td mat-cell *matCellDef="let l">{{ l.ipAdresa || '—' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    </div>
  `
})
export class ActivityLogComponent implements OnInit {
  private api = inject(ApiService);

  logs = signal<LogItem[]>([]);
  columns = ['datum', 'user', 'akcija', 'tabela', 'entitet', 'ip'];

  akcijaFilter = '';
  tabelaFilter = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  ngOnInit() { this.load(); }

  load() {
    const params = new URLSearchParams();
    if (this.akcijaFilter) params.set('akcija', this.akcijaFilter);
    if (this.tabelaFilter) params.set('tabela', this.tabelaFilter);
    if (this.fromDate) params.set('from', this.fromDate.toISOString());
    if (this.toDate) params.set('to', this.toDate.toISOString());
    const qs = params.toString();
    this.api.get<LogItem[]>(`activity-log${qs ? '?' + qs : ''}`).subscribe(r => this.logs.set(r));
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../shared/services/api.service';
import { WaitingListDialogComponent } from './waiting-list-dialog.component';

interface WaitingListItem {
  waitingListItemId: number;
  patientId: number;
  patientName: string;
  serviceId: number;
  serviceName: string;
  doctorId: number | null;
  doctorName: string | null;
  datumUpisa: string;
  prioritet: number;
  status: string;
  napomena: string | null;
}

@Component({
  selector: 'app-waiting-list',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatDialogModule, MatTooltipModule,
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-slate-800 m-0">Lista čekanja</h2>
      <button mat-flat-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon> Dodaj na listu
      </button>
    </div>

    <mat-card class="mb-4">
      <mat-card-content>
        <div class="flex gap-4 items-end">
          <mat-form-field class="w-48">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="load()">
              <mat-option value="">Svi</mat-option>
              <mat-option value="aktivan">Aktivan</mat-option>
              <mat-option value="zakazan">Zakazan</mat-option>
              <mat-option value="istekao">Istekao</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-content>
        @if (items().length === 0) {
          <p class="text-slate-500 text-center py-8">Lista čekanja je prazna.</p>
        } @else {
          <table mat-table [dataSource]="items()" class="w-full">
            <ng-container matColumnDef="prioritet">
              <th mat-header-cell *matHeaderCellDef>Prioritet</th>
              <td mat-cell *matCellDef="let w">
                <mat-chip [class]="priorityClass(w.prioritet)">
                  {{ priorityLabel(w.prioritet) }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="patientName">
              <th mat-header-cell *matHeaderCellDef>Pacijent</th>
              <td mat-cell *matCellDef="let w">{{ w.patientName }}</td>
            </ng-container>
            <ng-container matColumnDef="serviceName">
              <th mat-header-cell *matHeaderCellDef>Usluga</th>
              <td mat-cell *matCellDef="let w">{{ w.serviceName }}</td>
            </ng-container>
            <ng-container matColumnDef="doctorName">
              <th mat-header-cell *matHeaderCellDef>Lekar</th>
              <td mat-cell *matCellDef="let w">{{ w.doctorName ?? 'Bilo koji' }}</td>
            </ng-container>
            <ng-container matColumnDef="datumUpisa">
              <th mat-header-cell *matHeaderCellDef>Datum upisa</th>
              <td mat-cell *matCellDef="let w">{{ w.datumUpisa | date:'dd.MM.yyyy HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let w">
                <mat-chip [class]="statusClass(w.status)">{{ statusLabel(w.status) }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="napomena">
              <th mat-header-cell *matHeaderCellDef>Napomena</th>
              <td mat-cell *matCellDef="let w">{{ w.napomena ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let w">
                <div class="flex gap-1">
                  @if (w.status === 'aktivan') {
                    <button mat-icon-button color="primary"
                            matTooltip="Označi kao zakazan"
                            (click)="updateStatus(w.waitingListItemId, 'zakazan')">
                      <mat-icon>event_available</mat-icon>
                    </button>
                    <button mat-icon-button color="warn"
                            matTooltip="Označi kao istekao"
                            (click)="updateStatus(w.waitingListItemId, 'istekao')">
                      <mat-icon>event_busy</mat-icon>
                    </button>
                  }
                  <button mat-icon-button color="warn"
                          matTooltip="Ukloni sa liste"
                          (click)="remove(w.waitingListItemId)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class WaitingListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);

  items = signal<WaitingListItem[]>([]);
  statusFilter = 'aktivan';
  columns = ['prioritet', 'patientName', 'serviceName', 'doctorName', 'datumUpisa', 'status', 'napomena', 'actions'];

  ngOnInit() {
    this.load();
  }

  load(): void {
    const params: Record<string, string> = {};
    if (this.statusFilter) params['status'] = this.statusFilter;
    this.api.get<WaitingListItem[]>('waiting-list', params).subscribe(d => this.items.set(d));
  }

  openDialog(): void {
    this.dialog.open(WaitingListDialogComponent, { width: '500px' })
      .afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  updateStatus(id: number, status: string): void {
    this.api.patch(`waiting-list/${id}/status`, { status }).subscribe(() => this.load());
  }

  remove(id: number): void {
    if (!confirm('Da li ste sigurni da želite da uklonite stavku sa liste čekanja?')) return;
    this.api.delete(`waiting-list/${id}`).subscribe(() => this.load());
  }

  priorityLabel(p: number): string {
    return p === 1 ? 'Visok' : p === 2 ? 'Srednji' : 'Nizak';
  }

  priorityClass(p: number): string {
    if (p === 1) return '!bg-red-100 !text-red-800';
    if (p === 2) return '!bg-amber-100 !text-amber-800';
    return '!bg-green-100 !text-green-800';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = { aktivan: 'Aktivan', zakazan: 'Zakazan', istekao: 'Istekao' };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      aktivan: '!bg-blue-100 !text-blue-800',
      zakazan: '!bg-green-100 !text-green-800',
      istekao: '!bg-slate-100 !text-slate-600',
    };
    return map[s] ?? '';
  }
}

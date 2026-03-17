import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../shared/services/api.service';

interface NotificationItem {
  notificationId: number;
  tip: string;
  primalacTip: string;
  primalacId: number;
  primalacIme: string;
  sadrzaj: string;
  datumSlanja: string;
  status: string;
  appointmentId: number | null;
}

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatChipsModule, MatSnackBarModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Obaveštenja</h1>
        <button mat-raised-button color="accent" (click)="generateReminders()">
          <mat-icon>notification_add</mat-icon> Generiši podsetnike
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-4">
        <mat-form-field class="w-48">
          <mat-label>Tip</mat-label>
          <mat-select [(ngModel)]="tipFilter" (selectionChange)="load()">
            <mat-option value="">Svi</mat-option>
            <mat-option value="podsetnik">Podsetnik</mat-option>
            <mat-option value="raspored">Raspored</mat-option>
            <mat-option value="kontrola">Kontrola</mat-option>
            <mat-option value="poruka">Poruka</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field class="w-48">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="load()">
            <mat-option value="">Svi</mat-option>
            <mat-option value="ceka">Čeka</mat-option>
            <mat-option value="poslato">Poslato</mat-option>
            <mat-option value="isporuceno">Isporučeno</mat-option>
            <mat-option value="greska">Greška</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field class="w-48">
          <mat-label>Primalac</mat-label>
          <mat-select [(ngModel)]="primalacFilter" (selectionChange)="load()">
            <mat-option value="">Svi</mat-option>
            <mat-option value="pacijent">Pacijent</mat-option>
            <mat-option value="lekar">Lekar</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <table mat-table [dataSource]="notifications()" class="w-full">
        <ng-container matColumnDef="tip">
          <th mat-header-cell *matHeaderCellDef>Tip</th>
          <td mat-cell *matCellDef="let n">{{ formatTip(n.tip) }}</td>
        </ng-container>
        <ng-container matColumnDef="primalac">
          <th mat-header-cell *matHeaderCellDef>Primalac</th>
          <td mat-cell *matCellDef="let n">
            <span class="text-xs text-gray-400">{{ n.primalacTip === 'pacijent' ? 'Pacijent' : 'Lekar' }}</span><br>
            {{ n.primalacIme }}
          </td>
        </ng-container>
        <ng-container matColumnDef="sadrzaj">
          <th mat-header-cell *matHeaderCellDef>Sadržaj</th>
          <td mat-cell *matCellDef="let n" class="max-w-sm truncate">{{ n.sadrzaj }}</td>
        </ng-container>
        <ng-container matColumnDef="datum">
          <th mat-header-cell *matHeaderCellDef>Datum</th>
          <td mat-cell *matCellDef="let n">{{ n.datumSlanja | date:'dd.MM.yyyy. HH:mm' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let n">
            <span class="px-2 py-1 rounded text-xs font-medium"
              [class.bg-yellow-100]="n.status === 'ceka'"
              [class.text-yellow-800]="n.status === 'ceka'"
              [class.bg-green-100]="n.status === 'poslato' || n.status === 'isporuceno'"
              [class.text-green-800]="n.status === 'poslato' || n.status === 'isporuceno'"
              [class.bg-red-100]="n.status === 'greska'"
              [class.text-red-800]="n.status === 'greska'">
              {{ formatStatus(n.status) }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let n">
            @if (n.status === 'ceka') {
              <button mat-icon-button color="primary" (click)="send(n)"
                matTooltip="Pošalji">
                <mat-icon>send</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `
})
export class NotificationListComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  notifications = signal<NotificationItem[]>([]);
  displayedColumns = ['tip', 'primalac', 'sadrzaj', 'datum', 'status', 'actions'];

  tipFilter = '';
  statusFilter = '';
  primalacFilter = '';

  ngOnInit() { this.load(); }

  load() {
    const params = new URLSearchParams();
    if (this.tipFilter) params.set('tip', this.tipFilter);
    if (this.statusFilter) params.set('status', this.statusFilter);
    if (this.primalacFilter) params.set('primalacTip', this.primalacFilter);
    const qs = params.toString();
    this.api.get<NotificationItem[]>(`notifications${qs ? '?' + qs : ''}`).subscribe(r => this.notifications.set(r));
  }

  send(n: NotificationItem) {
    this.api.patch(`notifications/${n.notificationId}/send`, {}).subscribe(() => {
      this.snack.open('Obaveštenje poslato', 'OK', { duration: 2000 });
      this.load();
    });
  }

  generateReminders() {
    this.api.post<{ generated: number }>('notifications/generate-reminders', {}).subscribe(r => {
      this.snack.open(`Generisano ${r.generated} obaveštenja`, 'OK', { duration: 3000 });
      this.load();
    });
  }

  formatTip(t: string): string {
    switch (t) {
      case 'podsetnik': return 'Podsetnik';
      case 'raspored': return 'Raspored';
      case 'kontrola': return 'Kontrola';
      case 'poruka': return 'Poruka';
      default: return t;
    }
  }

  formatStatus(s: string): string {
    switch (s) {
      case 'ceka': return 'Čeka';
      case 'poslato': return 'Poslato';
      case 'isporuceno': return 'Isporučeno';
      case 'greska': return 'Greška';
      default: return s;
    }
  }
}

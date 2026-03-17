import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { WaitingListDialogComponent } from './waiting-list-dialog.component';
import { WaitingListConvertDialogComponent, ConvertDialogData } from './waiting-list-convert-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

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
  imports: [DatePipe, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Lista čekanja</h2>
      <button class="btn btn-primary btn-sm" (click)="openDialog()">
        <span class="material-icons text-sm">add</span> Dodaj na listu
      </button>
    </div>

    <div class="card bg-base-100 shadow-sm mb-4">
      <div class="card-body p-4">
        <div class="flex gap-4 items-end">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Status</legend>
            <select class="select w-48" [(ngModel)]="statusFilter" (ngModelChange)="load()">
              <option value="">Svi</option>
              <option value="aktivan">Aktivan</option>
              <option value="zakazan">Zakazan</option>
              <option value="istekao">Istekao</option>
            </select>
          </fieldset>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-0">
        @if (items().length === 0) {
          <p class="text-base-content/60 text-center py-8">Lista čekanja je prazna.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Prioritet</th>
                <th>Pacijent</th>
                <th>Usluga</th>
                <th>Lekar</th>
                <th>Datum upisa</th>
                <th>Status</th>
                <th>Napomena</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (w of items(); track w.waitingListItemId) {
                <tr>
                  <td><span class="badge" [class]="priorityClass(w.prioritet)">{{ priorityLabel(w.prioritet) }}</span></td>
                  <td>{{ w.patientName }}</td>
                  <td>{{ w.serviceName }}</td>
                  <td>{{ w.doctorName ?? 'Bilo koji' }}</td>
                  <td>{{ w.datumUpisa | date:'dd.MM.yyyy HH:mm' }}</td>
                  <td><span class="badge" [class]="statusClass(w.status)">{{ statusLabel(w.status) }}</span></td>
                  <td>{{ w.napomena ?? '-' }}</td>
                  <td>
                    <div class="flex gap-1">
                      @if (w.status === 'aktivan') {
                        <div class="tooltip" data-tip="Zakaži termin">
                          <button class="btn btn-ghost btn-xs btn-square text-success"
                                  (click)="convertToAppointment(w)">
                            <span class="material-icons">calendar_month</span>
                          </button>
                        </div>
                        <div class="tooltip" data-tip="Označi kao zakazan">
                          <button class="btn btn-ghost btn-xs btn-square text-primary"
                                  (click)="updateStatus(w.waitingListItemId, 'zakazan')">
                            <span class="material-icons">event_available</span>
                          </button>
                        </div>
                        <div class="tooltip" data-tip="Označi kao istekao">
                          <button class="btn btn-ghost btn-xs btn-square text-error"
                                  (click)="updateStatus(w.waitingListItemId, 'istekao')">
                            <span class="material-icons">event_busy</span>
                          </button>
                        </div>
                      }
                      <div class="tooltip" data-tip="Ukloni sa liste">
                        <button class="btn btn-ghost btn-xs btn-square text-error"
                                (click)="remove(w.waitingListItemId)">
                          <span class="material-icons">delete</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class WaitingListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);

  items = signal<WaitingListItem[]>([]);
  statusFilter = 'aktivan';

  ngOnInit() {
    this.load();
  }

  load(): void {
    const params: Record<string, string> = {};
    if (this.statusFilter) params['status'] = this.statusFilter;
    this.api.get<WaitingListItem[]>('waiting-list', params).subscribe(d => this.items.set(d));
  }

  openDialog(): void {
    this.dialogService.open(WaitingListDialogComponent, null)
      .afterClosed.subscribe(ok => { if (ok) this.load(); });
  }

  updateStatus(id: number, status: string): void {
    this.api.patch(`waiting-list/${id}/status`, { status }).subscribe(() => this.load());
  }

  remove(id: number): void {
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Uklanjanje',
      message: 'Da li ste sigurni da želite da uklonite stavku sa liste čekanja?'
    });
    ref.afterClosed.subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`waiting-list/${id}`).subscribe(() => this.load());
    });
  }

  convertToAppointment(w: WaitingListItem): void {
    const data: ConvertDialogData = {
      waitingListItemId: w.waitingListItemId,
      patientName: w.patientName,
      serviceName: w.serviceName,
      serviceId: w.serviceId,
      doctorId: w.doctorId,
      doctorName: w.doctorName,
    };
    this.dialogService.open(WaitingListConvertDialogComponent, data)
      .afterClosed.subscribe(ok => { if (ok) this.load(); });
  }

  priorityLabel(p: number): string {
    return p === 1 ? 'Visok' : p === 2 ? 'Srednji' : 'Nizak';
  }

  priorityClass(p: number): string {
    if (p === 1) return 'badge-error';
    if (p === 2) return 'badge-warning';
    return 'badge-success';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = { aktivan: 'Aktivan', zakazan: 'Zakazan', istekao: 'Istekao' };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      aktivan: 'badge-info',
      zakazan: 'badge-success',
      istekao: 'badge-ghost',
    };
    return map[s] ?? '';
  }
}

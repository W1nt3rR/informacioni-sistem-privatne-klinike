import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  AppointmentListItem,
  ApproveRequest,
  CancelRequest,
  Doctor,
  RejectRequest,
  RescheduleRequest,
} from './appointment.model';
import { AppointmentDialogComponent } from './appointment-dialog.component';
import { CancelDialogComponent, CancelDialogData } from './cancel-dialog.component';
import { ApproveRequestDialogComponent } from './approve-request-dialog.component';
import { RejectRequestDialogComponent } from './reject-request-dialog.component';
import { RescheduleAppointmentDialogComponent } from './reschedule-appointment-dialog.component';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Termini</h2>
      <button class="btn btn-primary btn-sm" (click)="openCreateDialog()">
        <span class="material-icons text-sm">add</span> Novi termin
      </button>
    </div>

    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <input type="date" class="input input-sm" [formControl]="fromCtrl" (change)="load()" />
      <input type="date" class="input input-sm" [formControl]="toCtrl" (change)="load()" />
      <select class="select select-sm" [formControl]="doctorCtrl" (change)="load()">
        <option [value]="0">Svi lekari</option>
        @for (d of doctors(); track d.doctorId) {
          <option [value]="d.doctorId">{{ d.ime }} {{ d.prezime }}</option>
        }
      </select>
      <select class="select select-sm" [formControl]="statusCtrl" (change)="load()">
        <option value="">Svi statusi</option>
        <option value="zahtev">Zahtev</option>
        <option value="zakazan">Zakazan</option>
        <option value="realizovan">Realizovan</option>
        <option value="otkazao_pacijent">Otkazao pacijent</option>
        <option value="otkazala_klinika">Otkazala klinika</option>
        <option value="nije_se_pojavio">Nije se pojavio</option>
      </select>
      <button class="btn btn-outline btn-sm" (click)="goToday()">Danas</button>
      <div class="join">
        <button class="btn btn-ghost btn-sm btn-square join-item" (click)="navigate(-1)">
          <span class="material-icons">chevron_left</span>
        </button>
        <button class="btn btn-ghost btn-sm btn-square join-item" (click)="navigate(1)">
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else {
      <div class="card bg-base-100 shadow-sm">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Datum i vreme</th>
                <th>Pacijent</th>
                <th>Lekar</th>
                <th>Usluga</th>
                <th>Ordinacija</th>
                <th>Trajanje</th>
                <th>Status</th>
                <th class="w-16"></th>
              </tr>
            </thead>
            <tbody>
              @for (row of appointments(); track row.appointmentId) {
                <tr class="hover">
                  <td>{{ row.datumVreme | date:'dd.MM.yyyy. HH:mm' }}</td>
                  <td>{{ row.pacijentIme }}</td>
                  <td>{{ row.lekarIme }}</td>
                  <td>{{ row.uslugaNaziv }}</td>
                  <td>{{ row.officeId ? row.ordinacijaNaziv : 'Nije dodeljena' }}</td>
                  <td>{{ row.trajanjeMinuta }} min</td>
                  <td><span class="badge" [class]="statusClass(row.status)">{{ statusLabel(row.status) }}</span></td>
                  <td>
                    @if (row.status === 'zahtev' && canManageRequests()) {
                      <div class="flex gap-1">
                        <div class="tooltip" data-tip="Odobri">
                          <button class="btn btn-ghost btn-xs btn-square text-success" (click)="openApproveDialog(row)">
                            <span class="material-icons text-sm">check_circle</span>
                          </button>
                        </div>
                        <div class="tooltip" data-tip="Odbij">
                          <button class="btn btn-ghost btn-xs btn-square text-error" (click)="openRejectDialog(row)">
                            <span class="material-icons text-sm">highlight_off</span>
                          </button>
                        </div>
                      </div>
                    }
                    @if (row.status === 'zakazan') {
                      <div class="flex gap-1">
                        @if (canReschedule()) {
                          <div class="tooltip" data-tip="Pomeri termin">
                            <button class="btn btn-ghost btn-xs btn-square" (click)="openRescheduleDialog(row)">
                              <span class="material-icons text-sm">edit_calendar</span>
                            </button>
                          </div>
                        }
                        <div class="tooltip" data-tip="Otkaži">
                          <button class="btn btn-ghost btn-xs btn-square text-error" (click)="openCancelDialog(row)">
                            <span class="material-icons text-sm">cancel</span>
                          </button>
                        </div>
                      </div>
                    }
                  </td>
                </tr>
              }
              @if (appointments().length === 0) {
                <tr><td colspan="8" class="text-center text-base-content/60 py-8">Nema termina za odabrani period.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class AppointmentListComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  appointments = signal<AppointmentListItem[]>([]);
  doctors = signal<Doctor[]>([]);
  loading = signal(false);

  fromCtrl = this.fb.control(this.toDateString(this.weekStart(new Date())));
  toCtrl = this.fb.control(this.toDateString(this.weekEnd(new Date())));
  doctorCtrl = this.fb.control(0);
  statusCtrl = this.fb.control('');

  ngOnInit(): void {
    this.api.get<Doctor[]>('doctors?aktivan=true').subscribe(d => this.doctors.set(d));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const from = this.fromCtrl.value as string;
    const to = this.toCtrl.value as string;
    const doctorId = this.doctorCtrl.value;
    const status = this.statusCtrl.value;

    let url = `appointments?from=${this.toApiDateTime(from)}&to=${this.toApiDateTime(to, true)}`;
    if (doctorId) url += `&doctorId=${doctorId}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;

    this.api.get<AppointmentListItem[]>(url).subscribe({
      next: data => { this.appointments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goToday(): void {
    const today = new Date();
    this.fromCtrl.setValue(this.toDateString(this.weekStart(today)));
    this.toCtrl.setValue(this.toDateString(this.weekEnd(today)));
    this.load();
  }

  navigate(dir: number): void {
    const from = new Date(this.fromCtrl.value as string);
    from.setDate(from.getDate() + dir * 7);
    this.fromCtrl.setValue(this.toDateString(from));
    this.toCtrl.setValue(this.toDateString(this.weekEnd(from)));
    this.load();
  }

  private weekStart(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0);
  }

  private weekEnd(d: Date): Date {
    const start = this.weekStart(d);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59);
  }

  private toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private toApiDateTime(date: string, endOfDay = false): string {
    const [year, month, day] = date.split('-').map(Number);
    const hours = endOfDay ? 23 : 0;
    const minutes = endOfDay ? 59 : 0;
    const seconds = endOfDay ? 59 : 0;
    const pad = (value: number) => value.toString().padStart(2, '0');

    return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  canManageRequests(): boolean {
    return this.auth.hasAnyRole(['admin', 'recepcija']);
  }

  canReschedule(): boolean {
    return this.auth.hasAnyRole(['admin', 'recepcija']);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'zahtev': return 'badge-secondary';
      case 'zakazan': return 'badge-info';
      case 'realizovan': return 'badge-success';
      case 'otkazao_pacijent': case 'otkazala_klinika': return 'badge-error';
      case 'nije_se_pojavio': return 'badge-warning';
      default: return '';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'zahtev': return 'Zahtev';
      case 'zakazan': return 'Zakazan';
      case 'realizovan': return 'Realizovan';
      case 'otkazao_pacijent': return 'Otkazao pacijent';
      case 'otkazala_klinika': return 'Otkazala klinika';
      case 'nije_se_pojavio': return 'Nije se pojavio';
      default: return status;
    }
  }

  openCreateDialog(): void {
    const ref = this.dialogService.open(AppointmentDialogComponent, { date: this.fromCtrl.value });
    ref.afterClosed.subscribe(result => {
      if (result) this.load();
    });
  }

  openRescheduleDialog(row: AppointmentListItem): void {
    const ref = this.dialogService.open(RescheduleAppointmentDialogComponent, row);
    ref.afterClosed.subscribe(result => {
      if (result) {
        this.api.put<RescheduleRequest>(`appointments/${row.appointmentId}`, result).subscribe({
          next: () => { this.toast.success('Termin je pomeren'); this.load(); },
          error: (err) => this.toast.error(err?.error || 'Greška'),
        });
      }
    });
  }

  openApproveDialog(row: AppointmentListItem): void {
    const ref = this.dialogService.open(ApproveRequestDialogComponent, row);
    ref.afterClosed.subscribe(result => {
      if (result) {
        this.api.patch<ApproveRequest>(`appointments/${row.appointmentId}/approve`, result).subscribe({
          next: () => { this.toast.success('Zahtev je odobren'); this.load(); },
          error: (err) => this.toast.error(err?.error || 'Greška'),
        });
      }
    });
  }

  openRejectDialog(row: AppointmentListItem): void {
    const ref = this.dialogService.open(RejectRequestDialogComponent, row);
    ref.afterClosed.subscribe(result => {
      if (result) {
        this.api.patch<RejectRequest>(`appointments/${row.appointmentId}/reject`, result).subscribe({
          next: () => { this.toast.success('Zahtev je odbijen'); this.load(); },
          error: (err) => this.toast.error(err?.error || 'Greška'),
        });
      }
    });
  }

  openCancelDialog(row: AppointmentListItem): void {
    const ref = this.dialogService.open(CancelDialogComponent, {
      appointmentId: row.appointmentId, pacijentIme: row.pacijentIme,
    } as CancelDialogData);
    ref.afterClosed.subscribe(result => {
      if (result) {
        this.api.patch<CancelRequest>(`appointments/${row.appointmentId}/cancel`, result).subscribe({
          next: () => { this.toast.success('Termin otkazan'); this.load(); },
          error: (err) => this.toast.error(err?.error || 'Greška'),
        });
      }
    });
  }
}

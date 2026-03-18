import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { CalendarAppointment, CancelRequest, Doctor } from './appointment.model';
import { AppointmentDialogComponent } from './appointment-dialog.component';
import { CancelDialogComponent, CancelDialogData } from './cancel-dialog.component';

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
                  <td>{{ row.ordinacijaNaziv }}</td>
                  <td>{{ row.trajanjeMinuta }} min</td>
                  <td><span class="badge" [class]="statusClass(row.status)">{{ statusLabel(row.status) }}</span></td>
                  <td>
                    @if (row.status === 'zakazan') {
                      <div class="flex gap-1">
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
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  appointments = signal<CalendarAppointment[]>([]);
  doctors = signal<Doctor[]>([]);
  loading = signal(false);

  fromCtrl = this.fb.control(this.toDateString(this.weekStart(new Date())));
  toCtrl = this.fb.control(this.toDateString(this.weekEnd(new Date())));
  doctorCtrl = this.fb.control(0);

  ngOnInit(): void {
    this.api.get<Doctor[]>('doctors?aktivan=true').subscribe(d => this.doctors.set(d));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const from = this.fromCtrl.value as string;
    const to = this.toCtrl.value as string;
    const doctorId = this.doctorCtrl.value;

    let url = `appointments/calendar?from=${new Date(from).toISOString()}&to=${new Date(to).toISOString()}`;
    if (doctorId) url += `&doctorId=${doctorId}`;

    this.api.get<CalendarAppointment[]>(url).subscribe({
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

  statusClass(status: string): string {
    switch (status) {
      case 'zakazan': return 'badge-info';
      case 'realizovan': return 'badge-success';
      case 'otkazao_pacijent': case 'otkazala_klinika': return 'badge-error';
      case 'nije_se_pojavio': return 'badge-warning';
      default: return '';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
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

  openCancelDialog(row: CalendarAppointment): void {
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

import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { CalendarAppointment, CancelRequest, Doctor } from './appointment.model';
import { AppointmentDialogComponent } from './appointment-dialog.component';
import { CancelDialogComponent, CancelDialogData } from './cancel-dialog.component';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule,
    MatSelectModule, MatDatepickerModule, MatInputModule, MatChipsModule,
    MatProgressSpinnerModule, MatMenuModule, ReactiveFormsModule, DatePipe,
  ],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-slate-800 m-0">Termini</h2>
      <button mat-flat-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon> Novi termin
      </button>
    </div>

    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Od</mat-label>
        <input matInput [matDatepicker]="fromPicker" [formControl]="fromCtrl"
               (dateChange)="load()" />
        <mat-datepicker-toggle matIconSuffix [for]="fromPicker" />
        <mat-datepicker #fromPicker />
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Do</mat-label>
        <input matInput [matDatepicker]="toPicker" [formControl]="toCtrl"
               (dateChange)="load()" />
        <mat-datepicker-toggle matIconSuffix [for]="toPicker" />
        <mat-datepicker #toPicker />
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Lekar</mat-label>
        <mat-select [formControl]="doctorCtrl" (selectionChange)="load()">
          <mat-option [value]="0">Svi</mat-option>
          @for (d of doctors(); track d.doctorId) {
            <mat-option [value]="d.doctorId">{{ d.ime }} {{ d.prezime }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button mat-stroked-button (click)="goToday()">Danas</button>
      <div class="flex items-center gap-1">
        <button mat-icon-button (click)="navigate(-1)"><mat-icon>chevron_left</mat-icon></button>
        <button mat-icon-button (click)="navigate(1)"><mat-icon>chevron_right</mat-icon></button>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="40" />
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <table mat-table [dataSource]="appointments()" class="w-full">
          <ng-container matColumnDef="datumVreme">
            <th mat-header-cell *matHeaderCellDef>Datum i vreme</th>
            <td mat-cell *matCellDef="let row">{{ row.datumVreme | date:'dd.MM.yyyy. HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="pacijent">
            <th mat-header-cell *matHeaderCellDef>Pacijent</th>
            <td mat-cell *matCellDef="let row">{{ row.pacijentIme }}</td>
          </ng-container>
          <ng-container matColumnDef="lekar">
            <th mat-header-cell *matHeaderCellDef>Lekar</th>
            <td mat-cell *matCellDef="let row">{{ row.lekarIme }}</td>
          </ng-container>
          <ng-container matColumnDef="usluga">
            <th mat-header-cell *matHeaderCellDef>Usluga</th>
            <td mat-cell *matCellDef="let row">{{ row.uslugaNaziv }}</td>
          </ng-container>
          <ng-container matColumnDef="ordinacija">
            <th mat-header-cell *matHeaderCellDef>Ordinacija</th>
            <td mat-cell *matCellDef="let row">{{ row.ordinacijaNaziv }}</td>
          </ng-container>
          <ng-container matColumnDef="trajanje">
            <th mat-header-cell *matHeaderCellDef>Trajanje</th>
            <td mat-cell *matCellDef="let row">{{ row.trajanjeMinuta }} min</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [class]="statusClass(row.status)">{{ statusLabel(row.status) }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="w-16"></th>
            <td mat-cell *matCellDef="let row">
              @if (row.status === 'zakazan') {
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="markRealized(row)">
                    <mat-icon>check_circle</mat-icon> Realizovan
                  </button>
                  <button mat-menu-item (click)="openCancelDialog(row)">
                    <mat-icon>cancel</mat-icon> Otkaži
                  </button>
                </mat-menu>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        @if (appointments().length === 0) {
          <div class="text-center text-slate-400 py-8">Nema termina za odabrani period.</div>
        }
      </div>
    }
  `,
})
export class AppointmentListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  appointments = signal<CalendarAppointment[]>([]);
  doctors = signal<Doctor[]>([]);
  loading = signal(false);
  columns = ['datumVreme', 'pacijent', 'lekar', 'usluga', 'ordinacija', 'trajanje', 'status', 'actions'];

  fromCtrl = this.fb.control(this.weekStart(new Date()));
  toCtrl = this.fb.control(this.weekEnd(new Date()));
  doctorCtrl = this.fb.control(0);

  ngOnInit(): void {
    this.api.get<Doctor[]>('doctors?aktivan=true').subscribe(d => this.doctors.set(d));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const from = this.fromCtrl.value as Date;
    const to = this.toCtrl.value as Date;
    const doctorId = this.doctorCtrl.value;

    let url = `appointments/calendar?from=${from.toISOString()}&to=${to.toISOString()}`;
    if (doctorId) url += `&doctorId=${doctorId}`;

    this.api.get<CalendarAppointment[]>(url).subscribe({
      next: data => { this.appointments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goToday(): void {
    const today = new Date();
    this.fromCtrl.setValue(this.weekStart(today));
    this.toCtrl.setValue(this.weekEnd(today));
    this.load();
  }

  navigate(dir: number): void {
    const from = new Date(this.fromCtrl.value as Date);
    from.setDate(from.getDate() + dir * 7);
    this.fromCtrl.setValue(from);
    this.toCtrl.setValue(this.weekEnd(from));
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

  statusClass(status: string): string {
    switch (status) {
      case 'zakazan': return 'bg-blue-100 text-blue-800';
      case 'realizovan': return 'bg-green-100 text-green-800';
      case 'otkazao_pacijent': case 'otkazala_klinika': return 'bg-red-100 text-red-800';
      case 'nije_se_pojavio': return 'bg-orange-100 text-orange-800';
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
    this.dialog.open(AppointmentDialogComponent, {
      width: '650px',
      data: { date: this.fromCtrl.value },
    }).afterClosed().subscribe(result => {
      if (result) this.load();
    });
  }

  markRealized(row: CalendarAppointment): void {
    this.api.patch(`appointments/${row.appointmentId}/status`, JSON.stringify('realizovan'))
      .subscribe({
        next: () => { this.snackBar.open('Termin realizovan', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snackBar.open('Greška', 'OK', { duration: 3000 }),
      });
  }

  openCancelDialog(row: CalendarAppointment): void {
    this.dialog.open(CancelDialogComponent, {
      width: '450px',
      data: { appointmentId: row.appointmentId, pacijentIme: row.pacijentIme } as CancelDialogData,
    }).afterClosed().subscribe(result => {
      if (result) {
        this.api.patch<CancelRequest>(`appointments/${row.appointmentId}/cancel`, result).subscribe({
          next: () => { this.snackBar.open('Termin otkazan', 'OK', { duration: 2000 }); this.load(); },
          error: (err) => this.snackBar.open(err?.error || 'Greška', 'OK', { duration: 3000 }),
        });
      }
    });
  }
}

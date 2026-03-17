import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { ExaminationListItem } from './examination.model';

interface AppointmentForExam {
  appointmentId: number;
  patientIme: string;
  patientPrezime: string;
  doctorIme: string;
  doctorPrezime: string;
  serviceName: string;
  datumVreme: string;
  trajanjeMinuta: number;
  status: string;
  examinationId?: number;
}

@Component({
  selector: 'app-examination-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatSelectModule, MatFormFieldModule, MatCardModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Pregledi</h1>
      </div>

      <mat-card class="mb-6">
        <mat-card-header>
          <mat-card-title>Današnji termini</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="todayAppointments()" class="w-full">
            <ng-container matColumnDef="vreme">
              <th mat-header-cell *matHeaderCellDef>Vreme</th>
              <td mat-cell *matCellDef="let a">{{ formatTime(a.datumVreme) }}</td>
            </ng-container>
            <ng-container matColumnDef="pacijent">
              <th mat-header-cell *matHeaderCellDef>Pacijent</th>
              <td mat-cell *matCellDef="let a">{{ a.patientIme }} {{ a.patientPrezime }}</td>
            </ng-container>
            <ng-container matColumnDef="lekar">
              <th mat-header-cell *matHeaderCellDef>Lekar</th>
              <td mat-cell *matCellDef="let a">Dr {{ a.doctorIme }} {{ a.doctorPrezime }}</td>
            </ng-container>
            <ng-container matColumnDef="usluga">
              <th mat-header-cell *matHeaderCellDef>Usluga</th>
              <td mat-cell *matCellDef="let a">{{ a.serviceName }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let a">
                <mat-chip [class]="'status-' + a.status">{{ statusLabel(a.status) }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="akcije">
              <th mat-header-cell *matHeaderCellDef>Akcije</th>
              <td mat-cell *matCellDef="let a">
                @if (a.status === 'zakazan') {
                  <button mat-raised-button color="primary" (click)="startExamination(a)">
                    <mat-icon>medical_services</mat-icon> Započni pregled
                  </button>
                }
                @if (a.status === 'realizovan' && a.examinationId) {
                  <a mat-button color="accent" [routerLink]="['/examinations', a.examinationId]">
                    <mat-icon>visibility</mat-icon> Otvori pregled
                  </a>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="appointmentColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: appointmentColumns;"></tr>
          </table>
          @if (todayAppointments().length === 0) {
            <p class="text-center text-gray-500 py-4">Nema zakazanih termina za danas.</p>
          }
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Svi pregledi</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="flex gap-4 mb-4 mt-2">
            <mat-form-field>
              <mat-label>Status</mat-label>
              <mat-select [(value)]="statusFilter" (selectionChange)="loadExaminations()">
                <mat-option value="">Svi</mat-option>
                <mat-option value="u_toku">U toku</mat-option>
                <mat-option value="zavrsen">Završen</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <table mat-table [dataSource]="examinations()" class="w-full">
            <ng-container matColumnDef="datum">
              <th mat-header-cell *matHeaderCellDef>Datum</th>
              <td mat-cell *matCellDef="let e">{{ formatDate(e.datumPregleda) }}</td>
            </ng-container>
            <ng-container matColumnDef="pacijent">
              <th mat-header-cell *matHeaderCellDef>Pacijent</th>
              <td mat-cell *matCellDef="let e">{{ e.patientIme }} {{ e.patientPrezime }}</td>
            </ng-container>
            <ng-container matColumnDef="lekar">
              <th mat-header-cell *matHeaderCellDef>Lekar</th>
              <td mat-cell *matCellDef="let e">Dr {{ e.doctorIme }} {{ e.doctorPrezime }}</td>
            </ng-container>
            <ng-container matColumnDef="dijagnoza">
              <th mat-header-cell *matHeaderCellDef>Dijagnoza</th>
              <td mat-cell *matCellDef="let e">
                @if (e.dijagnozaSifra) {
                  {{ e.dijagnozaSifra }} - {{ e.dijagnozaNaziv }}
                } @else {
                  <span class="text-gray-400">—</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let e">
                <mat-chip [class]="'status-' + e.status">{{ statusLabel(e.status) }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="akcije">
              <th mat-header-cell *matHeaderCellDef>Akcije</th>
              <td mat-cell *matCellDef="let e">
                <a mat-icon-button [routerLink]="['/examinations', e.examinationId]">
                  <mat-icon>visibility</mat-icon>
                </a>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="examColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: examColumns;"></tr>
          </table>
          @if (examinations().length === 0) {
            <p class="text-center text-gray-500 py-4">Nema pregleda.</p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .status-zakazan { background-color: #e3f2fd !important; }
    .status-realizovan { background-color: #e8f5e9 !important; }
    .status-u_toku { background-color: #fff3e0 !important; }
    .status-zavrsen { background-color: #e8f5e9 !important; }
  `]
})
export class ExaminationListComponent implements OnInit {
  private api = inject(ApiService);

  todayAppointments = signal<AppointmentForExam[]>([]);
  examinations = signal<ExaminationListItem[]>([]);
  statusFilter = '';
  appointmentColumns = ['vreme', 'pacijent', 'lekar', 'usluga', 'status', 'akcije'];
  examColumns = ['datum', 'pacijent', 'lekar', 'dijagnoza', 'status', 'akcije'];

  ngOnInit() {
    this.loadTodayAppointments();
    this.loadExaminations();
  }

  loadTodayAppointments() {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    this.api.get<AppointmentForExam[]>(`appointments?from=${from}&to=${to}`)
      .subscribe(list => this.todayAppointments.set(list));
  }

  loadExaminations() {
    let url = 'examinations';
    if (this.statusFilter) url += `?status=${this.statusFilter}`;
    this.api.get<ExaminationListItem[]>(url).subscribe(list => this.examinations.set(list));
  }

  startExamination(appointment: AppointmentForExam) {
    this.api.post<any>('examinations', { appointmentId: appointment.appointmentId })
      .subscribe(exam => {
        appointment.status = 'realizovan';
        appointment.examinationId = exam.examinationId;
        this.loadExaminations();
      });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      zakazan: 'Zakazan', realizovan: 'Realizovan', u_toku: 'U toku', zavrsen: 'Završen',
      otkazao_pacijent: 'Otkazao pacijent', otkazala_klinika: 'Otkazala klinika',
      nije_se_pojavio: 'Nije se pojavio'
    };
    return map[status] ?? status;
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sr-Latn', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

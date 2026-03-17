import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold">Pregledi</h2>
      </div>

      <div class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body">
          <h2 class="card-title">Današnji termini</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Vreme</th><th>Pacijent</th><th>Lekar</th><th>Usluga</th><th>Status</th><th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                @for (a of todayAppointments(); track a.appointmentId) {
                  <tr>
                    <td>{{ formatTime(a.datumVreme) }}</td>
                    <td>{{ a.patientIme }} {{ a.patientPrezime }}</td>
                    <td>Dr {{ a.doctorIme }} {{ a.doctorPrezime }}</td>
                    <td>{{ a.serviceName }}</td>
                    <td><span class="badge" [class]="statusBadge(a.status)">{{ statusLabel(a.status) }}</span></td>
                    <td>
                      @if (a.status === 'zakazan') {
                        <button class="btn btn-primary btn-sm" (click)="startExamination(a)">
                          <span class="material-icons text-sm">medical_services</span> Započni pregled
                        </button>
                      }
                      @if (a.status === 'realizovan' && a.examinationId) {
                        <a class="btn btn-ghost btn-sm" [routerLink]="['/examinations', a.examinationId]">
                          <span class="material-icons text-sm">visibility</span> Otvori pregled
                        </a>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (todayAppointments().length === 0) {
            <p class="text-center text-base-content/60 py-4">Nema zakazanih termina za danas.</p>
          }
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Svi pregledi</h2>
          <div class="flex gap-4 mb-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Status</legend>
              <select class="select" [(ngModel)]="statusFilter" (ngModelChange)="loadExaminations()">
                <option value="">Svi</option>
                <option value="u_toku">U toku</option>
                <option value="zavrsen">Završen</option>
              </select>
            </fieldset>
          </div>

          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Datum</th><th>Pacijent</th><th>Lekar</th><th>Dijagnoza</th><th>Status</th><th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                @for (e of examinations(); track e.examinationId) {
                  <tr>
                    <td>{{ formatDate(e.datumPregleda) }}</td>
                    <td>{{ e.patientIme }} {{ e.patientPrezime }}</td>
                    <td>Dr {{ e.doctorIme }} {{ e.doctorPrezime }}</td>
                    <td>
                      @if (e.dijagnozaSifra) {
                        {{ e.dijagnozaSifra }} - {{ e.dijagnozaNaziv }}
                      } @else {
                        <span class="opacity-40">—</span>
                      }
                    </td>
                    <td><span class="badge" [class]="statusBadge(e.status)">{{ statusLabel(e.status) }}</span></td>
                    <td>
                      <a class="btn btn-ghost btn-sm btn-square" [routerLink]="['/examinations', e.examinationId]">
                        <span class="material-icons">visibility</span>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (examinations().length === 0) {
            <p class="text-center text-base-content/60 py-4">Nema pregleda.</p>
          }
        </div>
      </div>
  `
})
export class ExaminationListComponent implements OnInit {
  private api = inject(ApiService);

  todayAppointments = signal<AppointmentForExam[]>([]);
  examinations = signal<ExaminationListItem[]>([]);
  statusFilter = '';

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

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      zakazan: 'badge-info', realizovan: 'badge-success', u_toku: 'badge-warning', zavrsen: 'badge-success',
      otkazao_pacijent: 'badge-error', otkazala_klinika: 'badge-error', nije_se_pojavio: 'badge-error'
    };
    return map[status] ?? '';
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

import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

interface PortalAppointment {
  appointmentId: number;
  serviceName: string;
  doctorName: string;
  datumVreme: string;
  trajanjeMinuta: number;
  status: string;
}

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold m-0">Moji termini</h2>
      <a routerLink="/portal/request-appointment" class="btn btn-primary">
        <span class="material-icons text-sm">add</span> Zakaži termin
      </a>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div role="tablist" class="tabs tabs-bordered mb-4">
          <button role="tab" class="tab" [class.tab-active]="activeTab() === 0" (click)="activeTab.set(0)">Predstojeći</button>
          <button role="tab" class="tab" [class.tab-active]="activeTab() === 1" (click)="activeTab.set(1)">Prošli</button>
        </div>

        @if (activeTab() === 0) {
          @if (upcoming().length === 0) {
            <p class="text-base-content/60 text-center py-8">Nemate zakazane termine.</p>
          } @else {
            <table class="table">
              <thead><tr><th>Datum i vreme</th><th>Usluga</th><th>Lekar</th><th>Trajanje</th><th>Status</th></tr></thead>
              <tbody>
                @for (a of upcoming(); track a.appointmentId) {
                  <tr>
                    <td>{{ a.datumVreme | date:'dd.MM.yyyy HH:mm' }}</td>
                    <td>{{ a.serviceName }}</td>
                    <td>{{ a.doctorName }}</td>
                    <td>{{ a.trajanjeMinuta }} min</td>
                    <td><span class="badge" [class]="statusClass(a.status)">{{ statusLabel(a.status) }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        }

        @if (activeTab() === 1) {
          @if (past().length === 0) {
            <p class="text-base-content/60 text-center py-8">Nema prošlih termina.</p>
          } @else {
            <table class="table">
              <thead><tr><th>Datum i vreme</th><th>Usluga</th><th>Lekar</th><th>Trajanje</th><th>Status</th></tr></thead>
              <tbody>
                @for (a of past(); track a.appointmentId) {
                  <tr>
                    <td>{{ a.datumVreme | date:'dd.MM.yyyy HH:mm' }}</td>
                    <td>{{ a.serviceName }}</td>
                    <td>{{ a.doctorName }}</td>
                    <td>{{ a.trajanjeMinuta }} min</td>
                    <td><span class="badge" [class]="statusClass(a.status)">{{ statusLabel(a.status) }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        }
      </div>
    </div>
  `,
})
export class MyAppointmentsComponent implements OnInit {
  private api = inject(ApiService);

  activeTab = signal(0);
  upcoming = signal<PortalAppointment[]>([]);
  past = signal<PortalAppointment[]>([]);

  ngOnInit() {
    this.api.get<PortalAppointment[]>('portal/appointments').subscribe(data => {
      const now = new Date();
      this.upcoming.set(data.filter(a => new Date(a.datumVreme) >= now));
      this.past.set(data.filter(a => new Date(a.datumVreme) < now));
    });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      zakazan: 'Zakazan', realizovan: 'Realizovan',
      otkazao_pacijent: 'Otkazao pacijent', otkazala_klinika: 'Otkazala klinika',
      nije_se_pojavio: 'Nije se pojavio',
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      zakazan: 'badge-info',
      realizovan: 'badge-success',
      otkazao_pacijent: 'badge-error',
      otkazala_klinika: 'badge-error',
      nije_se_pojavio: 'badge-warning',
    };
    return map[s] ?? '';
  }
}

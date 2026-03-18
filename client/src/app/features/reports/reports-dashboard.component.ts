import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule],
  template: `
      <h2 class="text-2xl font-semibold mb-6">Izveštaji</h2>

      <!-- Date Range Filter -->
      <div class="flex gap-4 mb-6 items-end">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Od</legend>
          <input type="date" class="input w-48" [(ngModel)]="fromDate" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Do</legend>
          <input type="date" class="input w-48" [(ngModel)]="toDate" />
        </fieldset>
        <button class="btn btn-primary btn-sm" (click)="loadAll()">
          <span class="material-icons text-sm">refresh</span> Učitaj
        </button>
      </div>

      <!-- Tabs -->
      <div role="tablist" class="tabs tabs-bordered mb-4">
        @for (tab of tabLabels; track tab; let i = $index) {
          <button role="tab" class="tab" [class.tab-active]="activeTab() === i" (click)="activeTab.set(i)">{{ tab }}</button>
        }
      </div>

      <!-- Tab: Pregledi -->
      @if (activeTab() === 0) {
        <div class="p-4">
          @if (examReport(); as r) {
            <div class="stats shadow mb-6 w-full">
              <div class="stat">
                <div class="stat-title">Ukupno pregleda</div>
                <div class="stat-value">{{ r.totalCount }}</div>
              </div>
            </div>

            <h3 class="font-semibold mb-2">Po doktoru</h3>
            <table class="table mb-6">
              <thead><tr><th>Doktor</th><th>Ukupno</th><th>Završeni</th><th>Otkazani</th></tr></thead>
              <tbody>
                @for (d of r.byDoctor; track d.doctorName) {
                  <tr><td>{{ d.doctorName }}</td><td>{{ d.count }}</td><td>{{ d.completed }}</td><td>{{ d.cancelled }}</td></tr>
                }
              </tbody>
            </table>

            <h3 class="font-semibold mb-2">Po usluzi</h3>
            <table class="table">
              <thead><tr><th>Usluga</th><th>Broj</th><th></th></tr></thead>
              <tbody>
                @for (s of r.byService; track s.serviceName) {
                  <tr>
                    <td>{{ s.serviceName }}</td>
                    <td>{{ s.count }}</td>
                    <td class="w-48"><progress class="progress progress-primary w-full" [value]="(s.count / r.totalCount) * 100" max="100"></progress></td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-base-content/60">Kliknite "Učitaj" za prikaz</p>
          }
        </div>
      }

      <!-- Tab: Prihodi -->
      @if (activeTab() === 1) {
        <div class="p-4">
          @if (revenueReport(); as r) {
            <div class="stats shadow mb-6 w-full">
              <div class="stat">
                <div class="stat-title">Ukupan prihod (RSD)</div>
                <div class="stat-value">{{ r.totalRevenue | number:'1.2-2' }}</div>
              </div>
              <div class="stat">
                <div class="stat-title">Broj uplata</div>
                <div class="stat-value">{{ r.paymentCount }}</div>
              </div>
            </div>

            <h3 class="font-semibold mb-2">Dnevni trend</h3>
            <table class="table mb-6">
              <thead><tr><th>Datum</th><th>Prihod</th><th>Uplata</th></tr></thead>
              <tbody>
                @for (d of r.daily; track d.date) {
                  <tr><td>{{ d.date | date:'dd.MM.yyyy.' }}</td><td>{{ d.revenue | number:'1.2-2' }} RSD</td><td>{{ d.count }}</td></tr>
                }
              </tbody>
            </table>

            <h3 class="font-semibold mb-2">Po usluzi</h3>
            <table class="table">
              <thead><tr><th>Usluga</th><th>Prihod</th><th>Količina</th></tr></thead>
              <tbody>
                @for (s of r.byService; track s.serviceName) {
                  <tr><td>{{ s.serviceName }}</td><td>{{ s.revenue | number:'1.2-2' }} RSD</td><td>{{ s.count }}</td></tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-base-content/60">Kliknite "Učitaj" za prikaz</p>
          }
        </div>
      }

      <!-- Tab: Otkazivanja -->
      @if (activeTab() === 2) {
        <div class="p-4">
          @if (cancelReport(); as r) {
            <div class="stats shadow mb-6 w-full">
              <div class="stat">
                <div class="stat-title">Ukupno otkazivanja</div>
                <div class="stat-value">{{ r.totalCancellations }}</div>
              </div>
              @for (t of r.byType; track t.status) {
                <div class="stat">
                  <div class="stat-title">{{ formatStatus(t.status) }}</div>
                  <div class="stat-value text-2xl">{{ t.count }}</div>
                </div>
              }
            </div>

            <table class="table">
              <thead><tr><th>Pacijent</th><th>Usluga</th><th>Datum</th><th>Tip</th><th>Razlog</th></tr></thead>
              <tbody>
                @for (d of r.details; track $index) {
                  <tr>
                    <td>{{ d.patient }}</td>
                    <td>{{ d.service }}</td>
                    <td>{{ d.datumVreme | date:'dd.MM.yyyy. HH:mm' }}</td>
                    <td>{{ formatStatus(d.status) }}</td>
                    <td>{{ d.razlogOtkazivanja || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-base-content/60">Kliknite "Učitaj" za prikaz</p>
          }
        </div>
      }

      <!-- Tab: Iskorišćenost -->
      @if (activeTab() === 3) {
        <div class="p-4">
          @if (utilReport(); as r) {
            <h3 class="font-semibold mb-2">Po ordinaciji</h3>
            <table class="table mb-6">
              <thead><tr><th>Ordinacija</th><th>Ukupno</th><th>Realizovani</th><th>Otkazani</th><th>Stopa</th></tr></thead>
              <tbody>
                @for (o of r.byOffice; track o.officeName) {
                  <tr>
                    <td>{{ o.officeName }}</td>
                    <td>{{ o.totalAppointments }}</td>
                    <td>{{ o.completed }}</td>
                    <td>{{ o.cancelled }}</td>
                    <td class="w-40">
                      @if (o.totalAppointments > 0) {
                        <progress class="progress progress-primary w-full" [value]="(o.completed / o.totalAppointments) * 100" max="100"></progress>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <h3 class="font-semibold mb-2">Po doktoru</h3>
            <table class="table">
              <thead><tr><th>Doktor</th><th>Termina</th><th>Realizovani</th><th>Ukupno minuta</th></tr></thead>
              <tbody>
                @for (d of r.byDoctor; track d.doctorName) {
                  <tr><td>{{ d.doctorName }}</td><td>{{ d.totalAppointments }}</td><td>{{ d.completed }}</td><td>{{ d.totalMinutes }}</td></tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-base-content/60">Kliknite "Učitaj" za prikaz</p>
          }
        </div>
      }

      <!-- Tab: Popularne usluge -->
      @if (activeTab() === 4) {
        <div class="p-4">
          @if (popularReport(); as r) {
            <table class="table">
              <thead><tr><th>#</th><th>Usluga</th><th>Cena</th><th>Termina</th><th>Prihod</th><th></th></tr></thead>
              <tbody>
                @for (s of r.services; track s.serviceName; let i = $index) {
                  <tr>
                    <td>{{ i + 1 }}</td>
                    <td>{{ s.serviceName }}</td>
                    <td>{{ s.cena | number:'1.2-2' }}</td>
                    <td>{{ s.appointmentCount }}</td>
                    <td>{{ s.revenue | number:'1.2-2' }} RSD</td>
                    <td class="w-40">
                      @if (maxAppointments() > 0) {
                        <progress class="progress progress-primary w-full" [value]="(s.appointmentCount / maxAppointments()) * 100" max="100"></progress>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-base-content/60">Kliknite "Učitaj" za prikaz</p>
          }
        </div>
      }
  `
})
export class ReportsDashboardComponent implements OnInit {
  private api = inject(ApiService);

  tabLabels = ['Pregledi', 'Prihodi', 'Otkazivanja', 'Iskorišćenost', 'Popularne usluge'];
  activeTab = signal(0);

  fromDate = this.toIsoDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  toDate = this.toIsoDate(new Date());

  examReport = signal<any>(null);
  revenueReport = signal<any>(null);
  cancelReport = signal<any>(null);
  utilReport = signal<any>(null);
  popularReport = signal<any>(null);
  maxAppointments = signal(0);

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    const params = `from=${this.fromDate}&to=${this.toDate}`;
    this.api.get<any>(`reports/examinations?${params}`).subscribe(r => this.examReport.set(r));
    this.api.get<any>(`reports/revenue?${params}`).subscribe(r => this.revenueReport.set(r));
    this.api.get<any>(`reports/cancellations?${params}`).subscribe(r => this.cancelReport.set(r));
    this.api.get<any>(`reports/utilization?${params}`).subscribe(r => this.utilReport.set(r));
    this.api.get<any>(`reports/popular-services?${params}`).subscribe(r => {
      this.popularReport.set(r);
      const max = r.services?.reduce((m: number, s: any) => Math.max(m, s.appointmentCount), 0) ?? 0;
      this.maxAppointments.set(max);
    });
  }

  formatStatus(s: string): string {
    switch (s) {
      case 'otkazao_pacijent': return 'Otkazao pacijent';
      case 'otkazala_klinika': return 'Otkazala klinika';
      case 'nije_se_pojavio': return 'Nije se pojavio';
      default: return s;
    }
  }

  private toIsoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

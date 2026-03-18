import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

interface DashboardData {
  patientCount: number;
  doctorCount: number;
  todayAppointments: number;
  unpaidInvoices: number;
  waitingListCount: number;
  todayRevenue: number;
  monthRevenue: number;
  upcomingAppointments: {
    appointmentId: number;
    pacijent: string;
    lekar: string;
    usluga: string;
    datumVreme: string;
    status: string;
  }[];
  recentInvoices: {
    invoiceId: number;
    brojRacuna: string;
    pacijent: string;
    iznosZaNaplatu: number;
    statusNaplate: string;
    datumIzdavanja: string;
  }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2 class="text-2xl font-semibold mb-6">Kontrolna tabla</h2>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else if (data()) {
      <!-- Stat cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        @for (card of statCards(); track card.label) {
          <div class="card bg-base-100 shadow">
            <div class="card-body flex-row items-center gap-4 p-4">
              <div class="p-3 rounded-lg" [class]="card.bg">
                <span class="material-icons" [class]="card.text">{{ card.icon }}</span>
              </div>
              <div>
                <p class="text-sm text-base-content/60 m-0">{{ card.label }}</p>
                <p class="text-2xl font-bold m-0">{{ card.value }}</p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Revenue cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4">
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-lg bg-success/10">
                <span class="material-icons text-success">payments</span>
              </div>
              <div>
                <p class="text-sm text-base-content/60 m-0">Današnji prihod</p>
                <p class="text-2xl font-bold m-0">{{ data()!.todayRevenue | number:'1.2-2' }} RSD</p>
              </div>
            </div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4">
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-lg bg-primary/10">
                <span class="material-icons text-primary">trending_up</span>
              </div>
              <div>
                <p class="text-sm text-base-content/60 m-0">Mesečni prihod</p>
                <p class="text-2xl font-bold m-0">{{ data()!.monthRevenue | number:'1.2-2' }} RSD</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tables row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Today's upcoming appointments -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-lg m-0">Današnji termini</h3>
              <a routerLink="/appointments" class="btn btn-ghost btn-xs">Svi termini</a>
            </div>
            @if (data()!.upcomingAppointments.length > 0) {
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Vreme</th>
                      <th>Pacijent</th>
                      <th>Lekar</th>
                      <th>Usluga</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (a of data()!.upcomingAppointments; track a.appointmentId) {
                      <tr class="hover">
                        <td>{{ a.datumVreme | date:'HH:mm' }}</td>
                        <td>{{ a.pacijent }}</td>
                        <td>{{ a.lekar }}</td>
                        <td>{{ a.usluga }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="text-base-content/60 text-center py-4">Nema zakazanih termina za danas.</div>
            }
          </div>
        </div>

        <!-- Unpaid invoices -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-lg m-0">Neplaćeni računi</h3>
              <a routerLink="/invoices" class="btn btn-ghost btn-xs">Svi računi</a>
            </div>
            @if (data()!.recentInvoices.length > 0) {
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Broj</th>
                      <th>Pacijent</th>
                      <th>Iznos</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inv of data()!.recentInvoices; track inv.invoiceId) {
                      <tr class="hover cursor-pointer" [routerLink]="['/invoices', inv.invoiceId]">
                        <td>{{ inv.brojRacuna }}</td>
                        <td>{{ inv.pacijent }}</td>
                        <td>{{ inv.iznosZaNaplatu | number:'1.2-2' }}</td>
                        <td>
                          <span class="badge badge-sm" [ngClass]="inv.statusNaplate === 'delimicno' ? 'badge-warning' : 'badge-error'">
                            {{ inv.statusNaplate === 'delimicno' ? 'Delimično' : 'Neplaćeno' }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="text-base-content/60 text-center py-4">Svi računi su plaćeni.</div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  data = signal<DashboardData | null>(null);
  loading = signal(true);

  statCards = signal<{ label: string; value: string | number; icon: string; text: string; bg: string }[]>([]);

  ngOnInit(): void {
    this.api.get<DashboardData>('reports/dashboard').subscribe({
      next: d => {
        this.data.set(d);
        this.statCards.set([
          { label: 'Pacijenti', value: d.patientCount, icon: 'people', text: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Današnji termini', value: d.todayAppointments, icon: 'calendar_today', text: 'text-success', bg: 'bg-success/10' },
          { label: 'Lekari', value: d.doctorCount, icon: 'badge', text: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Neplaćeni računi', value: d.unpaidInvoices, icon: 'receipt_long', text: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Lista čekanja', value: d.waitingListCount, icon: 'hourglass_empty', text: 'text-info', bg: 'bg-info/10' },
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

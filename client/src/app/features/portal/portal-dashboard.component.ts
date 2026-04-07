import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

interface PortalDashboardData {
  upcomingAppointments: number;
  pastAppointments: number;
  unpaidInvoices: number;
  totalDebt: number;
  reportsCount: number;
  unreadMessages: number;
  nextAppointment: {
    appointmentId: number;
    serviceName: string;
    doctorName: string;
    datumVreme: string;
    status: string;
  } | null;
  recentInvoices: {
    invoiceId: number;
    brojRacuna: string;
    iznosZaNaplatu: number;
    statusNaplate: string;
    datumIzdavanja: string;
  }[];
}

@Component({
  selector: 'app-portal-dashboard',
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
          <a [routerLink]="card.route" class="card bg-base-100 shadow hover:shadow-md transition-shadow no-underline">
            <div class="card-body flex-row items-center gap-4 p-4">
              <div class="p-3 rounded-lg" [class]="card.bg">
                <span class="material-icons" [class]="card.text">{{ card.icon }}</span>
              </div>
              <div>
                <p class="text-sm text-base-content/60 m-0">{{ card.label }}</p>
                <p class="text-2xl font-bold m-0">{{ card.value }}</p>
              </div>
            </div>
          </a>
        }
      </div>

      <!-- Next appointment highlight -->
      @if (data()!.nextAppointment; as next) {
        <div class="card bg-primary text-primary-content shadow mb-6">
          <div class="card-body p-4">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-lg bg-primary-content/20">
                <span class="material-icons text-2xl">event</span>
              </div>
              <div class="flex-1">
                <p class="text-sm opacity-80 m-0">Sledeći termin</p>
                <p class="text-lg font-bold m-0">{{ next.serviceName }}</p>
                <p class="text-sm opacity-80 m-0">Dr {{ next.doctorName }} &mdash; {{ formatDateTime(next.datumVreme) }}</p>
              </div>
              <a routerLink="/portal/appointments" class="btn btn-ghost btn-sm text-primary-content">
                Detlaji <span class="material-icons text-sm">chevron_right</span>
              </a>
            </div>
          </div>
        </div>
      }

      <!-- Unpaid invoices + debt -->
      @if (data()!.totalDebt > 0) {
        <div class="card bg-warning/10 border border-warning/30 shadow-sm mb-6">
          <div class="card-body p-4">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-lg bg-warning/20">
                <span class="material-icons text-warning text-2xl">payments</span>
              </div>
              <div class="flex-1">
                <p class="text-sm text-base-content/60 m-0">Ukupno dugovanje</p>
                <p class="text-2xl font-bold m-0">{{ data()!.totalDebt | number:'1.2-2' }} RSD</p>
                <p class="text-xs text-base-content/50 m-0">{{ data()!.unpaidInvoices }} neplaćen{{ data()!.unpaidInvoices === 1 ? '' : 'a' }} račun{{ data()!.unpaidInvoices === 1 ? '' : 'a' }}</p>
              </div>
              <a routerLink="/portal/invoices" class="btn btn-warning btn-sm">
                Plati <span class="material-icons text-sm">chevron_right</span>
              </a>
            </div>
          </div>
        </div>
      }

      <!-- Recent unpaid invoices table -->
      @if (data()!.recentInvoices.length > 0) {
        <div class="card bg-base-100 shadow mb-6">
          <div class="card-body p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-lg m-0">Neplaćeni računi</h3>
              <a routerLink="/portal/invoices" class="btn btn-ghost btn-xs">Svi računi</a>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr><th>Broj</th><th>Datum</th><th>Iznos</th><th>Status</th></tr>
                </thead>
                <tbody>
                  @for (inv of data()!.recentInvoices; track inv.invoiceId) {
                    <tr class="hover">
                      <td>{{ inv.brojRacuna }}</td>
                      <td>{{ formatDate(inv.datumIzdavanja) }}</td>
                      <td>{{ inv.iznosZaNaplatu | number:'1.2-2' }} RSD</td>
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
          </div>
        </div>
      }

      <!-- Quick actions -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <h3 class="font-semibold text-lg mb-3 m-0">Brze akcije</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a routerLink="/portal/request-appointment"
               class="btn btn-outline btn-sm gap-2 justify-start no-underline">
              <span class="material-icons text-base">add_circle_outline</span> Zakaži termin
            </a>
            <a routerLink="/portal/appointments"
               class="btn btn-outline btn-sm gap-2 justify-start no-underline">
              <span class="material-icons text-base">calendar_today</span> Moji termini
            </a>
            <a routerLink="/portal/reports"
               class="btn btn-outline btn-sm gap-2 justify-start no-underline">
              <span class="material-icons text-base">description</span> Nalazi
            </a>
            <a routerLink="/portal/messages"
               class="btn btn-outline btn-sm gap-2 justify-start no-underline">
              <span class="material-icons text-base">mail</span> Poruke
            </a>
          </div>
        </div>
      </div>
    }
  `,
})
export class PortalDashboardComponent implements OnInit {
  private api = inject(ApiService);

  data = signal<PortalDashboardData | null>(null);
  loading = signal(true);
  statCards = signal<{ label: string; value: string | number; icon: string; text: string; bg: string; route: string }[]>([]);

  ngOnInit() {
    this.api.get<PortalDashboardData>('portal/dashboard').subscribe({
      next: d => {
        this.data.set(d);
        this.statCards.set([
          { label: 'Predstojeći termini', value: d.upcomingAppointments, icon: 'calendar_today', text: 'text-primary', bg: 'bg-primary/10', route: '/portal/appointments' },
          { label: 'Nalazi', value: d.reportsCount, icon: 'description', text: 'text-success', bg: 'bg-success/10', route: '/portal/reports' },
          { label: 'Neplaćeni računi', value: d.unpaidInvoices, icon: 'receipt_long', text: 'text-warning', bg: 'bg-warning/10', route: '/portal/invoices' },
          { label: 'Nepročitane poruke', value: d.unreadMessages, icon: 'mail', text: 'text-info', bg: 'bg-info/10', route: '/portal/messages' },
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sr-Latn', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sr-Latn', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }
}

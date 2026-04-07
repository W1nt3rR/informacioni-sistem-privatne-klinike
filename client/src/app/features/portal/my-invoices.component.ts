import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';

interface PortalInvoice {
  invoiceId: number;
  brojRacuna: string;
  datumIzdavanja: string;
  ukupanIznos: number;
  popustProcenat: number;
  iznosZaNaplatu: number;
  statusNaplate: string;
  placeno: number;
}

interface InvoiceDetail {
  invoiceId: number;
  brojRacuna: string;
  datumIzdavanja: string;
  ukupanIznos: number;
  popustProcenat: number;
  iznosZaNaplatu: number;
  statusNaplate: string;
  napomena: string | null;
  placeno: number;
  items: InvoiceItem[];
  payments: PaymentItem[];
}

interface InvoiceItem {
  serviceNaziv: string;
  kolicina: number;
  jedinicnaCena: number;
  iznos: number;
}

interface PaymentItem {
  iznos: number;
  nacinPlacanja: string;
  datumPlacanja: string;
}

@Component({
  selector: 'app-my-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2 class="text-2xl font-semibold mb-6">Moji računi</h2>

    @if (!selectedInvoice()) {
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          @if (invoices().length === 0) {
            <p class="text-base-content/60 text-center py-8">Nemate račune.</p>
          } @else {
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Broj računa</th>
                    <th>Datum</th>
                    <th>Ukupno</th>
                    <th>Popust</th>
                    <th>Za naplatu</th>
                    <th>Plaćeno</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (inv of invoices(); track inv.invoiceId) {
                    <tr class="hover">
                      <td>{{ inv.brojRacuna }}</td>
                      <td>{{ formatDate(inv.datumIzdavanja) }}</td>
                      <td>{{ inv.ukupanIznos | number:'1.2-2' }} RSD</td>
                      <td>{{ inv.popustProcenat | number:'1.0-1' }}%</td>
                      <td class="font-semibold">{{ inv.iznosZaNaplatu | number:'1.2-2' }} RSD</td>
                      <td>{{ inv.placeno | number:'1.2-2' }} RSD</td>
                      <td>
                        <span class="badge" [class]="statusBadge(inv.statusNaplate)">
                          {{ statusLabel(inv.statusNaplate) }}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-ghost btn-xs" (click)="openDetail(inv.invoiceId)">
                          <span class="material-icons text-sm">visibility</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    }

    @if (selectedInvoice(); as inv) {
      <button class="btn btn-ghost btn-sm mb-4" (click)="selectedInvoice.set(null)">
        <span class="material-icons text-sm">arrow_back</span> Nazad
      </button>

      <div class="card bg-base-100 shadow-sm mb-4">
        <div class="card-body">
          <h3 class="card-title text-lg">Račun {{ inv.brojRacuna }}</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
            <div><strong>Datum:</strong> {{ formatDate(inv.datumIzdavanja) }}</div>
            <div><strong>Ukupno:</strong> {{ inv.ukupanIznos | number:'1.2-2' }} RSD</div>
            <div><strong>Popust:</strong> {{ inv.popustProcenat | number:'1.0-1' }}%</div>
            <div>
              <strong>Status:</strong>
              <span class="badge ml-1" [class]="statusBadge(inv.statusNaplate)">
                {{ statusLabel(inv.statusNaplate) }}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm mt-2">
            <div><strong>Za naplatu:</strong> <span class="font-semibold">{{ inv.iznosZaNaplatu | number:'1.2-2' }} RSD</span></div>
            <div><strong>Plaćeno:</strong> {{ inv.placeno | number:'1.2-2' }} RSD</div>
          </div>
          @if (inv.napomena) {
            <div class="text-sm mt-2"><strong>Napomena:</strong> {{ inv.napomena }}</div>
          }
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm mb-4">
        <div class="card-body">
          <h4 class="font-semibold mb-2">Stavke</h4>
          <table class="table table-sm">
            <thead>
              <tr><th>Usluga</th><th>Količina</th><th>Cena</th><th>Iznos</th></tr>
            </thead>
            <tbody>
              @for (item of inv.items; track $index) {
                <tr>
                  <td>{{ item.serviceNaziv }}</td>
                  <td>{{ item.kolicina }}</td>
                  <td>{{ item.jedinicnaCena | number:'1.2-2' }} RSD</td>
                  <td>{{ item.iznos | number:'1.2-2' }} RSD</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (inv.payments.length > 0) {
        <div class="card bg-base-100 shadow-sm mb-4">
          <div class="card-body">
            <h4 class="font-semibold mb-2">Uplate</h4>
            <table class="table table-sm">
              <thead>
                <tr><th>Datum</th><th>Način</th><th>Iznos</th></tr>
              </thead>
              <tbody>
                @for (p of inv.payments; track $index) {
                  <tr>
                    <td>{{ formatDate(p.datumPlacanja) }}</td>
                    <td>{{ paymentMethodLabel(p.nacinPlacanja) }}</td>
                    <td>{{ p.iznos | number:'1.2-2' }} RSD</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (inv.statusNaplate !== 'placeno') {
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h4 class="font-semibold mb-3">Plati online</h4>
            <div class="flex flex-wrap gap-4 items-end">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Iznos (RSD)</legend>
                <input type="number" class="input input-bordered w-40"
                       [min]="0.01" [max]="inv.iznosZaNaplatu - inv.placeno"
                       [(ngModel)]="payAmount"
                       [step]="0.01" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Način plaćanja</legend>
                <select class="select select-bordered" [(ngModel)]="payMethod">
                  <option value="kartica">Kartica</option>
                  <option value="virman">Virman</option>
                </select>
              </fieldset>
              <button class="btn btn-primary" [disabled]="paying()"
                      (click)="submitPayment(inv.invoiceId)">
                @if (paying()) {
                  <span class="loading loading-spinner loading-sm"></span>
                }
                Plati
              </button>
            </div>
            @if (payError()) {
              <div class="text-error text-sm mt-2">{{ payError() }}</div>
            }
            @if (paySuccess()) {
              <div class="text-success text-sm mt-2">{{ paySuccess() }}</div>
            }
            <p class="text-xs text-base-content/50 mt-2">
              Preostalo za uplatu: {{ (inv.iznosZaNaplatu - inv.placeno) | number:'1.2-2' }} RSD
            </p>
          </div>
        </div>
      }
    }
  `,
})
export class MyInvoicesComponent implements OnInit {
  private api = inject(ApiService);

  invoices = signal<PortalInvoice[]>([]);
  selectedInvoice = signal<InvoiceDetail | null>(null);
  paying = signal(false);
  payError = signal('');
  paySuccess = signal('');
  payAmount = 0;
  payMethod = 'kartica';

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.api.get<PortalInvoice[]>('portal/invoices').subscribe(d => this.invoices.set(d));
  }

  openDetail(id: number) {
    this.api.get<InvoiceDetail>(`portal/invoices/${id}`).subscribe(inv => {
      this.selectedInvoice.set(inv);
      this.payAmount = +(inv.iznosZaNaplatu - inv.placeno).toFixed(2);
      this.payError.set('');
      this.paySuccess.set('');
    });
  }

  submitPayment(invoiceId: number) {
    if (this.payAmount <= 0) {
      this.payError.set('Iznos mora biti veći od 0.');
      return;
    }
    this.paying.set(true);
    this.payError.set('');
    this.paySuccess.set('');
    this.api.post<{ message: string }>(`portal/invoices/${invoiceId}/pay`, {
      iznos: this.payAmount,
      nacinPlacanja: this.payMethod,
    }).subscribe({
      next: (res) => {
        this.paySuccess.set(res.message);
        this.paying.set(false);
        this.openDetail(invoiceId);
        this.loadInvoices();
      },
      error: (err) => {
        this.payError.set(err.error?.message ?? 'Greška pri plaćanju.');
        this.paying.set(false);
      },
    });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      neplaceno: 'Neplaćeno', placeno: 'Plaćeno', delimicno: 'Delimično',
    };
    return map[s] ?? s;
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = {
      neplaceno: 'badge-error', placeno: 'badge-success', delimicno: 'badge-warning',
    };
    return map[s] ?? '';
  }

  paymentMethodLabel(m: string): string {
    const map: Record<string, string> = {
      gotovina: 'Gotovina', kartica: 'Kartica', virman: 'Virman',
    };
    return map[m] ?? m;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sr-Latn', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }
}

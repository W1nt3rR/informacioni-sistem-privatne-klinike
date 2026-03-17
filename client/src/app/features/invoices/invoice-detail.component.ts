import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { InvoiceDetail } from './invoice.model';
import { PaymentDialogComponent } from './payment-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (invoice(); as inv) {
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">Račun {{ inv.brojRacuna }}</h2>
          <div class="flex gap-2">
            @if (inv.statusNaplate !== 'placeno') {
              <button class="btn btn-primary btn-sm" (click)="openPayment()">
                <span class="material-icons text-sm">payment</span> Uplata
              </button>
            }
            <button class="btn btn-sm" (click)="printInvoice()">
              <span class="material-icons text-sm">print</span> Štampaj
            </button>
          </div>
        </div>

        <!-- Header Info -->
        <div class="card bg-base-100 shadow-sm mb-4">
          <div class="card-body grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-base-content/60">Pacijent</p>
              <p class="font-medium">{{ inv.patientIme }} {{ inv.patientPrezime }}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Datum izdavanja</p>
              <p class="font-medium">{{ inv.datumIzdavanja | date:'dd.MM.yyyy. HH:mm' }}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Status</p>
              <span class="badge" [ngClass]="statusBadge(inv.statusNaplate)">
                {{ inv.statusNaplate === 'neplaceno' ? 'Neplaćeno' :
                   inv.statusNaplate === 'delimicno' ? 'Delimično' : 'Plaćeno' }}
              </span>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Napomena</p>
              <p class="font-medium">{{ inv.napomena || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Items -->
        <h2 class="text-lg font-semibold mb-2">Stavke</h2>
        <div class="overflow-x-auto mb-4">
          <table class="table">
            <thead>
              <tr>
                <th>Usluga</th>
                <th>Jed. cena</th>
                <th>Količina</th>
                <th>Iznos</th>
              </tr>
            </thead>
            <tbody>
              @for (it of inv.items; track it.invoiceItemId) {
                <tr>
                  <td>{{ it.serviceNaziv }}</td>
                  <td>{{ it.jedinicnaCena | number:'1.2-2' }}</td>
                  <td>{{ it.kolicina }}</td>
                  <td>{{ it.iznos | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="text-right mb-6">
          <p>Ukupno: <strong>{{ inv.ukupanIznos | number:'1.2-2' }} RSD</strong></p>
          @if (inv.popustProcenat > 0) {
            <p>Popust: {{ inv.popustProcenat }}%</p>
          }
          <p class="text-lg">Za naplatu: <strong>{{ inv.iznosZaNaplatu | number:'1.2-2' }} RSD</strong></p>
          <p class="text-sm text-base-content/60">
            Plaćeno: {{ paidTotal() | number:'1.2-2' }} RSD |
            Preostalo: {{ inv.iznosZaNaplatu - paidTotal() | number:'1.2-2' }} RSD
          </p>
        </div>

        <!-- Payments -->
        <h2 class="text-lg font-semibold mb-2">Uplate</h2>
        @if (inv.payments.length > 0) {
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Iznos</th>
                  <th>Način plaćanja</th>
                  <th>Napomena</th>
                </tr>
              </thead>
              <tbody>
                @for (p of inv.payments; track p.paymentId) {
                  <tr>
                    <td>{{ p.datumPlacanja | date:'dd.MM.yyyy. HH:mm' }}</td>
                    <td>{{ p.iznos | number:'1.2-2' }} RSD</td>
                    <td>{{ p.nacinPlacanja === 'gotovina' ? 'Gotovina' :
                           p.nacinPlacanja === 'kartica' ? 'Kartica' : 'Virman' }}</td>
                    <td>{{ p.napomena || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="text-base-content/60">Nema evidentiranih uplata</p>
        }
      </div>
    }
  `
})
export class InvoiceDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private dialogService = inject(DialogService);

  invoice = signal<InvoiceDetail | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadInvoice(+id);
  }

  loadInvoice(id: number) {
    this.api.get<InvoiceDetail>(`invoices/${id}`).subscribe(inv => this.invoice.set(inv));
  }

  paidTotal(): number {
    return this.invoice()?.payments.reduce((s, p) => s + p.iznos, 0) ?? 0;
  }

  openPayment() {
    const inv = this.invoice();
    if (!inv) return;
    const remaining = inv.iznosZaNaplatu - this.paidTotal();
    this.dialogService.open(PaymentDialogComponent, { remaining })
      .afterClosed.subscribe(result => {
        if (result) {
          this.api.post<any>(`invoices/${inv.invoiceId}/payments`, result)
            .subscribe(() => this.loadInvoice(inv.invoiceId));
        }
      });
  }

  printInvoice() {
    window.print();
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'neplaceno': return 'badge-error';
      case 'delimicno': return 'badge-warning';
      case 'placeno': return 'badge-success';
      default: return 'badge-info';
    }
  }
}

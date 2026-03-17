import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../shared/services/api.service';
import { InvoiceDetail } from './invoice.model';
import { PaymentDialogComponent } from './payment-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    @if (invoice(); as inv) {
      <div class="p-6 max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">Račun {{ inv.brojRacuna }}</h1>
          <div class="flex gap-2">
            @if (inv.statusNaplate !== 'placeno') {
              <button mat-raised-button color="primary" (click)="openPayment()">
                <mat-icon>payment</mat-icon> Uplata
              </button>
            }
            <button mat-raised-button (click)="printInvoice()">
              <mat-icon>print</mat-icon> Štampaj
            </button>
          </div>
        </div>

        <!-- Header Info -->
        <mat-card class="mb-4">
          <mat-card-content class="grid grid-cols-2 gap-4 p-4">
            <div>
              <p class="text-sm text-gray-500">Pacijent</p>
              <p class="font-medium">{{ inv.patientIme }} {{ inv.patientPrezime }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Datum izdavanja</p>
              <p class="font-medium">{{ inv.datumIzdavanja | date:'dd.MM.yyyy. HH:mm' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Status</p>
              <span class="px-2 py-1 rounded text-xs font-medium"
                [class.bg-red-100]="inv.statusNaplate === 'neplaceno'"
                [class.text-red-700]="inv.statusNaplate === 'neplaceno'"
                [class.bg-yellow-100]="inv.statusNaplate === 'delimicno'"
                [class.text-yellow-700]="inv.statusNaplate === 'delimicno'"
                [class.bg-green-100]="inv.statusNaplate === 'placeno'"
                [class.text-green-700]="inv.statusNaplate === 'placeno'">
                {{ inv.statusNaplate === 'neplaceno' ? 'Neplaćeno' :
                   inv.statusNaplate === 'delimicno' ? 'Delimično' : 'Plaćeno' }}
              </span>
            </div>
            <div>
              <p class="text-sm text-gray-500">Napomena</p>
              <p class="font-medium">{{ inv.napomena || '—' }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Items -->
        <h2 class="text-lg font-semibold mb-2">Stavke</h2>
        <table mat-table [dataSource]="inv.items" class="w-full mb-4">
          <ng-container matColumnDef="service">
            <th mat-header-cell *matHeaderCellDef>Usluga</th>
            <td mat-cell *matCellDef="let it">{{ it.serviceNaziv }}</td>
          </ng-container>
          <ng-container matColumnDef="cena">
            <th mat-header-cell *matHeaderCellDef>Jed. cena</th>
            <td mat-cell *matCellDef="let it">{{ it.jedinicnaCena | number:'1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="kolicina">
            <th mat-header-cell *matHeaderCellDef>Količina</th>
            <td mat-cell *matCellDef="let it">{{ it.kolicina }}</td>
          </ng-container>
          <ng-container matColumnDef="iznos">
            <th mat-header-cell *matHeaderCellDef>Iznos</th>
            <td mat-cell *matCellDef="let it">{{ it.iznos | number:'1.2-2' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="itemColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: itemColumns;"></tr>
        </table>

        <!-- Totals -->
        <div class="text-right mb-6">
          <p>Ukupno: <strong>{{ inv.ukupanIznos | number:'1.2-2' }} RSD</strong></p>
          @if (inv.popustProcenat > 0) {
            <p>Popust: {{ inv.popustProcenat }}%</p>
          }
          <p class="text-lg">Za naplatu: <strong>{{ inv.iznosZaNaplatu | number:'1.2-2' }} RSD</strong></p>
          <p class="text-sm text-gray-500">
            Plaćeno: {{ paidTotal() | number:'1.2-2' }} RSD |
            Preostalo: {{ inv.iznosZaNaplatu - paidTotal() | number:'1.2-2' }} RSD
          </p>
        </div>

        <!-- Payments -->
        <h2 class="text-lg font-semibold mb-2">Uplate</h2>
        @if (inv.payments.length > 0) {
          <table mat-table [dataSource]="inv.payments" class="w-full">
            <ng-container matColumnDef="datum">
              <th mat-header-cell *matHeaderCellDef>Datum</th>
              <td mat-cell *matCellDef="let p">{{ p.datumPlacanja | date:'dd.MM.yyyy. HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="iznos">
              <th mat-header-cell *matHeaderCellDef>Iznos</th>
              <td mat-cell *matCellDef="let p">{{ p.iznos | number:'1.2-2' }} RSD</td>
            </ng-container>
            <ng-container matColumnDef="nacin">
              <th mat-header-cell *matHeaderCellDef>Način plaćanja</th>
              <td mat-cell *matCellDef="let p">
                {{ p.nacinPlacanja === 'gotovina' ? 'Gotovina' :
                   p.nacinPlacanja === 'kartica' ? 'Kartica' : 'Virman' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="napomena">
              <th mat-header-cell *matHeaderCellDef>Napomena</th>
              <td mat-cell *matCellDef="let p">{{ p.napomena || '—' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: paymentColumns;"></tr>
          </table>
        } @else {
          <p class="text-gray-500">Nema evidentiranih uplata</p>
        }
      </div>
    }
  `
})
export class InvoiceDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  invoice = signal<InvoiceDetail | null>(null);
  itemColumns = ['service', 'cena', 'kolicina', 'iznos'];
  paymentColumns = ['datum', 'iznos', 'nacin', 'napomena'];

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
    this.dialog.open(PaymentDialogComponent, { width: '400px', data: { remaining } })
      .afterClosed().subscribe(result => {
        if (result) {
          this.api.post<any>(`invoices/${inv.invoiceId}/payments`, result)
            .subscribe(() => this.loadInvoice(inv.invoiceId));
        }
      });
  }

  printInvoice() {
    window.print();
  }
}

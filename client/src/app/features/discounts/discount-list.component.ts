import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { Discount } from './discount.model';
import { DiscountDialogComponent } from './discount-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-discount-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <h2 class="text-2xl font-semibold mb-6">Popusti</h2>

    <!-- System Discounts -->
    <h3 class="text-lg font-medium mb-3">Sistemski popusti</h3>
    <p class="text-sm text-base-content/60 mb-3">Automatski se primenjuju na račun prema statusu pacijenta i broju stavki. Ne mogu se obrisati.</p>

    @if (loading()) {
      <div class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else {
      <div class="card bg-base-100 shadow-sm overflow-x-auto mb-8">
        <table class="table">
          <thead>
            <tr>
              <th>Naziv</th>
              <th>Tip</th>
              <th>Procenat</th>
              <th>Status</th>
              <th class="w-24">Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (row of systemDiscounts(); track row.discountId) {
              <tr>
                <td>{{ row.naziv }}</td>
                <td>
                  <span class="badge" [class]="tipBadgeClass(row.tip)">{{ tipLabel(row.tip) }}</span>
                </td>
                <td>{{ row.procenat | number:'1.0-2' }}%</td>
                <td>
                  <span class="badge" [class]="row.aktivan ? 'badge-success' : 'badge-error'">
                    {{ row.aktivan ? 'Aktivan' : 'Neaktivan' }}
                  </span>
                </td>
                <td>
                  <div class="tooltip" data-tip="Izmeni">
                    <button class="btn btn-ghost btn-xs btn-square" (click)="openDialog(row)">
                      <span class="material-icons text-sm">edit</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Discount Codes -->
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="text-lg font-medium">Kodovi za popust</h3>
          <p class="text-sm text-base-content/60">Pacijent može uneti kod pri kreiranju računa za dodatni popust.</p>
        </div>
        <button class="btn btn-primary btn-sm" (click)="openCodeDialog()">
          <span class="material-icons text-sm">add</span> Novi kod
        </button>
      </div>

      <div class="card bg-base-100 shadow-sm overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Naziv</th>
              <th>Kod</th>
              <th>Procenat</th>
              <th>Važi od</th>
              <th>Važi do</th>
              <th>Status</th>
              <th class="w-24">Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (row of codeDiscounts(); track row.discountId) {
              <tr>
                <td>{{ row.naziv }}</td>
                <td><code class="font-mono text-sm bg-base-200 px-2 py-0.5 rounded">{{ row.kod }}</code></td>
                <td>{{ row.procenat | number:'1.0-2' }}%</td>
                <td>{{ row.vaziOd ? (row.vaziOd | date:'dd.MM.yyyy.') : '—' }}</td>
                <td>{{ row.vaziDo ? (row.vaziDo | date:'dd.MM.yyyy.') : '—' }}</td>
                <td>
                  <span class="badge" [class]="row.aktivan ? 'badge-success' : 'badge-error'">
                    {{ row.aktivan ? 'Aktivan' : 'Neaktivan' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-1">
                    <div class="tooltip" data-tip="Izmeni">
                      <button class="btn btn-ghost btn-xs btn-square" (click)="openDialog(row)">
                        <span class="material-icons text-sm">edit</span>
                      </button>
                    </div>
                    <div class="tooltip" data-tip="Obriši">
                      <button class="btn btn-ghost btn-xs btn-square text-error" (click)="deleteItem(row)">
                        <span class="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (codeDiscounts().length === 0) {
          <div class="text-center text-base-content/60 py-8">Nema kodova za popust.</div>
        }
      </div>
    }
  `,
})
export class DiscountListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  items = signal<Discount[]>([]);
  loading = signal(true);

  systemDiscounts = computed(() => this.items().filter(d => d.jeSistemski));
  codeDiscounts = computed(() => this.items().filter(d => !d.jeSistemski));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<Discount[]>('discounts').subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  tipLabel(tip: string): string {
    const labels: Record<string, string> = {
      student: 'Student', penzioner: 'Penzioner', paket2: 'Paket 2',
      paket3: 'Paket 3+', opsti: 'Opšti', kod: 'Kod'
    };
    return labels[tip] ?? tip;
  }

  tipBadgeClass(tip: string): string {
    const classes: Record<string, string> = {
      student: 'badge-info', penzioner: 'badge-warning',
      paket2: 'badge-accent', paket3: 'badge-accent',
      opsti: 'badge-ghost', kod: 'badge-secondary'
    };
    return classes[tip] ?? 'badge-ghost';
  }

  openDialog(item: Discount): void {
    const ref = this.dialogService.open(DiscountDialogComponent, item);
    ref.afterClosed.subscribe(result => {
      if (!result) return;
      this.api.put(`discounts/${item.discountId}`, result).subscribe({
        next: () => { this.toast.success('Izmenjeno'); this.load(); },
        error: () => this.toast.error('Greška pri čuvanju'),
      });
    });
  }

  openCodeDialog(): void {
    const ref = this.dialogService.open(DiscountDialogComponent, null);
    ref.afterClosed.subscribe(result => {
      if (!result) return;
      this.api.post('discounts', result).subscribe({
        next: () => { this.toast.success('Kod kreiran'); this.load(); },
        error: (err: any) => this.toast.error(err?.error || 'Greška pri čuvanju'),
      });
    });
  }

  deleteItem(item: Discount): void {
    const ref = this.dialogService.open(ConfirmDialogComponent, { title: 'Brisanje', message: `Obrisati kod popusta "${item.naziv}"?` });
    ref.afterClosed.subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`discounts/${item.discountId}`).subscribe({
        next: () => { this.toast.success('Obrisano'); this.load(); },
        error: (err: any) => this.toast.error(err?.error || 'Greška pri brisanju'),
      });
    });
  }
}

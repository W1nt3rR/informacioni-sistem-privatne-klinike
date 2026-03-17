import { Component, inject, OnInit, signal } from '@angular/core';
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
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Popusti</h2>
      <button class="btn btn-primary btn-sm" (click)="openDialog()">
        <span class="material-icons text-sm">add</span> Dodaj
      </button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else {
      <div class="card bg-base-100 shadow-sm overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Naziv</th>
              <th>Tip</th>
              <th>Procenat</th>
              <th>Važi od</th>
              <th>Važi do</th>
              <th>Status</th>
              <th class="w-24">Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (row of items(); track row.discountId) {
              <tr>
                <td>{{ row.naziv }}</td>
                <td>
                  <span class="badge" [class]="row.tip === 'student' ? 'badge-info' : row.tip === 'penzioner' ? 'badge-warning' : 'badge-ghost'">{{ row.tip === 'opsti' ? 'Opšti' : row.tip === 'student' ? 'Student' : 'Penzioner' }}</span>
                </td>
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

        @if (items().length === 0) {
          <div class="text-center text-base-content/60 py-8">Nema popusta.</div>
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

  openDialog(item?: Discount): void {
    const ref = this.dialogService.open(DiscountDialogComponent, item ?? null);
    ref.afterClosed.subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`discounts/${item.discountId}`, result)
        : this.api.post('discounts', result);
      op.subscribe({
        next: () => { this.toast.success(item ? 'Izmenjeno' : 'Dodato'); this.load(); },
        error: () => this.toast.error('Greška pri čuvanju'),
      });
    });
  }

  deleteItem(item: Discount): void {
    const ref = this.dialogService.open(ConfirmDialogComponent, { title: 'Brisanje', message: `Obrisati popust "${item.naziv}"?` });
    ref.afterClosed.subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`discounts/${item.discountId}`).subscribe({
        next: () => { this.toast.success('Obrisano'); this.load(); },
        error: () => this.toast.error('Greška pri brisanju'),
      });
    });
  }
}

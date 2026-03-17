import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { Specialization } from './specialization.model';
import { SpecializationDialogComponent } from './specialization-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-specialization-list',
  standalone: true,
  imports: [],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Specijalizacije</h2>
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
              <th>Opis</th>
              <th class="w-24">Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (row of items(); track row.specializationId) {
              <tr>
                <td>{{ row.naziv }}</td>
                <td>{{ row.opis ?? '—' }}</td>
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
          <div class="text-center text-base-content/60 py-8">Nema specijalizacija.</div>
        }
      </div>
    }
  `,
})
export class SpecializationListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  items = signal<Specialization[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<Specialization[]>('specializations').subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  openDialog(item?: Specialization): void {
    const ref = this.dialogService.open(SpecializationDialogComponent, item ?? null);
    ref.afterClosed.subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`specializations/${item.specializationId}`, result)
        : this.api.post('specializations', result);
      op.subscribe({
        next: () => { this.toast.success(item ? 'Izmenjeno' : 'Dodato'); this.load(); },
        error: () => this.toast.error('Greška pri čuvanju'),
      });
    });
  }

  deleteItem(item: Specialization): void {
    const ref = this.dialogService.open(ConfirmDialogComponent, { title: 'Brisanje', message: `Obrisati specijalizaciju "${item.naziv}"?` });
    ref.afterClosed.subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`specializations/${item.specializationId}`).subscribe({
        next: () => { this.toast.success('Obrisano'); this.load(); },
        error: () => this.toast.error('Greška pri brisanju'),
      });
    });
  }
}

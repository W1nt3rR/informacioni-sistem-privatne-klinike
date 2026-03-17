import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { Diagnosis } from './diagnosis.model';
import { DiagnosisDialogComponent } from './diagnosis-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-diagnosis-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Dijagnoze</h2>
      <button class="btn btn-primary btn-sm" (click)="openDialog()">
        <span class="material-icons text-sm">add</span> Dodaj
      </button>
    </div>

    <label class="input w-full mb-4">
      <span class="material-icons">search</span>
      <input placeholder="Pretraga (šifra ili naziv)" [(ngModel)]="searchTerm" (input)="onSearch()" />
    </label>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else {
      <div class="card bg-base-100 shadow-sm overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Šifra</th>
              <th>Naziv</th>
              <th>Opis</th>
              <th class="w-24">Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (row of items(); track row.diagnosisId) {
              <tr>
                <td>{{ row.sifra }}</td>
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
          <div class="text-center text-base-content/60 py-8">Nema dijagnoza.</div>
        }
      </div>
    }
  `,
})
export class DiagnosisListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  items = signal<Diagnosis[]>([]);
  loading = signal(true);
  searchTerm = '';

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

  onSearch(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 300);
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.searchTerm.trim()) params['search'] = this.searchTerm.trim();
    this.api.get<Diagnosis[]>('diagnoses', params).subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  openDialog(item?: Diagnosis): void {
    const ref = this.dialogService.open(DiagnosisDialogComponent, item ?? null);
    ref.afterClosed.subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`diagnoses/${item.diagnosisId}`, result)
        : this.api.post('diagnoses', result);
      op.subscribe({
        next: () => { this.toast.success(item ? 'Izmenjeno' : 'Dodato'); this.load(); },
        error: () => this.toast.error('Greška pri čuvanju'),
      });
    });
  }

  deleteItem(item: Diagnosis): void {
    const ref = this.dialogService.open(ConfirmDialogComponent, { title: 'Brisanje', message: `Obrisati dijagnozu "${item.sifra} — ${item.naziv}"?` });
    ref.afterClosed.subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`diagnoses/${item.diagnosisId}`).subscribe({
        next: () => { this.toast.success('Obrisano'); this.load(); },
        error: () => this.toast.error('Greška pri brisanju'),
      });
    });
  }
}

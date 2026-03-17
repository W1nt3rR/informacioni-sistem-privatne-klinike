import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { ServiceItem } from './service.model';
import { ServiceDialogComponent } from './service-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

interface Specialization {
  specializationId: number;
  naziv: string;
}

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Usluge</h2>
      <div class="flex gap-3 items-center">
        <select class="select w-52" (change)="filterBySpec($event)">
          <option [value]="''">Sve specijalizacije</option>
          @for (s of specializations(); track s.specializationId) {
            <option [value]="s.specializationId">{{ s.naziv }}</option>
          }
        </select>
        <button class="btn btn-primary btn-sm" (click)="openDialog()">
          <span class="material-icons text-sm">add</span> Dodaj
        </button>
      </div>
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
              <th>Specijalizacija</th>
              <th>Trajanje</th>
              <th>Cena</th>
              <th>Status</th>
              <th class="w-32">Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (row of items(); track row.serviceId) {
              <tr>
                <td>{{ row.naziv }}</td>
                <td>{{ row.specijalizacijaNaziv }}</td>
                <td>{{ row.trajanjeMinuta }} min</td>
                <td>{{ row.cena | number:'1.0-2' }} RSD</td>
                <td>
                  <span class="badge" [class]="row.aktivan ? 'badge-success' : 'badge-error'">
                    {{ row.aktivan ? 'Aktivna' : 'Neaktivna' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-1">
                    <div class="tooltip" data-tip="Izmeni">
                      <button class="btn btn-ghost btn-xs btn-square" (click)="openDialog(row)">
                        <span class="material-icons text-sm">edit</span>
                      </button>
                    </div>
                    <div class="tooltip" [attr.data-tip]="row.aktivan ? 'Deaktiviraj' : 'Aktiviraj'">
                      <button class="btn btn-ghost btn-xs btn-square" (click)="toggleStatus(row)">
                        <span class="material-icons text-sm">{{ row.aktivan ? 'block' : 'check_circle' }}</span>
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
          <div class="text-center text-base-content/60 py-8">Nema usluga.</div>
        }
      </div>
    }
  `,
})
export class ServiceListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  items = signal<ServiceItem[]>([]);
  specializations = signal<Specialization[]>([]);
  loading = signal(true);
  private specFilter: number | null = null;

  ngOnInit(): void {
    this.api.get<Specialization[]>('specializations').subscribe(s => this.specializations.set(s));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.specFilter) params['specializationId'] = this.specFilter.toString();
    this.api.get<ServiceItem[]>('services', params).subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  filterBySpec(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.specFilter = val ? +val : null;
    this.load();
  }

  openDialog(item?: ServiceItem): void {
    const ref = this.dialogService.open(ServiceDialogComponent, item ?? null);
    ref.afterClosed.subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`services/${item.serviceId}`, result)
        : this.api.post('services', result);
      op.subscribe({
        next: () => { this.toast.success(item ? 'Izmenjeno' : 'Dodato'); this.load(); },
        error: () => this.toast.error('Greška pri čuvanju'),
      });
    });
  }

  toggleStatus(item: ServiceItem): void {
    this.api.patch(`services/${item.serviceId}/status`).subscribe({
      next: () => { this.toast.success('Status promenjen'); this.load(); },
      error: () => this.toast.error('Greška'),
    });
  }

  deleteItem(item: ServiceItem): void {
    const ref = this.dialogService.open(ConfirmDialogComponent, { title: 'Brisanje', message: `Obrisati uslugu "${item.naziv}"?` });
    ref.afterClosed.subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`services/${item.serviceId}`).subscribe({
        next: () => { this.toast.success('Obrisano'); this.load(); },
        error: () => this.toast.error('Greška pri brisanju'),
      });
    });
  }
}

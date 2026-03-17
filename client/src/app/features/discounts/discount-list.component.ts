import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../shared/services/api.service';
import { Discount } from './discount.model';
import { DiscountDialogComponent } from './discount-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-discount-list',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-slate-800 m-0">Popusti</h2>
      <button mat-flat-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon> Dodaj
      </button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="40" />
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <table mat-table [dataSource]="items()" class="w-full">
          <ng-container matColumnDef="naziv">
            <th mat-header-cell *matHeaderCellDef>Naziv</th>
            <td mat-cell *matCellDef="let row">{{ row.naziv }}</td>
          </ng-container>
          <ng-container matColumnDef="procenat">
            <th mat-header-cell *matHeaderCellDef>Procenat</th>
            <td mat-cell *matCellDef="let row">{{ row.procenat | number:'1.0-2' }}%</td>
          </ng-container>
          <ng-container matColumnDef="vaziOd">
            <th mat-header-cell *matHeaderCellDef>Važi od</th>
            <td mat-cell *matCellDef="let row">{{ row.vaziOd ? (row.vaziOd | date:'dd.MM.yyyy.') : '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="vaziDo">
            <th mat-header-cell *matHeaderCellDef>Važi do</th>
            <td mat-cell *matCellDef="let row">{{ row.vaziDo ? (row.vaziDo | date:'dd.MM.yyyy.') : '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="aktivan">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [class]="row.aktivan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ row.aktivan ? 'Aktivan' : 'Neaktivan' }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="w-24">Akcije</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button matTooltip="Izmeni" (click)="openDialog(row)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Obriši" color="warn" (click)="deleteItem(row)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>

        @if (items().length === 0) {
          <div class="text-center text-slate-400 py-8">Nema popusta.</div>
        }
      </div>
    }
  `,
})
export class DiscountListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  items = signal<Discount[]>([]);
  loading = signal(true);
  columns = ['naziv', 'procenat', 'vaziOd', 'vaziDo', 'aktivan', 'actions'];

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
    const ref = this.dialog.open(DiscountDialogComponent, { data: item ?? null });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`discounts/${item.discountId}`, result)
        : this.api.post('discounts', result);
      op.subscribe({
        next: () => { this.snackBar.open(item ? 'Izmenjeno' : 'Dodato', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snackBar.open('Greška pri čuvanju', 'OK', { duration: 3000 }),
      });
    });
  }

  deleteItem(item: Discount): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Brisanje', message: `Obrisati popust "${item.naziv}"?` },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`discounts/${item.discountId}`).subscribe({
        next: () => { this.snackBar.open('Obrisano', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snackBar.open('Greška pri brisanju', 'OK', { duration: 3000 }),
      });
    });
  }
}

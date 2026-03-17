import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../shared/services/api.service';
import { Office } from './office.model';
import { OfficeDialogComponent } from './office-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-office-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule, MatProgressSpinnerModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-slate-800 m-0">Ordinacije</h2>
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
          <ng-container matColumnDef="lokacija">
            <th mat-header-cell *matHeaderCellDef>Lokacija</th>
            <td mat-cell *matCellDef="let row">{{ row.lokacija ?? '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="oprema">
            <th mat-header-cell *matHeaderCellDef>Oprema</th>
            <td mat-cell *matCellDef="let row">{{ row.oprema ?? '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="dostupna">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [highlighted]="row.dostupna" [class]="row.dostupna ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ row.dostupna ? 'Dostupna' : 'Nedostupna' }}
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
          <div class="text-center text-slate-400 py-8">Nema ordinacija.</div>
        }
      </div>
    }
  `,
})
export class OfficeListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  items = signal<Office[]>([]);
  loading = signal(true);
  columns = ['naziv', 'lokacija', 'oprema', 'dostupna', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<Office[]>('offices').subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  openDialog(item?: Office): void {
    const ref = this.dialog.open(OfficeDialogComponent, { data: item ?? null });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`offices/${item.officeId}`, result)
        : this.api.post('offices', result);
      op.subscribe({
        next: () => { this.snackBar.open(item ? 'Izmenjeno' : 'Dodato', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snackBar.open('Greška pri čuvanju', 'OK', { duration: 3000 }),
      });
    });
  }

  deleteItem(item: Office): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Brisanje', message: `Obrisati ordinaciju "${item.naziv}"?` },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`offices/${item.officeId}`).subscribe({
        next: () => { this.snackBar.open('Obrisano', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snackBar.open('Greška pri brisanju', 'OK', { duration: 3000 }),
      });
    });
  }
}

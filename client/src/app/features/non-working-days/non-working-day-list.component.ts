import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../shared/services/api.service';
import { NonWorkingDay } from './non-working-day.model';
import { NonWorkingDayDialogComponent } from './non-working-day-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-non-working-day-list',
  standalone: true,
  imports: [DatePipe, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-slate-800 m-0">Neradni dani</h2>
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
          <ng-container matColumnDef="datum">
            <th mat-header-cell *matHeaderCellDef>Datum</th>
            <td mat-cell *matCellDef="let row">{{ row.datum | date:'dd.MM.yyyy.' }}</td>
          </ng-container>
          <ng-container matColumnDef="naziv">
            <th mat-header-cell *matHeaderCellDef>Naziv</th>
            <td mat-cell *matCellDef="let row">{{ row.naziv }}</td>
          </ng-container>
          <ng-container matColumnDef="opis">
            <th mat-header-cell *matHeaderCellDef>Opis</th>
            <td mat-cell *matCellDef="let row">{{ row.opis ?? '—' }}</td>
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
          <div class="text-center text-slate-400 py-8">Nema neradnih dana.</div>
        }
      </div>
    }
  `,
})
export class NonWorkingDayListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  items = signal<NonWorkingDay[]>([]);
  loading = signal(true);
  columns = ['datum', 'naziv', 'opis', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<NonWorkingDay[]>('nonworkingdays').subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  openDialog(item?: NonWorkingDay): void {
    const ref = this.dialog.open(NonWorkingDayDialogComponent, { data: item ?? null });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`nonworkingdays/${item.nonWorkingDayId}`, result)
        : this.api.post('nonworkingdays', result);
      op.subscribe({
        next: () => { this.snackBar.open(item ? 'Izmenjeno' : 'Dodato', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snackBar.open('Greška pri čuvanju', 'OK', { duration: 3000 }),
      });
    });
  }

  deleteItem(item: NonWorkingDay): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Brisanje', message: `Obrisati neradni dan "${item.naziv}"?` },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`nonworkingdays/${item.nonWorkingDayId}`).subscribe({
        next: () => { this.snackBar.open('Obrisano', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snackBar.open('Greška pri brisanju', 'OK', { duration: 3000 }),
      });
    });
  }
}

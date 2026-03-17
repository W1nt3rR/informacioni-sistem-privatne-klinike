import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { Doctor } from './doctor.model';
import { DoctorDialogComponent } from './doctor-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

interface Specialization {
  specializationId: number;
  naziv: string;
}

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatChipsModule, MatSelectModule, MatFormFieldModule, RouterLink,
  ],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-slate-800 m-0">Lekari</h2>
      <div class="flex gap-3 items-center">
        <mat-form-field class="w-52" subscriptSizing="dynamic">
          <mat-label>Specijalizacija</mat-label>
          <mat-select (selectionChange)="filterBySpec($event.value)" [value]="null">
            <mat-option [value]="null">Sve</mat-option>
            @for (s of specializations(); track s.specializationId) {
              <mat-option [value]="s.specializationId">{{ s.naziv }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Dodaj
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="40" />
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <table mat-table [dataSource]="items()" class="w-full">
          <ng-container matColumnDef="ime">
            <th mat-header-cell *matHeaderCellDef>Ime i prezime</th>
            <td mat-cell *matCellDef="let row">
              <a [routerLink]="[row.doctorId]" class="text-blue-600 hover:underline">
                {{ row.titula ? row.titula + ' ' : '' }}{{ row.ime }} {{ row.prezime }}
              </a>
            </td>
          </ng-container>
          <ng-container matColumnDef="specijalizacija">
            <th mat-header-cell *matHeaderCellDef>Specijalizacija</th>
            <td mat-cell *matCellDef="let row">{{ row.specijalizacijaNaziv }}</td>
          </ng-container>
          <ng-container matColumnDef="licencaBroj">
            <th mat-header-cell *matHeaderCellDef>Broj licence</th>
            <td mat-cell *matCellDef="let row">{{ row.licencaBroj }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let row">{{ row.email }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [highlighted]="row.aktivan" [class]="row.aktivan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ row.aktivan ? 'Aktivan' : 'Neaktivan' }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="w-32">Akcije</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button matTooltip="Izmeni" (click)="openDialog(row)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button [matTooltip]="row.aktivan ? 'Deaktiviraj' : 'Aktiviraj'" (click)="toggleStatus(row)">
                <mat-icon>{{ row.aktivan ? 'block' : 'check_circle' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>

        @if (items().length === 0) {
          <div class="text-center text-slate-400 py-8">Nema lekara.</div>
        }
      </div>
    }
  `,
})
export class DoctorListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  items = signal<Doctor[]>([]);
  specializations = signal<Specialization[]>([]);
  loading = signal(true);
  columns = ['ime', 'specijalizacija', 'licencaBroj', 'email', 'status', 'actions'];
  private specFilter: number | null = null;

  ngOnInit(): void {
    this.api.get<Specialization[]>('specializations').subscribe(s => this.specializations.set(s));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.specFilter) params['specializationId'] = this.specFilter.toString();
    this.api.get<Doctor[]>('doctors', params).subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  filterBySpec(id: number | null): void {
    this.specFilter = id;
    this.load();
  }

  openDialog(item?: Doctor): void {
    const ref = this.dialog.open(DoctorDialogComponent, { data: item ?? null });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`doctors/${item.doctorId}`, {
            ime: result.ime, prezime: result.prezime, email: result.email,
            telefon: result.telefon || null, specializationId: result.specializationId,
            titula: result.titula || null, licencaBroj: result.licencaBroj,
          })
        : this.api.post('doctors', result);
      op.subscribe({
        next: () => { this.snackBar.open(item ? 'Izmenjeno' : 'Dodato', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snackBar.open('Greška pri čuvanju', 'OK', { duration: 3000 }),
      });
    });
  }

  toggleStatus(item: Doctor): void {
    this.api.patch(`doctors/${item.doctorId}/status`).subscribe({
      next: () => { this.snackBar.open('Status promenjen', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Greška', 'OK', { duration: 3000 }),
    });
  }
}

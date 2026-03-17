import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Patient } from './patient.model';
import { PatientDialogComponent } from './patient-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule,
    MatInputModule, MatChipsModule, MatProgressSpinnerModule, RouterLink,
  ],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-slate-800 m-0">Pacijenti</h2>
      <button mat-flat-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon> Novi pacijent
      </button>
    </div>

    <mat-form-field class="w-full mb-4" subscriptSizing="dynamic">
      <mat-label>Pretraži pacijente</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input matInput (input)="onSearch($event)" placeholder="Ime, prezime, JMBG, telefon, email..." />
    </mat-form-field>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="40" />
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <table mat-table [dataSource]="patients()" class="w-full">
          <ng-container matColumnDef="ime">
            <th mat-header-cell *matHeaderCellDef>Ime i prezime</th>
            <td mat-cell *matCellDef="let row">
              <a [routerLink]="['/patients', row.patientId]" class="text-blue-600 hover:underline">
                {{ row.ime }} {{ row.prezime }}
              </a>
            </td>
          </ng-container>
          <ng-container matColumnDef="jmbg">
            <th mat-header-cell *matHeaderCellDef>JMBG</th>
            <td mat-cell *matCellDef="let row">{{ row.jmbg }}</td>
          </ng-container>
          <ng-container matColumnDef="telefon">
            <th mat-header-cell *matHeaderCellDef>Telefon</th>
            <td mat-cell *matCellDef="let row">{{ row.telefon }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let row">{{ row.email ?? '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [class]="row.aktivan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ row.aktivan ? 'Aktivan' : 'Neaktivan' }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="w-24"></th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button (click)="openDialog(row)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="toggleStatus(row)">
                <mat-icon>{{ row.aktivan ? 'person_off' : 'person' }}</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        @if (patients().length === 0) {
          <div class="text-center text-slate-400 py-8">Nema pronađenih pacijenata.</div>
        }
      </div>
    }
  `,
})
export class PatientListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  patients = signal<Patient[]>([]);
  loading = signal(false);
  columns = ['ime', 'jmbg', 'telefon', 'email', 'status', 'actions'];
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => this.load(q));
    this.load('');
  }

  onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  load(search: string): void {
    this.loading.set(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    this.api.get<Patient[]>(`patients${params}`).subscribe({
      next: data => { this.patients.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(patient?: Patient): void {
    this.dialog.open(PatientDialogComponent, {
      width: '600px',
      data: patient ?? null,
    }).afterClosed().subscribe(result => {
      if (result) this.load('');
    });
  }

  toggleStatus(patient: Patient): void {
    const action = patient.aktivan ? 'deaktivirate' : 'aktivirate';
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Potvrda', message: `Da li želite da ${action} pacijenta ${patient.ime} ${patient.prezime}?` },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.patch(`patients/${patient.patientId}/status`, {}).subscribe({
          next: () => {
            this.snackBar.open('Status ažuriran', 'OK', { duration: 2000 });
            this.load('');
          },
          error: () => this.snackBar.open('Greška', 'OK', { duration: 3000 }),
        });
      }
    });
  }
}

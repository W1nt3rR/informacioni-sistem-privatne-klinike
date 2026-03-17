import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../shared/services/api.service';
import { UserDialogComponent } from './user-dialog.component';

interface UserItem {
  id: string;
  userName: string;
  ime: string;
  prezime: string;
  email: string | null;
  phoneNumber: string | null;
  aktivan: boolean;
  datumKreiranja: string;
  roles: string[];
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatChipsModule, MatFormFieldModule, MatSelectModule, MatSnackBarModule, MatTooltipModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Korisnici</h1>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>person_add</mat-icon> Novi korisnik
        </button>
      </div>

      <mat-form-field class="w-48 mb-4">
        <mat-label>Uloga</mat-label>
        <mat-select [(ngModel)]="roleFilter" (selectionChange)="load()">
          <mat-option value="">Sve</mat-option>
          <mat-option value="admin">Admin</mat-option>
          <mat-option value="recepcija">Recepcija</mat-option>
          <mat-option value="lekar">Lekar</mat-option>
          <mat-option value="menadzer">Menadžer</mat-option>
          <mat-option value="pacijent">Pacijent</mat-option>
        </mat-select>
      </mat-form-field>

      <table mat-table [dataSource]="users()" class="w-full">
        <ng-container matColumnDef="ime">
          <th mat-header-cell *matHeaderCellDef>Ime i prezime</th>
          <td mat-cell *matCellDef="let u">{{ u.ime }} {{ u.prezime }}</td>
        </ng-container>
        <ng-container matColumnDef="userName">
          <th mat-header-cell *matHeaderCellDef>Korisničko ime</th>
          <td mat-cell *matCellDef="let u">{{ u.userName }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let u">{{ u.email || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef>Uloge</th>
          <td mat-cell *matCellDef="let u">
            @for (r of u.roles; track r) {
              <span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs mr-1">{{ r }}</span>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="aktivan">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let u">
            <span [class.text-green-600]="u.aktivan" [class.text-red-500]="!u.aktivan">
              {{ u.aktivan ? 'Aktivan' : 'Neaktivan' }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let u">
            <button mat-icon-button (click)="openDialog(u)" matTooltip="Izmeni">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="toggleActive(u)"
              [matTooltip]="u.aktivan ? 'Deaktiviraj' : 'Aktiviraj'">
              <mat-icon>{{ u.aktivan ? 'person_off' : 'person' }}</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    </div>
  `
})
export class UserListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  users = signal<UserItem[]>([]);
  columns = ['ime', 'userName', 'email', 'roles', 'aktivan', 'actions'];
  roleFilter = '';

  ngOnInit() { this.load(); }

  load() {
    const qs = this.roleFilter ? `?role=${this.roleFilter}` : '';
    this.api.get<UserItem[]>(`users${qs}`).subscribe(r => this.users.set(r));
  }

  openDialog(user?: UserItem) {
    this.dialog.open(UserDialogComponent, {
      width: '480px',
      data: user ?? null,
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  toggleActive(u: UserItem) {
    this.api.patch(`users/${u.id}/deactivate`, {}).subscribe(() => {
      this.snack.open(u.aktivan ? 'Korisnik deaktiviran' : 'Korisnik aktiviran', 'OK', { duration: 2000 });
      this.load();
    });
  }
}

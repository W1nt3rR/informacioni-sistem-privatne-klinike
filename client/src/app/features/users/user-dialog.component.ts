import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Izmeni korisnika' : 'Novi korisnik' }}</h2>
    <mat-dialog-content class="flex flex-col gap-3">
      @if (!data) {
        <mat-form-field>
          <mat-label>Korisničko ime</mat-label>
          <input matInput [(ngModel)]="form.userName" required>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Lozinka</mat-label>
          <input matInput type="password" [(ngModel)]="form.password" required>
        </mat-form-field>
      }
      <mat-form-field>
        <mat-label>Ime</mat-label>
        <input matInput [(ngModel)]="form.ime" required>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Prezime</mat-label>
        <input matInput [(ngModel)]="form.prezime" required>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput [(ngModel)]="form.email">
      </mat-form-field>
      <mat-form-field>
        <mat-label>Telefon</mat-label>
        <input matInput [(ngModel)]="form.phoneNumber">
      </mat-form-field>
      <mat-form-field>
        <mat-label>Uloga</mat-label>
        <mat-select [(ngModel)]="form.role" required>
          <mat-option value="admin">Admin</mat-option>
          <mat-option value="recepcija">Recepcija</mat-option>
          <mat-option value="lekar">Lekar</mat-option>
          <mat-option value="menadzer">Menadžer</mat-option>
          <mat-option value="pacijent">Pacijent</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-raised-button color="primary" (click)="save()">Sačuvaj</button>
    </mat-dialog-actions>
  `
})
export class UserDialogComponent {
  data = inject(MAT_DIALOG_DATA) as any;
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);
  private snack = inject(MatSnackBar);

  form: any = {
    userName: '',
    password: '',
    ime: this.data?.ime ?? '',
    prezime: this.data?.prezime ?? '',
    email: this.data?.email ?? '',
    phoneNumber: this.data?.phoneNumber ?? '',
    role: this.data?.roles?.[0] ?? 'recepcija',
  };

  save() {
    if (this.data) {
      this.api.put(`users/${this.data.id}`, {
        ime: this.form.ime,
        prezime: this.form.prezime,
        email: this.form.email || null,
        phoneNumber: this.form.phoneNumber || null,
        role: this.form.role,
      }).subscribe({
        next: () => { this.snack.open('Korisnik ažuriran', 'OK', { duration: 2000 }); this.dialogRef.close(true); },
        error: () => this.snack.open('Greška pri ažuriranju', 'OK', { duration: 3000 }),
      });
    } else {
      this.api.post('users', {
        userName: this.form.userName,
        password: this.form.password,
        ime: this.form.ime,
        prezime: this.form.prezime,
        email: this.form.email || null,
        phoneNumber: this.form.phoneNumber || null,
        role: this.form.role,
      }).subscribe({
        next: () => { this.snack.open('Korisnik kreiran', 'OK', { duration: 2000 }); this.dialogRef.close(true); },
        error: () => this.snack.open('Greška pri kreiranju', 'OK', { duration: 3000 }),
      });
    }
  }
}

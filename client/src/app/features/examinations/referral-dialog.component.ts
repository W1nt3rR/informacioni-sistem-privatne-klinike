import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-referral-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Dodaj uput</h2>
    <mat-dialog-content class="flex flex-col gap-3">
      <mat-form-field>
        <mat-label>Tip uputa</mat-label>
        <mat-select [(value)]="tip" required>
          <mat-option value="laboratorija">Laboratorija</mat-option>
          <mat-option value="specijalisticki">Specijalistički</mat-option>
          <mat-option value="dijagnostika">Dijagnostika</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Opis</mat-label>
        <textarea matInput [(ngModel)]="opis" rows="3" required></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-raised-button color="primary" (click)="save()"
        [disabled]="!tip || !opis">Dodaj</button>
    </mat-dialog-actions>
  `
})
export class ReferralDialogComponent {
  tip = '';
  opis = '';

  constructor(private dialogRef: MatDialogRef<ReferralDialogComponent>) {}

  save() {
    this.dialogRef.close({ tip: this.tip, opis: this.opis });
  }
}

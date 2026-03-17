import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Kreiraj medicinski izveštaj</h2>
    <mat-dialog-content>
      <mat-form-field class="w-full">
        <mat-label>Sadržaj izveštaja</mat-label>
        <textarea matInput [(ngModel)]="sadrzaj" rows="6" required></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-raised-button color="primary" (click)="save()"
        [disabled]="!sadrzaj">Kreiraj</button>
    </mat-dialog-actions>
  `
})
export class ReportDialogComponent {
  sadrzaj = '';

  constructor(private dialogRef: MatDialogRef<ReportDialogComponent>) {}

  save() {
    this.dialogRef.close(this.sadrzaj);
  }
}

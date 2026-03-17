import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-therapy-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Dodaj terapiju</h2>
    <mat-dialog-content class="flex flex-col gap-3">
      <mat-form-field>
        <mat-label>Naziv leka</mat-label>
        <input matInput [(ngModel)]="nazivLeka" required>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Doza</mat-label>
        <input matInput [(ngModel)]="doza" required>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Učestalost</mat-label>
        <input matInput [(ngModel)]="ucestalost" required placeholder="npr. 3x dnevno">
      </mat-form-field>
      <mat-form-field>
        <mat-label>Trajanje</mat-label>
        <input matInput [(ngModel)]="trajanje" required placeholder="npr. 7 dana">
      </mat-form-field>
      <mat-form-field>
        <mat-label>Napomena</mat-label>
        <textarea matInput [(ngModel)]="napomena" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-raised-button color="primary" (click)="save()"
        [disabled]="!nazivLeka || !doza || !ucestalost || !trajanje">Dodaj</button>
    </mat-dialog-actions>
  `
})
export class TherapyDialogComponent {
  nazivLeka = '';
  doza = '';
  ucestalost = '';
  trajanje = '';
  napomena = '';

  constructor(private dialogRef: MatDialogRef<TherapyDialogComponent>) {}

  save() {
    this.dialogRef.close({
      nazivLeka: this.nazivLeka,
      doza: this.doza,
      ucestalost: this.ucestalost,
      trajanje: this.trajanje,
      napomena: this.napomena || undefined
    });
  }
}

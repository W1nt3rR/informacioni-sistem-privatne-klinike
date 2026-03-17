import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Specialization } from './specialization.model';

@Component({
  selector: 'app-specialization-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Izmeni specijalizaciju' : 'Nova specijalizacija' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2" style="min-width: 360px;">
        <mat-form-field>
          <mat-label>Naziv</mat-label>
          <input matInput formControlName="naziv" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Opis</mat-label>
          <textarea matInput formControlName="opis" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Sačuvaj</button>
    </mat-dialog-actions>
  `,
})
export class SpecializationDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SpecializationDialogComponent>);
  data = inject<Specialization | null>(MAT_DIALOG_DATA);

  form = this.fb.group({
    naziv: [this.data?.naziv ?? '', Validators.required],
    opis: [this.data?.opis ?? ''],
  });

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

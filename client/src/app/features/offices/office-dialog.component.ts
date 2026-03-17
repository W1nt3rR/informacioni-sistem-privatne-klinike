import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Office } from './office.model';

@Component({
  selector: 'app-office-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Izmeni ordinaciju' : 'Nova ordinacija' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2" style="min-width: 360px;">
        <mat-form-field>
          <mat-label>Naziv</mat-label>
          <input matInput formControlName="naziv" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Lokacija</mat-label>
          <input matInput formControlName="lokacija" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Oprema</mat-label>
          <textarea matInput formControlName="oprema" rows="3"></textarea>
        </mat-form-field>
        <mat-checkbox formControlName="dostupna">Dostupna</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Sačuvaj</button>
    </mat-dialog-actions>
  `,
})
export class OfficeDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<OfficeDialogComponent>);
  data = inject<Office | null>(MAT_DIALOG_DATA);

  form = this.fb.group({
    naziv: [this.data?.naziv ?? '', Validators.required],
    lokacija: [this.data?.lokacija ?? ''],
    oprema: [this.data?.oprema ?? ''],
    dostupna: [this.data?.dostupna ?? true],
  });

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface CancelDialogData {
  appointmentId: number;
  pacijentIme: string;
}

@Component({
  selector: 'app-cancel-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Otkaži termin</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="flex flex-col gap-3">
        <p class="text-sm text-slate-600">Pacijent: {{ data.pacijentIme }}</p>
        <mat-form-field>
          <mat-label>Razlog otkazivanja</mat-label>
          <mat-select formControlName="status">
            <mat-option value="otkazao_pacijent">Otkazao pacijent</mat-option>
            <mat-option value="otkazala_klinika">Otkazala klinika</mat-option>
            <mat-option value="nije_se_pojavio">Nije se pojavio</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Napomena</mat-label>
          <textarea matInput formControlName="razlogOtkazivanja" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Nazad</button>
        <button mat-flat-button color="warn" type="submit" [disabled]="form.invalid">
          Otkaži termin
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CancelDialogComponent {
  data = inject<CancelDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<CancelDialogComponent>);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    status: ['', Validators.required],
    razlogOtkazivanja: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.dialogRef.close({
      status: val.status,
      razlogOtkazivanja: val.razlogOtkazivanja || null,
    });
  }
}

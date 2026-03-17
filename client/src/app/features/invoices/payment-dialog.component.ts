import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CreatePaymentRequest } from './invoice.model';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Evidentiraj uplatu</h2>
    <mat-dialog-content>
      <p class="mb-4">Preostalo za naplatu: <strong>{{ data.remaining | number:'1.2-2' }} RSD</strong></p>
      <mat-form-field class="w-full">
        <mat-label>Iznos</mat-label>
        <input matInput type="number" [(ngModel)]="payment.iznos" [max]="data.remaining" min="0.01">
      </mat-form-field>
      <mat-form-field class="w-full">
        <mat-label>Način plaćanja</mat-label>
        <mat-select [(ngModel)]="payment.nacinPlacanja">
          <mat-option value="gotovina">Gotovina</mat-option>
          <mat-option value="kartica">Kartica</mat-option>
          <mat-option value="virman">Virman</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field class="w-full">
        <mat-label>Napomena</mat-label>
        <textarea matInput [(ngModel)]="payment.napomena" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-raised-button color="primary" (click)="save()"
        [disabled]="!payment.iznos || !payment.nacinPlacanja">Sačuvaj</button>
    </mat-dialog-actions>
  `
})
export class PaymentDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { remaining: number };
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);

  payment: CreatePaymentRequest = {
    iznos: this.data.remaining,
    nacinPlacanja: 'gotovina',
    napomena: ''
  };

  save() {
    this.dialogRef.close(this.payment);
  }
}

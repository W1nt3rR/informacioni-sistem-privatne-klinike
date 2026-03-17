import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { CreatePaymentRequest } from './invoice.model';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h3 class="font-bold text-lg">Evidentiraj uplatu</h3>
    <p class="mb-4">Preostalo za naplatu: <strong>{{ data.remaining | number:'1.2-2' }} RSD</strong></p>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Iznos</legend>
      <input class="input w-full" type="number" [(ngModel)]="payment.iznos" [max]="data.remaining" min="0.01">
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Način plaćanja</legend>
      <select class="select w-full" [(ngModel)]="payment.nacinPlacanja">
        <option value="gotovina">Gotovina</option>
        <option value="kartica">Kartica</option>
        <option value="virman">Virman</option>
      </select>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Napomena</legend>
      <textarea class="textarea w-full" [(ngModel)]="payment.napomena" rows="2"></textarea>
    </fieldset>
    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" (click)="save()"
        [disabled]="!payment.iznos || !payment.nacinPlacanja">Sačuvaj</button>
    </div>
  `
})
export class PaymentDialogComponent {
  ref = inject(DialogRef);
  data = inject(DIALOG_DATA) as { remaining: number };

  payment: CreatePaymentRequest = {
    iznos: this.data.remaining,
    nacinPlacanja: 'gotovina',
    napomena: ''
  };

  save() {
    this.ref.close(this.payment);
  }
}

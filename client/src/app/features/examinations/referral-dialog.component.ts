import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-referral-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3 class="font-bold text-lg">Dodaj uput</h3>
    <div class="mt-4 space-y-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Tip uputa</legend>
        <select class="select w-full" [(ngModel)]="tip" required>
          <option value="" disabled>Odaberi tip</option>
          <option value="laboratorija">Laboratorija</option>
          <option value="specijalisticki">Specijalistički</option>
          <option value="dijagnostika">Dijagnostika</option>
        </select>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Opis</legend>
        <textarea class="textarea w-full" [(ngModel)]="opis" rows="3" required></textarea>
      </fieldset>
    </div>
    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" (click)="save()"
        [disabled]="!tip || !opis">Dodaj</button>
    </div>
  `
})
export class ReferralDialogComponent {
  ref = inject(DialogRef);
  tip = '';
  opis = '';

  save() {
    this.ref.close({ tip: this.tip, opis: this.opis });
  }
}

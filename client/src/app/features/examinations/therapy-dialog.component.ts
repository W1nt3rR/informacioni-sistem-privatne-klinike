import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-therapy-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3 class="font-bold text-lg">Dodaj terapiju</h3>
    <div class="mt-4 space-y-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Naziv leka</legend>
        <input class="input w-full" [(ngModel)]="nazivLeka" required />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Doza</legend>
        <input class="input w-full" [(ngModel)]="doza" required />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Učestalost</legend>
        <input class="input w-full" [(ngModel)]="ucestalost" required placeholder="npr. 3x dnevno" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Trajanje</legend>
        <input class="input w-full" [(ngModel)]="trajanje" required placeholder="npr. 7 dana" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Napomena</legend>
        <textarea class="textarea w-full" [(ngModel)]="napomena" rows="2"></textarea>
      </fieldset>
    </div>
    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" (click)="save()"
        [disabled]="!nazivLeka || !doza || !ucestalost || !trajanje">Dodaj</button>
    </div>
  `
})
export class TherapyDialogComponent {
  ref = inject(DialogRef);
  nazivLeka = '';
  doza = '';
  ucestalost = '';
  trajanje = '';
  napomena = '';

  save() {
    this.ref.close({
      nazivLeka: this.nazivLeka,
      doza: this.doza,
      ucestalost: this.ucestalost,
      trajanje: this.trajanje,
      napomena: this.napomena || undefined
    });
  }
}

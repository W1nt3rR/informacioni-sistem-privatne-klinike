import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3 class="font-bold text-lg">Kreiraj medicinski izveštaj</h3>
    <div class="mt-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Sadržaj izveštaja</legend>
        <textarea class="textarea w-full" [(ngModel)]="sadrzaj" rows="6" required></textarea>
      </fieldset>
    </div>
    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" (click)="save()"
        [disabled]="!sadrzaj">Kreiraj</button>
    </div>
  `
})
export class ReportDialogComponent {
  ref = inject(DialogRef);
  sadrzaj = '';

  save() {
    this.ref.close(this.sadrzaj);
  }
}

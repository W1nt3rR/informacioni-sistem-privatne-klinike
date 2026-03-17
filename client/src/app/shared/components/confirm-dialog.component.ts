import { Component, inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '../services/dialog.service';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <h3 class="font-bold text-lg mb-4">{{ data.title }}</h3>
    <p class="mb-6">{{ data.message }}</p>
    <div class="modal-action">
      <button class="btn" (click)="dialogRef.close(false)">{{ data.cancelText ?? 'Otkaži' }}</button>
      <button class="btn btn-error" (click)="dialogRef.close(true)">{{ data.confirmText ?? 'Potvrdi' }}</button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(DIALOG_DATA);
  dialogRef = inject(DialogRef);
}

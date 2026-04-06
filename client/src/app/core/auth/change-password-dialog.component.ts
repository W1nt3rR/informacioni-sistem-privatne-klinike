import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DialogRef } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">Promena lozinke</h3>
    <form [formGroup]="form" (ngSubmit)="submit()" class="mt-4 space-y-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Trenutna lozinka</legend>
        <input class="input w-full" type="password" formControlName="currentPassword" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Nova lozinka</legend>
        <input class="input w-full" type="password" formControlName="newPassword" />
        <span class="text-xs opacity-70">Najmanje 6 karaktera.</span>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Potvrda nove lozinke</legend>
        <input class="input w-full" type="password" formControlName="confirmPassword" />
        @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
          <span class="text-error text-sm">Lozinke se ne poklapaju.</span>
        }
      </fieldset>

      <div class="modal-action">
        <button class="btn" type="button" (click)="dialogRef.close()">Otkaži</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid || saving()">
          @if (saving()) {
            <span class="loading loading-spinner loading-sm"></span>
          }
          Sačuvaj
        </button>
      </div>
    </form>
  `,
})
export class ChangePasswordDialogComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  dialogRef = inject(DialogRef);
  saving = signal(false);

  form = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: [this.passwordMatchValidator] },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentPassword = this.form.get('currentPassword')?.value ?? '';
    const newPassword = this.form.get('newPassword')?.value ?? '';

    this.saving.set(true);
    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Lozinka uspešno promenjena.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? err?.error ?? 'Greška pri promeni lozinke.');
      },
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }
}

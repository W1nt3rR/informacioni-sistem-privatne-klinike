import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data ? 'Izmeni korisnika' : 'Novi korisnik' }}</h3>
    <div class="mt-4 space-y-3">
      @if (!data) {
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Korisničko ime</legend>
          <input class="input w-full" [(ngModel)]="form.userName" required />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Lozinka</legend>
          <input class="input w-full" type="password" [(ngModel)]="form.password" required />
        </fieldset>
      }
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Ime</legend>
        <input class="input w-full" [(ngModel)]="form.ime" required />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Prezime</legend>
        <input class="input w-full" [(ngModel)]="form.prezime" required />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Email</legend>
        <input class="input w-full" [(ngModel)]="form.email" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Telefon</legend>
        <input class="input w-full" [(ngModel)]="form.phoneNumber" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Uloga</legend>
        <select class="select w-full" [(ngModel)]="form.role" required>
          <option value="admin">Admin</option>
          <option value="recepcija">Recepcija</option>
          <option value="lekar">Lekar</option>
          <option value="menadzer">Menadžer</option>
          <option value="pacijent">Pacijent</option>
        </select>
      </fieldset>
    </div>
    <div class="modal-action">
      <button class="btn" (click)="dialogRef.close(null)">Otkaži</button>
      <button class="btn btn-primary" (click)="save()">Sačuvaj</button>
    </div>
  `
})
export class UserDialogComponent {
  data = inject(DIALOG_DATA) as any;
  private api = inject(ApiService);
  dialogRef = inject(DialogRef);
  private toast = inject(ToastService);

  form: any = {
    userName: '',
    password: '',
    ime: this.data?.ime ?? '',
    prezime: this.data?.prezime ?? '',
    email: this.data?.email ?? '',
    phoneNumber: this.data?.phoneNumber ?? '',
    role: this.data?.roles?.[0] ?? 'recepcija',
  };

  save() {
    if (this.data) {
      this.api.put(`users/${this.data.id}`, {
        ime: this.form.ime,
        prezime: this.form.prezime,
        email: this.form.email || null,
        phoneNumber: this.form.phoneNumber || null,
        role: this.form.role,
      }).subscribe({
        next: () => { this.toast.success('Korisnik ažuriran'); this.dialogRef.close(true); },
        error: () => this.toast.error('Greška pri ažuriranju'),
      });
    } else {
      this.api.post('users', {
        userName: this.form.userName,
        password: this.form.password,
        ime: this.form.ime,
        prezime: this.form.prezime,
        email: this.form.email || null,
        phoneNumber: this.form.phoneNumber || null,
        role: this.form.role,
      }).subscribe({
        next: () => { this.toast.success('Korisnik kreiran'); this.dialogRef.close(true); },
        error: () => this.toast.error('Greška pri kreiranju'),
      });
    }
  }
}

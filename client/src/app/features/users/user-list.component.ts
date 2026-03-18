import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserDialogComponent } from './user-dialog.component';

interface UserItem {
  id: string;
  userName: string;
  ime: string;
  prezime: string;
  email: string | null;
  phoneNumber: string | null;
  aktivan: boolean;
  datumKreiranja: string;
  roles: string[];
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Korisnici</h2>
      <button class="btn btn-primary btn-sm" (click)="openDialog()">
        <span class="material-icons text-sm">person_add</span> Novi korisnik
      </button>
    </div>

    <select class="select w-48 mb-4" [(ngModel)]="roleFilter" (ngModelChange)="load()">
      <option value="">Sve uloge</option>
      <option value="admin">Admin</option>
      <option value="recepcija">Recepcija</option>
      <option value="lekar">Lekar</option>
      <option value="menadzer">Menadžer</option>
      <option value="pacijent">Pacijent</option>
    </select>
    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else {    <div class="card bg-base-100 shadow-sm overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Ime i prezime</th>
            <th>Korisničko ime</th>
            <th>Email</th>
            <th>Uloge</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td>{{ u.ime }} {{ u.prezime }}</td>
              <td>{{ u.userName }}</td>
              <td>{{ u.email || '—' }}</td>
              <td>
                @for (r of u.roles; track r) {
                  <span class="badge badge-info badge-sm mr-1">{{ r }}</span>
                }
              </td>
              <td>
                <span class="badge" [class]="u.aktivan ? 'badge-success' : 'badge-error'">
                  {{ u.aktivan ? 'Aktivan' : 'Neaktivan' }}
                </span>
              </td>
              <td>
                <div class="flex gap-1">
                  <div class="tooltip" data-tip="Izmeni">
                    <button class="btn btn-ghost btn-xs btn-square" (click)="openDialog(u)">
                      <span class="material-icons text-sm">edit</span>
                    </button>
                  </div>
                  <div class="tooltip" [attr.data-tip]="u.aktivan ? 'Deaktiviraj' : 'Aktiviraj'">
                    <button class="btn btn-ghost btn-xs btn-square" (click)="toggleActive(u)">
                      <span class="material-icons text-sm">{{ u.aktivan ? 'person_off' : 'person' }}</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    }
  `
})
export class UserListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  users = signal<UserItem[]>([]);
  loading = signal(true);
  roleFilter = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const qs = this.roleFilter ? `?role=${this.roleFilter}` : '';
    this.api.get<UserItem[]>(`users${qs}`).subscribe(r => {
      this.users.set(r);
      this.loading.set(false);
    });
  }

  openDialog(user?: UserItem) {
    this.dialogService.open(UserDialogComponent, user ?? null)
      .afterClosed.subscribe(r => { if (r) this.load(); });
  }

  toggleActive(u: UserItem) {
    this.api.patch(`users/${u.id}/deactivate`, {}).subscribe(() => {
      this.toast.success(u.aktivan ? 'Korisnik deaktiviran' : 'Korisnik aktiviran');
      this.load();
    });
  }
}

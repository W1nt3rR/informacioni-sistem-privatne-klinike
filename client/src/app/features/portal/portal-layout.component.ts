import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ChangePasswordDialogComponent } from '../../core/auth/change-password-dialog.component';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-primary text-primary-content">
        <div class="flex-none">
          <span class="material-icons mr-2">local_hospital</span>
          <span class="font-semibold text-lg">Portal pacijenta</span>
        </div>

        <nav class="ml-8 flex gap-1">
          <a routerLink="/portal/appointments" routerLinkActive="bg-primary-focus"
             class="btn btn-ghost btn-sm">
            <span class="material-icons text-sm">calendar_today</span> Termini
          </a>
          <a routerLink="/portal/reports" routerLinkActive="bg-primary-focus"
             class="btn btn-ghost btn-sm">
            <span class="material-icons text-sm">description</span> Nalazi
          </a>
          <a routerLink="/portal/messages" routerLinkActive="bg-primary-focus"
             class="btn btn-ghost btn-sm">
            <span class="material-icons text-sm">mail</span> Poruke
          </a>
          <a routerLink="/portal/invoices" routerLinkActive="bg-primary-focus"
             class="btn btn-ghost btn-sm">
            <span class="material-icons text-sm">receipt_long</span> Računi
          </a>
        </nav>

        <div class="flex-1"></div>

        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <span class="material-icons">account_circle</span>
          </div>
          <ul tabindex="0" class="dropdown-content menu bg-base-100 text-base-content rounded-box z-10 w-56 p-2 shadow">
            <li class="disabled"><a class="text-base-content/60">
              <span class="material-icons text-sm">person</span>
              {{ user()?.ime }} {{ user()?.prezime }}
            </a></li>
            <li><a (click)="openChangePassword()">
              <span class="material-icons text-sm">lock_reset</span>
              Promeni lozinku
            </a></li>
            <li><a (click)="logout()">
              <span class="material-icons text-sm">logout</span>
              Odjavi se
            </a></li>
          </ul>
        </div>
      </div>

      <main class="max-w-5xl mx-auto p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PortalLayoutComponent {
  private authService = inject(AuthService);
  private dialog = inject(DialogService);
  user = this.authService.user;

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent);
  }

  logout(): void {
    this.authService.logout();
  }
}

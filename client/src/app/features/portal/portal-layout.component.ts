import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
  ],
  template: `
    <div class="min-h-screen bg-slate-50">
      <mat-toolbar color="primary" class="!bg-blue-700">
        <mat-icon class="mr-2">local_hospital</mat-icon>
        <span class="font-semibold">Portal pacijenta</span>

        <nav class="ml-8 flex gap-1">
          <a mat-button routerLink="/portal/appointments" routerLinkActive="!bg-blue-800"
             class="!text-white">
            <mat-icon>calendar_today</mat-icon> Termini
          </a>
          <a mat-button routerLink="/portal/reports" routerLinkActive="!bg-blue-800"
             class="!text-white">
            <mat-icon>description</mat-icon> Nalazi
          </a>
          <a mat-button routerLink="/portal/messages" routerLinkActive="!bg-blue-800"
             class="!text-white">
            <mat-icon>mail</mat-icon> Poruke
          </a>
        </nav>

        <span class="flex-1"></span>

        <button mat-icon-button [matMenuTriggerFor]="menu" class="!text-white">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item disabled>
            <mat-icon>person</mat-icon>
            <span>{{ user()?.ime }} {{ user()?.prezime }}</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Odjavi se</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <main class="max-w-5xl mx-auto p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PortalLayoutComponent {
  private authService = inject(AuthService);
  user = this.authService.user;

  logout(): void {
    this.authService.logout();
  }
}

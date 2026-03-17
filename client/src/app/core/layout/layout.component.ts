import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ThemeService } from '../../shared/services/theme.service';
import { SettingsDialogComponent } from '../../shared/components/settings-dialog.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  themeService = inject(ThemeService);

  sidenavOpened = signal(true);
  user = this.authService.user;
  pendingCount = signal(0);

  navGroups: NavGroup[] = [
    {
      title: 'Početna',
      items: [
        { label: 'Kontrolna tabla', icon: 'dashboard', route: '/dashboard' },
      ],
    },
    {
      title: 'Zakazivanje',
      items: [
        { label: 'Termini', icon: 'calendar_today', route: '/appointments' },
        { label: 'Lista čekanja', icon: 'hourglass_empty', route: '/waiting-list' },
      ],
    },
    {
      title: 'Pacijenti',
      items: [
        { label: 'Pacijenti', icon: 'people', route: '/patients' },
      ],
    },
    {
      title: 'Pregledi',
      items: [
        { label: 'Pregledi', icon: 'medical_services', route: '/examinations' },
      ],
    },
    {
      title: 'Finansije',
      items: [
        { label: 'Računi', icon: 'receipt_long', route: '/invoices' },
        { label: 'Popusti', icon: 'discount', route: '/discounts' },
      ],
    },
    {
      title: 'Izveštaji',
      items: [
        { label: 'Izveštaji', icon: 'bar_chart', route: '/reports' },
      ],
    },
    {
      title: 'Administracija',
      items: [
        { label: 'Osoblje', icon: 'badge', route: '/staff' },
        { label: 'Usluge', icon: 'inventory', route: '/services' },
        { label: 'Specijalizacije', icon: 'school', route: '/specializations' },
        { label: 'Ordinacije', icon: 'meeting_room', route: '/offices' },
        { label: 'Dijagnoze', icon: 'biotech', route: '/diagnoses' },
        { label: 'Radno vreme', icon: 'schedule', route: '/working-hours' },
        { label: 'Neradni dani', icon: 'event_busy', route: '/non-working-days' },
      ],
    },
    {
      title: 'Sistem',
      items: [
        { label: 'Korisnici', icon: 'manage_accounts', route: '/users' },
        { label: 'Obaveštenja', icon: 'notifications', route: '/notifications' },
        { label: 'Evidencija aktivnosti', icon: 'history', route: '/activity-log' },
      ],
    },
  ];

  ngOnInit() {
    this.loadPendingCount();
  }

  loadPendingCount() {
    this.api.get<any[]>('notifications?status=ceka').subscribe(r => this.pendingCount.set(r.length));
  }

  toggleSidenav(): void {
    this.sidenavOpened.update(v => !v);
  }

  toggleMode(): void {
    this.themeService.toggleMode();
  }

  openSettings(): void {
    this.dialog.open(SettingsDialogComponent);
  }

  logout(): void {
    this.authService.logout();
  }
}

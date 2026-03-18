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
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  sidenavOpened = signal(true);
  user = this.authService.user;
  pendingCount = signal(0);

  navGroups: NavGroup[] = [
    {
      title: 'Početna',
      items: [
        { label: 'Kontrolna tabla', icon: 'dashboard', route: '/dashboard', roles: ['admin', 'recepcija', 'lekar', 'menadzer'] },
      ],
    },
    {
      title: 'Zakazivanje',
      items: [
        { label: 'Termini', icon: 'calendar_today', route: '/appointments', roles: ['admin', 'recepcija', 'lekar'] },
        { label: 'Lista čekanja', icon: 'hourglass_empty', route: '/waiting-list', roles: ['admin', 'recepcija'] },
      ],
    },
    {
      title: 'Pacijenti',
      items: [
        { label: 'Pacijenti', icon: 'people', route: '/patients', roles: ['admin', 'recepcija', 'lekar'] },
      ],
    },
    {
      title: 'Pregledi',
      items: [
        { label: 'Pregledi', icon: 'medical_services', route: '/examinations', roles: ['admin', 'recepcija', 'lekar'] },
      ],
    },
    {
      title: 'Finansije',
      items: [
        { label: 'Računi', icon: 'receipt_long', route: '/invoices', roles: ['admin', 'recepcija', 'menadzer'] },
        { label: 'Popusti', icon: 'discount', route: '/discounts', roles: ['admin', 'menadzer'] },
      ],
    },
    {
      title: 'Izveštaji',
      items: [
        { label: 'Izveštaji', icon: 'bar_chart', route: '/reports', roles: ['admin', 'menadzer'] },
      ],
    },
    {
      title: 'Administracija',
      items: [
        { label: 'Osoblje', icon: 'badge', route: '/staff', roles: ['admin'] },
        { label: 'Usluge', icon: 'inventory', route: '/services', roles: ['admin'] },
        { label: 'Specijalizacije', icon: 'school', route: '/specializations', roles: ['admin'] },
        { label: 'Ordinacije', icon: 'meeting_room', route: '/offices', roles: ['admin'] },
        { label: 'Dijagnoze', icon: 'biotech', route: '/diagnoses', roles: ['admin', 'lekar'] },
        { label: 'Radno vreme', icon: 'schedule', route: '/working-hours', roles: ['admin'] },
        { label: 'Neradni dani', icon: 'event_busy', route: '/non-working-days', roles: ['admin'] },
      ],
    },
    {
      title: 'Sistem',
      items: [
        { label: 'Korisnici', icon: 'manage_accounts', route: '/users', roles: ['admin'] },
        { label: 'Obaveštenja', icon: 'notifications', route: '/notifications', roles: ['admin', 'recepcija'] },
        { label: 'Evidencija aktivnosti', icon: 'history', route: '/activity-log', roles: ['admin'] },
      ],
    },
  ];

  ngOnInit() {
    this.loadPendingCount();
  }

  visibleItems(group: NavGroup): NavItem[] {
    return group.items.filter(item => !item.roles || this.authService.hasAnyRole(item.roles));
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

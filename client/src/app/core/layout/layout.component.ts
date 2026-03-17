import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

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
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  sidenavOpened = signal(true);

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
        { label: 'Ordinacije', icon: 'meeting_room', route: '/offices' },
        { label: 'Dijagnoze', icon: 'biotech', route: '/diagnoses' },
        { label: 'Radno vreme', icon: 'schedule', route: '/working-hours' },
        { label: 'Neradni dani', icon: 'event_busy', route: '/non-working-days' },
      ],
    },
    {
      title: 'Sistem',
      items: [
        { label: 'Obaveštenja', icon: 'notifications', route: '/notifications' },
        { label: 'Evidencija aktivnosti', icon: 'history', route: '/activity-log' },
      ],
    },
  ];

  toggleSidenav(): void {
    this.sidenavOpened.update(v => !v);
  }

  logout(): void {
    // Will be implemented in Commit 5 (Auth Flow)
  }
}

import { Routes } from '@angular/router';
import { PortalLayoutComponent } from './portal-layout.component';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    component: PortalLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./portal-dashboard.component').then(m => m.PortalDashboardComponent),
      },
      {
        path: 'appointments',
        loadComponent: () => import('./my-appointments.component').then(m => m.MyAppointmentsComponent),
      },
      {
        path: 'request-appointment',
        loadComponent: () => import('./request-appointment.component').then(m => m.RequestAppointmentComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./my-reports.component').then(m => m.MyReportsComponent),
      },
      {
        path: 'messages',
        loadComponent: () => import('./portal-messages.component').then(m => m.PortalMessagesComponent),
      },
      {
        path: 'invoices',
        loadComponent: () => import('./my-invoices.component').then(m => m.MyInvoicesComponent),
      },
    ],
  },
];

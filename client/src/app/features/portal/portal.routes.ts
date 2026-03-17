import { Routes } from '@angular/router';
import { PortalLayoutComponent } from './portal-layout.component';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    component: PortalLayoutComponent,
    children: [
      { path: '', redirectTo: 'appointments', pathMatch: 'full' },
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
    ],
  },
];

import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'appointments',
        loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENT_ROUTES),
      },
      {
        path: 'waiting-list',
        loadChildren: () => import('./features/waiting-list/waiting-list.routes').then(m => m.WAITING_LIST_ROUTES),
      },
      {
        path: 'patients',
        loadChildren: () => import('./features/patients/patients.routes').then(m => m.PATIENT_ROUTES),
      },
      {
        path: 'examinations',
        loadChildren: () => import('./features/examinations/examinations.routes').then(m => m.EXAMINATION_ROUTES),
      },
      {
        path: 'invoices',
        loadChildren: () => import('./features/invoices/invoices.routes').then(m => m.INVOICE_ROUTES),
      },
      {
        path: 'discounts',
        loadChildren: () => import('./features/discounts/discounts.routes').then(m => m.DISCOUNT_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORT_ROUTES),
      },
      {
        path: 'staff',
        loadChildren: () => import('./features/staff/staff.routes').then(m => m.STAFF_ROUTES),
      },
      {
        path: 'services',
        loadChildren: () => import('./features/services/services.routes').then(m => m.SERVICE_ROUTES),
      },
      {
        path: 'offices',
        loadChildren: () => import('./features/offices/offices.routes').then(m => m.OFFICE_ROUTES),
      },
      {
        path: 'diagnoses',
        loadChildren: () => import('./features/diagnoses/diagnoses.routes').then(m => m.DIAGNOSIS_ROUTES),
      },
      {
        path: 'working-hours',
        loadChildren: () => import('./features/working-hours/working-hours.routes').then(m => m.WORKING_HOURS_ROUTES),
      },
      {
        path: 'non-working-days',
        loadChildren: () => import('./features/non-working-days/non-working-days.routes').then(m => m.NON_WORKING_DAYS_ROUTES),
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.NOTIFICATION_ROUTES),
      },
      {
        path: 'activity-log',
        loadChildren: () => import('./features/activity-log/activity-log.routes').then(m => m.ACTIVITY_LOG_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

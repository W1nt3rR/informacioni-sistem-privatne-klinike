import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { authGuard, portalGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/portal/portal-register.component').then(m => m.PortalRegisterComponent),
  },
  {
    path: 'portal',
    canActivate: [portalGuard],
    loadChildren: () => import('./features/portal/portal.routes').then(m => m.PORTAL_ROUTES),
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
        canActivate: [roleGuard('admin', 'recepcija', 'lekar')],
        loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENT_ROUTES),
      },
      {
        path: 'waiting-list',
        canActivate: [roleGuard('admin', 'recepcija')],
        loadChildren: () => import('./features/waiting-list/waiting-list.routes').then(m => m.WAITING_LIST_ROUTES),
      },
      {
        path: 'patients',
        canActivate: [roleGuard('admin', 'recepcija', 'lekar')],
        loadChildren: () => import('./features/patients/patients.routes').then(m => m.PATIENT_ROUTES),
      },
      {
        path: 'examinations',
        canActivate: [roleGuard('admin', 'recepcija', 'lekar')],
        loadChildren: () => import('./features/examinations/examinations.routes').then(m => m.EXAMINATION_ROUTES),
      },
      {
        path: 'invoices',
        canActivate: [roleGuard('admin', 'recepcija', 'menadzer')],
        loadChildren: () => import('./features/invoices/invoices.routes').then(m => m.INVOICE_ROUTES),
      },
      {
        path: 'discounts',
        canActivate: [roleGuard('admin', 'menadzer')],
        loadChildren: () => import('./features/discounts/discounts.routes').then(m => m.DISCOUNT_ROUTES),
      },
      {
        path: 'reports',
        canActivate: [roleGuard('admin', 'menadzer')],
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORT_ROUTES),
      },
      {
        path: 'staff',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/staff/staff.routes').then(m => m.STAFF_ROUTES),
      },
      {
        path: 'services',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/services/services.routes').then(m => m.SERVICE_ROUTES),
      },
      {
        path: 'offices',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/offices/offices.routes').then(m => m.OFFICE_ROUTES),
      },
      {
        path: 'diagnoses',
        canActivate: [roleGuard('admin', 'lekar')],
        loadChildren: () => import('./features/diagnoses/diagnoses.routes').then(m => m.DIAGNOSIS_ROUTES),
      },
      {
        path: 'specializations',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/specializations/specializations.routes').then(m => m.SPECIALIZATION_ROUTES),
      },
      {
        path: 'working-hours',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/working-hours/working-hours.routes').then(m => m.WORKING_HOURS_ROUTES),
      },
      {
        path: 'non-working-days',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/non-working-days/non-working-days.routes').then(m => m.NON_WORKING_DAYS_ROUTES),
      },
      {
        path: 'notifications',
        canActivate: [roleGuard('admin', 'recepcija')],
        loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.NOTIFICATION_ROUTES),
      },
      {
        path: 'activity-log',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/activity-log/activity-log.routes').then(m => m.ACTIVITY_LOG_ROUTES),
      },
      {
        path: 'users',
        canActivate: [roleGuard('admin')],
        loadChildren: () => import('./features/users/users.routes').then(m => m.USER_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

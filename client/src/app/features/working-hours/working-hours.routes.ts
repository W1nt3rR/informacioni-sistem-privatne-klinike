import { Routes } from '@angular/router';

export const WORKING_HOURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./working-hours.component').then((m) => m.WorkingHoursComponent),
  },
];

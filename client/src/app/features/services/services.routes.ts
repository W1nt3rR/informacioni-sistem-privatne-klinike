import { Routes } from '@angular/router';
import { ServiceListComponent } from './service-list.component';

export const SERVICE_ROUTES: Routes = [
  { path: '', component: ServiceListComponent, data: { title: 'Usluge' } },
];

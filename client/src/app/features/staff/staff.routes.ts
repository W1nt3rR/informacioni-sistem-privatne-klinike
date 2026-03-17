import { Routes } from '@angular/router';
import { DoctorListComponent } from './doctor-list.component';
import { DoctorDetailComponent } from './doctor-detail.component';

export const STAFF_ROUTES: Routes = [
  { path: '', component: DoctorListComponent, data: { title: 'Lekari' } },
  { path: ':id', component: DoctorDetailComponent, data: { title: 'Detalji lekara' } },
];

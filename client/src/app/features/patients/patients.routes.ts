import { Routes } from '@angular/router';
import { PatientListComponent } from './patient-list.component';
import { PatientDetailComponent } from './patient-detail.component';

export const PATIENT_ROUTES: Routes = [
  { path: '', component: PatientListComponent, data: { title: 'Pacijenti' } },
  { path: ':id', component: PatientDetailComponent, data: { title: 'Detalji pacijenta' } },
];

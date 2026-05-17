/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { PassengerComponent } from './components/passenger/passenger.component';
import { AtcComponent } from './components/atc/atc.component';

export const routes: Routes = [
  { path: '',          redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',     component: LoginComponent },
  { path: 'passenger', component: PassengerComponent },
  { path: 'atc',       component: AtcComponent },
  { path: '**',        redirectTo: 'login' }
];

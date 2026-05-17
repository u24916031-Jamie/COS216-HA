/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 */

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import {
  LUCIDE_ICONS, LucideIconProvider,
  Plane, LogOut, Send, Radio, Map,
  CircleX, TriangleAlert, CircleCheck,
  Clock, X, PlaneTakeoff
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Plane, LogOut, Send, Radio, Map,
        CircleX, TriangleAlert, CircleCheck,
        Clock, X, PlaneTakeoff
      })
    }
  ]
};

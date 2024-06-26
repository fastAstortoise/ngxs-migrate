import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideStore} from '@ngxs/store';

import {routes} from './app.routes';
import {AnimalsState} from "./store/animal.state";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideStore([AnimalsState])
  ]
};

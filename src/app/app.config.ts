import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import {MessageService} from 'primeng/api';
import {provideHttpClient} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(), // Provide HttpClient here
    MessageService,
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
};

//
// const appConfig: ApplicationConfig = {
//   providers: [
//     provideRouter(routes),
//     // ... other providers, such as:
//     // provideAnimations(),
//     // provideStore(...),
//     // importProvidersFrom(SomeModule.forRoot()), // If you have modules with forRoot()
//   ],
// };

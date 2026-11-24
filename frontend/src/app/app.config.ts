import { provideHttpClient, withFetch } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { API_CONFIG } from './services/api.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // This portfolio has no deferred hydration boundaries. Standard hydration
    // preserves static HTML without adding inline event-replay bootstrap scripts.
    provideClientHydration(withNoIncrementalHydration()),
    provideHttpClient(withFetch()),
    // Routes own /PortfolioWebApp. Keep the router base at the origin while
    // the HTML base href resolves production assets inside the Pages subpath.
    { provide: APP_BASE_HREF, useValue: '/' },
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    { provide: API_CONFIG, useValue: environment.api },
  ],
};

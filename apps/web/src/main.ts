import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/routes';
import { authInterceptor } from './app/auth';
import { config } from './app/config';
fetch('config.json')
  .then((r) => {
    if (!r.ok) throw new Error('Configuration unavailable');
    return r.json();
  })
  .then((value) => {
    Object.assign(config, value);
    return bootstrapApplication(App, {
      providers: [
        provideRouter(routes, withHashLocation()),
        provideHttpClient(withInterceptors([authInterceptor])),
      ],
    });
  })
  .catch((error) => {
    console.error(error);
    document.body.textContent =
      'Nie udało się uruchomić aplikacji. Odśwież stronę.';
  });

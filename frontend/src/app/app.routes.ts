import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { PortfolioContentService } from './services/portfolio-content.service';

const projectExists: CanActivateFn = (route) => {
  const found = inject(PortfolioContentService).project(route.paramMap.get('slug') ?? '');
  return found ? true : inject(Router).createUrlTree(['/PortfolioWebApp']);
};

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'PortfolioWebApp' },
  {
    path: 'PortfolioWebApp',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/portfolio/portfolio-page.component').then(
        (module) => module.PortfolioPageComponent,
      ),
  },
  {
    path: 'PortfolioWebApp/projects/:slug',
    canActivate: [projectExists],
    loadComponent: () =>
      import('./pages/project/project-page.component').then(
        (module) => module.ProjectPageComponent,
      ),
  },
  { path: '**', redirectTo: 'PortfolioWebApp' },
];

import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import portfolio from '../../../content/portfolio.json';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Client },
  { path: 'PortfolioWebApp', renderMode: RenderMode.Prerender },
  {
    path: 'PortfolioWebApp/projects/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: async () => portfolio.projects.map(({ slug }) => ({ slug })),
  },
  { path: '**', renderMode: RenderMode.Client },
];

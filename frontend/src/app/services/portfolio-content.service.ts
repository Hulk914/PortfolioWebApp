import { computed, Injectable, signal } from '@angular/core';
import portfolio from '../../../../content/portfolio.json';
import { Portfolio } from '../models/portfolio.model';

@Injectable({ providedIn: 'root' })
export class PortfolioContentService {
  private readonly state = signal(portfolio as Portfolio);
  readonly content = this.state.asReadonly();
  readonly companies = computed(() => [
    ...new Set(this.content().experience.map((role) => role.company)),
  ]);

  project(slug: string): ProjectResult {
    return this.content().projects.find((project) => project.slug === slug);
  }
}

type ProjectResult = Portfolio['projects'][number] | undefined;

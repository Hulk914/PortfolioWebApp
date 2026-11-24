import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Project } from '../models/portfolio.model';
import { PortfolioContentService } from './portfolio-content.service';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly content = inject(PortfolioContentService);

  home() {
    const { profile } = this.content.content();
    this.title.setTitle(`${profile.name} | ${profile.headline}`);
    this.meta.updateTag({ name: 'description', content: profile.seoDescription });
  }

  project(project: Project) {
    this.title.setTitle(`${project.title} | ${this.content.content().profile.name}`);
    this.meta.updateTag({ name: 'description', content: project.summary });
  }
}

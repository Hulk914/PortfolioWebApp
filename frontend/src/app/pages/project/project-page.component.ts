import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';
import { PortfolioContentService } from '../../services/portfolio-content.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-project-page',
  standalone: true,
  imports: [RouterLink, ProjectCardComponent],
  template: `
    <main id="main" tabindex="-1" class="shell project-page section-space">
      <a class="text-link project-back" routerLink="/PortfolioWebApp" fragment="projects"
        >Back to projects</a
      >
      @if (project(); as selected) {
        <h1 class="project-page-title">{{ selected.title }}</h1>
        <article appProjectCard [project]="selected" [expanded]="true"></article>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly content = inject(PortfolioContentService);
  private readonly seo = inject(SeoService);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly project = computed(() => this.content.project(this.params().get('slug') ?? ''));

  constructor() {
    effect(() => {
      const project = this.project();
      if (project) this.seo.project(project);
    });
  }
}

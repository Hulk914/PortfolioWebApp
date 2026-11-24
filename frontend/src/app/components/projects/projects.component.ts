import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project, ProjectGroup, SectionHeading } from '../../models/portfolio.model';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, ProjectCardComponent, SectionHeadingComponent, RevealDirective],
  template: `
    <section
      class="projects-section shell section-space"
      id="projects"
      aria-labelledby="projects-title"
    >
      <app-section-heading [heading]="heading()" titleId="projects-title" />
      <p class="project-disclosure-hint"
        >A quick overview first. Select <span>View details</span> to explore the implementation.</p
      >
      <nav class="project-group-nav" aria-label="Project categories">
        @for (group of grouped(); track group.id) {
          <a routerLink="/PortfolioWebApp" [fragment]="group.id"
            >{{ group.label }} <span>{{ group.projects.length }}</span></a
          >
        }
      </nav>
      @for (group of grouped(); track group.id) {
        <section class="project-group" [id]="group.id" [attr.aria-labelledby]="group.id + '-title'">
          <div class="project-group-heading"
            ><h3 [id]="group.id + '-title'">{{ group.label }}</h3
            ><p>{{ group.description }}</p></div
          >
          @for (project of group.projects; track project.id) {
            <article appProjectCard appReveal class="reveal" [project]="project"></article>
          }
        </section>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  readonly projects = input.required<Project[]>();
  readonly groups = input.required<ProjectGroup[]>();
  readonly heading = input.required<SectionHeading>();
  readonly grouped = computed(() =>
    this.groups().map((group) => ({
      ...group,
      projects: this.projects().filter((project) => project.groupId === group.id),
    })),
  );
}

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Project, ProjectGroup, SectionHeading } from '../../models/portfolio.model';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ProjectCardComponent, SectionHeadingComponent, RevealDirective],
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
      <div class="project-group-nav" role="group" aria-label="Filter projects by category">
        <button
          type="button"
          [attr.aria-pressed]="selectedGroup() === null"
          aria-controls="project-results"
          (click)="selectedGroup.set(null)"
          >All <span>{{ projects().length }}</span></button
        >
        @for (group of grouped(); track group.id) {
          <button
            type="button"
            [attr.aria-pressed]="selectedGroup() === group.id"
            aria-controls="project-results"
            (click)="selectedGroup.set(group.id)"
            >{{ group.label }} <span>{{ group.projects.length }}</span></button
          >
        }
      </div>
      <p class="project-filter-status" role="status" aria-live="polite" aria-atomic="true">
        Showing {{ visibleCount() }} of {{ projects().length }} projects
      </p>
      <div id="project-results">
        @for (group of visibleGroups(); track group.id) {
          <section
            class="project-group"
            [id]="group.id"
            [attr.aria-labelledby]="group.id + '-title'"
          >
            <div class="project-group-heading"
              ><h3 [id]="group.id + '-title'">{{ group.label }}</h3
              ><p>{{ group.description }}</p></div
            >
            @for (project of group.projects; track project.id) {
              <article appProjectCard appReveal class="reveal" [project]="project"></article>
            }
          </section>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  readonly projects = input.required<Project[]>();
  readonly groups = input.required<ProjectGroup[]>();
  readonly heading = input.required<SectionHeading>();
  readonly selectedGroup = signal<string | null>(null);
  readonly grouped = computed(() =>
    this.groups().map((group) => ({
      ...group,
      projects: this.projects().filter((project) => project.groupId === group.id),
    })),
  );
  readonly visibleGroups = computed(() =>
    this.grouped().filter(
      (group) => this.selectedGroup() === null || group.id === this.selectedGroup(),
    ),
  );
  readonly visibleCount = computed(() =>
    this.visibleGroups().reduce((count, group) => count + group.projects.length, 0),
  );
}

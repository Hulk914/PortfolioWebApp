import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/portfolio.model';
import { ContentBlocksComponent } from '../content-blocks/content-blocks.component';
import { ContentLinkComponent } from '../content-link/content-link.component';

@Component({
  selector: 'article[appProjectCard]',
  standalone: true,
  imports: [RouterLink, ContentBlocksComponent, ContentLinkComponent],
  host: {
    class: 'project-entry',
    '[attr.id]': 'project().id',
    '[attr.aria-labelledby]': 'project().titleId',
  },
  template: `
    <div class="project-overview"
      ><div class="project-intro">
        <p class="eyebrow project-eyebrow">
          @if (project().statusDot) {
            <span class="status-dot" aria-hidden="true"></span>
          }
          {{ project().eyebrow }} <span class="project-date">/ {{ project().kind }}</span></p
        >
        <h4 [id]="project().titleId"
          ><a [routerLink]="['/PortfolioWebApp/projects', project().slug]"
            >{{ project().title }}
            @if (project().stack) {
              <span class="project-stack">{{ project().stack }}</span>
            }
          </a></h4
        >
        @if (project().subtitle) {
          <p class="project-subtitle">{{ project().subtitle }}</p>
        }
        <p class="project-preview">{{ project().summary }}</p> </div
      ><div class="project-overview-meta">
        <ul class="card-tags" aria-label="Project technologies">
          @for (technology of project().technologies; track technology) {
            <li>{{ technology }}</li>
          }
        </ul>
        <div class="project-links">
          @for (link of project().links; track link.url) {
            <app-content-link [link]="link" />
          }
        </div> </div
    ></div>
    <details class="project-details" [open]="expanded()">
      <summary class="project-toggle" [attr.aria-describedby]="project().titleId"
        ><span class="details-closed-label">View details</span
        ><span class="details-open-label">Hide details</span
        ><span class="project-toggle-icon" aria-hidden="true"></span
      ></summary>
      <div appContentBlocks [class]="project().detailClass" [blocks]="project().details"></div>
    </details>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly expanded = input(false);
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Experience, SectionHeading } from '../../models/portfolio.model';
import { ContentBlocksComponent } from '../content-blocks/content-blocks.component';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'article[appExperienceCard]',
  standalone: true,
  imports: [DatePipe, ContentBlocksComponent],
  template: `
    <div class="note-target" aria-hidden="true"></div
    ><div class="content">
      <div class="card-meta"
        ><span class="company-name">{{ experience().company }}</span
        ><span class="role-index" aria-hidden="true">{{
          (index() + 1).toString().padStart(2, '0')
        }}</span></div
      >
      <h3>{{ experience().role }}</h3>
      <span class="date"
        ><time [attr.datetime]="experience().startDate">{{
          experience().startDate | date: 'MMM y' : 'UTC'
        }}</time>
        —
        @if (experience().endDate) {
          <time [attr.datetime]="experience().endDate">{{
            experience().endDate | date: 'MMM y' : 'UTC'
          }}</time>
        } @else {
          Present
        }
      </span>
      @for (paragraph of experience().description; track $index) {
        <p appContentBlocks [class]="paragraph.className" [blocks]="paragraph.children ?? []"></p>
      }
      <ul class="card-tags" aria-label="Technologies and focus areas">
        @for (technology of experience().technologies; track technology) {
          <li>{{ technology }}</li>
        }
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceCardComponent {
  readonly experience = input.required<Experience>();
  readonly index = input.required<number>();
}

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [SectionHeadingComponent, ExperienceCardComponent, RevealDirective],
  template: `
    <section
      class="experience-section shell section-space"
      id="experience"
      aria-labelledby="experience-title"
    >
      <app-section-heading [heading]="heading()" titleId="experience-title" />
      <div class="track-container"
        ><div class="timeline">
          <div class="guitar-neck" aria-hidden="true">
            @for (string of strings; track string) {
              <div class="string"></div>
            }
          </div>
          @for (role of roles(); track role.id; let index = $index) {
            <article
              appExperienceCard
              appReveal
              class="timeline-item reveal"
              [class.left]="index % 2 === 0"
              [class.right]="index % 2 !== 0"
              [experience]="role"
              [index]="index"
            ></article>
          }</div
      ></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  readonly roles = input.required<Experience[]>();
  readonly heading = input.required<SectionHeading>();
  readonly strings = [0, 1, 2, 3, 4, 5];
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Education, Portfolio, SectionHeading } from '../../models/portfolio.model';
import { ContentBlocksComponent } from '../content-blocks/content-blocks.component';
import { ContentLinkComponent } from '../content-link/content-link.component';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';
import { IconComponent } from '../icon/icon.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-beyond',
  standalone: true,
  imports: [
    ContentBlocksComponent,
    ContentLinkComponent,
    SectionHeadingComponent,
    IconComponent,
    RevealDirective,
  ],
  template: `
    <section class="beyond-section shell section-space" id="beyond" aria-labelledby="beyond-title">
      <app-section-heading [heading]="heading()" titleId="beyond-title" />
      <div class="personal-grid">
        <article class="music-card reveal" appReveal>
          <div class="music-wave" aria-hidden="true">
            @for (bar of bars; track bar) {
              <span></span>
            }
          </div>
          <p class="eyebrow">{{ information().eyebrow }}</p
          ><h3 appContentBlocks [blocks]="information().title"></h3>
          @for (paragraph of information().description; track $index) {
            <p appContentBlocks [blocks]="paragraph.children ?? []"></p>
          }
          <div class="personal-links">
            @for (link of information().links; track link.url) {
              <app-content-link [link]="link" />
            }
          </div>
        </article>
        @for (item of education(); track item.id) {
          <article class="education-card reveal" appReveal>
            <p class="eyebrow">The foundation</p><app-icon name="education" />
            <h3>{{ item.degree }}<br />{{ item.field }}</h3
            ><p>{{ item.institution }} · Class of {{ item.graduationYear }}</p>
            <div class="education-score"
              ><strong
                >{{ item.grade }}<span>/ {{ item.gradeScale }}</span></strong
              ><span>CGPA</span></div
            >
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeyondComponent {
  readonly heading = input.required<SectionHeading>();
  readonly information = input.required<Portfolio['additionalInformation']>();
  readonly education = input.required<Education[]>();
  readonly bars = [0, 1, 2, 3, 4, 5, 6, 7, 8];
}

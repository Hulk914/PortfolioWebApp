import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionHeading } from '../../models/portfolio.model';
import { ContentBlocksComponent } from '../content-blocks/content-blocks.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-section-heading',
  standalone: true,
  imports: [ContentBlocksComponent, RevealDirective],
  template: `
    <div class="section-heading reveal" appReveal>
      <div
        ><p class="eyebrow"
          ><span class="section-number">{{ heading().number }}</span> {{ heading().eyebrow }}</p
        >
        <h2 appContentBlocks [id]="titleId()" [blocks]="heading().title"></h2>
      </div>
      <p><app-content-blocks [blocks]="heading().description" /></p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeadingComponent {
  readonly heading = input.required<SectionHeading>();
  readonly titleId = input.required<string>();
}

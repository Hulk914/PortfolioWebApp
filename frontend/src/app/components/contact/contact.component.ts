import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Portfolio } from '../../models/portfolio.model';
import { ContentBlocksComponent } from '../content-blocks/content-blocks.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ContentBlocksComponent, RevealDirective],
  template: `<section class="contact-section shell reveal" appReveal aria-labelledby="contact-title"
    ><p class="eyebrow">{{ content().eyebrow }}</p
    ><h2 appContentBlocks id="contact-title" [blocks]="content().title"></h2
    ><a class="contact-link" [href]="'mailto:' + email()"
      >{{ email() }} <span aria-hidden="true">↗</span></a
    ></section
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  readonly content = input.required<Portfolio['presentation']['contact']>();
  readonly email = input.required<string>();
}

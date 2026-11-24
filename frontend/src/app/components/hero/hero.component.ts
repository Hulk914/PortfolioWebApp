import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Portfolio, Profile } from '../../models/portfolio.model';
import { ContentBlocksComponent } from '../content-blocks/content-blocks.component';
import { ContentLinkComponent } from '../content-link/content-link.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, ContentBlocksComponent, ContentLinkComponent, IconComponent],
  templateUrl: './hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  readonly profile = input.required<Profile>();
  readonly companies = input.required<string[]>();
  readonly presentation = input.required<Portfolio['presentation']>();
}

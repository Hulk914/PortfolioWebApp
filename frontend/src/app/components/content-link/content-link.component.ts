import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContentLink } from '../../models/portfolio.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-content-link',
  standalone: true,
  imports: [IconComponent],
  template: `
    <a
      [href]="link().url"
      [class]="linkClass()"
      [attr.id]="link().id"
      [attr.target]="link().external ? '_blank' : null"
      [attr.rel]="link().external ? 'noopener noreferrer' : null"
      [attr.aria-describedby]="link().external ? 'new-tab-hint' : null"
      [attr.download]="link().download"
    >
      @if (link().icon; as icon) {
        <app-icon [name]="icon" />
      }
      {{ link().label }}
      @if (link().external || link().download) {
        <span class="external-arrow" aria-hidden="true">{{ link().download ? '↓' : '↗' }}</span>
      }
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentLinkComponent {
  readonly link = input.required<ContentLink>();
  readonly linkClass = input('text-link');
}

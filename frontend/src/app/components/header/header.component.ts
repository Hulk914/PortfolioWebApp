import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profile, Portfolio } from '../../models/portfolio.model';
import { NavigationService } from '../../services/navigation.service';
import { AssistantSessionService } from '../../services/assistant-session.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <header class="site-header">
      <nav class="nav shell" aria-label="Main navigation">
        <a
          class="brand"
          routerLink="/PortfolioWebApp"
          fragment="top"
          [attr.aria-label]="initials() + '. ' + profile().name + ', home'"
        >
          <span class="brand-mark" aria-hidden="true">{{ initials() }}<span>.</span></span
          ><span class="brand-name">{{ profile().name }}</span>
        </a>
        <div class="nav-links">
          @for (link of links(); track link.id) {
            <a
              routerLink="/PortfolioWebApp"
              [fragment]="link.id"
              [class.is-active]="navigation.activeSection() === link.id"
              [attr.aria-current]="navigation.activeSection() === link.id ? 'location' : null"
              >{{ link.label }}</a
            >
          }
        </div>
        <div class="nav-actions">
          <button
            type="button"
            class="nav-ai"
            aria-haspopup="dialog"
            aria-controls="portfolio-assistant"
            [attr.aria-expanded]="assistant.opened()"
            (click)="assistant.open()"
          >
            <app-icon name="sparkle" />
            <span>{{ assistant.copy.navigationLabel }}</span>
          </button>
          <a class="nav-contact" [href]="'mailto:' + profile().email"
            >Let’s talk <span aria-hidden="true">↗</span></a
          >
        </div>
      </nav>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly profile = input.required<Profile>();
  readonly links = input.required<Portfolio['presentation']['navigation']>();
  readonly initials = computed(() =>
    this.profile()
      .name.split(' ')
      .map((name) => name[0])
      .join('')
      .toLowerCase(),
  );
  readonly navigation = inject(NavigationService);
  readonly assistant = inject(AssistantSessionService);
}

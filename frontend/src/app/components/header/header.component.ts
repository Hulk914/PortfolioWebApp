import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profile, Portfolio } from '../../models/portfolio.model';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
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
        <a class="nav-contact" [href]="'mailto:' + profile().email"
          >Let’s talk <span aria-hidden="true">↗</span></a
        >
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
}

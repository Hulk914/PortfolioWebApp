import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `<footer class="site-footer shell"
    ><p
      >© <span id="current-year">{{ year }}</span> {{ name() }}
      <span class="footer-separator">/</span> {{ caption() }}</p
    ><a routerLink="/PortfolioWebApp" fragment="top"
      >Back to top <span aria-hidden="true">↑</span></a
    ><span id="new-tab-hint" class="visually-hidden">Opens in a new tab</span></footer
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly name = input.required<string>();
  readonly caption = input.required<string>();
  readonly year = new Date().getUTCFullYear();
}

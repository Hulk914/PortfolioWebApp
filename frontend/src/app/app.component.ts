import { DOCUMENT, ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { PortfolioContentService } from './services/portfolio-content.service';
import { RecruiterAssistantComponent } from './components/recruiter-assistant/recruiter-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, RecruiterAssistantComponent],
  template: `
    <a class="skip-link" href="#main" (click)="skipToMain($event)">Skip to content</a>
    <app-header [profile]="content().profile" [links]="content().presentation.navigation" />
    <router-outlet />
    <app-footer [name]="content().profile.name" [caption]="content().presentation.footer" />
    <app-recruiter-assistant />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly content = inject(PortfolioContentService).content;
  private readonly document = inject(DOCUMENT);

  constructor() {
    // Match the original native-anchor clearance below the sticky header.
    inject(ViewportScroller).setOffset([0, 110]);
  }

  skipToMain(event: Event) {
    const main = this.document.getElementById('main');
    if (!main) return;
    event.preventDefault();
    main.focus();
    main.scrollIntoView();
  }
}

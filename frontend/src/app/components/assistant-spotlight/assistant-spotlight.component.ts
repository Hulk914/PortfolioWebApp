import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AssistantSessionService } from '../../services/assistant-session.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-assistant-spotlight',
  standalone: true,
  imports: [IconComponent],
  template: `
    <section class="spotlight" aria-labelledby="assistant-spotlight-title">
      <div class="spotlight-copy">
        <p class="spotlight-eyebrow"
          ><span class="live-dot" aria-hidden="true"></span>{{ session.copy.eyebrow }}</p
        >
        <h2 id="assistant-spotlight-title">{{ session.copy.headline }}</h2>
        <p>{{ session.copy.description }}</p>
        <button
          type="button"
          class="spotlight-cta"
          aria-haspopup="dialog"
          aria-controls="portfolio-assistant"
          (click)="session.open()"
        >
          <app-icon name="sparkle" /> Ask my portfolio <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div class="spotlight-demo">
        <p class="demo-caption">PICK A THREAD. FOLLOW THE EVIDENCE.</p>
        <button type="button" class="demo-question" aria-haspopup="dialog" (click)="start()">
          <span class="demo-avatar" aria-hidden="true">?</span>
          <span>{{ featuredQuestion }}</span>
          <app-icon name="send" />
        </button>
        <ol class="mini-pipeline" aria-label="How an answer is built">
          @for (step of session.copy.pipeline; track step.label; let i = $index) {
            <li
              ><span>{{ '0' + (i + 1) }}</span
              >{{ step.label }}</li
            >
          }
        </ol>
        <p class="demo-footnote"
          ><app-icon name="source" /> Portfolio context. Real retrieval. Sources you can inspect.</p
        >
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantSpotlightComponent {
  readonly session = inject(AssistantSessionService);
  readonly featuredQuestion =
    this.session.copy.suggestions[1]?.question ?? this.session.copy.suggestions[0].question;
  start() {
    this.session.draft.set(this.featuredQuestion);
    this.session.open();
  }
}

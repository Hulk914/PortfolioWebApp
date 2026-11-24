import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { SkillsComponent } from '../../components/skills/skills.component';
import { ExperienceComponent } from '../../components/experience/experience.component';
import { ProjectsComponent } from '../../components/projects/projects.component';
import { BeyondComponent } from '../../components/beyond/beyond.component';
import { ContactComponent } from '../../components/contact/contact.component';
import { PortfolioContentService } from '../../services/portfolio-content.service';
import { NavigationService } from '../../services/navigation.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-portfolio-page',
  standalone: true,
  imports: [
    HeroComponent,
    SkillsComponent,
    ExperienceComponent,
    ProjectsComponent,
    BeyondComponent,
    ContactComponent,
  ],
  template: `
    <main id="main" tabindex="-1">
      <app-hero
        [profile]="content().profile"
        [companies]="store.companies()"
        [presentation]="content().presentation"
      />
      <app-skills [groups]="content().skills" />
      <app-experience
        [roles]="content().experience"
        [heading]="content().presentation.experience"
      />
      <app-projects
        [projects]="content().projects"
        [groups]="content().projectGroups"
        [heading]="content().presentation.projects"
      />
      <app-beyond
        [heading]="content().presentation.beyond"
        [information]="content().additionalInformation"
        [education]="content().education"
      />
      <app-contact [content]="content().presentation.contact" [email]="content().profile.email" />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioPageComponent {
  readonly store = inject(PortfolioContentService);
  readonly content = this.store.content;
  private readonly navigation = inject(NavigationService);
  private readonly document = inject(DOCUMENT);
  private readonly destroy = inject(DestroyRef);

  constructor() {
    inject(SeoService).home();
    afterNextRender(() => {
      if (typeof IntersectionObserver !== 'function') return;
      const sections = this.content()
        .presentation.navigation.map((link) => this.document.getElementById(link.id))
        .filter((section): section is HTMLElement => section !== null);
      const visible = new Set<Element>();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
          }
          this.navigation.activeSection.set(
            sections.find((section) => visible.has(section))?.id ?? null,
          );
        },
        { rootMargin: '-15% 0px -55% 0px', threshold: 0 },
      );
      sections.forEach((section) => observer.observe(section));
      this.destroy.onDestroy(() => {
        observer.disconnect();
        this.navigation.activeSection.set(null);
      });
    });
  }
}

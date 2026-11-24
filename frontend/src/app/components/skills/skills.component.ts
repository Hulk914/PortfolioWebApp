import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkillGroup } from '../../models/portfolio.model';

@Component({
  selector: 'app-skills',
  standalone: true,
  template: `<section class="toolkit" aria-labelledby="toolkit-title"
    ><div class="shell toolkit-inner"
      ><h2 class="eyebrow" id="toolkit-title">The toolkit</h2
      ><dl class="skill-groups">
        @for (group of groups(); track group.id) {
          <div
            ><dt>{{ group.label }}</dt
            ><dd>{{ group.description }}</dd></div
          >
        }
      </dl></div
    ></section
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  readonly groups = input.required<SkillGroup[]>();
}

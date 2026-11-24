import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContentBlock } from '../../models/portfolio.model';

@Component({
  selector: 'app-content-blocks, [appContentBlocks]',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './content-blocks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentBlocksComponent {
  readonly blocks = input.required<ContentBlock[]>();
}

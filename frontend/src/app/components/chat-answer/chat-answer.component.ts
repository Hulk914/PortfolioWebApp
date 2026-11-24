import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface AnswerBlock {
  kind: 'paragraph' | 'list' | 'ordered' | 'heading';
  lines: string[];
}

/** Format plain text into semantic blocks. Model output is always text, never HTML. */
@Component({
  selector: 'app-chat-answer',
  standalone: true,
  template: `
    @for (block of blocks(); track $index) {
      @switch (block.kind) {
        @case ('list') {
          <ul>
            @for (line of block.lines; track $index) {
              <li>{{ line }}</li>
            }
          </ul>
        }
        @case ('ordered') {
          <ol>
            @for (line of block.lines; track $index) {
              <li>{{ line }}</li>
            }
          </ol>
        }
        @case ('heading') {
          <h4>{{ block.lines[0] }}</h4>
        }
        @default {
          <p>{{ block.lines.join(' ') }}</p>
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatAnswerComponent {
  readonly text = input.required<string>();
  readonly blocks = computed(() => {
    const blocks: AnswerBlock[] = [];
    let current: AnswerBlock | undefined;
    for (const raw of this.text().split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) {
        current = undefined;
        continue;
      }
      const bullet = line.match(/^[-*•]\s+(.+)$/);
      const ordered = line.match(/^\d+[.)]\s+(.+)$/);
      const heading = line.length < 100 && (line.endsWith(':') || /^#{1,4}\s/.test(line));
      const kind = bullet ? 'list' : ordered ? 'ordered' : heading ? 'heading' : 'paragraph';
      const value = (bullet?.[1] ?? ordered?.[1] ?? line)
        .replace(/^#{1,4}\s+/, '')
        .replace(/\*\*(.*?)\*\*/g, '$1');
      if (!current || current.kind !== kind || kind === 'heading') {
        current = { kind, lines: [] };
        blocks.push(current);
      }
      current.lines.push(value);
    }
    return blocks;
  });
}

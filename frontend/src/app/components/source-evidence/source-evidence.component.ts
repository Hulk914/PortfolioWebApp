import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { ChatResponse, Citation } from '../../models/api.model';
import { IconComponent } from '../icon/icon.component';

export interface EvidenceSelection {
  response: ChatResponse;
  citation: Citation;
  index: number;
}

@Component({
  selector: 'app-source-evidence',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './source-evidence.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceEvidenceComponent {
  readonly selection = input.required<EvidenceSelection>();
  readonly closed = output<void>();
  readonly selected = output<EvidenceSelection>();
  readonly scope = signal<'cited' | 'all'>('cited');
  readonly cited = computed(() => {
    const { citation, response } = this.selection();
    return response.retrieved_chunks.filter(
      (chunk) =>
        citation.chunk_ids.includes(chunk.chunk_id) && chunk.document_id === citation.document_id,
    );
  });
  readonly chunks = computed(() =>
    this.scope() === 'cited' ? this.cited() : this.selection().response.retrieved_chunks,
  );

  constructor() {
    effect(() => {
      this.selection();
      this.scope.set('cited');
    });
  }

  select(citation: Citation, index: number) {
    this.selected.emit({ response: this.selection().response, citation, index });
  }
}

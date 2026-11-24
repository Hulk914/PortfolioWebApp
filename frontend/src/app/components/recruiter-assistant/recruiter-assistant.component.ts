import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ChatResponse, Citation } from '../../models/api.model';
import { AssistantSessionService } from '../../services/assistant-session.service';
import { ChatAnswerComponent } from '../chat-answer/chat-answer.component';
import { IconComponent } from '../icon/icon.component';
import {
  EvidenceSelection,
  SourceEvidenceComponent,
} from '../source-evidence/source-evidence.component';

@Component({
  selector: 'app-recruiter-assistant',
  standalone: true,
  imports: [IconComponent, ChatAnswerComponent, SourceEvidenceComponent],
  templateUrl: './recruiter-assistant.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecruiterAssistantComponent {
  readonly session = inject(AssistantSessionService);
  readonly selection = signal<EvidenceSelection | null>(null);
  readonly copied = signal<number | null>(null);
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  readonly input = viewChild<ElementRef<HTMLTextAreaElement>>('questionInput');
  readonly ready = signal(false);
  readonly canSend = computed(
    () =>
      !!this.session.draft().trim() &&
      this.session.draft().trim().length <= 500 &&
      !this.session.pending() &&
      !this.session.retryWait(),
  );
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private returnFocus?: HTMLElement;
  private sourceTrigger?: HTMLElement;
  private copyTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!this.browser || !this.ready() || !element) return;
      if (this.session.opened() && !element.open) {
        this.returnFocus =
          this.document.activeElement instanceof HTMLElement
            ? this.document.activeElement
            : undefined;
        element.showModal();
        this.document.body.classList.add('assistant-modal-open');
        this.heading()?.nativeElement.focus({ preventScroll: true });
      } else if (!this.session.opened() && element.open) element.close();
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.copyTimer);
      if (this.browser) {
        this.document.body.classList.remove('assistant-modal-open');
        const element = this.dialog()?.nativeElement;
        if (element?.open) element.close();
      }
    });
  }

  submit(event?: Event) {
    event?.preventDefault();
    if (!this.canSend()) return;
    this.selection.set(null);
    this.session.ask();
    this.scrollToLatest();
  }

  suggest(question: string) {
    this.session.draft.set(question);
    this.submit();
  }

  keydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.submit();
    }
  }

  closed() {
    this.session.minimize();
    this.document.body.classList.remove('assistant-modal-open');
    const previous = this.returnFocus;
    // The launcher becomes visible again on Angular's next render.
    requestAnimationFrame(() => {
      if (!this.session.opened() && previous?.isConnected) previous.focus({ preventScroll: true });
    });
  }

  backdrop(event: MouseEvent) {
    const element = this.dialog()?.nativeElement;
    if (event.target !== element || !element) return;
    const rect = element.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      this.session.minimize();
  }

  reset() {
    this.selection.set(null);
    this.session.reset();
    this.input()?.nativeElement.focus();
  }

  inspect(response: ChatResponse, citation: Citation, index: number, event: Event) {
    this.sourceTrigger = event.currentTarget as HTMLElement;
    this.selection.set({ response, citation, index });
    requestAnimationFrame(() =>
      this.document.getElementById('evidence-title')?.focus({ preventScroll: true }),
    );
  }

  closeEvidence() {
    this.selection.set(null);
    requestAnimationFrame(() => {
      if (this.sourceTrigger?.isConnected) this.sourceTrigger.focus({ preventScroll: true });
      else this.input()?.nativeElement.focus();
    });
  }

  insufficient(response: ChatResponse) {
    return (
      response.status === 'insufficient_context' || (!response.status && !response.citations.length)
    );
  }

  async copyAnswer(id: number, answer: string) {
    try {
      await navigator.clipboard.writeText(answer);
      this.copied.set(id);
      this.session.announcement.set('Answer copied to clipboard.');
      clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copied.set(null), 2000);
    } catch {
      this.session.announcement.set(
        'Copy is unavailable in this browser. You can select the answer text instead.',
      );
    }
  }

  private scrollToLatest() {
    requestAnimationFrame(() => {
      const id = this.session.turns().at(-1)?.id;
      this.document.getElementById(`assistant-turn-${id}`)?.scrollIntoView({ block: 'start' });
    });
  }
}

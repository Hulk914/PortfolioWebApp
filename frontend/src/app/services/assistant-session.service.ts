import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, take, timer } from 'rxjs';
import assistant from '../../../../content/assistant.json';
import { ApiError } from '../models/api.model';
import { AssistantCopy, ChatFailure, ChatTurn } from '../models/assistant.model';
import { ChatbotService } from './chatbot.service';

/** In-memory UI session. Each API request sends only its own complete question. */
@Injectable({ providedIn: 'root' })
export class AssistantSessionService {
  readonly copy: AssistantCopy = assistant;
  readonly opened = signal(false);
  readonly draft = signal('');
  readonly turns = signal<ChatTurn[]>([]);
  readonly retryWait = signal(0);
  readonly pending = computed(() => this.turns().some((turn) => turn.state === 'pending'));
  readonly announcement = signal('');
  private readonly api = inject(ChatbotService);
  private request?: Subscription;
  private cooldown?: Subscription;
  private nextId = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.request?.unsubscribe();
      this.cooldown?.unsubscribe();
    });
  }

  open() {
    this.opened.set(true);
  }
  minimize() {
    this.opened.set(false);
  }

  ask(question = this.draft()) {
    const text = question.trim();
    if (!text || text.length > 500 || this.pending() || this.retryWait()) return;
    this.draft.set('');
    const turn: ChatTurn = { id: ++this.nextId, question: text, state: 'pending' };
    // Keep a bounded, tab-local transcript; never write questions to localStorage.
    this.turns.update((turns) => [...turns.slice(-19), turn]);
    this.send(turn);
  }

  retry(turn: ChatTurn) {
    if (this.pending() || this.retryWait()) return;
    this.update(turn.id, { state: 'pending', response: undefined, error: undefined });
    this.send(turn);
  }

  stop() {
    this.request?.unsubscribe();
    this.turns.update((turns) =>
      turns.map((turn) => (turn.state === 'pending' ? { ...turn, state: 'cancelled' } : turn)),
    );
    this.announcement.set('Stopped waiting for the answer. You can ask another question.');
  }

  reset() {
    this.request?.unsubscribe();
    this.cooldown?.unsubscribe();
    this.turns.set([]);
    this.draft.set('');
    this.retryWait.set(0);
    this.announcement.set('New conversation. Ask a complete question about the portfolio.');
  }

  private send(turn: ChatTurn) {
    this.announcement.set('Searching the portfolio and asking Gemini. This may take a moment.');
    this.request = this.api.ask(turn.question).subscribe({
      next: (response) => {
        this.update(turn.id, { state: 'answered', response });
        this.announcement.set(
          response.status === 'insufficient_context' || !response.citations.length
            ? 'The portfolio does not contain enough information to answer this question.'
            : `Answer ready with ${response.citations.length} sources. Open a source to inspect its evidence.`,
        );
      },
      error: (error: unknown) => {
        const failure = this.describeError(error);
        this.update(turn.id, { state: 'error', error: failure });
        this.announcement.set(failure.title + ' ' + failure.message);
        const seconds =
          error instanceof ApiError
            ? Math.ceil(error.retryAfterSeconds || (failure.availability ? 5 : 0))
            : 0;
        this.cooldown?.unsubscribe();
        this.retryWait.set(seconds);
        if (seconds)
          this.cooldown = timer(1000, 1000)
            .pipe(take(seconds))
            .subscribe((tick) => this.retryWait.set(seconds - tick - 1));
      },
    });
  }

  private update(id: number, change: Partial<ChatTurn>) {
    this.turns.update((turns) =>
      turns.map((turn) => (turn.id === id ? { ...turn, ...change } : turn)),
    );
  }

  private describeError(error: unknown): ChatFailure {
    const code = error instanceof ApiError ? error.code : '';
    if (
      ['provider_unavailable', 'provider_quota', 'provider_timeout', 'client_timeout'].includes(
        code,
      )
    ) {
      return {
        title:
          code === 'provider_quota'
            ? 'The free tier needs a breather.'
            : 'The cloud is taking a coffee break.',
        message:
          code === 'provider_quota'
            ? 'The model quota is currently exhausted. Please come back later.'
            : 'The model is busy or took too long. Your question is saved and ready for another try.',
        availability: true,
      };
    }
    if (code === 'network_error')
      return {
        title: 'Couldn’t reach the assistant.',
        message:
          'Check your connection and try again. The assistant service may also be temporarily unavailable.',
        availability: false,
      };
    if (
      [
        'provider_credentials',
        'missing_api_key',
        'missing_index',
        'stale_index',
        'invalid_release',
      ].includes(code)
    )
      return {
        title: 'The assistant needs a quick tune-up.',
        message:
          'The service configuration or portfolio index needs attention. You can still explore the portfolio while it is being sorted out.',
        availability: false,
      };
    return {
      title: 'That answer didn’t make it through.',
      message:
        'The service could not return a verified answer. Your question is saved; please try again.',
      availability: false,
    };
  }
}

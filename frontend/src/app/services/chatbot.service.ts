import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ChatRequest, ChatResponse, HealthResponse } from '../models/api.model';

/** Backend contract only. No network calls are made until a consumer subscribes. */
@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly api = inject(ApiService);
  health() {
    return this.api.get<HealthResponse>('health');
  }
  ask(question: string) {
    const body: ChatRequest = { question: question.trim() };
    return this.api.post<ChatResponse>('chat', body);
  }
}

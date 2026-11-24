import { ChatResponse } from './api.model';

export interface AssistantCopy {
  title: string;
  launcherLabel: string;
  navigationLabel: string;
  eyebrow: string;
  headline: string;
  description: string;
  welcome: string;
  welcomeDescription: string;
  placeholder: string;
  suggestions: { label: string; question: string }[];
  pipeline: { label: string; detail: string }[];
  deliveryNote: string;
  availabilityTitle: string;
  availabilityNote: string;
  privacyNote: string;
}

export interface ChatFailure {
  title: string;
  message: string;
  availability: boolean;
}

export interface ChatTurn {
  id: number;
  question: string;
  state: 'pending' | 'answered' | 'error' | 'cancelled';
  response?: ChatResponse;
  error?: ChatFailure;
}

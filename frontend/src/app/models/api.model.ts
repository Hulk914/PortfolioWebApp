export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
}
export interface HealthResponse {
  status: string;
  rag_index_loaded: boolean;
  content_hash?: string;
}
export interface ChatRequest {
  question: string;
}
export interface Citation {
  document_id: string;
  title: string;
  url: string;
  section?: string;
}
export interface ChatResponse {
  answer: string;
  citations: Citation[];
  trace_id?: string;
  trace_url?: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

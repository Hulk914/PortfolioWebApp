export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
}
export interface HealthResponse {
  status: 'ok';
  rag_index_loaded: boolean;
  content_hash: string;
  index_id: string;
  source_revision: string;
  embedding_model: string;
  embedding_dimensions: number;
  chunk_count: number;
}
export interface ChatRequest {
  question: string;
}
export interface Citation {
  document_id: string;
  title: string;
  url: string;
  section?: string;
  chunk_ids: string[];
}
export interface EvidenceChunk {
  chunk_id: string;
  document_id: string;
  title: string;
  section: string;
  text: string;
  similarity_score: number;
  used_in_answer: boolean;
  source_file: string;
  url: string;
}
export interface ChatResponse {
  /** Optional while an older backend deployment is still serving traffic. */
  status?: 'answered' | 'insufficient_context';
  answer: string;
  citations: Citation[];
  retrieved_chunks: EvidenceChunk[];
  content_hash: string;
  trace_id?: string;
  trace_url?: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly code = 'service_unavailable',
    readonly retryAfterSeconds = 0,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

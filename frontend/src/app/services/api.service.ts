import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, defer, Observable, throwError, timeout, TimeoutError } from 'rxjs';
import { ApiConfig, ApiError } from '../models/api.model';

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  get<T>(path: string): Observable<T> {
    return this.request(() => this.http.get<T>(this.url(path)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.request(() => this.http.post<T>(this.url(path), body));
  }

  private url(path: string): string {
    const base = this.config.baseUrl.trim();
    if (!base) throw new ApiError('The assistant service has not been configured yet.');
    if (!/^https?:\/\//.test(base) || /^(?:[a-z]+:|\/\/)/i.test(path)) {
      throw new ApiError('Invalid API configuration or endpoint.');
    }
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private request<T>(send: () => Observable<T>): Observable<T> {
    return defer(send).pipe(
      timeout(this.config.timeoutMs),
      catchError((error: unknown) => {
        if (error instanceof ApiError) return throwError(() => error);
        if (error instanceof TimeoutError)
          return throwError(
            () => new ApiError('The service took too long to respond. Please try again.'),
          );
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        const message =
          status === 429
            ? 'The service is busy. Please try again later.'
            : 'The assistant service is unavailable. Please try again later.';
        return throwError(() => new ApiError(message, status));
      }),
    );
  }
}

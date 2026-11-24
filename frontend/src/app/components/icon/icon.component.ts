import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      [attr.viewBox]="name() === 'education' ? '0 0 48 48' : '0 0 24 24'"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      [class.education-icon]="name() === 'education'"
    >
      @switch (name()) {
        @case ('chat') {
          <path
            d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-3 2V11.5A8.5 8.5 0 0 1 9.5 3h3a8.5 8.5 0 0 1 8.5 8.5Z"
          />
          <path d="M7 10h8M7 14h5" />
        }
        @case ('sparkle') {
          <path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3ZM20 2v4M18 4h4" />
        }
        @case ('close') {
          <path d="m6 6 12 12M6 18 18 6" />
        }
        @case ('minimize') {
          <path d="M5 17h14" />
        }
        @case ('send') {
          <path d="m12 19 0-14M5 12l7-7 7 7" />
        }
        @case ('refresh') {
          <path d="M20 7v5h-5M4 17v-5h5M6.1 6a8 8 0 0 1 13 3M4.9 15a8 8 0 0 0 13 3" />
        }
        @case ('source') {
          <path
            d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6M8 13h8M8 17h5"
          />
        }
        @case ('copy') {
          <rect x="8" y="8" width="12" height="13" rx="2" />
          <path d="M16 8V3H4v13h4" />
        }
        @case ('check') {
          <path d="m5 12 4 4L19 6" />
        }
        @case ('stop') {
          <rect x="6" y="6" width="12" height="12" rx="2" />
        }
        @case ('back') {
          <path d="m12 5-7 7 7 7M5 12h15" />
        }
        @case ('email') {
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        }
        @case ('linkedin') {
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="7.5" cy="7.5" r="0.75" fill="currentColor" stroke="none" />
          <path d="M7.5 11v6M11 17v-6m0 3a3 3 0 0 1 6 0v3" />
        }
        @case ('github') {
          <path
            d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22"
          />
        }
        @case ('medium') {
          <path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" />
        }
        @case ('education') {
          <path d="m4 18 20-10 20 10-20 10L4 18Zm8 5v12c8 6 16 6 24 0V23M44 18v15" />
        }
        @default {
          <path d="M7 17 17 7M7 7h10v10" />
        }
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input('external');
}

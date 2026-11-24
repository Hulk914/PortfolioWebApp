import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroy = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const element = this.element;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (typeof IntersectionObserver !== 'function') {
        element.classList.add('hit');
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          if (!reducedMotion?.matches) element.classList.add('is-visible');
          if (element.classList.contains('timeline-item')) element.classList.add('hit');
          observer.disconnect();
        },
        { threshold: 0.12 },
      );
      observer.observe(element);
      this.destroy.onDestroy(() => observer.disconnect());
    });
  }
}

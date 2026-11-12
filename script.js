// The deferred classic script also works when index.html is opened directly.
// Keep enhancement state private; the HTML remains usable without these APIs.
(() => {
  'use strict';

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Local file links cannot trigger downloads in Chrome. Load a Blob-backed
  // copy only for direct file previews; hosted pages use the original PDF.
  if (window.location.protocol === 'file:' && document.getElementById('fastapi-guide-download')) {
    const downloadScript = document.createElement('script');
    downloadScript.src = 'assets/FastAPI-Guide.download.js';
    document.head.append(downloadScript);
  }

  if (typeof window.IntersectionObserver !== 'function') {
    document.querySelectorAll('.timeline-item').forEach((item) => item.classList.add('hit'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!reducedMotion?.matches) entry.target.classList.add('is-visible');
        if (entry.target.classList.contains('timeline-item')) entry.target.classList.add('hit');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const sections = navLinks
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);
  const visibleSections = new Set();

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleSections.add(entry.target);
        else visibleSections.delete(entry.target);
      });

      // Resolve simultaneous entries in document order, and clear stale state
      // when the visitor returns to the introduction or reaches the footer.
      const currentSection = sections.find((section) => visibleSections.has(section));
      navLinks.forEach((link) => {
        const active = Boolean(currentSection && link.hash === '#' + currentSection.id);
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-15% 0px -55% 0px', threshold: 0 },
  );

  sections.forEach((section) => sectionObserver.observe(section));
})();

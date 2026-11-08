// Content stays readable without JavaScript; motion only adds a finishing touch.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const year = document.getElementById('current-year');
if (year) year.textContent = new Date().getFullYear();

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            if (!reducedMotion.matches) entry.target.classList.add('is-visible');
            if (entry.target.classList.contains('timeline-item')) entry.target.classList.add('hit');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

    const navLinks = [...document.querySelectorAll('.nav-links a')];
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(link => {
                const active = link.hash === '#' + entry.target.id;
                link.classList.toggle('is-active', active);
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });

    document.querySelectorAll('#experience, #projects, #beyond').forEach(section => sectionObserver.observe(section));
} else {
    document.querySelectorAll('.timeline-item').forEach(item => item.classList.add('hit'));
}

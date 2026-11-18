// ── Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav       = document.getElementById('nav');

function setNav(open) {
  nav.classList.toggle('open', open);
  navToggle.classList.toggle('active', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
}

if (navToggle && nav) {
  navToggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));

  // Close nav on link click or Escape (mobile)
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setNav(false);
      navToggle.focus();
    }
  });
}

// ── Sticky header: compact + stronger shadow once the page scrolls
const header = document.querySelector('.header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ── Reveal cards on scroll (skipped when the visitor prefers reduced motion)
const revealTargets = document.querySelectorAll('.service-card, .gallery-item, .contact-card');
const reduceMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealTargets.forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

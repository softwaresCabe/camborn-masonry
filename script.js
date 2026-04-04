// ── Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav       = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
  navToggle.classList.toggle('active');
});

// Close nav on link click (mobile)
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.classList.remove('active');
  });
});

// ── Sticky header shadow
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.style.boxShadow = window.scrollY > 10
    ? '0 2px 20px rgba(0,0,0,.12)'
    : '0 2px 12px rgba(0,0,0,.06)';
}, { passive: true });

// ── Contact form handler
function handleFormSubmit(e) {
  e.preventDefault();
  const form    = e.target;
  const success = form.querySelector('.form-success') || createSuccessEl(form);

  // Show success message (in production, replace with a real form service)
  success.style.display = 'block';
  form.reset();

  // Scroll to success
  success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  setTimeout(() => { success.style.display = 'none'; }, 6000);
}

function createSuccessEl(form) {
  const el = document.createElement('div');
  el.className = 'form-success';
  el.textContent = "✓ Thanks! We'll be in touch shortly. Or call us at 442-260-5727.";
  form.prepend(el);
  return el;
}

// ── Animate elements on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .gallery-item, .contact-card').forEach(el => {
  el.style.opacity  = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});

document.addEventListener('DOMContentLoaded', () => {
  // Style for visible state
  const style = document.createElement('style');
  style.textContent = '.service-card.visible, .gallery-item.visible, .contact-card.visible { opacity: 1 !important; transform: none !important; }';
  document.head.appendChild(style);
});

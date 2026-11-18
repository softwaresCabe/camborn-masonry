// ── Guided estimate request (contact.html)
// Five short steps, validated one at a time, submitted to Netlify Forms via fetch,
// then redirected to thank-you.html. Without JS the form still posts natively.
(() => {
  const form = document.getElementById('estimateForm');
  if (!form) return;

  form.classList.add('is-enhanced');

  const steps        = [...form.querySelectorAll('.form-step')];
  const errorBox     = document.getElementById('formError');
  const progressBar  = document.getElementById('progressBar');
  const progressText = document.getElementById('progressLabel');
  const backBtn      = document.getElementById('formBack');
  const nextBtn      = document.getElementById('formNext');
  const submitBtn    = document.getElementById('formSubmit');
  const privacy      = document.getElementById('formPrivacy');
  const summary      = document.getElementById('selectionSummary');
  const PHONE        = '442-260-5727';
  let current = 0;

  const multi = (group) =>
    [...form.querySelectorAll(`[data-group="${group}"] input:checked`)].map((i) => i.value);
  const radio = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const text  = (name) => (form.elements[name]?.value || '').trim();

  // Keep the visual "selected" state and exclusive options ("Not sure yet") in sync
  form.addEventListener('change', (e) => {
    const input = e.target;
    if (!input.matches('.form-choice input')) return;
    hideError();

    const group = input.closest('[data-multi]');
    if (group && input.checked) {
      group.querySelectorAll('input').forEach((other) => {
        if (other === input) return;
        if (input.hasAttribute('data-exclusive') || other.hasAttribute('data-exclusive')) other.checked = false;
      });
    }
    form.querySelectorAll('.form-choice').forEach((label) => {
      label.classList.toggle('is-selected', label.querySelector('input').checked);
    });
  });

  function stepError(index) {
    switch (index) {
      case 0:
        if (!multi('services').length) return 'Choose at least one service, or select "Not sure yet."';
        break;
      case 1:
        if (!radio('propertyType')) return 'Choose the type of property this project is for.';
        if (!radio('projectSize')) return 'Choose an approximate project size. "Not sure" is okay.';
        break;
      case 2:
        if (!multi('priorities').length) return 'Choose at least one thing that matters to you.';
        break;
      case 3:
        if (!radio('timeline')) return 'Choose the timing that best fits your plans.';
        break;
      case 4:
        if (!text('name') || !text('phone')) return 'Please enter your name and phone number so we can reach you.';
        if (text('phone').replace(/\D/g, '').length < 10) return 'Please enter a 10-digit phone number.';
        if (!radio('preferredContact')) return 'Choose how you would prefer to be contacted.';
        if (radio('preferredContact') === 'Email' && !text('email')) return 'Enter an email address, or choose phone call or text message.';
        if (text('email') && !form.elements.email.checkValidity()) return 'Please check the email address.';
        break;
    }
    return '';
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }
  function hideError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  function render(focus = true) {
    steps.forEach((step, i) => { step.hidden = i !== current; });
    const last = current === steps.length - 1;
    backBtn.hidden   = current === 0;
    nextBtn.hidden   = last;
    submitBtn.hidden = !last;
    privacy.hidden   = !last;
    progressBar.style.width = `${((current + 1) / steps.length) * 100}%`;
    progressText.textContent = `Step ${current + 1} of ${steps.length}`;
    form.setAttribute('aria-label', `Estimate request, step ${current + 1} of ${steps.length}: ${steps[current].dataset.label}`);

    if (last) {
      const bits = [...multi('services'), radio('projectSize'), radio('timeline')].filter(Boolean);
      summary.textContent = bits.join(' · ');
    }
    if (focus) {
      steps[current].querySelector('h2')?.focus({ preventScroll: true });
      const top = form.getBoundingClientRect().top;
      if (top < 0) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function go(index) {
    hideError();
    current = Math.max(0, Math.min(index, steps.length - 1));
    render();
  }

  function next() {
    const err = stepError(current);
    if (err) return showError(err);
    go(current + 1);
  }

  nextBtn.addEventListener('click', next);
  backBtn.addEventListener('click', () => go(current - 1));
  document.getElementById('editSelections').addEventListener('click', () => go(0));

  const encode = (data) => new URLSearchParams(data).toString();

  // Join multi-select groups into one readable value each for the Netlify notification
  function payload() {
    const data = new FormData(form);
    ['services', 'priorities'].forEach((group) => {
      data.delete(group);
      data.set(group, multi(group).join(', '));
    });
    return data;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Enter pressed on an earlier step → advance instead of submitting
    if (current < steps.length - 1) return next();

    for (let i = 0; i < steps.length; i += 1) {
      const err = stepError(i);
      if (err) {
        current = i;
        render();
        return showError(err);
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(payload()),
      });
      if (!res.ok) throw new Error(`Form submission failed: ${res.status}`);

      // Fires only if an ads/analytics tag has been added to the page
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', {
          event_category: 'estimate-form',
          event_label: multi('services').join(', ') || 'general',
        });
      }
      window.location.href = 'thank-you.html';
    } catch {
      showError(`Your request could not be sent. Please call or text us at ${PHONE}.`);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send my request';
      form.removeAttribute('aria-busy');
    }
  });

  render(false);
})();

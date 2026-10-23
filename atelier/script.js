(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const closeMenu = () => {
    if (!menuToggle || !mobileNav) return;
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  };
  menuToggle?.addEventListener('click', () => {
    const open = mobileNav.hidden;
    mobileNav.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  mobileNav?.querySelectorAll('a, button').forEach(item => item.addEventListener('click', closeMenu));

  const panel = document.querySelector('.booking-panel');
  const backdrop = document.querySelector('.booking-backdrop');
  const closeButton = document.querySelector('.booking-close');
  const form = document.getElementById('stay-form');
  const summary = document.getElementById('booking-summary');
  const summaryDetails = document.getElementById('summary-details');
  const error = document.getElementById('form-error');
  const arrival = document.getElementById('arrival');
  const departure = document.getElementById('departure');
  const suite = document.getElementById('suite');
  const submit = form?.querySelector('[type="submit"]');
  let previousFocus = null;
  let closeTimer = null;

  const localDate = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = localDate(new Date());
  if (arrival && departure) {
    arrival.min = today;
    departure.min = today;
    arrival.addEventListener('change', () => {
      departure.min = arrival.value || today;
      if (departure.value && departure.value <= arrival.value) departure.value = '';
    });
  }

  function openBooking(trigger) {
    if (!panel || !backdrop) return;
    clearTimeout(closeTimer);
    closeMenu();
    previousFocus = trigger || document.activeElement;
    const selected = trigger?.dataset.suite;
    if (selected && suite) suite.value = selected;
    panel.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
      backdrop.classList.add('is-open');
      closeButton?.focus();
    });
  }
  function closeBooking() {
    if (!panel || panel.hidden) return;
    panel.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    closeTimer = setTimeout(() => {
      panel.hidden = true;
      if (backdrop) backdrop.hidden = true;
      previousFocus?.focus?.();
    }, 450);
  }
  document.querySelectorAll('[data-open-booking]').forEach(button => button.addEventListener('click', () => openBooking(button)));
  closeButton?.addEventListener('click', closeBooking);
  backdrop?.addEventListener('click', closeBooking);
  panel?.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('button, input:not(.honeypot), select, textarea')].filter(el => !el.disabled && !el.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (panel && !panel.hidden) closeBooking();
    else if (mobileNav && !mobileNav.hidden) closeMenu();
  });

  const showError = (message, field) => {
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
    field?.focus();
  };
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!error || !submit) return;
    error.hidden = true;
    const name = form.querySelector('[name="name"]');
    const email = form.querySelector('[name="email"]');
    if (!arrival?.value || !departure?.value) {
      showError('Choose your arrival and departure dates.', !arrival?.value ? arrival : departure); return;
    }
    if (arrival.value < today) { showError('Arrival cannot be in the past.', arrival); return; }
    if (departure.value <= arrival.value) { showError('Departure must be after arrival.', departure); return; }
    if (!name?.value.trim()) { showError('Enter your name.', name); return; }
    if (!email?.validity.valid || !email.value.trim()) { showError('Enter a valid email address.', email); return; }

    const originalLabel = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    const data = Object.fromEntries(new FormData(form));
    data._subject = 'Cala Selva concept — new stay inquiry';
    data._template = 'table';
    data._url = location.href;
    data.message = data.message || data.notes || '';
    delete data.notes;
    try {
      const response = await fetch('https://formsubmit.co/ajax/d8320a4df9abf44157cd47da0234bcfb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok || result.success === false || result.success === 'false') {
        if (/activation/i.test(result.message || '')) {
          showError('The inquiry form is awaiting email activation. Please try again shortly.');
          return;
        }
        throw new Error(result.message || 'The inquiry could not be sent.');
      }
      form.hidden = true;
      if (summary && summaryDetails) {
        summaryDetails.textContent = 'Your request has been sent to the designer. A reply will go to ' + email.value.trim() + '. No reservation has been made.';
        summary.hidden = false;
        summary.querySelector('button')?.focus();
      }
    } catch (cause) {
      showError('We could not send your inquiry. Please try again in a moment.');
    } finally {
      submit.disabled = false;
      submit.innerHTML = originalLabel;
    }
  });
  document.getElementById('edit-stay')?.addEventListener('click', () => {
    if (!form || !summary) return;
    form.reset();
    summary.hidden = true;
    form.hidden = false;
    form.querySelector('[name="name"]')?.focus();
  });

  const revealNodes = document.querySelectorAll('.reveal, .image-reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { threshold: .08, rootMargin: '0px 0px -25px 0px' });
    revealNodes.forEach(node => observer.observe(node));
  } else revealNodes.forEach(node => node.classList.add('is-visible'));
})();

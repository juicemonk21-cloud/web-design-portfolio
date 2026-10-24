(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      siteNav.classList.toggle('open', open);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && siteNav.classList.contains('open')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
        siteNav.classList.remove('open');
        menuToggle.focus();
      }
    });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    document.querySelectorAll('.menu-intro,.menu-tabs,.menu-group,.menu-outro .media-frame,.menu-outro>div:last-child,.space-hero h1,.space-hero p,.booking-lead,.booking-form .form-grid,.floorplan-heading,.floorplan,.note-label,.booking-submit,.faq-row').forEach((element) => element.classList.add('reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px 50px 0px' });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

    const wordmark = document.querySelector('.hero-wordmark');
    if (wordmark) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
          wordmark.style.transform = `scale(${1 - progress * 0.045})`;
          ticking = false;
        });
      }, { passive: true });
    }
  }

  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (reduceMotion || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      document.body.classList.add('is-leaving');
      window.setTimeout(() => { window.location.href = url.href; }, 410);
    });
  });

  const tabs = [...document.querySelectorAll('.menu-tab')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const targetIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(tabs[targetIndex]);
      tabs[targetIndex].focus();
    });
  });
  function selectTab(selected) {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(`panel-${tab.dataset.tab}`);
      if (panel) { panel.hidden = !active; panel.classList.toggle('active', active); }
    });
  }

  const form = document.getElementById('booking-form');
  if (form) {
    const dateInput = document.getElementById('booking-date');
    const guestsInput = document.getElementById('booking-guests');
    const tableHint = document.getElementById('table-hint');
    const tableButtons = [...document.querySelectorAll('.table-choice')];
    const error = document.getElementById('booking-error');
    const success = document.getElementById('booking-success');
    const summary = document.getElementById('booking-summary');
    let selectedTable = null;
    const today = new Date();
    const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 90);
    const localISO = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    dateInput.min = localISO(today);
    dateInput.max = localISO(maxDate);

    guestsInput.addEventListener('change', () => {
      const guests = Number(guestsInput.value);
      tableButtons.forEach((button) => { button.disabled = !guests || Number(button.dataset.seats) < guests; });
      if (selectedTable && selectedTable.disabled) {
        selectedTable.setAttribute('aria-pressed', 'false');
        selectedTable = null;
      }
      tableHint.textContent = guests ? `Tables for ${guests} ${guests === 1 ? 'guest' : 'guests'} are highlighted below.` : 'Choose your party size to see suitable tables.';
      error.hidden = true;
    });
    tableButtons.forEach((button) => {
      button.disabled = true;
      button.addEventListener('click', () => {
        if (selectedTable) selectedTable.setAttribute('aria-pressed', 'false');
        selectedTable = button;
        button.setAttribute('aria-pressed', 'true');
        tableHint.textContent = `${button.dataset.table} selected.`;
        error.hidden = true;
      });
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const showError = (message, target) => {
        error.textContent = message;
        error.hidden = false;
        target?.focus();
      };
      if (!dateInput.value) return showError('Choose an evening.', dateInput);
      const [year, month, day] = dateInput.value.split('-').map(Number);
      const chosenDate = new Date(year, month - 1, day);
      if (dateInput.value < dateInput.min || dateInput.value > dateInput.max) return showError('Choose a date within the next 90 days.', dateInput);
      if (chosenDate.getDay() === 1) return showError('Nocte is closed on Mondays. Please choose Tuesday through Sunday.', dateInput);
      if (!document.getElementById('booking-time').value) return showError('Choose a time.', document.getElementById('booking-time'));
      if (!guestsInput.value) return showError('Choose your party size.', guestsInput);
      if (!selectedTable) return showError('Choose a table in the room.', tableButtons.find((button) => !button.disabled));
      const name = document.getElementById('booking-name');
      const email = document.getElementById('booking-email');
      if (!name.value.trim()) return showError('Enter your name.', name);
      if (!email.value.trim() || !email.checkValidity()) return showError('Enter a valid email address.', email);
      const booking = { date: dateInput.value, time: document.getElementById('booking-time').value, guests: Number(guestsInput.value), table: selectedTable.dataset.table, name: name.value.trim(), email: email.value.trim(), phone: document.getElementById('booking-phone').value.trim(), note: document.getElementById('booking-note').value.trim() };
      try { localStorage.setItem('nocte-demo-booking', JSON.stringify(booking)); } catch (_) { /* Browser storage may be disabled. The visible summary still works. */ }
      summary.textContent = `${booking.name}, your demo request for ${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'} at ${booking.table} on ${chosenDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${booking.time} is ready.`;
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });
    document.getElementById('book-again').addEventListener('click', () => {
      form.reset();
      selectedTable = null;
      tableButtons.forEach((button) => { button.disabled = true; button.setAttribute('aria-pressed', 'false'); });
      tableHint.textContent = 'Choose your party size to see suitable tables.';
      error.hidden = true;
      success.hidden = true;
      form.hidden = false;
      dateInput.focus();
    });
  }
})();

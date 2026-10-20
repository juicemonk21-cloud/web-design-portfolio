const rooms = {
  sea: {
    image: 'assets/hero-suite.webp', alt: 'Sea Suite with a private view of the Adriatic',
    title: 'Wake to the horizon.',
    description: 'A generous suite with natural stone, soft linen, and a sea view worth lingering over. Open the doors and let the morning in.',
    facts: ['Private sea-facing terrace', 'King bed', 'Up to two guests'], select: 'Sea Suite'
  },
  courtyard: {
    image: 'assets/courtyard-suite.webp', alt: 'Courtyard Suite with natural linen and limestone details',
    title: 'A slower morning awaits.',
    description: 'A calm retreat with layered textures, thoughtful details, and a secluded terrace for reading long past breakfast.',
    facts: ['Secluded terrace', 'King bed', 'Up to two guests'], select: 'Courtyard Suite'
  }
};

const tabs = [...document.querySelectorAll('.room-tab')];
const roomPhoto = document.getElementById('room-photo');
const roomPanel = document.getElementById('room-panel');
function setRoom(key) {
  const room = rooms[key];
  if (!room) return;
  tabs.forEach(tab => { const active = tab.dataset.room === key; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
  roomPanel.setAttribute('aria-labelledby', `tab-${key}`);
  roomPhoto.classList.add('is-changing');
  const next = new Image(); next.src = room.image;
  const swap = () => { roomPhoto.src = room.image; roomPhoto.alt = room.alt; roomPhoto.classList.remove('is-changing'); };
  if (next.complete) setTimeout(swap, 170); else next.onload = swap;
  document.getElementById('room-title').textContent = room.title;
  document.getElementById('room-description').textContent = room.description;
  document.getElementById('room-facts').replaceChildren(...room.facts.map(fact => { const item = document.createElement('li'); item.textContent = fact; return item; }));
  document.getElementById('suite').value = room.select;
}
tabs.forEach((tab, index) => { tab.addEventListener('click', () => setRoom(tab.dataset.room)); tab.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; next.focus(); setRoom(next.dataset.room); } }); });

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open menu'); }
menuToggle.addEventListener('click', () => { const open = mobileNav.hidden; mobileNav.hidden = !open; menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
mobileNav.querySelectorAll('a, button').forEach(element => element.addEventListener('click', closeMenu));

const panel = document.querySelector('.booking-panel');
const backdrop = document.querySelector('.booking-backdrop');
const closeButton = document.querySelector('.booking-close');
let priorFocus;
function openBooking() { priorFocus = document.activeElement; panel.hidden = false; backdrop.hidden = false; document.body.style.overflow = 'hidden'; requestAnimationFrame(() => { panel.classList.add('is-open'); backdrop.classList.add('is-open'); closeButton.focus(); }); }
function closeBooking() { panel.classList.remove('is-open'); backdrop.classList.remove('is-open'); document.body.style.overflow = ''; setTimeout(() => { panel.hidden = true; backdrop.hidden = true; priorFocus?.focus(); }, 450); }
document.querySelectorAll('[data-open-booking]').forEach(button => button.addEventListener('click', openBooking));
closeButton.addEventListener('click', closeBooking); backdrop.addEventListener('click', closeBooking);
panel.addEventListener('keydown', event => { if (event.key === 'Tab') { const focusable = [...panel.querySelectorAll('button, input, select')].filter(el => !el.closest('[hidden]')); const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (!panel.hidden) closeBooking(); else if (!mobileNav.hidden) closeMenu(); } });

const arrival = document.getElementById('arrival');
const departure = document.getElementById('departure');
const today = new Date();
const todayLocal = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
arrival.min = todayLocal; departure.min = todayLocal;
arrival.addEventListener('change', () => { departure.min = arrival.value || todayLocal; if (departure.value && departure.value <= arrival.value) departure.value = ''; });
const stayForm = document.getElementById('stay-form');
const error = document.getElementById('form-error');
stayForm.addEventListener('submit', event => { event.preventDefault(); error.hidden = true; if (!arrival.value || !departure.value) { error.textContent = 'Choose your arrival and departure dates.'; error.hidden = false; (!arrival.value ? arrival : departure).focus(); return; } if (departure.value <= arrival.value) { error.textContent = 'Departure must be after arrival.'; error.hidden = false; departure.focus(); return; } const format = value => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`)); document.getElementById('summary-details').textContent = `${document.getElementById('suite').value} · ${format(arrival.value)} to ${format(departure.value)} · ${document.getElementById('guests').selectedOptions[0].textContent}. This is a preview only; no booking has been placed.`; stayForm.hidden = true; document.getElementById('booking-summary').hidden = false; document.getElementById('edit-stay').focus(); });
document.getElementById('edit-stay').addEventListener('click', () => { document.getElementById('booking-summary').hidden = true; stayForm.hidden = false; arrival.focus(); });

document.getElementById('year').textContent = new Date().getFullYear();
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: .12, rootMargin: '0px 0px -20px 0px' });
  reveals.forEach(element => observer.observe(element));
} else reveals.forEach(element => element.classList.add('is-visible'));

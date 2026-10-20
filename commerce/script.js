const scenes = {
  evening: 'A softer evening, wherever you are.',
  daylight: 'A sculptural silhouette in natural light.'
};

document.querySelectorAll('[data-scene]').forEach(button => {
  button.addEventListener('click', () => {
    const next = button.dataset.scene;
    document.querySelectorAll('[data-scene]').forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-image]').forEach(image => {
      image.classList.toggle('is-active', image.dataset.image === next);
    });
    document.querySelector('.scene-caption').textContent = scenes[next];
  });
});

let quantity = 0;
const drawer = document.querySelector('.bag-drawer');
const backdrop = document.querySelector('.bag-backdrop');
const bagButton = document.querySelector('.bag-button');
let returnFocus = bagButton;

function updateBag() {
  document.querySelectorAll('.bag-count').forEach(el => { el.textContent = quantity; });
  bagButton.setAttribute('aria-label', `Open bag, ${quantity} ${quantity === 1 ? 'item' : 'items'}`);
  document.querySelector('.bag-empty').hidden = quantity > 0;
  document.querySelector('.bag-item').hidden = quantity === 0;
  document.querySelector('.item-qty').textContent = quantity;
  document.querySelector('.item-total').textContent = `$${quantity * 280}`;
  document.querySelector('.subtotal strong').textContent = `$${quantity * 280}`;
}

function openBag(trigger = bagButton) {
  returnFocus = trigger;
  backdrop.hidden = false;
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  drawer.querySelector('.close-button').focus();
}

function closeBag() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.inert = true;
  backdrop.hidden = true;
  document.body.style.overflow = '';
  returnFocus.focus();
}

document.querySelectorAll('[data-add-bag]').forEach(button => button.addEventListener('click', () => {
  quantity += 1;
  updateBag();
  openBag(button);
}));
document.querySelectorAll('[data-open-bag]').forEach(button => button.addEventListener('click', () => openBag(button)));
document.querySelectorAll('[data-close-bag]').forEach(button => button.addEventListener('click', closeBag));
document.querySelector('[data-increase]').addEventListener('click', () => { quantity += 1; updateBag(); });
document.querySelector('[data-decrease]').addEventListener('click', () => { quantity = Math.max(0, quantity - 1); updateBag(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeBag();
  if (event.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
  const focusable = [...drawer.querySelectorAll('button:not([disabled])')];
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

updateBag();

// Global Mouse Spotlight Controller (Optimizado con rAF y listeners locales sin forced reflow)
function initSpotlight() {
  if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const cards = document.querySelectorAll<HTMLElement>('.spotlight-card');
  if (cards.length === 0) return;

  cards.forEach((card) => {
    if (card.dataset.spotlightInitialized === 'true') return;
    card.dataset.spotlightInitialized = 'true';
    let rect: DOMRect | null = null;
    let ticking = false;

    const updateRect = () => {
      rect = card.getBoundingClientRect();
    };

    card.addEventListener('pointerenter', () => {
      updateRect();
    }, { passive: true });

    card.addEventListener('pointermove', (e: PointerEvent) => {
      if (!rect) updateRect();
      if (!ticking && rect) {
        ticking = true;
        requestAnimationFrame(() => {
          if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
          }
          ticking = false;
        });
      }
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      rect = null;
    }, { passive: true });
  });
}

initSpotlight();
document.addEventListener('astro:page-load', initSpotlight);

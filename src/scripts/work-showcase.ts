function initWorkShowcase() {
// Accordion logic for project rationale cards
const toggleButtons = document.querySelectorAll<HTMLButtonElement>('button[data-toggle-why]');

toggleButtons.forEach((btn) => {
  if (btn.dataset.initialized === 'true') return;
  btn.dataset.initialized = 'true';
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-toggle-why');
    if (!id) return;
    const target = document.getElementById(`rationale-${id}`);
    if (!target) return;

    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isExpanded));

    const icon = btn.querySelector('.toggle-icon');

    if (isExpanded) {
      target.classList.add('hidden');
      if (icon) icon.textContent = '[+]';
    } else {
      target.classList.remove('hidden');
      if (icon) icon.textContent = '[-]';
    }
  });
});

}
initWorkShowcase();
document.addEventListener('astro:page-load', initWorkShowcase);

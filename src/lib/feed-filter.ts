/**
 * Progressive enhancement: links work without JS (go to /category/<slug>/);
 * with JS they become toggle buttons that filter the cards already on the page.
 */
export function initFeedFilter(root: Document | HTMLElement): void {
  const group = root.querySelector<HTMLElement>('[data-feed-filter]');
  if (!group) return;
  const controls = [...group.querySelectorAll<HTMLAnchorElement>('[data-cat]')];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-feed-item]')];
  const empty = root.querySelector<HTMLElement>('[data-feed-empty]');

  const apply = (cat: string) => {
    let shown = 0;
    for (const card of cards) {
      const match = cat === 'all' || card.dataset.cat === cat;
      card.hidden = !match;
      if (match) shown++;
    }
    for (const c of controls) c.setAttribute('aria-pressed', String(c.dataset.cat === cat));
    if (empty) empty.hidden = shown > 0;
  };

  for (const c of controls) {
    c.setAttribute('role', 'button');
    c.addEventListener('click', (e) => {
      e.preventDefault();
      apply(c.dataset.cat ?? 'all');
    });
    c.addEventListener('keydown', (e) => {
      if (e.key === ' ') { e.preventDefault(); apply(c.dataset.cat ?? 'all'); }
    });
  }

  // Server markup carries no ARIA state (links are plain links without JS); set it now.
  apply('all');
}

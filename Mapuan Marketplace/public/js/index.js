import { api, listingCard } from './app.js';

async function init() {
  try {
    const [{ categories }, { listings }] = await Promise.all([
      api('/api/categories'),
      api('/api/listings?sort=newest')
    ]);

    document.querySelector('#categoryGrid').innerHTML = categories.slice(0, 7).map(c => `
      <a class="category-card" href="/browse.html?category=${encodeURIComponent(c.slug)}">
        <div class="category-icon">${c.icon || '📦'}</div>
        <h3>${c.name}</h3>
        <div class="muted">Browse student listings</div>
      </a>
    `).join('');

    document.querySelector('#featuredListings').innerHTML =
      listings.slice(0, 8).map(listingCard).join('') ||
      '<div class="empty">No listings yet. Be the first to sell something.</div>';
  } catch (err) {
    console.error(err);
  }
}
init();

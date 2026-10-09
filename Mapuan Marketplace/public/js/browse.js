import { api, listingCard, toast } from './app.js';

const form = document.querySelector('#filters');
const grid = document.querySelector('#listingGrid');
const count = document.querySelector('#resultCount');

async function loadCategories() {
  const { categories } = await api('/api/categories');
  const select = document.querySelector('#categoryFilter');
  select.innerHTML = '<option value="">All categories</option>' +
    categories.map(c => `<option value="${c.slug}">${c.icon || ''} ${c.name}</option>`).join('');

  const fromUrl = new URLSearchParams(location.search).get('category');
  if (fromUrl) select.value = fromUrl;
}

async function loadListings() {
  const params = new URLSearchParams();
  const data = Object.fromEntries(new FormData(form));
  Object.entries(data).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  try {
    const { listings } = await api(`/api/listings?${params}`);
    count.textContent = `${listings.length} item${listings.length === 1 ? '' : 's'} found`;
    grid.innerHTML = listings.length
      ? listings.map(listingCard).join('')
      : '<div class="empty">No listings match those filters.</div>';
  } catch (err) {
    toast(err.message);
  }
}

form.addEventListener('input', () => {
  clearTimeout(window.__filterTimer);
  window.__filterTimer = setTimeout(loadListings, 250);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  loadListings();
});

await loadCategories();
await loadListings();

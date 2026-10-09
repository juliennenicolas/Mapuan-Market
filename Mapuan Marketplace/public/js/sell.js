import { api, requireLogin, toast } from './app.js';

if (requireLogin()) {
  const form = document.querySelector('#sellForm');
  const categorySelect = document.querySelector('#categoryId');

  try {
    const { categories } = await api('/api/categories');
    categorySelect.innerHTML = categories.map(c =>
      `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`
    ).join('');
  } catch (err) {
    toast(err.message);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = new FormData(form);

    try {
      const { listing } = await api('/api/listings', {
        method: 'POST',
        body
      });
      toast('Listing posted!');
      setTimeout(() => location.href = `/listing.html?id=${listing.id}`, 500);
    } catch (err) {
      toast(err.message);
    }
  });
}

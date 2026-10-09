import { api, requireLogin, listingCard, toast } from './app.js';

if (requireLogin()) {
  const grid = document.querySelector('#myListingGrid');

  async function load() {
    try {
      const { listings } = await api('/api/listings/mine');
      grid.innerHTML = listings.length
        ? listings.map(item => `
          <div>
            ${listingCard(item)}
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-soft" data-status="${item.id}" data-value="Sold">Mark sold</button>
              <button class="btn btn-danger" data-delete="${item.id}">Remove</button>
            </div>
          </div>
        `).join('')
        : '<div class="empty">You have not posted anything yet.</div>';
    } catch (err) {
      toast(err.message);
    }
  }

  document.addEventListener('click', async (e) => {
    const statusBtn = e.target.closest('[data-status]');
    const deleteBtn = e.target.closest('[data-delete]');

    try {
      if (statusBtn) {
        const form = new FormData();
        form.append('status', statusBtn.dataset.value);
        await api(`/api/listings/${statusBtn.dataset.status}`, { method: 'PUT', body: form });
        toast('Listing updated.');
        load();
      }

      if (deleteBtn) {
        await api(`/api/listings/${deleteBtn.dataset.delete}`, { method: 'DELETE' });
        toast('Listing removed.');
        load();
      }
    } catch (err) {
      toast(err.message);
    }
  });

  load();
}

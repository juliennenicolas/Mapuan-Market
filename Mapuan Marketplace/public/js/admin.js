import { api, getUser, requireLogin, toast, escapeHtml, peso } from './app.js';

if (requireLogin()) {
  const me = getUser();
  if (me?.role !== 'admin') {
    location.href = '/index.html';
  } else {
    const statGrid = document.querySelector('#statGrid');
    const usersBody = document.querySelector('#usersBody');
    const listingsBody = document.querySelector('#listingsBody');

    async function load() {
      try {
        const [stats, userData, listingData] = await Promise.all([
          api('/api/admin/stats'),
          api('/api/admin/users'),
          api('/api/admin/listings')
        ]);

        statGrid.innerHTML = `
          <div class="panel"><div class="muted">Active users</div><div class="price">${stats.users}</div></div>
          <div class="panel"><div class="muted">Listings</div><div class="price">${stats.listings}</div></div>
          <div class="panel"><div class="muted">Messages</div><div class="price">${stats.messages}</div></div>
        `;

        usersBody.innerHTML = userData.users.map(u => `
          <tr>
            <td>${escapeHtml(u.full_name)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(u.role)}</td>
            <td>${u.is_active ? 'Active' : 'Disabled'}</td>
            <td><button class="btn btn-soft" data-user-toggle="${u.id}">Toggle</button></td>
          </tr>
        `).join('');

        listingsBody.innerHTML = listingData.listings.map(l => `
          <tr>
            <td>${escapeHtml(l.title)}</td>
            <td>${escapeHtml(l.seller_name)}</td>
            <td>${peso(l.price)}</td>
            <td>${escapeHtml(l.status)}</td>
            <td><button class="btn btn-danger" data-listing-remove="${l.id}">Remove</button></td>
          </tr>
        `).join('');
      } catch (err) {
        toast(err.message);
      }
    }

    document.addEventListener('click', async (e) => {
      const userBtn = e.target.closest('[data-user-toggle]');
      const listingBtn = e.target.closest('[data-listing-remove]');

      try {
        if (userBtn) {
          await api(`/api/admin/users/${userBtn.dataset.userToggle}/toggle`, { method: 'PATCH' });
          toast('User status changed.');
          load();
        }

        if (listingBtn) {
          await api(`/api/admin/listings/${listingBtn.dataset.listingRemove}/remove`, { method: 'PATCH' });
          toast('Listing removed.');
          load();
        }
      } catch (err) {
        toast(err.message);
      }
    });

    load();
  }
}

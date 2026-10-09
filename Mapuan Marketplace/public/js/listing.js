import { api, getUser, peso, escapeHtml, toast, requireLogin, timeAgo } from './app.js';

const id = new URLSearchParams(location.search).get('id');
const root = document.querySelector('#listingDetail');

async function init() {
  if (!id) {
    root.innerHTML = '<div class="empty">Listing not found.</div>';
    return;
  }

  try {
    const { listing } = await api(`/api/listings/${id}`);
    const user = getUser();

    const image = listing.imageUrl
      ? `<img src="${listing.imageUrl}" alt="${escapeHtml(listing.title)}">`
      : '<span style="font-size:5rem">📦</span>';

    const mine = user?.id === listing.seller.id;

    root.innerHTML = `
      <div class="detail-grid">
        <div class="detail-image">${image}</div>
        <div class="detail-info">
          <div class="eyebrow">${listing.category.icon || '📦'} ${escapeHtml(listing.category.name)}</div>
          <h1>${escapeHtml(listing.title)}</h1>
          <div class="price" style="font-size:2.2rem">${peso(listing.price)}</div>
          <div class="badge-row">
            <span class="badge">${escapeHtml(listing.condition)}</span>
            <span class="badge">${escapeHtml(listing.meetupLocation)}</span>
            <span class="badge">${escapeHtml(listing.status)}</span>
          </div>

          <div class="seller-card">
            <div class="avatar" style="background:${listing.seller.avatarColor || '#D71920'}">
              ${escapeHtml(listing.seller.name.charAt(0).toUpperCase())}
            </div>
            <div>
              <strong>${escapeHtml(listing.seller.name)}</strong>
              <div class="muted">${escapeHtml(listing.seller.course || 'Mapúa student')} · ${escapeHtml(listing.seller.campus)}</div>
            </div>
          </div>

          <div class="panel" style="margin:18px 0">
            <strong>Description</strong>
            <p class="muted" style="line-height:1.8">${escapeHtml(listing.description || 'No description provided.')}</p>
            <small class="muted">Posted ${timeAgo(listing.createdAt)}</small>
          </div>

          ${
            mine
              ? '<a class="btn btn-dark" href="/my-listings.html">Manage this listing</a>'
              : `<button class="btn btn-primary" id="messageBtn">Message seller</button>`
          }
        </div>
      </div>
    `;

    document.querySelector('#messageBtn')?.addEventListener('click', () => {
      if (!requireLogin()) return;
      location.href = `/messages.html?withUser=${listing.seller.id}&listingId=${listing.id}`;
    });
  } catch (err) {
    root.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

init();

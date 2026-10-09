const TOKEN_KEY = 'mapuan_marketplace_token';
const USER_KEY = 'mapuan_marketplace_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  location.href = '/login.html';
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();

  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, { ...options, headers });
  let data = {};
  try { data = await response.json(); } catch {}

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

export function peso(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function timeAgo(value) {
  if (!value) return '';
  const date = new Date(value.replace(' ', 'T'));
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  for (const [name, size] of units) {
    const count = Math.floor(seconds / size);
    if (count >= 1) return `${count} ${name}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function toast(message) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function requireLogin() {
  if (!getToken()) {
    location.href = `/login.html?next=${encodeURIComponent(location.pathname + location.search)}`;
    return false;
  }
  return true;
}

export function listingCard(item) {
  const image = item.imageUrl
    ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}">`
    : `<span>📦</span>`;

  return `
    <a class="listing-card" href="/listing.html?id=${item.id}">
      <div class="listing-image">${image}</div>
      <div class="listing-body">
        <div class="price">${peso(item.price)}</div>
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-meta">${escapeHtml(item.meetupLocation)} · ${timeAgo(item.createdAt)}</div>
        <div class="badge-row">
          <span class="badge">${escapeHtml(item.category?.name || '')}</span>
          <span class="badge">${escapeHtml(item.condition || '')}</span>
        </div>
      </div>
    </a>
  `;
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderNav() {
  const user = getUser();
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  nav.innerHTML = `
    <div class="navbar">
      <div class="container nav-inner">
        <a class="brand" href="./index.html">
          <span class="brand-mark">M</span>
          <span>Mapúan Marketplace</span>
        </a>

        <nav class="nav-links">
          <a href="./browse.html">Browse</a>
          <a href="./sell.html">Sell</a>
          <a href="./messages.html">Messages</a>
          <a href="./my-listings.html">My Listings</a>
          ${user?.role === 'admin' ? '<a href="./admin.html">Admin</a>' : ''}
        </nav>

        <div class="nav-actions">
          ${
            user
              ? `<a class="btn btn-soft" href="./profile.html">${escapeHtml(user.fullName?.split(' ')[0] || 'Profile')}</a>
                 <button class="btn btn-dark" id="logoutBtn">Log out</button>`
              : `<a class="btn btn-soft" href="./login.html">Log in</a>
                 <a class="btn btn-primary" href="./register.html">Join</a>`
          }
        </div>
      </div>
    </div>
  `;

  document.querySelector('#logoutBtn')?.addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', renderNav);

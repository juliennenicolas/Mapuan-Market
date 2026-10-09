import { api, getUser, requireLogin, escapeHtml, peso, toast } from './app.js';

if (requireLogin()) {
  const currentUser = getUser();
  const threadList = document.querySelector('#threadList');
  const chatHead = document.querySelector('#chatHead');
  const chatMessages = document.querySelector('#chatMessages');
  const compose = document.querySelector('#compose');
  const input = document.querySelector('#messageInput');

  let active = {
    otherUserId: Number(new URLSearchParams(location.search).get('withUser')) || null,
    listingId: Number(new URLSearchParams(location.search).get('listingId')) || null
  };

  async function loadThreads() {
    try {
      const { threads } = await api('/api/messages/threads');

      threadList.innerHTML = threads.length
        ? threads.map(t => `
          <div class="thread-item ${active.otherUserId === t.otherUserId && active.listingId === t.listingId ? 'active' : ''}"
               data-user="${t.otherUserId}" data-listing="${t.listingId || ''}">
            <strong>${escapeHtml(t.otherUserName)}</strong>
            <div class="muted" style="font-size:.84rem">${escapeHtml(t.listingTitle || 'General conversation')}</div>
            <div style="margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${t.lastMessageIsMine ? 'You: ' : ''}${escapeHtml(t.lastMessage)}
            </div>
          </div>
        `).join('')
        : '<div class="empty" style="margin:16px;padding:24px">No conversations yet.</div>';
    } catch (err) {
      toast(err.message);
    }
  }

  async function loadThread() {
    if (!active.otherUserId) {
      chatHead.textContent = 'Select a conversation';
      chatMessages.innerHTML = '<div class="empty">Choose a thread, or message a seller from a listing.</div>';
      compose.style.display = 'none';
      return;
    }

    try {
      const params = new URLSearchParams({ withUser: active.otherUserId });
      if (active.listingId) params.set('listingId', active.listingId);

      const data = await api(`/api/messages/thread?${params}`);

      chatHead.innerHTML = `
        ${escapeHtml(data.otherUser.name)}
        ${data.listing ? `<span class="muted"> · ${escapeHtml(data.listing.title)} · ${peso(data.listing.price)}</span>` : ''}
      `;

      chatMessages.innerHTML = data.messages.length
        ? data.messages.map(m => `
          <div class="bubble ${m.senderId === currentUser.id ? 'mine' : ''}">
            ${escapeHtml(m.body)}
          </div>
        `).join('')
        : '<div class="empty">No messages yet. Say hi.</div>';

      compose.style.display = 'flex';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      toast(err.message);
    }
  }

  threadList.addEventListener('click', (e) => {
    const item = e.target.closest('.thread-item');
    if (!item) return;
    active.otherUserId = Number(item.dataset.user);
    active.listingId = item.dataset.listing ? Number(item.dataset.listing) : null;
    loadThreads();
    loadThread();
  });

  compose.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = input.value.trim();
    if (!body) return;

    try {
      await api('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: active.otherUserId,
          listingId: active.listingId,
          body
        })
      });
      input.value = '';
      await loadThread();
      await loadThreads();
    } catch (err) {
      toast(err.message);
    }
  });

  await loadThreads();
  await loadThread();
}

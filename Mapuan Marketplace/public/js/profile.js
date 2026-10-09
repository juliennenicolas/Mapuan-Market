import { api, requireLogin, getUser, saveSession, getToken, toast } from './app.js';

if (requireLogin()) {
  const form = document.querySelector('#profileForm');

  async function load() {
    try {
      const { user } = await api('/api/users/profile');
      form.fullName.value = user.full_name || '';
      form.email.value = user.email || '';
      form.course.value = user.course || '';
      form.campus.value = user.campus || 'Intramuros Campus';
      form.avatarColor.value = user.avatar_color || '#D71920';
    } catch (err) {
      toast(err.message);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    try {
      await api('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const current = getUser();
      saveSession(getToken(), {
        ...current,
        fullName: payload.fullName,
        campus: payload.campus,
        course: payload.course,
        avatarColor: payload.avatarColor
      });

      toast('Profile updated.');
      setTimeout(() => location.reload(), 500);
    } catch (err) {
      toast(err.message);
    }
  });

  load();
}

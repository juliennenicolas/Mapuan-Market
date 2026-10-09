import { api, saveSession, toast } from './app.js';

const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(loginForm);
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form))
    });
    saveSession(data.token, data.user);
    const next = new URLSearchParams(location.search).get('next') || '/index.html';
    location.href = next;
  } catch (err) {
    toast(err.message);
  }
});

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(registerForm);
  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form))
    });
    saveSession(data.token, data.user);
    location.href = '/index.html';
  } catch (err) {
    toast(err.message);
  }
});

import { supabase } from './supabase.js';

const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');

const { data: { session } } = await supabase.auth.getSession();
if (session) location.href = 'dashboard.html';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  message.textContent = 'Signing in…';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    message.textContent = error.message;
    return;
  }
  location.href = 'dashboard.html';
});

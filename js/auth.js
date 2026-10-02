import { supabase } from './supabase.js';

export async function requireUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const target = location.pathname.endsWith('/pages/staff.html') ? '../index.html' : 'index.html';
    location.href = target;
    return null;
  }
  return session.user;
}

export async function signOut() {
  await supabase.auth.signOut();
  location.href = location.pathname.endsWith('/pages/staff.html') ? '../index.html' : 'index.html';
}

export function wireLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', signOut);
}

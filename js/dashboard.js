import { supabase } from './supabase.js';
import { requireUser, wireLogout } from './auth.js';

const user = await requireUser();
if (!user) throw new Error('Not authenticated');
wireLogout();
document.getElementById('userEmail').textContent = user.email || '';

async function count(table, filter = null) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = q.eq(filter.column, filter.value);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

try {
  document.getElementById('staffCount').textContent = await count('staff_members');
  document.getElementById('activeCount').textContent = await count('staff_members', { column: 'status', value: 'active' });
  document.getElementById('teacherCount').textContent = await count('teachers');
  document.getElementById('branchCount').textContent = await count('branches');
} catch (e) {
  document.getElementById('dashboardMessage').textContent = e.message;
}

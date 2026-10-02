import { supabase } from './supabase.js';
import { requireUser, wireLogout } from './auth.js';

const user = await requireUser();
if (!user) throw new Error('Not authenticated');
wireLogout();
document.getElementById('userEmail').textContent = user.email || '';

const $ = (id) => document.getElementById(id);
const modal = $('staffModal');
let branches = [], roles = [], instruments = [], staffRows = [];

async function loadMasters() {
  const [b, r, i] = await Promise.all([
    supabase.from('branches').select('id,branch_code,branch_name').eq('status','active').order('branch_name'),
    supabase.from('roles').select('id,role_code,role_name').order('role_name'),
    supabase.from('instruments').select('id,instrument_code,instrument_name').eq('status','active').order('instrument_name')
  ]);
  if (b.error) throw b.error; if (r.error) throw r.error; if (i.error) throw i.error;
  branches = b.data || []; roles = r.data || []; instruments = i.data || [];
  $('branchId').innerHTML = branches.map(x => `<option value="${x.id}">${escapeHtml(x.branch_name)} (${escapeHtml(x.branch_code)})</option>`).join('');
  $('rolesBox').innerHTML = roles.map(x => checkbox('role', x.id, x.role_name)).join('');
  $('instrumentsBox').innerHTML = instruments.map(x => checkbox('instrument', x.id, x.instrument_name)).join('');
}
function checkbox(name, value, label) {
  return `<label class="check"><input type="checkbox" name="${name}" value="${value}"><span>${escapeHtml(label)}</span></label>`;
}
function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function branchName(id) { return branches.find(x=>x.id===id)?.branch_name || '—'; }

async function loadStaff() {
  const { data, error } = await supabase.from('staff_members')
    .select('id,employee_id,full_name,branch_id,staff_type,status,email,phone,notes')
    .order('full_name');
  if (error) throw error;
  staffRows = data || [];

  const { data: roleData, error: roleError } = await supabase
    .from('staff_role_assignments')
    .select('staff_id,role_id,roles(role_name)');
  if (roleError) throw roleError;

  const { data: teacherData, error: teacherError } = await supabase
    .from('teachers')
    .select('id,employee_id');
  if (teacherError) throw teacherError;

  const teacherMap = Object.fromEntries((teacherData||[]).map(t=>[t.employee_id,t.id]));
  const teacherIds = (teacherData||[]).map(t=>t.id);
  let ti = [];
  if (teacherIds.length) {
    const { data, error } = await supabase.from('teacher_instruments')
      .select('teacher_id,instrument_id,instruments(instrument_name)')
      .in('teacher_id', teacherIds);
    if (error) throw error;
    ti = data || [];
  }

  const rolesByStaff = {};
  (roleData||[]).forEach(x => (rolesByStaff[x.staff_id] ||= []).push(x.roles?.role_name));
  const instByTeacher = {};
  ti.forEach(x => (instByTeacher[x.teacher_id] ||= []).push(x.instruments?.instrument_name));

  $('staffTable').innerHTML = staffRows.map(s => {
    const rid = rolesByStaff[s.id] || [];
    const iid = instByTeacher[teacherMap[s.employee_id]] || [];
    return `<tr>
      <td>${escapeHtml(s.employee_id)}</td>
      <td><strong>${escapeHtml(s.full_name)}</strong></td>
      <td>${escapeHtml(s.staff_type)}</td>
      <td>${escapeHtml(branchName(s.branch_id))}</td>
      <td><span class="status ${s.status==='active'?'active':'inactive'}">${escapeHtml(s.status)}</span></td>
      <td>${escapeHtml(rid.join(', ') || '—')}</td>
      <td>${escapeHtml(iid.join(', ') || '—')}</td>
      <td class="actions"><button class="small" data-edit="${s.id}">Edit</button>
      ${s.status==='active' ? `<button class="small danger" data-deactivate="${s.id}">Deactivate</button>` : ''}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="8">No staff found.</td></tr>';
}

function openAdd() {
  $('modalTitle').textContent = 'Add Staff';
  $('staffForm').reset();
  $('editingId').value = '';
  if (branches[0]) $('branchId').value = branches[0].id;
  $('teacherSection').classList.toggle('hidden', $('staffType').value !== 'teacher');
  modal.classList.remove('hidden');
}
async function openEdit(id) {
  const s = staffRows.find(x=>x.id===id);
  if (!s) return;
  $('modalTitle').textContent = 'Edit Staff';
  $('editingId').value = s.id;
  $('fullName').value = s.full_name || '';
  $('employeeId').value = s.employee_id || '';
  $('staffEmail').value = s.email || '';
  $('phone').value = s.phone || '';
  $('branchId').value = s.branch_id || '';
  $('staffType').value = s.staff_type || 'teacher';
  $('status').value = s.status || 'active';
  $('notes').value = s.notes || '';
  document.querySelectorAll('input[name=role],input[name=instrument]').forEach(x=>x.checked=false);

  const { data: ra } = await supabase.from('staff_role_assignments').select('role_id').eq('staff_id', id);
  (ra||[]).forEach(x => { const el=document.querySelector(`input[name=role][value="${x.role_id}"]`); if(el) el.checked=true; });

  if (s.staff_type === 'teacher') {
    const { data: t } = await supabase.from('teachers').select('id').eq('employee_id', s.employee_id).maybeSingle();
    if (t) {
      const { data: ti } = await supabase.from('teacher_instruments').select('instrument_id').eq('teacher_id', t.id);
      (ti||[]).forEach(x => { const el=document.querySelector(`input[name=instrument][value="${x.instrument_id}"]`); if(el) el.checked=true; });
    }
  }
  $('teacherSection').classList.toggle('hidden', s.staff_type !== 'teacher');
  modal.classList.remove('hidden');
}

$('staffType').addEventListener('change', () => {
  $('teacherSection').classList.toggle('hidden', $('staffType').value !== 'teacher');
});

$('addStaffBtn').addEventListener('click', openAdd);
$('closeModal').addEventListener('click', ()=>modal.classList.add('hidden'));
$('cancelBtn').addEventListener('click', ()=>modal.classList.add('hidden'));

$('staffTable').addEventListener('click', async (e) => {
  const edit = e.target.closest('[data-edit]');
  const deact = e.target.closest('[data-deactivate]');
  if (edit) await openEdit(edit.dataset.edit);
  if (deact) {
    if (!confirm('Deactivate this staff member? Their history will be preserved.')) return;
    const { error } = await supabase.from('staff_members').update({status:'inactive'}).eq('id', deact.dataset.deactivate);
    if (error) return $('staffMessage').textContent = error.message;
    await loadStaff();
  }
});

$('staffForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('formMessage'); msg.textContent='Saving…';
  const editingId = $('editingId').value || null;
  const full_name = $('fullName').value.trim();
  let employee_id = $('employeeId').value.trim();
  const branch_id = $('branchId').value;
  const staff_type = $('staffType').value;
  const status = $('status').value;
  const email = $('staffEmail').value.trim() || null;
  const phone = $('phone').value.trim() || null;
  const notes = $('notes').value.trim() || null;

  try {
    if (!employee_id) {
      const { data, error } = await supabase.from('staff_members').select('employee_id').like('employee_id','STF%');
      if (error) throw error;
      const nums = (data||[]).map(x=>parseInt(String(x.employee_id).replace(/^STF/,''),10)).filter(Number.isFinite);
      employee_id = `STF${String((nums.length?Math.max(...nums):0)+1).padStart(3,'0')}`;
    }

    let staffId = editingId;
    if (editingId) {
      const { error } = await supabase.from('staff_members').update({full_name,employee_id,branch_id,staff_type,status,email,phone,notes}).eq('id',editingId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('staff_members').insert({full_name,employee_id,branch_id,staff_type,status,login_enabled:false,email,phone,notes}).select('id').single();
      if (error) throw error;
      staffId = data.id;
    }

    const selectedRoles = [...document.querySelectorAll('input[name=role]:checked')].map(x=>x.value);
    await supabase.from('staff_role_assignments').delete().eq('staff_id', staffId);
    if (selectedRoles.length) {
      const { error } = await supabase.from('staff_role_assignments').insert(selectedRoles.map(role_id=>({staff_id:staffId,role_id})));
      if (error) throw error;
    }

    if (staff_type === 'teacher') {
      let teacher;
      const existing = await supabase.from('teachers').select('id,teacher_code').eq('employee_id',employee_id).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) {
        const { data, error } = await supabase.from('teachers').update({full_name,branch_id,status,notes}).eq('id',existing.data.id).select('id').single();
        if (error) throw error; teacher=data;
      } else {
        const { data: codes, error: ce } = await supabase.from('teachers').select('teacher_code');
        if (ce) throw ce;
        const nums=(codes||[]).map(x=>parseInt(String(x.teacher_code).replace(/\D/g,''),10)).filter(Number.isFinite);
        const teacher_code=`SOHMI-TCH-${String((nums.length?Math.max(...nums):0)+1).padStart(3,'0')}`;
        const { data, error } = await supabase.from('teachers').insert({teacher_code,employee_id,branch_id,full_name,status,notes}).select('id').single();
        if (error) throw error; teacher=data;
      }
      const selectedInst = [...document.querySelectorAll('input[name=instrument]:checked')].map(x=>x.value);
      await supabase.from('teacher_instruments').delete().eq('teacher_id',teacher.id);
      if (selectedInst.length) {
        const { error } = await supabase.from('teacher_instruments').insert(selectedInst.map(instrument_id=>({teacher_id:teacher.id,instrument_id})));
        if (error) throw error;
      }
    }

    msg.textContent='Saved successfully.';
    await loadStaff();
    setTimeout(()=>modal.classList.add('hidden'),400);
  } catch (err) {
    msg.textContent = err.message || String(err);
  }
});

await loadMasters();
await loadStaff();

/**
 * admin-logic.js — Clivon Edu / Admin Mestre
 * API real via CONFIG.apiFetch() (config.js)
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   1. ESTADO LOCAL (cache em memória)
════════════════════════════════════════════════════════════ */

const state = {
  teachers: [],
  students: [],
  classes:  [],
};


/* ════════════════════════════════════════════════════════════
   2. HELPERS DE API
════════════════════════════════════════════════════════════ */

async function apiGet(path) {
  const res = await CONFIG.apiFetch(path);
  if (!res) throw new Error('Sem resposta do servidor.');
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch (_) {}
    throw new Error(body.detail || `Erro ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, payload) {
  const res = await CONFIG.apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res) throw new Error('Sem resposta do servidor.');
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch (_) {}
    throw new Error(body.detail || `Erro ${res.status}`);
  }
  return res.json();
}


/* ════════════════════════════════════════════════════════════
   3. NAVEGAÇÃO / ROUTING
════════════════════════════════════════════════════════════ */

function setView(name, tabEl) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));

  document.getElementById(`view-${name}`).classList.add('active');
  tabEl.classList.add('active');

  const viewLoaders = {
    dashboard:   loadDashboard,
    professores: loadProfessores,
    alunos:      loadAlunos,
    turmas:      loadTurmas,
  };

  viewLoaders[name]?.();
}

function toggleDD() {
  document.getElementById('dd').classList.toggle('open');
}

function logout(event) {
  event.stopPropagation();
  if (!confirm('Sair do painel Mestre?')) return;
  ['clivon_token', 'clivon_user', 'clivon_role', 'clivon_token_ts'].forEach((k) =>
    localStorage.removeItem(k)
  );
  window.location.href = 'LoginAdmin.html';
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-user')) document.getElementById('dd').classList.remove('open');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape')
    document.querySelectorAll('.modal-bg.open').forEach((m) => m.classList.remove('open'));
});


/* ════════════════════════════════════════════════════════════
   4. MODAIS
════════════════════════════════════════════════════════════ */

function openM(id)  { document.getElementById(id).classList.add('open'); }
function closeM(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-bg').forEach((el) => {
  el.addEventListener('click', (e) => { if (e.target === el) closeM(el.id); });
});


/* ════════════════════════════════════════════════════════════
   5. TOAST
════════════════════════════════════════════════════════════ */

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  el.className = `toast show${type ? ` ${type}` : ''}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3000);
}


/* ════════════════════════════════════════════════════════════
   6. UTILITÁRIOS DE RENDERIZAÇÃO
════════════════════════════════════════════════════════════ */

function initials(name) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');
}

const AV_COLORS = ['av-blue', 'av-green', 'av-yellow', 'av-purple'];
const avColor   = (i) => AV_COLORS[i % AV_COLORS.length];

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}"><div class="empty"><p>${msg}</p></div></td></tr>`;
}

const ROLE_LABELS = { admin: 'Admin', coordinator: 'Coordenador', teacher: 'Professor' };
const ROLE_CSS    = { admin: 'role-admin', coordinator: 'role-coordinator', teacher: 'role-teacher' };

const ICON_LOCK  = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const ICON_X     = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const ICON_CHECK = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_COPY  = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const ICON_USERS = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;


/* ════════════════════════════════════════════════════════════
   7. DASHBOARD
════════════════════════════════════════════════════════════ */

async function loadDashboard() {
  try {
    const data = await apiGet('/admin/stats');
    document.getElementById('st-teachers').textContent = data.total_teachers ?? '—';
    document.getElementById('st-students').textContent = data.total_students ?? '—';
    document.getElementById('st-classes').textContent  = data.total_classes  ?? '—';
    document.getElementById('st-scans').textContent    = data.total_scans    ?? 0;
  } catch (err) {
    toast(`Erro ao carregar dashboard: ${err.message}`, 'err');
  }

  const feed = document.getElementById('activityFeed');
  if (feed) feed.innerHTML = `<div class="feed-item"><span class="feed-dot dot-blue"></span><span>Sistema carregado.</span></div>`;
}


/* ════════════════════════════════════════════════════════════
   8. PROFESSORES
════════════════════════════════════════════════════════════ */

async function loadProfessores() {
  try {
    state.teachers = await apiGet('/admin/teachers');
    renderProfs();
  } catch (err) {
    toast(`Erro ao carregar professores: ${err.message}`, 'err');
  }
}

function renderProfs(list, roleFilter = '') {
  const source   = list || state.teachers;
  const filtered = roleFilter ? source.filter((t) => t.role === roleFilter) : source;

  document.getElementById('profCount').textContent = filtered.length;
  const tbody = document.getElementById('profBody');

  if (!filtered.length) { tbody.innerHTML = emptyRow(6, 'Nenhum professor encontrado.'); return; }

  tbody.innerHTML = filtered.map((t, i) => `
    <tr>
      <td>
        <div class="td-name">
          <div class="av ${avColor(i)}">${initials(t.name)}</div>
          <div style="font-weight:600;">${t.name}</div>
        </div>
      </td>
      <td style="color:var(--muted);font-size:13px;">${t.email}</td>
      <td><span class="role-pill ${ROLE_CSS[t.role] || ''}">${ROLE_LABELS[t.role] || t.role}</span></td>
      <td><span style="color:var(--xs);font-size:12px;">—</span></td>
      <td><span class="badge ${t.is_active ? 'bg-green' : 'bg-red'}">${t.is_active ? '● Ativo' : '○ Inativo'}</span></td>
      <td>
        <div class="actions">
          <button class="ibtn warn" title="Redefinir senha" onclick="abrirResetSenha('${t.id}','${t.name}','${t.email}')">${ICON_LOCK}</button>
          ${t.is_active
            ? `<button class="ibtn del" title="Desativar" onclick="desativarProf('${t.id}','${t.name}')">${ICON_X}</button>`
            : `<button class="ibtn" title="Reativar" onclick="reativarProf('${t.id}','${t.name}')">${ICON_CHECK}</button>`}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterProfs(query, role = '') {
  const lower    = query.toLowerCase();
  const filtered = state.teachers.filter((t) =>
    t.name.toLowerCase().includes(lower) || t.email.toLowerCase().includes(lower)
  );
  renderProfs(filtered, role);
}

async function salvarProfessor(event) {
  event.preventDefault();
  const btn = document.getElementById('btnSalvarProf');
  btn.disabled = true;
  btn.innerHTML = '<div class="spin"></div> Salvando…';

  try {
    const tokenPayload = JSON.parse(atob(localStorage.getItem('clivon_token').split('.')[1]));
    await apiPost('/register', {
      name:      document.getElementById('pNome').value.trim(),
      email:     document.getElementById('pEmail').value.trim(),
      password:  document.getElementById('pSenha').value,
      role:      document.getElementById('pRole').value,
      school_id: tokenPayload.school_id,
    });
    toast('Professor cadastrado com sucesso!', 'ok');
    closeM('mProfessor');
    event.target.reset();
    await loadProfessores();
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `${ICON_LOCK} Salvar Professor`;
  }
}

function abrirResetSenha(id, nome, email) {
  document.getElementById('rsProfNome').value  = nome;
  document.getElementById('rsProfEmail').value = email;
  openM('mResetSenha');
}

async function confirmarResetSenha(event) {
  event.preventDefault();
  toast('Função disponível em breve.', 'warn');
  closeM('mResetSenha');
}

async function desativarProf(id, nome) {
  if (!confirm(`Desativar ${nome}? O acesso será bloqueado.`)) return;
  try {
    await apiPost(`/admin/teachers/${id}/deactivate`, {});
    toast(`${nome} desativado.`, 'warn');
    await loadProfessores();
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  }
}

async function reativarProf(id, nome) {
  try {
    await apiPost(`/admin/teachers/${id}/activate`, {});
    toast(`${nome} reativado.`, 'ok');
    await loadProfessores();
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  }
}


/* ════════════════════════════════════════════════════════════
   9. ALUNOS
════════════════════════════════════════════════════════════ */

async function loadAlunos() {
  try {
    state.students = await apiGet('/admin/students');
    renderAlunos();
  } catch (err) {
    toast(`Erro ao carregar alunos: ${err.message}`, 'err');
  }
}

function populateTurmaSelects() {
  const options = state.classes.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  ['aTurma', 'csvTurma'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">Selecione...</option>' + options;
  });
  const filter = document.getElementById('alunoTurmaFilter');
  if (filter) filter.innerHTML = '<option value="">Todas as turmas</option>' + options;
}

function renderAlunos(list) {
  const turmaFilter = document.getElementById('alunoTurmaFilter')?.value || '';
  const source      = list || state.students;
  const filtered    = turmaFilter ? source.filter((a) => a.class_id === turmaFilter) : source;

  document.getElementById('alunoCount').textContent = filtered.length;
  const tbody = document.getElementById('alunoBody');

  if (!filtered.length) { tbody.innerHTML = emptyRow(6, 'Nenhum aluno encontrado.'); return; }

  tbody.innerHTML = filtered.map((a) => `
    <tr>
      <td>
        <div class="td-name">
          <div class="av av-green">${initials(a.name)}</div>
          <span style="font-weight:600;">${a.name}</span>
        </div>
      </td>
      <td><code>${a.enrollment}</code></td>
      <td><span class="tag">${a.class_name || '—'}</span></td>
      <td style="color:var(--muted);font-size:13px;">${fmtDate(a.birth_date)}</td>
      <td><span class="badge ${a.is_active ? 'bg-green' : 'bg-red'}">${a.is_active ? '● Ativo' : '○ Inativo'}</span></td>
      <td>
        <div class="actions">
          <button class="ibtn warn" title="Redefinir PIN" onclick="abrirResetPin('${a.id}','${a.name}','${a.enrollment}')">${ICON_LOCK}</button>
          <button class="ibtn del" title="Desativar aluno" onclick="desativarAluno('${a.id}','${a.name}')">${ICON_X}</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterAlunos(query) {
  const lower    = query.toLowerCase();
  const filtered = state.students.filter((a) =>
    a.name.toLowerCase().includes(lower) || a.enrollment.includes(lower)
  );
  renderAlunos(filtered);
}

async function salvarAluno(event) {
  event.preventDefault();
  const class_id   = document.getElementById('aTurma').value;
  const name       = document.getElementById('aNome').value.trim();
  const birth_date = document.getElementById('aNasc').value;

  if (!class_id) { toast('Selecione uma turma!', 'err'); return; }

  const btn = document.getElementById('btnSalvarAluno');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spin"></div> Salvando…'; }

  try {
    const result = await apiPost('/admin/students', { class_id, name, birth_date });
    toast(`Aluno cadastrado! Matrícula: ${result.enrollment || ''}`, 'ok');
    closeM('mAluno');
    event.target.reset();
    await loadAlunos();
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Salvar Aluno'; }
  }
}

function abrirResetPin(id, nome, enrollment) {
  document.getElementById('rpAlunoNome').value = nome;
  document.getElementById('rpMatricula').value = enrollment;
  openM('mResetPin');
}

async function confirmarResetPin(event) {
  event.preventDefault();
  toast('Função disponível em breve.', 'warn');
  closeM('mResetPin');
}

async function desativarAluno(id, nome) {
  if (!confirm(`Desativar ${nome}?`)) return;
  try {
    await apiPost(`/admin/students/${id}/deactivate`, {});
    toast(`${nome} desativado.`, 'warn');
    await loadAlunos();
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  }
}

/* ── CSV Import ─────────────────────────────── */

let csvData = [];

function handleCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const lines = ev.target.result.split('\n').filter((l) => l.trim());
    csvData = [];
    const preview = document.getElementById('csvPreview');
    preview.style.display = 'block';
    let html = `<b>${lines.length} linhas encontradas:</b><br><br>`;
    lines.slice(0, 8).forEach((line, i) => {
      const [name, dob] = line.split(',').map((p) => p?.trim());
      if (name && dob) { csvData.push({ name, birth_date: dob }); html += `${i + 1}. ${name} — ${dob}<br>`; }
    });
    if (lines.length > 8) html += `<br>…e mais ${lines.length - 8} alunos.`;
    preview.innerHTML = html;
  };
  reader.readAsText(file);
}

async function importarCSV() {
  const class_id = document.getElementById('csvTurma').value;
  if (!class_id)       { toast('Selecione a turma de destino!', 'err'); return; }
  if (!csvData.length) { toast('Faça upload de um CSV primeiro!', 'err'); return; }

  const btn = document.getElementById('btnImport');
  btn.disabled = true;
  btn.innerHTML = '<div class="spin"></div> Importando…';

  try {
    const result = await apiPost('/admin/students/import', { class_id, students: csvData });
    toast(`✓ ${result.inserted ?? csvData.length}/${result.total ?? csvData.length} alunos importados!`, 'ok');
    closeM('mImportCSV');
    csvData = [];
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('csvFile').value = '';
    await loadAlunos();
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `${ICON_X} Importar Alunos`;
  }
}

(function initDropZone() {
  const dz = document.getElementById('dropZone');
  if (!dz) return;
  dz.addEventListener('dragover',  (e) => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', ()  => dz.classList.remove('drag'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault(); dz.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById('csvFile').files = dt.files;
    handleCSV({ files: [file] });
  });
})();


/* ════════════════════════════════════════════════════════════
   10. TURMAS
════════════════════════════════════════════════════════════ */

async function loadTurmas() {
  try {
    state.classes = await apiGet('/admin/classes');
    renderTurmas();
    populateTurmaSelects();
  } catch (err) {
    toast(`Erro ao carregar turmas: ${err.message}`, 'err');
  }
}

function renderTurmas(list) {
  const source = list || state.classes;
  document.getElementById('turmaCount').textContent = source.length;
  const tbody = document.getElementById('turmaBody');

  if (!source.length) { tbody.innerHTML = emptyRow(7, 'Nenhuma turma criada ainda.'); return; }

  tbody.innerHTML = source.map((c, i) => `
    <tr>
      <td>
        <div class="td-name">
          <div class="av ${avColor(i)}" style="border-radius:8px;">${c.name.slice(0, 2)}</div>
          <span style="font-weight:600;">${c.name}</span>
        </div>
      </td>
      <td style="color:var(--muted);">${c.year ?? '—'}</td>
      <td><span class="badge bg-gray">${c.shift ?? '—'}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:7px;">
          <code style="font-weight:700;letter-spacing:.5px;">${c.join_code}</code>
          <button class="ibtn" title="Copiar código" onclick="copiarCodigo('${c.join_code}')">${ICON_COPY}</button>
        </div>
      </td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="verAlunos('${c.id}')">
          ${ICON_USERS} ${c.students ?? 0} alunos
        </button>
      </td>
      <td><span class="badge ${c.is_active ? 'bg-green' : 'bg-red'}">${c.is_active ? '● Ativa' : '○ Inativa'}</span></td>
      <td>
        <div class="actions">
          <button class="ibtn del" title="Desativar turma" onclick="desativarTurma('${c.id}','${c.name}')">${ICON_X}</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterTurmas(query) {
  const lower    = query.toLowerCase();
  const filtered = state.classes.filter((c) =>
    c.name.toLowerCase().includes(lower) || c.join_code.toLowerCase().includes(lower)
  );
  renderTurmas(filtered);
}

function gerarJoinCode() {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) code += charset[Math.floor(Math.random() * charset.length)];
  document.getElementById('tJoinCode').value = code;
}

async function salvarTurma(event) {
  event.preventDefault();
  const nome     = document.getElementById('tNome').value.trim();
  const ano      = +document.getElementById('tAno').value;
  const turno    = document.getElementById('tTurno').value;
  let   joinCode = document.getElementById('tJoinCode').value.trim().toUpperCase();
  if (!joinCode) { gerarJoinCode(); joinCode = document.getElementById('tJoinCode').value; }

  const btn = document.getElementById('btnSalvarTurma');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spin"></div> Salvando…'; }

  try {
    await apiPost('/admin/classes', { name: nome, year: ano, shift: turno, join_code: joinCode });
    toast(`Turma "${nome}" criada! Código: ${joinCode}`, 'ok');
    closeM('mTurma');
    event.target.reset();
    if (document.getElementById('tAno')) document.getElementById('tAno').value = new Date().getFullYear();
    await loadTurmas();
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Salvar Turma'; }
  }
}

async function verAlunos(classId) {
  const turma = state.classes.find((c) => c.id === classId);
  if (!turma) return;
  document.getElementById('vaTurmaNome').textContent = turma.name;

  const alunos = state.students.filter((a) => a.class_id === classId);
  const tbody  = document.getElementById('vaBody');

  tbody.innerHTML = !alunos.length
    ? emptyRow(4, 'Nenhum aluno nesta turma ainda.')
    : alunos.map((a) => `
        <tr>
          <td><div class="td-name"><div class="av av-green">${initials(a.name)}</div><span>${a.name}</span></div></td>
          <td><code>${a.enrollment}</code></td>
          <td style="color:var(--muted);font-size:13px;">${fmtDate(a.birth_date)}</td>
          <td><span class="badge ${a.is_active ? 'bg-green' : 'bg-red'}">${a.is_active ? '● Ativo' : '○ Inativo'}</span></td>
        </tr>
      `).join('');

  openM('mVerAlunos');
}

async function desativarTurma(id, nome) {
  if (!confirm(`Desativar a turma "${nome}"? Os alunos perderão acesso.`)) return;
  try {
    await apiPost(`/admin/classes/${id}/deactivate`, {});
    toast(`Turma "${nome}" desativada.`, 'warn');
    await loadTurmas();
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  }
}

function copiarCodigo(code) {
  navigator.clipboard?.writeText(code).then(() => toast(`Código "${code}" copiado!`, 'ok'));
}


/* ════════════════════════════════════════════════════════════
   11. INICIALIZAÇÃO
════════════════════════════════════════════════════════════ */

(async function init() {
  const navName = document.getElementById('navUserName');
  if (navName) navName.textContent = localStorage.getItem('clivon_user') || 'Admin';

  await loadDashboard();
  await loadTurmas();
  await Promise.all([loadProfessores(), loadAlunos()]);
})();
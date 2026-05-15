/**
 * admin.js — Clivon Edu / Admin Mestre
 *
 * Organização:
 *   1. Estado local (mock)
 *   2. Helpers de API  (prontos para plugar ao Supabase via config.js / script.js)
 *   3. Navegação / routing
 *   4. Modais
 *   5. Toast
 *   6. Utilitários de renderização
 *   7. Dashboard
 *   8. Professores
 *   9. Alunos
 *  10. Turmas
 *  11. Inicialização
 *
 * Todos os pontos de integração estão marcados com: // ⚡ API:
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   1. ESTADO LOCAL  (substitua pelas chamadas reais ao Supabase)
════════════════════════════════════════════════════════════ */

const state = {
  teachers: [
    { id: 't1', name: 'Letícia Johnson', email: 'leticia@escola.edu.br', role: 'admin',       turmas: ['1º A', '2º B'], is_active: true  },
    { id: 't2', name: 'Carlos Silva',    email: 'carlos@escola.edu.br',  role: 'coordinator', turmas: ['3º A'],          is_active: true  },
    { id: 't3', name: 'Ana Souza',       email: 'ana@escola.edu.br',     role: 'teacher',     turmas: ['1º A'],          is_active: true  },
    { id: 't4', name: 'João Carlos',     email: 'jc@escola.edu.br',      role: 'teacher',     turmas: [],                is_active: false },
  ],

  students: [
    { id: 'a1', name: 'Maria da Silva', enrollment: '2026001001', turma_id: 'c1', turma: '1º Ano A', birth_date: '2010-04-15', is_active: true },
    { id: 'a2', name: 'João Pereira',   enrollment: '2026001002', turma_id: 'c1', turma: '1º Ano A', birth_date: '2009-11-03', is_active: true },
    { id: 'a3', name: 'Ana Oliveira',   enrollment: '2026001003', turma_id: 'c2', turma: '2º Ano B', birth_date: '2008-07-22', is_active: true },
  ],

  classes: [
    { id: 'c1', name: '1º Ano A', year: 2026, shift: 'Manhã', join_code: 'MAT1A26', students: 2, is_active: true },
    { id: 'c2', name: '2º Ano B', year: 2026, shift: 'Tarde', join_code: 'MAT2B26', students: 1, is_active: true },
    { id: 'c3', name: '3º Ano A', year: 2026, shift: 'Manhã', join_code: 'MAT3A26', students: 0, is_active: true },
  ],
};


/* ════════════════════════════════════════════════════════════
   2. HELPERS DE API
════════════════════════════════════════════════════════════ */

/**
 * Chama uma RPC function no Supabase.
 * ⚡ API: descomente o bloco real e remova o mock abaixo.
 */
async function rpc(fn, params) {
  /*
  // ⚡ API: integração real via config.js / script.js
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro na API');
  return data;
  */

  // Mock — simula latência de rede
  await delay(400);
  return { ok: true, ...params };
}

/**
 * Consulta uma tabela via REST do Supabase.
 * ⚡ API: descomente o bloco real e remova o mock abaixo.
 */
async function supabaseGet(table, filters = '') {
  /*
  // ⚡ API: integração real via config.js / script.js
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}&select=*`, {
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return await res.json();
  */

  await delay(300);
  return [];
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


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
    professores: renderProfs,
    alunos:      renderAlunos,
    turmas:      renderTurmas,
  };

  viewLoaders[name]?.();
}

function toggleDD() {
  document.getElementById('dd').classList.toggle('open');
}

function logout(event) {
  event.stopPropagation();
  if (!confirm('Sair do painel Mestre?')) return;
  toast('Saindo…', '');
  // ⚡ API: chame a função de logout do script.js / config.js
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-user')) {
    document.getElementById('dd').classList.remove('open');
  }
});

// Fechar modais com Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-bg.open').forEach((m) => m.classList.remove('open'));
  }
});


/* ════════════════════════════════════════════════════════════
   4. MODAIS
════════════════════════════════════════════════════════════ */

function openM(id) {
  document.getElementById(id).classList.add('open');
}

function closeM(id) {
  document.getElementById(id).classList.remove('open');
}

// Fechar modal ao clicar no backdrop
document.querySelectorAll('.modal-bg').forEach((el) => {
  el.addEventListener('click', (e) => {
    if (e.target === el) closeM(el.id);
  });
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
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');
}

const AV_COLORS = ['av-blue', 'av-green', 'av-yellow', 'av-purple'];
const avColor   = (i) => AV_COLORS[i % AV_COLORS.length];

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}">
    <div class="empty"><p>${msg}</p></div>
  </td></tr>`;
}

const ROLE_LABELS = { admin: 'Admin', coordinator: 'Coordenador', teacher: 'Professor' };
const ROLE_CSS    = { admin: 'role-admin', coordinator: 'role-coordinator', teacher: 'role-teacher' };

/** Ícone SVG de cadeado (redefinir senha/PIN) */
const ICON_LOCK = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>`;

/** Ícone SVG de X (desativar) */
const ICON_X = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

/** Ícone SVG de check (reativar) */
const ICON_CHECK = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <polyline points="20 6 9 17 4 12"/>
</svg>`;

/** Ícone SVG de copiar */
const ICON_COPY = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</svg>`;

/** Ícone SVG de grupo (ver alunos) */
const ICON_USERS = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
</svg>`;


/* ════════════════════════════════════════════════════════════
   7. DASHBOARD
════════════════════════════════════════════════════════════ */

function loadDashboard() {
  // ⚡ API: substitua pelos counts reais do Supabase
  const activeTeachers = state.teachers.filter((t) => t.is_active).length;
  const totalStudents  = state.students.filter((s) => s.is_active).length;
  const activeClasses  = state.classes.filter((c) => c.is_active).length;

  document.getElementById('st-teachers').textContent = activeTeachers;
  document.getElementById('st-students').textContent = totalStudents;
  document.getElementById('st-classes').textContent  = activeClasses;
  document.getElementById('st-scans').textContent    = 87; // ⚡ API: buscar de scan_results

  _renderBarChart();
  _renderActivityFeed();
}

function _renderBarChart() {
  const container = document.getElementById('barChart');
  if (!state.classes.length) {
    container.innerHTML = '<div class="empty" style="padding:30px 0;"><p>Nenhuma turma criada.</p></div>';
    return;
  }

  const max = Math.max(...state.classes.map((c) => c.students), 1);

  container.innerHTML = state.classes
    .map((c) => `
      <div class="bar-row">
        <div class="bar-label">${c.name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(c.students / max) * 100}%"></div>
        </div>
        <div class="bar-count">${c.students}</div>
      </div>
    `)
    .join('');
}

function _renderActivityFeed() {
  // ⚡ API: substituir por query real de audit log ou tabela de eventos
  const activities = [
    { color: '#3B5BF6', text: '<b>Ana Souza</b> cadastrou 3 alunos na turma 1º Ano A', time: 'há 2 min'  },
    { color: '#22C55E', text: '<b>Letícia Johnson</b> corrigiu prova de Matemática — 24 alunos',           time: 'há 18 min' },
    { color: '#F59E0B', text: '<b>João Carlos</b> teve senha redefinida pelo admin',                       time: 'há 1h'     },
    { color: '#A855F7', text: '<b>3º Ano A</b> foi criada com join_code MAT3A26',                          time: 'há 2h'     },
  ];

  document.getElementById('activityList').innerHTML = activities
    .map((a) => `
      <div class="activity-item">
        <div class="act-dot" style="background:${a.color};"></div>
        <div>
          <div class="act-text">${a.text}</div>
          <div class="act-time">${a.time}</div>
        </div>
      </div>
    `)
    .join('');
}


/* ════════════════════════════════════════════════════════════
   8. PROFESSORES
════════════════════════════════════════════════════════════ */

function renderProfs(list, roleFilter = '') {
  const source   = list || state.teachers;
  const filtered = roleFilter ? source.filter((t) => t.role === roleFilter) : source;

  document.getElementById('profCount').textContent = filtered.length;

  const tbody = document.getElementById('profBody');

  if (!filtered.length) {
    tbody.innerHTML = emptyRow(6, 'Nenhum professor encontrado.');
    return;
  }

  tbody.innerHTML = filtered
    .map((t, i) => `
      <tr>
        <td>
          <div class="td-name">
            <div class="av ${avColor(i)}">${initials(t.name)}</div>
            <div><div style="font-weight:600;">${t.name}</div></div>
          </div>
        </td>
        <td style="color:var(--muted);font-size:13px;">${t.email}</td>
        <td><span class="role-pill ${ROLE_CSS[t.role]}">${ROLE_LABELS[t.role]}</span></td>
        <td>
          ${t.turmas.length
            ? t.turmas.map((tu) => `<span class="tag">${tu}</span>`).join('')
            : '<span style="color:var(--xs);font-size:12px;">—</span>'
          }
        </td>
        <td>
          <span class="badge ${t.is_active ? 'bg-green' : 'bg-red'}">
            ${t.is_active ? '● Ativo' : '○ Inativo'}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="ibtn warn" title="Redefinir senha" onclick="abrirResetSenha('${t.id}')">
              ${ICON_LOCK}
            </button>
            ${t.is_active
              ? `<button class="ibtn del" title="Desativar" onclick="desativarProf('${t.id}')">${ICON_X}</button>`
              : `<button class="ibtn" title="Reativar" onclick="reativarProf('${t.id}')">${ICON_CHECK}</button>`
            }
          </div>
        </td>
      </tr>
    `)
    .join('');
}

function filterProfs(query, role = '') {
  const lower  = query.toLowerCase();
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

  const payload = {
    p_school_id: typeof SCHOOL_ID !== 'undefined' ? SCHOOL_ID : 'mock-school',
    p_name:      document.getElementById('pNome').value.trim(),
    p_email:     document.getElementById('pEmail').value.trim(),
    p_password:  document.getElementById('pSenha').value,
    p_role:      document.getElementById('pRole').value,
  };

  try {
    // ⚡ API: await rpc('create_teacher', payload);
    await rpc('create_teacher', payload);

    state.teachers.unshift({
      id:        `t${Date.now()}`,
      name:      payload.p_name,
      email:     payload.p_email,
      role:      payload.p_role,
      turmas:    [],
      is_active: true,
    });

    renderProfs();
    closeM('mProfessor');
    event.target.reset();
    document.getElementById('pSenha').value = 'mudar123';
    toast('Professor cadastrado com sucesso!', 'ok');
  } catch (err) {
    toast(`Erro: ${err.message}`, 'err');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `${ICON_LOCK} Salvar Professor`;
  }
}

function abrirResetSenha(id) {
  const prof = state.teachers.find((t) => t.id === id);
  if (!prof) return;
  document.getElementById('rsProfNome').value  = prof.name;
  document.getElementById('rsProfEmail').value = prof.email;
  openM('mResetSenha');
}

async function confirmarResetSenha(event) {
  event.preventDefault();

  const email = document.getElementById('rsProfEmail').value;
  const senha = document.getElementById('rsNovaSenha').value;

  // ⚡ API: await rpc('reset_teacher_password', { p_email: email, p_new_password: senha });
  await delay(400);

  closeM('mResetSenha');
  toast('Senha redefinida com sucesso!', 'ok');
}

async function desativarProf(id) {
  const prof = state.teachers.find((t) => t.id === id);
  if (!prof || !confirm(`Desativar ${prof.name}? O acesso será bloqueado.`)) return;

  // ⚡ API: await rpc('deactivate_teacher', { p_email: prof.email });
  await delay(400);

  prof.is_active = false;
  renderProfs();
  toast(`${prof.name} desativado.`, 'warn');
}

async function reativarProf(id) {
  const prof = state.teachers.find((t) => t.id === id);
  if (!prof) return;

  // ⚡ API: UPDATE public.teachers SET is_active=true WHERE id=prof.id
  // ⚡ API: UPDATE auth.users SET banned_until=null WHERE id=prof.auth_id
  await delay(400);

  prof.is_active = true;
  renderProfs();
  toast(`${prof.name} reativado.`, 'ok');
}


/* ════════════════════════════════════════════════════════════
   9. ALUNOS
════════════════════════════════════════════════════════════ */

function populateTurmaSelects() {
  const options = state.classes
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join('');

  document.getElementById('aTurma').innerHTML    = '<option value="">Selecione...</option>' + options;
  document.getElementById('csvTurma').innerHTML  = '<option value="">Selecione a turma...</option>' + options;
  document.getElementById('alunoTurmaFilter').innerHTML = '<option value="">Todas as turmas</option>' + options;
}

function renderAlunos(list) {
  const turmaFilter = document.getElementById('alunoTurmaFilter')?.value || '';
  const source      = list || state.students;
  const filtered    = turmaFilter ? source.filter((a) => a.turma_id === turmaFilter) : source;

  document.getElementById('alunoCount').textContent = filtered.length;

  const tbody = document.getElementById('alunoBody');

  if (!filtered.length) {
    tbody.innerHTML = emptyRow(6, 'Nenhum aluno encontrado.');
    return;
  }

  tbody.innerHTML = filtered
    .map((a) => `
      <tr>
        <td>
          <div class="td-name">
            <div class="av av-green">${initials(a.name)}</div>
            <span style="font-weight:600;">${a.name}</span>
          </div>
        </td>
        <td><code>${a.enrollment}</code></td>
        <td><span class="tag">${a.turma}</span></td>
        <td style="color:var(--muted);font-size:13px;">${fmtDate(a.birth_date)}</td>
        <td>
          <span class="badge ${a.is_active ? 'bg-green' : 'bg-red'}">
            ${a.is_active ? '● Ativo' : '○ Inativo'}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="ibtn warn" title="Redefinir PIN" onclick="abrirResetPin('${a.id}')">
              ${ICON_LOCK}
            </button>
            <button class="ibtn del" title="Desativar aluno" onclick="desativarAluno('${a.id}')">
              ${ICON_X}
            </button>
          </div>
        </td>
      </tr>
    `)
    .join('');
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

  const payload = {
    p_school_id:  typeof SCHOOL_ID !== 'undefined' ? SCHOOL_ID : 'mock-school',
    p_class_id:   document.getElementById('aTurma').value,
    p_name:       document.getElementById('aNome').value.trim(),
    p_birth_date: document.getElementById('aNasc').value,
  };

  if (!payload.p_class_id) {
    toast('Selecione uma turma!', 'err');
    return;
  }

  // ⚡ API: await rpc('create_student', payload);
  await delay(500);

  const turma = state.classes.find((c) => c.id === payload.p_class_id);
  const d     = payload.p_birth_date.replace(/-/g, '');
  const pin   = `${d.slice(6, 8)}${d.slice(4, 6)}${d.slice(0, 4)}`; // DDMMAAAA

  const seq = String(state.students.length + 1).padStart(4, '0');

  state.students.unshift({
    id:         `a${Date.now()}`,
    name:       payload.p_name,
    enrollment: `2026001${seq}`,
    turma_id:   payload.p_class_id,
    turma:      turma?.name || '—',
    birth_date: payload.p_birth_date,
    is_active:  true,
  });

  if (turma) turma.students++;

  renderAlunos();
  closeM('mAluno');
  event.target.reset();
  toast(`Aluno cadastrado! PIN: ${pin}`, 'ok');
}

function abrirResetPin(id) {
  const aluno = state.students.find((a) => a.id === id);
  if (!aluno) return;
  document.getElementById('rpAlunoNome').value = aluno.name;
  document.getElementById('rpMatricula').value = aluno.enrollment;
  openM('mResetPin');
}

async function confirmarResetPin(event) {
  event.preventDefault();

  const matricula = document.getElementById('rpMatricula').value;
  const pin       = document.getElementById('rpNovoPIN').value;

  // ⚡ API: await rpc('reset_student_pin', { p_enrollment: matricula, p_new_pin: pin });
  await delay(400);

  closeM('mResetPin');
  toast('PIN redefinido com sucesso!', 'ok');
}

async function desativarAluno(id) {
  const aluno = state.students.find((a) => a.id === id);
  if (!aluno || !confirm(`Desativar ${aluno.name}?`)) return;

  // ⚡ API: UPDATE students SET is_active=false WHERE enrollment=aluno.enrollment
  await delay(300);

  aluno.is_active = false;
  renderAlunos();
  toast(`${aluno.name} desativado.`, 'warn');
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
      if (name && dob) {
        csvData.push({ name, birth_date: dob });
        html += `${i + 1}. ${name} — ${dob}<br>`;
      }
    });

    if (lines.length > 8) html += `<br>…e mais ${lines.length - 8} alunos.`;
    preview.innerHTML = html;
  };

  reader.readAsText(file);
}

async function importarCSV() {
  const classId = document.getElementById('csvTurma').value;

  if (!classId)       { toast('Selecione a turma de destino!', 'err'); return; }
  if (!csvData.length) { toast('Faça upload de um CSV primeiro!', 'err'); return; }

  const btn = document.getElementById('btnImport');
  btn.disabled = true;
  btn.innerHTML = '<div class="spin"></div> Importando…';

  try {
    // ⚡ API: const res = await rpc('import_students', { p_school_id: SCHOOL_ID, p_class_id: classId, p_students: csvData });
    await delay(800);
    const res = { total: csvData.length, inserted: csvData.length, skipped: 0 };

    const turma = state.classes.find((c) => c.id === classId);

    csvData.forEach((s) => {
      state.students.unshift({
        id:         `a${Date.now()}${Math.random()}`,
        name:       s.name,
        enrollment: `2026001${String(state.students.length + 1).padStart(4, '0')}`,
        turma_id:   classId,
        turma:      turma?.name || '—',
        birth_date: s.birth_date,
        is_active:  true,
      });
      if (turma) turma.students++;
    });

    renderAlunos();
    closeM('mImportCSV');
    toast(`✓ ${res.inserted}/${res.total} alunos importados!`, 'ok');
  } finally {
    csvData = [];
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('csvFile').value = '';
    btn.disabled = false;
    btn.innerHTML = `${ICON_X} Importar Alunos`;
  }
}

// Drag & drop CSV
(function initDropZone() {
  const dz = document.getElementById('dropZone');

  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('drag');
  });

  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));

  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('drag');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Atribuir ao input para manter consistência
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById('csvFile').files = dt.files;

    handleCSV({ files: [file] });
  });
})();


/* ════════════════════════════════════════════════════════════
   10. TURMAS
════════════════════════════════════════════════════════════ */

function renderTurmas(list) {
  const source = list || state.classes;
  document.getElementById('turmaCount').textContent = source.length;

  const tbody = document.getElementById('turmaBody');

  if (!source.length) {
    tbody.innerHTML = emptyRow(7, 'Nenhuma turma criada ainda.');
    return;
  }

  tbody.innerHTML = source
    .map((c, i) => `
      <tr>
        <td>
          <div class="td-name">
            <div class="av ${avColor(i)}" style="border-radius:8px;">${c.name.slice(0, 2)}</div>
            <span style="font-weight:600;">${c.name}</span>
          </div>
        </td>
        <td style="color:var(--muted);">${c.year}</td>
        <td><span class="badge bg-gray">${c.shift}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:7px;">
            <code style="font-weight:700;letter-spacing:.5px;">${c.join_code}</code>
            <button class="ibtn" title="Copiar código" onclick="copiarCodigo('${c.join_code}')">
              ${ICON_COPY}
            </button>
          </div>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="verAlunos('${c.id}')">
            ${ICON_USERS}
            ${c.students} alunos
          </button>
        </td>
        <td>
          <span class="badge ${c.is_active ? 'bg-green' : 'bg-red'}">
            ${c.is_active ? '● Ativa' : '○ Inativa'}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="ibtn del" title="Desativar turma" onclick="desativarTurma('${c.id}')">
              ${ICON_X}
            </button>
          </div>
        </td>
      </tr>
    `)
    .join('');
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
  for (let i = 0; i < 7; i++) {
    code += charset[Math.floor(Math.random() * charset.length)];
  }
  document.getElementById('tJoinCode').value = code;
}

async function salvarTurma(event) {
  event.preventDefault();

  const nome    = document.getElementById('tNome').value.trim();
  const ano     = +document.getElementById('tAno').value;
  const turno   = document.getElementById('tTurno').value;
  let joinCode  = document.getElementById('tJoinCode').value.trim().toUpperCase();

  if (!joinCode) {
    gerarJoinCode();
    joinCode = document.getElementById('tJoinCode').value;
  }

  // ⚡ API: INSERT INTO classes (school_id, name, year, shift, join_code, is_active)
  await delay(400);

  const newClass = {
    id:        `c${Date.now()}`,
    name:      nome,
    year:      ano,
    shift:     turno,
    join_code: joinCode,
    students:  0,
    is_active: true,
  };

  state.classes.unshift(newClass);

  renderTurmas();
  populateTurmaSelects();
  closeM('mTurma');
  event.target.reset();
  document.getElementById('tAno').value = '2026';

  toast(`Turma "${nome}" criada! Código: ${joinCode}`, 'ok');
}

function verAlunos(classId) {
  const turma = state.classes.find((c) => c.id === classId);
  if (!turma) return;

  document.getElementById('vaTurmaNome').textContent = turma.name;

  // ⚡ API: SELECT * FROM vw_class_students WHERE class_id = classId
  const alunos = state.students.filter((a) => a.turma_id === classId);
  const tbody  = document.getElementById('vaBody');

  if (!alunos.length) {
    tbody.innerHTML = emptyRow(4, 'Nenhum aluno nesta turma ainda.');
  } else {
    tbody.innerHTML = alunos
      .map((a) => `
        <tr>
          <td>
            <div class="td-name">
              <div class="av av-green">${initials(a.name)}</div>
              <span>${a.name}</span>
            </div>
          </td>
          <td><code>${a.enrollment}</code></td>
          <td style="color:var(--muted);font-size:13px;">${fmtDate(a.birth_date)}</td>
          <td style="color:var(--muted);font-size:13px;">${fmtDate(a.birth_date)}</td>
        </tr>
      `)
      .join('');
  }

  openM('mVerAlunos');
}

async function desativarTurma(id) {
  const turma = state.classes.find((c) => c.id === id);
  if (!turma || !confirm(`Desativar a turma "${turma.name}"? Os alunos perderão acesso.`)) return;

  // ⚡ API: UPDATE classes SET is_active=false WHERE id=id
  await delay(300);

  turma.is_active = false;
  renderTurmas();
  toast(`Turma "${turma.name}" desativada.`, 'warn');
}

function copiarCodigo(code) {
  navigator.clipboard?.writeText(code).then(() => {
    toast(`Código "${code}" copiado!`, 'ok');
  });
}


/* ════════════════════════════════════════════════════════════
   11. INICIALIZAÇÃO
════════════════════════════════════════════════════════════ */

(function init() {
  loadDashboard();
  populateTurmaSelects();
  renderProfs();
})();

  // O Javascript agora apenas comunica com o seu Python (FastAPI)
        async function handleAdminLogin(event) {
            event.preventDefault();
            
            const btn = document.getElementById("btnSubmit");
            const email = document.getElementById("email").value.trim().toLowerCase();
            const password = document.getElementById("password").value;

            btn.disabled = true;
            btn.textContent = "A autenticar...";

            try {
                const API_URL = CONFIG.API_BASE + "/login";

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ email: email, password: password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || data.message || "E-mail ou senha incorretos.");
                }

                // Guarda o token recebido do SEU backend
                localStorage.setItem("clivon_token", data.access_token);
                
                // Redireciona para o Painel Mestre
                window.location.href = "Admin.html";

            } catch (error) {
                showError(error.message);
                btn.disabled = false;
                btn.textContent = "Entrar";
            }
        }

        // Função para exibir mensagem de erro vermelha no canto superior
        function showError(msg) {
            const toast = document.getElementById("toast");
            toast.textContent = msg;
            toast.classList.add("show");
            setTimeout(() => toast.classList.remove("show"), 3500);
        }
const ICONS = {
  "Português":       `<i class="ph ph-book-open"></i>`,
  "Matemática":      `<i class="ph ph-calculator"></i>`,
  "Ciências":        `<i class="ph ph-flask"></i>`,
  "História":        `<i class="ph ph-scroll"></i>`,
  "Geografia":       `<i class="ph ph-globe-hemisphere-west"></i>`,
  "Arte":            `<i class="ph ph-palette"></i>`,
  "Educação Física": `<i class="ph ph-basketball"></i>`,
  "Inglês":          `<i class="ph ph-translate"></i>`,
};

const SUBJECTS = [
  "Português","Matemática","Ciências","História",
  "Geografia","Arte","Educação Física","Inglês",
];

let allResults   = [];
let activeFilter = "ALL";
let clearTarget  = "ALL";
let pendingPhoto = null;

function avatarKey() {
  const email = localStorage.getItem("clivon_email") || "default";
  return `clivon_avatar_${email}`;
}

if (!CONFIG.getToken()) window.location.href = "Login.html";

window.addEventListener("DOMContentLoaded", () => {
  const name = localStorage.getItem("clivon_user") || "Professor";
  setUserUI(name);
  loadDashboard();

  document.addEventListener("click", e => {
    const user = document.getElementById("navUser");
    if (!user.contains(e.target)) closeDropdown();

    if (!e.target.closest(".export-wrap")) {
      document.querySelectorAll(".export-dropdown").forEach(d => d.classList.remove("open"));
    }
  });

  const zone = document.querySelector(".upload-zone");
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.style.borderColor = "var(--brand)"; });
  zone.addEventListener("dragleave", () => { zone.style.borderColor = ""; });
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file) processPhotoFile(file);
  });
});

function setUserUI(name) {
  const firstName = name.split(" ")[0];
  const initials  = name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();
  const email     = localStorage.getItem("clivon_email") || "";

  document.getElementById("welcomeTitle").textContent = `Olá, ${firstName}`;
  document.getElementById("navName").textContent      = name;
  document.getElementById("ddName").textContent       = name;
  document.getElementById("ddEmail").textContent      = email;
  document.getElementById("navEmail").textContent     = email;

  const savedPhoto = localStorage.getItem(avatarKey());
  applyAvatarToAll(savedPhoto, initials);
}

function applyAvatarToAll(photoB64, initials) {
  const navAv = document.getElementById("navAvatar");
  const ddAv  = document.getElementById("ddAvatar");

  if (photoB64) {
    const imgTag = `<img src="${photoB64}" alt="avatar">`;
    navAv.innerHTML = imgTag;
    ddAv.innerHTML  = imgTag;
  } else {
    navAv.innerHTML = initials || "?";
    ddAv.innerHTML  = initials || "?";
  }
}

function toggleDropdown() {
  const dd   = document.getElementById("profileDropdown");
  const user = document.getElementById("navUser");
  const open = dd.classList.toggle("open");
  user.classList.toggle("open", open);
}
function closeDropdown() {
  document.getElementById("profileDropdown").classList.remove("open");
  document.getElementById("navUser").classList.remove("open");
}

/* CADASTRO DE ALUNOS */
async function openRegisterModal() {
  closeDropdown();
  document.getElementById("registerModal").classList.add("open");
  
  const select = document.getElementById("alunoTurma");
  select.innerHTML = '<option value="">Carregando turmas...</option>';
  
  try {
    const res = await CONFIG.apiFetch("/professor/turmas");
    if (res && res.ok) {
      const turmas = await res.json();
      if (turmas.length === 0) {
        select.innerHTML = '<option value="">Nenhuma turma encontrada</option>';
      } else {
        select.innerHTML = '<option value="">Selecione a turma...</option>' + 
          turmas.map(t => `<option value="${t.id}">${t.name} (${t.year} - ${t.shift})</option>`).join("");
      }
    } else {
      select.innerHTML = '<option value="">Erro ao carregar turmas</option>';
    }
  } catch (error) {
    select.innerHTML = '<option value="">Erro de conexão</option>';
  }
}

function closeRegisterModal() {
  document.getElementById("registerModal").classList.remove("open");
  document.getElementById("formCadastroAluno").reset();
}

async function cadastrarAlunoNovo(event) {
  event.preventDefault();
  const btn = document.getElementById("btnSubmitAluno");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  const payload = {
    name: document.getElementById('alunoNome').value,
    enrollment: document.getElementById('alunoMatricula').value,
    birth_date: document.getElementById('alunoNascimento').value,
    class_id: document.getElementById('alunoTurma').value
  };

  try {
    const res = await CONFIG.apiFetch("/professor/aluno/cadastrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      toast("Aluno cadastrado com sucesso!", "ok");
      closeRegisterModal();
    } else {
      toast(data.detail || "Erro ao cadastrar.", "err");
    }
  } catch (error) {
    toast("Falha na comunicação com o servidor.", "err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar Aluno";
  }
}

/* EXPORTAÇÃO */
function toggleExport(subjectKey, e) {
  e.stopPropagation();
  const drop = document.getElementById(`exportDrop_${subjectKey}`);
  const isOpen = drop.classList.toggle("open");
  
  document.querySelectorAll(".export-dropdown").forEach(d => {
    if (d !== drop) d.classList.remove("open");
  });
}

async function exportSubject(subject, type, e) {
  e.stopPropagation();
  const subjectKey = subject.replace(/\s/g, '_');
  document.getElementById(`exportDrop_${subjectKey}`).classList.remove("open");

  const map = {
    csv:      { path: "/export/csv",      ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    pdf:      { path: "/export/pdf",      ext: "pdf",  mime: "application/pdf" },
    gabarito: { path: "/export/gabarito", ext: "pdf",  mime: "application/pdf" },
  };
  const { path, ext, mime } = map[type];
  toast("Gerando arquivo...");

  try {
    const res = await CONFIG.apiFetch(`${path}?subject=${encodeURIComponent(subject)}`);
    if (!res || !res.ok) { toast("Erro ao exportar. Tente novamente.", "err"); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const date = new Date().toISOString().slice(0,10).replace(/-/g,"");
    a.href     = url;
    a.download = `${type}_${subject.replace(/\s/g,"_")}_${date}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Download iniciado!", "ok");
  } catch {
    toast("Erro ao exportar. Servidor offline?", "err");
  }
}

/* PERFIL E FOTOS */
function openPhotoModal() {
  closeDropdown();
  pendingPhoto = null;
  const name     = localStorage.getItem("clivon_user") || "Professor";
  const initials = name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();
  const saved  = localStorage.getItem(avatarKey());
  const preview = document.getElementById("avatarPreview");
  const btn     = document.getElementById("btnRemovePhoto");

  if (saved) {
    preview.innerHTML = `<img src="${saved}" alt="avatar">`;
    btn.style.display = "inline-flex";
  } else {
    preview.innerHTML = `<span id="avatarPreviewInitials">${initials}</span>`;
    btn.style.display = "none";
  }
  document.getElementById("photoModal").classList.add("open");
}

function closePhotoModal() {
  document.getElementById("photoModal").classList.remove("open");
  document.getElementById("photoInput").value = "";
  pendingPhoto = null;
}

function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (file) processPhotoFile(file);
}

function processPhotoFile(file) {
  if (!file.type.startsWith("image/")) { toast("Arquivo inválido.", "err"); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }

      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);

      pendingPhoto = canvas.toDataURL("image/jpeg", 0.82);
      document.getElementById("avatarPreview").innerHTML = `<img src="${pendingPhoto}" alt="previa">`;
      document.getElementById("btnRemovePhoto").style.display = "inline-flex";
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function savePhoto() {
  const name     = localStorage.getItem("clivon_user") || "Professor";
  const initials = name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();
  if (pendingPhoto) {
    localStorage.setItem(avatarKey(), pendingPhoto);
    applyAvatarToAll(pendingPhoto, initials);
    toast("Foto de perfil atualizada!", "ok");
  }
  closePhotoModal();
}

function removePhoto() {
  const name     = localStorage.getItem("clivon_user") || "Professor";
  const initials = name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();
  localStorage.removeItem(avatarKey());
  pendingPhoto = null;
  applyAvatarToAll(null, initials);
  document.getElementById("avatarPreview").innerHTML = `<span id="avatarPreviewInitials">${initials}</span>`;
  document.getElementById("btnRemovePhoto").style.display = "none";
  toast("Foto removida.", "ok");
  closePhotoModal();
}

/* CARREGAMENTO DE DADOS */
async function loadDashboard() {
  try {
    const [statsRes, histRes] = await Promise.all([
      CONFIG.apiFetch("/dashboard_stats"),
      CONFIG.apiFetch("/results"),
    ]);

    let serverData = {};
    if (statsRes && statsRes.ok) {
      const stats = await statsRes.json();
      if (stats.teacher_name) {
        localStorage.setItem("clivon_user", stats.teacher_name);
        setUserUI(stats.teacher_name);
      }
      stats.subjects.forEach(s => { serverData[s.subject] = s; });
    }
    renderSubjects(serverData);

    if (histRes && histRes.ok) allResults = await histRes.json();
    renderHistory(allResults);
    renderFilters();
    if (allResults.length) document.getElementById("btnClear").style.display = "flex";

  } catch {
    renderSubjects({});
    document.getElementById("histBody").innerHTML = `<tr class="empty-row"><td colspan="5">Servidor offline.</td></tr>`;
  }
}

/* TEMPLATE DOS CARDS REESCRITO PARA O NOVO DESIGN */
function renderSubjects(serverData) {
  const grid = document.getElementById("subjectGrid");
  grid.innerHTML = SUBJECTS.map(name => {
    const d        = serverData[name] || {};
    const hasKey   = !!d.has_answer_key;
    const scans    = d.scans_done ?? 0;
    const avg      = d.avg_score ?? null;
    const avgStr   = avg !== null ? avg.toFixed(1) : "—";
    const avgCls   = avg !== null && avg >= 7 ? " green" : "";
    const classLbl = d.class_id ? `Turma ${d.class_id}` : "Sem turma configurada";
    const subKey   = name.replace(/\s/g, '_');

    const badge = hasKey
      ? `<div class="badge-status success"><i class="ph-bold ph-check"></i> Gabarito</div>`
      : `<div class="badge-status empty">Sem gabarito</div>`;

    const exportBlock = hasKey ? `
      <div class="export-wrap" style="margin-top: 6px;">
        <button class="btn-export-small" onclick="toggleExport('${subKey}', event)">
          Exportar resultados <i class="ph-bold ph-caret-down"></i>
        </button>
        <div class="export-dropdown" id="exportDrop_${subKey}">
          <button class="export-item" onclick="exportSubject('${name}','csv',event)"><i class="ph ph-table"></i> Planilha de Notas</button>
          <button class="export-item" onclick="exportSubject('${name}','pdf',event)"><i class="ph ph-file-pdf"></i> Provas Corrigidas</button>
          <button class="export-item" onclick="exportSubject('${name}','gabarito',event)"><i class="ph ph-file"></i> Gabarito em Branco</button>
        </div>
      </div>` : "";

    return `
    <div class="subject-card">
      
      <div class="card-top">
        <div class="card-left">
          <div class="s-icon">${ICONS[name] || ""}</div>
          <div class="s-info">
            <div class="s-name">${name}</div>
            <div class="s-sub">${classLbl}</div>
          </div>
        </div>
        <div class="card-right-status">
           ${badge}
           ${exportBlock}
        </div>
      </div>
      
      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-val">${scans}</div>
          <div class="stat-lbl">Correções</div>
        </div>
        <div class="stat-box">
          <div class="stat-val${avgCls}">${avgStr}</div>
          <div class="stat-lbl">Média</div>
        </div>
      </div>
      
      <div class="card-btns">
        <button class="btn-gab" onclick="go('${name}','criar-gabarito.html')">
          <i class="ph ph-check-circle" style="font-size:16px;"></i> Gabarito
        </button>
        <button class="btn-scan" onclick="go('${name}','index.html')">
          <i class="ph ph-corners-out" style="font-size:16px;"></i> Escanear
        </button>
      </div>
      
      <button class="btn-chamada" onclick="go('${name}','chamada.html')">
        <i class="ph ph-users"></i> Fazer Chamada
      </button>

    </div>`;
  }).join("");
}

/* ÁREA DO HISTÓRICO */
function renderHistory(results) {
  const tbody = document.getElementById("histBody");
  if (!results.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Nenhuma correção registrada ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = results.slice(0,50).map(r => {
    const cls  = r.score>=7 ? "td-green" : r.score>=5 ? "td-amber" : "td-red";
    // Formatação de data similar à da imagem de referência
    const dateObj = new Date(r.scanned_at);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = dateObj.toLocaleString('pt-BR', { month: 'short' });
    const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = `${day} de ${month}., ${time}`;

    return `<tr>
      <td><strong>${r.student_name}</strong></td>
      <td>${r.subject}</td>
      <td class="${cls}">${r.score.toFixed(1)}</td>
      <td>${r.correct} / ${r.correct + r.wrong}</td>
      <td class="td-date">${formattedDate}</td>
    </tr>`;
  }).join("");
}

function renderFilters() {
  const subjects = [...new Set(allResults.map(r=>r.subject))];
  const row = document.getElementById("filterRow");
  row.innerHTML = `<button class="filter-pill fp-blue" data-f="ALL" onclick="setFilter('ALL',this)">Todas</button>`;
  subjects.forEach(s => {
    row.innerHTML += `<button class="filter-pill fp-outline" data-f="${s}" onclick="setFilter('${s}',this)">${s}</button>`;
  });
}

function setFilter(subject, btn) {
  activeFilter = subject;
  document.querySelectorAll(".filter-pill").forEach(b => { b.className = "filter-pill fp-outline"; });
  btn.className = subject === "ALL" ? "filter-pill fp-blue" : "filter-pill fp-dark";
  const filtered = subject === "ALL" ? allResults : allResults.filter(r=>r.subject===subject);
  renderHistory(filtered);
}

function openClearModal() {
  closeDropdown();
  clearTarget = activeFilter;
  const label = clearTarget === "ALL" ? "todos os registros" : `todos os registros de <strong>${clearTarget}</strong>`;
  document.getElementById("clearModalText").innerHTML = `Deseja apagar ${label}?<br>Esta ação <strong>não pode ser desfeita</strong>.`;
  document.getElementById("clearModal").classList.add("open");
}
function closeClearModal() { document.getElementById("clearModal").classList.remove("open"); }

async function execClear() {
  const btn = document.getElementById("btnExecClear");
  btn.disabled = true; btn.textContent = "Apagando...";
  try {
    const res = await CONFIG.apiFetch("/results/clear", {
      method: "DELETE",
      body: JSON.stringify({ subject: clearTarget }),
    });
    if (!res || !res.ok) throw new Error();
    allResults = clearTarget === "ALL" ? [] : allResults.filter(r=>r.subject!==clearTarget);
    closeClearModal();
    renderHistory(allResults);
    renderFilters();
    if (!allResults.length) document.getElementById("btnClear").style.display = "none";
    toast("Histórico apagado.", "ok");
    loadDashboard();
  } catch {
    toast("Erro ao limpar. Tente novamente.", "err");
  } finally {
    btn.disabled = false; btn.textContent = "Apagar";
  }
}

/* Event listeners para fechar modais ao clicar no fundo escuro */
["photoModal","clearModal","registerModal"].forEach(id => {
  document.getElementById(id).addEventListener("click", e => {
    if (e.target === e.currentTarget) { 
      if (id === "photoModal") closePhotoModal();
      if (id === "clearModal") closeClearModal();
      if (id === "registerModal") closeRegisterModal();
    }
  });
});

function go(subject, page) {
  sessionStorage.setItem("currentSubject", subject);
  window.location.href = page; 
}

function logout() {
  if (!confirm("Sair da conta?")) return;
  localStorage.removeItem("clivon_token");
  localStorage.removeItem("clivon_user");
  localStorage.removeItem("clivon_email");
  window.location.href = "Login.html";
}

function toast(msg, type="") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show" + (type ? " "+type : "");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 2800);
}
/**
 * auth.js — Clivon Edu Authentication Module
 * Centraliza toda a lógica de autenticação, fetch, token e sessão.
 */

// ─── Configuração base ────────────────────────────────────────────────────────
// Fallback caso config.js não tenha carregado ainda
const API_BASE = (typeof CONFIG !== "undefined" && CONFIG.API_BASE)
  ? CONFIG.API_BASE.replace(/\/$/, "")   // remove barra final se houver
  : "https://clivon-api.onrender.com";

const REQUEST_TIMEOUT_MS = 60000; // 60 segundos (ajusta para o cold start do Render)

// ─── Utilitário: fetch com timeout ────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("O servidor demorou muito para responder. Tente novamente.");
    }
    // Erro de rede (sem internet, CORS bloqueado, etc.)
    throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão.");
  } finally {
    clearTimeout(timer);
  }
}

// ─── Utilitário: parse seguro de resposta da API ──────────────────────────────
async function parseApiResponse(response) {
  let body = {};
  try {
    body = await response.json();
  } catch {
    // resposta sem JSON válido
  }

  if (!response.ok) {
    // FastAPI retorna erros em { detail: "..." } ou { detail: [{...}] }
    let message = "Ocorreu um erro inesperado.";
    if (body.detail) {
      message = Array.isArray(body.detail)
        ? body.detail.map(d => d.msg || d).join(", ")
        : body.detail;
    }
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

// ─── Gerenciamento de sessão ─────────────────────────────────────────────────
const Session = {
  /** Salva token e dados do professor */
  saveProfessor(data, email) {
    localStorage.setItem("clivon_token",      data.access_token);
    localStorage.setItem("clivon_user",       data.name  || "");
    localStorage.setItem("clivon_email",      email);
    localStorage.setItem("clivon_role",       "professor");
    localStorage.setItem("clivon_token_ts",   Date.now().toString());
  },

  /** Salva token e dados do aluno */
  saveAluno(data) {
    localStorage.setItem("clivon_aluno_token",      data.access_token);
    localStorage.setItem("clivon_aluno_student_id", data.student_id  || "");
    localStorage.setItem("clivon_aluno_class_id",   data.class_id    || "");
    localStorage.setItem("clivon_aluno_name",        data.name        || "");
    localStorage.setItem("clivon_aluno_enrollment",  data.enrollment  || "");
    localStorage.setItem("clivon_role",              "aluno");
    localStorage.setItem("clivon_token_ts",          Date.now().toString());
  },

  /** Verifica se já existe sessão ativa e redireciona */
  checkExistingSession() {
    const role = localStorage.getItem("clivon_role");
    const tokenTs = parseInt(localStorage.getItem("clivon_token_ts") || "0", 10);
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;

    // Token expirado (mais de 8h) → limpa sessão
    if (tokenTs && Date.now() - tokenTs > EIGHT_HOURS) {
      Session.clear();
      return;
    }

    if (role === "professor" && localStorage.getItem("clivon_token")) {
      window.location.replace("dashboard.html");
    } else if (role === "aluno" && localStorage.getItem("clivon_aluno_token")) {
      window.location.replace("aluno-dashboard.html");
    }
  },

  /** Limpa todos os dados de sessão */
  clear() {
    const keys = [
      "clivon_token", "clivon_user", "clivon_email", "clivon_role",
      "clivon_token_ts", "clivon_aluno_token", "clivon_aluno_student_id",
      "clivon_aluno_class_id", "clivon_aluno_name", "clivon_aluno_enrollment",
    ];
    keys.forEach(k => localStorage.removeItem(k));
  },
};

// ─── Login do Aluno ───────────────────────────────────────────────────────────
async function loginAluno() {
  const btn        = document.getElementById("btnSubmitAluno");
  const join_code  = document.getElementById("join_code").value.trim().toUpperCase();
  const enrollment = document.getElementById("enrollment").value.trim();
  const birthDate  = document.getElementById("birth_date").value;

  // Validação local
  if (!join_code)  { showToast("Informe o código da turma.", true);        return; }
  if (!enrollment) { showToast("Informe sua matrícula.", true);             return; }
  if (!birthDate)  { showToast("Informe sua data de nascimento.", true);   return; }

// Envia a data original que já vem do input HTML (YYYY-MM-DD)
  const pin = birthDate;

  setLoading(btn, true, "Entrando...");

  try {
    const response = await fetchWithTimeout(`${API_BASE}/aluno/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ join_code, enrollment, pin }),
    });

    const data = await parseApiResponse(response);

    if (!data.access_token) {
      throw new Error("Resposta inesperada do servidor. Contate o suporte.");
    }

    Session.saveAluno(data);
    showToast("Tudo certo! Redirecionando...", false, true);
    setTimeout(() => window.location.replace("aluno-dashboard.html"), 900);

  } catch (err) {
    console.error("[Clivon/loginAluno]", err);
    showToast(err.message, true);
    setLoading(btn, false, "Entrar na minha conta");
  }
}

// ─── Login do Professor ───────────────────────────────────────────────────────
async function loginProfessor() {
  const btn      = document.getElementById("btnSubmitProf");
  const email    = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password-prof").value;

  // Validação local
  if (!email)    { showToast("Informe seu e-mail.", true);  return; }
  if (!password) { showToast("Informe sua senha.", true);   return; }

  // Validação básica de formato de e-mail
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast("E-mail inválido.", true);
    return;
  }

  setLoading(btn, true, "Entrando...");

  try {
    const response = await fetchWithTimeout(`${API_BASE}/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });

    const data = await parseApiResponse(response);

    if (!data.access_token) {
      throw new Error("Resposta inesperada do servidor. Contate o suporte.");
    }

    Session.saveProfessor(data, email);
    showToast("Bem-vindo de volta!", false, true);
    setTimeout(() => window.location.replace("dashboard.html"), 900);

  } catch (err) {
    console.error("[Clivon/loginProfessor]", err);
    showToast(err.message, true);
    setLoading(btn, false, "Entrar no painel");
  }
}

// ─── Helpers de UI ───────────────────────────────────────────────────────────
function setLoading(btn, isLoading, text) {
  btn.disabled  = isLoading;
  btn.innerHTML = isLoading
    ? `<span class="spinner" aria-hidden="true"></span> ${text}`
    : text;
}

function showToast(msg, isError = false, isSuccess = false) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className   = "toast show" + (isError ? " error" : isSuccess ? " success" : "");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector("i");
  const isHidden = input.type === "password";
  input.type      = isHidden ? "text" : "password";
  icon.className  = isHidden ? "ph ph-eye-slash" : "ph ph-eye";
  btn.setAttribute("aria-label", isHidden ? "Ocultar senha" : "Mostrar senha");
}

let currentMode = "aluno";

function switchMode(mode) {
  currentMode = mode;
  ["aluno", "professor"].forEach(m => {
    const isActive = m === mode;
    const key = m === "professor" ? "prof" : "aluno";
    document.getElementById(`btn-${key}`)?.classList.toggle("active", isActive);
    document.getElementById(`left-${key}`)?.classList.toggle("hidden", !isActive);
    document.getElementById(`right-${key}`)?.classList.toggle("hidden", !isActive);
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Redireciona se já logado
  Session.checkExistingSession();

  // Enter para submeter
  document.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      currentMode === "aluno" ? loginAluno() : loginProfessor();
    }
  });
});
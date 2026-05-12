/**
 * config.js — Configuração global do Clivon Edu
 *
 * ⚠️ Este arquivo DEVE ser carregado ANTES de Auth.js e de qualquer
 *    script que use CONFIG.apiFetch() ou CONFIG.getToken().
 *
 * Em produção:  API_BASE aponta para o backend no Render (ou onde estiver).
 * Em dev local: troque por "http://localhost:8000"
 */
const CONFIG = {

  API_BASE: "https://clivon-api.onrender.com",

  // ── Token ──────────────────────────────────────────────────────────────────

  /** Retorna o token JWT do professor logado (ou null). */
  getToken() {
    return localStorage.getItem("clivon_token") || null;
  },

  /** Retorna o token JWT do aluno logado (ou null). */
  getAlunoToken() {
    return localStorage.getItem("clivon_aluno_token") || null;
  },

  // ── Fetch autenticado ──────────────────────────────────────────────────────

  /**
   * Wrapper de fetch já autenticado para rotas do professor.
   * - Injeta Authorization: Bearer <token>
   * - Se o token não existir, redireciona para Login.html
   * - Se a resposta for 401, redireciona para Login.html
   *
   * Uso: const res = await CONFIG.apiFetch("/dashboard_stats");
   */
  async apiFetch(path, options = {}) {
    const token = CONFIG.getToken();

    if (!token) {
      window.location.href = "Login.html";
      return null;
    }

    const url = CONFIG.API_BASE.replace(/\/$/, "") + path;

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, { ...options, headers });

      if (res.status === 401) {
        localStorage.removeItem("clivon_token");
        window.location.href = "Login.html";
        return null;
      }

      return res;

    } catch (err) {
      console.error("[CONFIG.apiFetch] Erro de rede:", err);
      return null;
    }
  },

  /**
   * Wrapper de fetch autenticado para rotas do aluno.
   * Usa clivon_aluno_token em vez do token do professor.
   */
  async alunoFetch(path, options = {}) {
    const token = CONFIG.getAlunoToken();

    if (!token) {
      window.location.href = "Login.html";
      return null;
    }

    const url = CONFIG.API_BASE.replace(/\/$/, "") + path;

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, { ...options, headers });

      if (res.status === 401) {
        localStorage.removeItem("clivon_aluno_token");
        window.location.href = "Login.html";
        return null;
      }

      return res;

    } catch (err) {
      console.error("[CONFIG.alunoFetch] Erro de rede:", err);
      return null;
    }
  },
};
/**
 * config.js — configuração centralizada do Clivon Edu
 * Altere API_BASE aqui e todos os arquivos herdam automaticamente.
 */
const CONFIG = {
API_BASE: "https://clivon-api.onrender.com",

  // Retorna o token JWT salvo (ou null se não houver)
  getToken() {
    return localStorage.getItem("clivon_token");
  },

  // Cabeçalhos padrão para chamadas autenticadas
  authHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // Fetch autenticado com tratamento de erro global
  async apiFetch(path, options = {}) {
    const res = await fetch(this.API_BASE + path, {
      ...options,
      headers: { ...this.authHeaders(), ...(options.headers || {}) },
    });

    if (res.status === 401) {
      localStorage.removeItem("clivon_token");
      localStorage.removeItem("clivon_user");
      window.location.href = "login.html";
      return null;
    }

    return res;
  },
};
let currentMode = 'aluno';

  document.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });

  function switchMode(mode) {
    currentMode = mode;
    
    document.getElementById('btn-aluno').classList.toggle('active', mode === 'aluno');
    document.getElementById('btn-prof').classList.toggle('active', mode === 'professor');

    document.getElementById('left-aluno').classList.toggle('hidden', mode !== 'aluno');
    document.getElementById('left-prof').classList.toggle('hidden', mode !== 'professor');
    
    document.getElementById('right-aluno').classList.toggle('hidden', mode !== 'aluno');
    document.getElementById('right-prof').classList.toggle('hidden', mode !== 'professor');
  }

  function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'ph ph-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'ph ph-eye';
    }
  }

  async function doLogin() {
    if (currentMode === 'aluno') await loginAluno();
    else await loginProfessor();
  }

  async function loginAluno() {
    const btn = document.getElementById("btnSubmitAluno");
    const school_code = document.getElementById("school_code").value.trim();
    const enrollment = document.getElementById("enrollment").value.trim();
    const password = document.getElementById("password-aluno").value;

    if (!enrollment || !password) { showToast("Preencha matrícula e senha.", true); return; }

    setLoading(btn, true, "Entrando...");

    try {
      const res = await fetch("https://clivon-api.onrender.com/aluno/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment, password, school_code }),
      });

      if (!res.ok) throw new Error("Matrícula ou senha incorretos.");
      const data = await res.json();

      localStorage.setItem("clivon_aluno_token", data.access_token);
      localStorage.setItem("clivon_aluno_id", data.class_id);
      localStorage.setItem("clivon_aluno_name", data.name);

      showToast("Tudo certo! Redirecionando...", false, true);
      setTimeout(() => window.location.href = "aluno-dashboard.html", 900);
    } catch (err) {
      showToast(err.message, true);
      setLoading(btn, false, "Entrar na minha conta");
    }
  }

  async function loginProfessor() {
    const btn = document.getElementById("btnSubmitProf");
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password-prof").value;

    if (!email || !password) { showToast("Preencha e-mail e senha.", true); return; }

    setLoading(btn, true, "Entrando...");

    try {
      const res = await fetch("https://clivon-api.onrender.com/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Credenciais inválidas. Tente novamente.");
      const data = await res.json();

      localStorage.setItem("clivon_token", data.access_token);
      localStorage.setItem("clivon_user", data.name);
      localStorage.setItem("clivon_email", email); 

      showToast("Bem-vindo de volta!", false, true);
      setTimeout(() => window.location.href = "dashboard.html", 900);
    } catch (err) {
      showToast(err.message || "Erro ao conectar ao servidor.", true);
      setLoading(btn, false, "Entrar no painel");
    }
  }

  /* Utiliza a estrutura do spinner e toast do seu style.css original */
  function setLoading(btn, isLoading, text) {
    btn.disabled = isLoading;
    // O spinner agora usa a classe .spinner que você já tem no CSS global
    btn.innerHTML = isLoading ? `<div class="spinner"></div> ${text}` : text;
  }

  function showToast(msg, isError = false, isSuccess = false) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast show" + (isError ? " error" : isSuccess ? " success" : "");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove("show"), 2800);
  }
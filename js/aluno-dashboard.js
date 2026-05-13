let horarioGlobal = [];

document.addEventListener("DOMContentLoaded", () => {

  /* DATA FORMATADA */
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("pt-BR", options);

  /* LOCAL STORAGE */
  const alunoName  = localStorage.getItem("clivon_aluno_name");
  const studentId  = localStorage.getItem("clivon_aluno_student_id");
  const classId    = localStorage.getItem("clivon_aluno_class_id");
  const enrollment = localStorage.getItem("clivon_aluno_enrollment");

  /* VALIDAÇÃO */
  if (!studentId || !classId) {

    if (sessionStorage.getItem("aluno_redirect_lock")) {

      sessionStorage.removeItem("aluno_redirect_lock");

      document.body.innerHTML = `
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          flex-direction:column;
          gap:16px;
          height:100vh;
          font-family:Inter,sans-serif;
        ">
          <p style="
            font-size:18px;
            color:#64748b;
          ">
            Sessão expirada.
          </p>

          <a href="Login.html"
             style="
              color:#2563eb;
              font-weight:600;
              text-decoration:none;
             ">
            Fazer login novamente
          </a>
        </div>
      `;

      return;
    }

    sessionStorage.setItem("aluno_redirect_lock", "1");

    window.location.href = "Login.html";

    return;
  }

  sessionStorage.removeItem("aluno_redirect_lock");

  /* USER INFO */
  const primeiroNome = (alunoName || "Aluno").split(" ")[0];

  document.getElementById("navName").textContent =
    alunoName || "Aluno";

  document.getElementById("navAvatar").textContent =
    primeiroNome.charAt(0).toUpperCase();

  document.getElementById("firstName").textContent =
    primeiroNome;

  if (enrollment) {
    document.getElementById("subInfo").textContent =
      `Matrícula ${enrollment} — veja seu progresso escolar.`;
  }

  /* ANIMAÇÃO PROGRESS */
  setTimeout(() => {
    document.getElementById("semesterProgress").style.width = "32%";
  }, 300);

  /* CARREGAR DADOS */
  carregarDados(studentId, classId);
});

/* =========================================
   CARREGAR DADOS
========================================= */

async function carregarDados(studentId, classId) {

  try {

    const res = await CONFIG.alunoFetch("/aluno/dashboard", {
      headers: {
        "x-student-id": studentId,
        "x-class-id": classId
      }
    });

    if (!res) {
      sair();
      return;
    }

    if (!res.ok) {

      if (res.status === 401) {
        sair();
        return;
      }

      throw new Error("Erro ao carregar dados");
    }

    const data = await res.json();

    renderNotas(data.notas);

    renderFaltas(data.faltas);

    horarioGlobal = data.horario || [];

    filtrarHorario(1);

  } catch (error) {

    console.error("Erro ao carregar dashboard:", error);

    document.getElementById("horarioList").innerHTML = `
      <div class="empty-desc"
           style="text-align:center;">
        Erro ao carregar informações.
      </div>
    `;
  }
}

/* =========================================
   NOTAS
========================================= */

function renderNotas(notas) {

  const container = document.getElementById("notasList");

  if (!notas || notas.length === 0) return;

  container.style.justifyContent = "flex-start";

  container.innerHTML = notas.map(n => `
    <div class="nota-row">

      <span class="nota-materia">
        ${n.subject}
      </span>

      <span class="nota-valor">
        ${Number(n.avg_score).toFixed(1)}
      </span>

    </div>
  `).join("");
}

/* =========================================
   FALTAS
========================================= */

function renderFaltas(faltas) {

  const container = document.getElementById("faltasList");

  if (!faltas || faltas.length === 0) return;

  const total = faltas.reduce((acc, curr) => {
    return acc + Number(curr.total_absences);
  }, 0);

  container.innerHTML = `
    <div class="feedback-green"
         style="color: var(--danger);">

      Atenção às faltas

    </div>

    <div class="feedback-sub">
      ${total} falta(s) registradas · Limite: 25%
    </div>
  `;
}

/* =========================================
   FILTRAR HORÁRIO
========================================= */

function filtrarHorario(diaSemana) {

  /* ACTIVE TAB */
  const botoes = document.querySelectorAll(".tab-btn");

  botoes.forEach((btn, index) => {

    if ((index + 1) === diaSemana) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const container = document.getElementById("horarioList");

  if (!horarioGlobal || horarioGlobal.length === 0) {

    container.innerHTML = `
      <div class="empty-desc"
           style="text-align:center;">
        Horário não disponível.
      </div>
    `;

    return;
  }

  const aulasDoDia = horarioGlobal.filter(aula =>
    aula.weekday === diaSemana
  );

  if (aulasDoDia.length === 0) {

    container.innerHTML = `
      <div class="empty-desc"
           style="text-align:center; padding-top:16px;">
        Sem aulas neste dia.
      </div>
    `;

    return;
  }

  container.innerHTML = aulasDoDia.map(aula => {

    const inicio = aula.start_time.substring(0, 5);
    const fim    = aula.end_time.substring(0, 5);

    return `
      <div class="aula-row">

        <span>
          ${aula.subject}
        </span>

        <span class="aula-horario">
          ${inicio} – ${fim}
        </span>

      </div>
    `;
  }).join("");
}

/* =========================================
   SAIR
========================================= */

function sair() {

  localStorage.clear();

  sessionStorage.clear();

  window.location.href = "Login.html";
}
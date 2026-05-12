<div align="center">

<img src="https://img.shields.io/badge/Clivon_Edu-Frontend-4F46E5?style=for-the-badge&logoColor=white" alt="Clivon Edu" height="60"/>

# 🎓 Clivon Edu — Frontend

**Interface web para professores e alunos da plataforma Clivon Edu. Correção de provas, chamada digital, painel de notas e muito mais — tudo no navegador.**

[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![Phosphor Icons](https://img.shields.io/badge/Phosphor_Icons-latest-8B5CF6?style=flat-square)](https://phosphoricons.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-orange?style=flat-square)]()

---

[📖 Páginas](#-páginas) • [🚀 Como usar](#-como-usar) • [🔗 Integração com a API](#-integração-com-a-api) • [🗺️ Roadmap](#-roadmap)

</div>

---

## 📌 Sobre o Projeto

O **Clivon Edu Frontend** é a interface web da plataforma Clivon Edu — construída em HTML, CSS e JavaScript puro, sem frameworks, projetada para rodar diretamente no navegador e se comunicar com a [API backend](https://github.com/Jcarlosk/clivon-backend) via `fetch`.

Dois portais em um só projeto: **professor** e **aluno**, com fluxos de autenticação independentes.

---

## ✨ Funcionalidades

| Funcionalidade | Status |
|---|---|
| ✅ Login professor (e-mail + senha) | Disponível |
| ✅ Login aluno (código de turma + matrícula + data de nascimento) | Disponível |
| ✅ Painel do professor com disciplinas e estatísticas | Disponível |
| ✅ Escaneamento de provas pela câmera ou upload | Disponível |
| ✅ Auto-scan com detecção de nitidez e brilho | Disponível |
| ✅ Overlay de correção sobre a foto da prova | Disponível |
| ✅ Edição manual de respostas detectadas | Disponível |
| ✅ Configuração de gabarito por disciplina e turma | Disponível |
| ✅ Chamada digital com presença, falta e justificada | Disponível |
| ✅ Painel do aluno com notas, faltas e horários | Disponível |
| ✅ Exportação de resultados (Excel / PDF) | Disponível |
| 🔄 Modo escuro | Em desenvolvimento |
| 🔄 PWA (instalável no celular) | Em desenvolvimento |

---

## 📁 Estrutura do Projeto

```bash
📦 clivon-frontend
 ┣ 📜 Login.html              # Tela de login — professor e aluno
 ┣ 📜 dashboard.html          # Painel do professor
 ┣ 📜 index.html              # Escaneamento de provas (câmera + upload)
 ┣ 📜 criar-gabarito.html     # Configuração do gabarito oficial
 ┣ 📜 chamada.html            # Registro de presença da turma
 ┣ 📜 aluno-dashboard.html    # Painel do aluno (notas, faltas, horários)
 ┣ 📂 css
 ┃ └ 📜 style.css             # Design system global
 ┣ 📂 js
 ┃ ┣ 📜 config.js             # CONFIG.API_BASE + CONFIG.apiFetch + CONFIG.getToken
 ┃ └ 📜 Auth.js               # Lógica de login (professor e aluno)
 ┗ 📂 assets
   ┣ 📂 img
   ┃ ┣ 📜 logo.svg
   ┃ ┣ 📜 logo-black.svg
   ┃ ┣ 📜 icon.svg
   ┃ └ 📜 linha.svg
   └ 📂 fonts
```

---

## 🚀 Como usar

O frontend é **100% estático** — basta abrir os arquivos em qualquer servidor HTTP.

### Opção 1 — VS Code Live Server (desenvolvimento)

1. Instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Clique com botão direito em `Login.html` → **Open with Live Server**

### Opção 2 — Python (sem instalar nada)

```bash
# Python 3
python -m http.server 5500
```

Acesse: `http://localhost:5500/Login.html`

### Opção 3 — Deploy estático (produção)

Funciona em qualquer host estático: **GitHub Pages**, **Netlify**, **Vercel**, **Cloudflare Pages**.

```bash
# Exemplo Netlify CLI
netlify deploy --prod --dir .
```

---

## 🔗 Integração com a API

Toda comunicação com o backend passa por `js/config.js`. Antes de rodar, ajuste a URL base:

```js
// js/config.js
const CONFIG = {
  API_BASE: "https://sua-api.onrender.com",  // ← altere aqui
  // ...
};
```

> A URL de produção aponta para o [clivon-backend](https://github.com/Jcarlosk/clivon-backend) hospedado no Render (ou onde você subir).

**Nunca coloque `SUPABASE_URL` ou `SUPABASE_ANON_KEY` diretamente nos HTMLs.** Essas credenciais devem ficar só em `config.js`, que não deve ser commitado com valores reais. Use `.env` no backend.

---

## 🔐 Fluxo de Autenticação

### Professor
```
Login.html → POST /login { email, password }
         ← { token, name, email }
         → salva token no localStorage
         → redireciona para dashboard.html
```

### Aluno
```
Login.html → POST /aluno/login { join_code, enrollment, birth_date }
         ← { student_id, class_id, name, enrollment }
         → salva dados no localStorage
         → redireciona para aluno-dashboard.html
```

> O frontend envia `birth_date` no formato ISO (`2010-04-15`). A conversão para PIN (`DDMMAAAA`) é feita no backend via `student_login_by_code()`.

---

## 🖥️ Páginas

### `Login.html`
Tela unificada com alternância entre **Portal do Aluno** e **Área do Professor**. Animações de transição, toggle de senha visível, e validação de formulário.

### `dashboard.html`
Painel principal do professor. Exibe as disciplinas configuradas com estatísticas (correções realizadas, média da turma), botões de ação rápida e histórico de correções com filtros por disciplina.

### `index.html`
Módulo de escaneamento. Suporta câmera em tempo real com **auto-scan** (detecta folha automaticamente por brilho + nitidez), upload de imagem, overlay de correção colorido sobre as bolinhas e edição manual de qualquer resposta antes de salvar.

### `criar-gabarito.html`
Formulário para configurar o gabarito oficial de uma prova. Seleciona disciplina e turma (carregados da API), define o número de questões e marca as respostas corretas (A–E). Exibe progresso de preenchimento em tempo real.

### `chamada.html`
Registro de presença digital. Carrega a lista de alunos da turma selecionada, permite marcar cada aluno como **Presente**, **Falta** ou **Justificada**, com campo de observação opcional.

### `aluno-dashboard.html`
Portal do aluno. Exibe médias por disciplina e bimestre, total de faltas por matéria, e horário semanal de aulas — tudo carregado da API com o `student_id` e `class_id` do localStorage.

---

## 🎨 Design System

O projeto usa um design system próprio definido em `css/style.css` com variáveis CSS:

```css
--brand, --brand-dark, --brand-light   /* azul primário */
--surface, --surface-2, --surface-3    /* fundos */
--text-1, --text-2, --text-3           /* hierarquia de texto */
--border, --border-strong              /* bordas */
--green, --red, --amber                /* semântico */
--radius-sm, --radius-md, --radius-lg  /* arredondamentos */
--shadow-sm, --shadow-md               /* sombras */
--font, --mono                         /* tipografia */
```

Ícones via [Phosphor Icons](https://phosphoricons.com) (carregado via CDN).

---

## 🗺️ Roadmap

- [x] Login professor e aluno
- [x] Painel do professor
- [x] Escaneamento com câmera e auto-scan
- [x] Configuração de gabarito
- [x] Chamada digital
- [x] Painel do aluno
- [ ] Modo escuro
- [ ] PWA — instalável no celular
- [ ] Notificações push de novas correções
- [ ] Importação de alunos em lote (CSV)
- [ ] Relatório de desempenho por turma

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
```bash
git checkout -b feature/nova-feature
```
3. Commit suas mudanças
```bash
git commit -m "feat: adiciona nova feature"
```
4. Push para a branch
```bash
git push origin feature/nova-feature
```
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

**Desenvolvido com ❤️ por [Weko Studio](https://github.com/Jcarlosk)**

[![GitHub](https://img.shields.io/badge/GitHub-Jcarlosk-181717?style=flat-square&logo=github)](https://github.com/Jcarlosk)

</div>

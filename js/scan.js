// js/scan.js
(function() {
  if (!CONFIG.getToken()) window.location.href = "Login.html";

  let stream = null, currentSubject = "", scanDraft = null, editedAnswers = [], totalQuestions = 0;

  window.addEventListener("DOMContentLoaded", () => {
    currentSubject = sessionStorage.getItem("currentSubject");
    if (!currentSubject) window.location.href = "dashboard.html";
    Utils.updateNavUser();
    document.getElementById("navSubjectBtn").textContent = currentSubject;
    // ... inicializar eventos
  });

  async function startCamera() { /* ... usa Utils.setLoading etc */ }
  async function processImage(base64) { /* ... */ }
  function renderResults(data) { /* ... */ }
  window.confirmAndSave = async function() { /* ... */ };
  // ... demais funções expostas globalmente
})();
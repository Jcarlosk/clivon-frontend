// js/utils.js
const Utils = {
  showToast(msg, isError = false, isSuccess = false) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = "toast show" + (isError ? " error" : isSuccess ? " success" : "");
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove("show"), 3200);
  },

  setLoading(button, isLoading, originalText = null) {
    if (!button) return;
    if (isLoading) {
      button.disabled = true;
      button._originalText = button.innerHTML;
      button.innerHTML = '<div class="spinner" style="border-top-color:white"></div> Carregando...';
    } else {
      button.disabled = false;
      if (button._originalText) button.innerHTML = button._originalText;
      else if (originalText) button.innerHTML = originalText;
    }
  },

  formatDate(date, locale = "pt-BR") {
    return new Date(date).toLocaleDateString(locale);
  },

  isValidBirthDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    return date <= today && date >= minDate;
  },

  getAvatarInitials(name) {
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  },

  updateNavUser() {
    const userName = localStorage.getItem("clivon_user") || "Usuário";
    const userEmail = localStorage.getItem("clivon_email") || "";
    const nameEl = document.getElementById("navName");
    const emailEl = document.getElementById("navEmail");
    const avatarEl = document.getElementById("navAvatar");
    if (nameEl) nameEl.textContent = userName;
    if (emailEl) emailEl.textContent = userEmail;
    if (avatarEl) {
      const storedAvatar = localStorage.getItem(`clivon_avatar_${userEmail}`);
      if (storedAvatar) {
        avatarEl.innerHTML = `<img src="${storedAvatar}" alt="avatar">`;
      } else {
        avatarEl.textContent = Utils.getAvatarInitials(userName);
      }
    }
  }
};
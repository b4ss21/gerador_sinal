// Auth simples para demonstração
(function () {
  const AUTH_KEY = 'auth_ok';
  const AUTH_UNTIL = 'auth_until';
  const TTL_MS = 60 * 60 * 1000; // 1 hora

  function now() { return Date.now(); }
  function setAuth(ok) {
    try {
      if (ok) {
        localStorage.setItem(AUTH_KEY, '1');
        localStorage.setItem(AUTH_UNTIL, String(now() + TTL_MS));
      } else {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(AUTH_UNTIL);
      }
    } catch (e) {}
  }
  function isAuth() {
    try {
      const ok = localStorage.getItem(AUTH_KEY) === '1';
      const until = Number(localStorage.getItem(AUTH_UNTIL) || 0);
      return ok && until > now();
    } catch (e) { return false; }
  }
  function logout() { setAuth(false); location.replace('login.html'); }

  // Proteger trading.html
  if (location.pathname.endsWith('/trading.html')) {
    if (!isAuth()) {
      location.replace('login.html?expired=1');
    } else {
      // Anexar handler de logout, se existir botão
      const logoutBtn = document.querySelector('[data-logout]');
      if (logoutBtn) logoutBtn.addEventListener('click', logout);
    }
    return;
  }

  // Handler do login (apenas em login.html)
  if (location.pathname.endsWith('/login.html')) {
    if (isAuth()) { location.replace('trading.html'); return; }

    const form = document.querySelector('form.form');
    const error = document.createElement('p');
    error.className = 'error';
    error.style.display = 'none';
    error.textContent = 'Email ou senha inválidos';
    form && form.appendChild(error);

    // Aviso de sessão expirada
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1' && form) {
      const note = document.createElement('p');
      note.className = 'notice';
      note.textContent = 'Sua sessão expirou. Faça login novamente.';
      form.prepend(note);
    }

    form && form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      const pass = form.querySelector('input[type="password"]').value;
      // Senha fixa de teste
      if (pass === '123456' && email) {
        setAuth(true);
        location.replace('trading.html');
      } else {
        setAuth(false);
        error.style.display = 'block';
      }
    });
  }
})();

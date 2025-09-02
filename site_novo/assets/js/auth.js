// Auth simples para demonstração (site_novo)
(function () {
  const AUTH_KEY = 'auth_ok';
  function setAuth(ok) { try { localStorage.setItem(AUTH_KEY, ok ? '1' : ''); } catch (e) {} }
  function isAuth() { try { return localStorage.getItem(AUTH_KEY) === '1'; } catch (e) { return false; } }

  if (location.pathname.endsWith('/trading.html')) {
    if (!isAuth()) location.replace('login.html');
    return;
  }
  if (location.pathname.endsWith('/login.html')) {
    const form = document.querySelector('form.form');
    const error = document.createElement('p');
    error.className = 'error';
    error.style.display = 'none';
    error.textContent = 'Email ou senha inválidos';
    form && form.appendChild(error);

    form && form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      const pass = form.querySelector('input[type="password"]').value;
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

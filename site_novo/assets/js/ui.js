// JS leve para UI (idiomas simulados, chips de timeframe, etc.)
(function () {
  // Marcar chip ativo
  document.querySelectorAll('.chip').forEach((el) => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    });
  });
})();
